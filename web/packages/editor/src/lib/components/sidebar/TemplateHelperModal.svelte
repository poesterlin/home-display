<script lang="ts">
  import { homeAssistantStore } from "$lib/stores/homeassistant.svelte";
    import type { EntityBinding } from "@esphome-designer/schema";
  import type { Entity, Device } from "@esphome-designer/schema/homeassistant";

  interface Props {
    onInsert: (binding: { entityId: string; attribute?: string }) => void;
    onClose: () => void;
    initialBinding?: EntityBinding | undefined;
  }

  let { onInsert, onClose, initialBinding }: Props = $props();

  let searchQuery = $state("");
  let inputEl = $state<HTMLInputElement | null>(null);
  let selectedEntity = $state<Entity | null>(null);
  let selectedAttribute = $state<string>("state");
  let showAttributes = $state(false);
  let selectedDomain = $state<string | null>(null);
  let selectedDeviceId = $state<string | null>(null);
  let browseMode = $state<"type" | "device" | "area">("type");

  $effect(() => {
    if (initialBinding && !selectedEntity) {
      const entity = homeAssistantStore.getEntity(initialBinding.entityId);
      if (entity) {
        selectedEntity = entity;
        selectedAttribute = initialBinding.attribute || "state";
        browseMode = "type";
        selectedDomain = entity.domain;
      }
    }
  });

  const domainLabels: Record<string, string> = {
    sensor: "Sensors",
    binary_sensor: "On/Off Sensors",
    switch: "Switches",
    light: "Lights",
    climate: "Climate",
    cover: "Covers & Blinds",
    media_player: "Media Players",
    camera: "Cameras",
    vacuum: "Vacuums",
    fan: "Fans",
    lock: "Locks",
    input_boolean: "Toggles",
    input_number: "Numbers",
    input_select: "Selections",
    person: "People",
    weather: "Weather",
    sun: "Sun",
    automation: "Automations",
    script: "Scripts",
    scene: "Scenes",
    button: "Buttons",
    update: "Updates",
    number: "Numbers",
    select: "Selects",
  };

  const domainIcons: Record<string, string> = {
    sensor: "📊",
    binary_sensor: "🔘",
    switch: "🔌",
    light: "💡",
    climate: "🌡️",
    cover: "🪟",
    media_player: "🎵",
    camera: "📷",
    vacuum: "🧹",
    fan: "🌀",
    lock: "🔒",
    input_boolean: "✅",
    input_number: "🔢",
    input_select: "📋",
    person: "👤",
    weather: "⛅",
    sun: "☀️",
    automation: "⚙️",
    script: "📜",
    scene: "🎬",
    button: "🔘",
    update: "🔄",
    number: "🔢",
    select: "📋",
  };

  const commonAttributes: Record<string, string[]> = {
    sensor: ["state", "unit_of_measurement", "device_class"],
    climate: ["temperature", "current_temperature", "hvac_action", "humidity"],
    media_player: ["media_title", "media_artist", "volume_level", "source"],
    weather: ["temperature", "humidity", "wind_speed", "forecast"],
    light: ["brightness", "color_temp", "rgb_color"],
    cover: ["current_position", "current_tilt_position"],
  };

  $effect(() => {
    if (inputEl) inputEl.focus();
  });

  function getDomainLabel(domain: string): string {
    return domainLabels[domain] || domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, " ");
  }

  function getDomainIcon(domain: string): string {
    return domainIcons[domain] || "📦";
  }

  function isIsoDate(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str);
  }

  function getDisplayName(entity: Entity): string {
    if (entity.name && !isIsoDate(entity.name)) return entity.name;
    return entity.entity_id.split(".")[1].replace(/_/g, " ");
  }

  function getStateDisplay(entity: Entity): string {
    if (entity.numeric_state !== undefined && entity.unit) return `${entity.numeric_state}${entity.unit}`;
    if (isIsoDate(entity.state)) return "";
    return entity.state;
  }

  function getEntityAttributes(entity: Entity): string[] {
    const attrs = new Set<string>(entity.attributes || []);
    const domainAttrs = commonAttributes[entity.domain] || [];
    for (const attr of domainAttrs) {
      if (!attrs.has(attr)) attrs.add(attr);
    }
    return Array.from(attrs).sort();
  }

  const allEntities = $derived(homeAssistantStore.entities);

  const availableDomains = $derived.by(() => {
    const domainCounts: Record<string, number> = {};
    for (const entity of allEntities) {
      domainCounts[entity.domain] = (domainCounts[entity.domain] || 0) + 1;
    }
    return Object.entries(domainCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([domain, count]) => ({ domain, count }));
  });

  const availableDevices = $derived(
    homeAssistantStore.devices
      .filter((d: Device) => d.entity_ids && d.entity_ids.length > 0)
      .sort((a: Device, b: Device) => (b.entity_ids?.length ?? 0) - (a.entity_ids?.length ?? 0)),
  );

  const availableAreas = $derived(homeAssistantStore.areasList);

  const filteredEntities = $derived.by(() => {
    if (searchQuery) return homeAssistantStore.searchEntities(searchQuery);
    if (browseMode === "type" && selectedDomain) return homeAssistantStore.getEntitiesByDomain(selectedDomain);
    if (browseMode === "device" && selectedDeviceId) return homeAssistantStore.getEntitiesByDevice(selectedDeviceId);
    if (browseMode === "area" && selectedDomain) return homeAssistantStore.getEntitiesByArea(selectedDomain);
    return [];
  });

  const resolvedValue = $derived.by(() => {
    if (!selectedEntity) return "";
    if (selectedAttribute === "state") return getStateDisplay(selectedEntity) || selectedEntity.state;
    return selectedAttribute.replace(/_/g, " ");
  });

  function selectEntity(entity: Entity) {
    selectedEntity = entity;
    selectedAttribute = "state";
    showAttributes = false;
  }

  function insertValue() {
    if (!selectedEntity) return;
    onInsert({
      entityId: selectedEntity.entity_id,
      attribute: selectedAttribute !== "state" ? selectedAttribute : undefined,
    });
  }

  function resetFilters() {
    selectedDomain = null;
    selectedDeviceId = null;
    searchQuery = "";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="modal-backdrop" role="dialog" aria-modal="true" tabindex="-1" onclick={onClose} onkeydown={handleKeydown}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>Insert Entity Value</h2>
      <button class="modal-close" onclick={onClose}>✕</button>
    </div>

    <div class="modal-search">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search entities..."
        bind:value={searchQuery}
        bind:this={inputEl}
      />
      {#if searchQuery}
        <button class="search-clear" onclick={() => (searchQuery = "")}>✕</button>
      {/if}
    </div>

    <div class="modal-body">
      {#if searchQuery}
        <div class="results-panel">
          <div class="panel-header">
            <span>Search Results</span>
            <span class="result-count">{filteredEntities.length} found</span>
          </div>
          <div class="entity-grid">
            {#each filteredEntities as entity (entity.entity_id)}
              <button
                class="entity-card"
                class:selected={selectedEntity?.entity_id === entity.entity_id}
                onclick={() => selectEntity(entity)}
              >
                <span class="entity-icon">{getDomainIcon(entity.domain)}</span>
                <div class="entity-info">
                  <span class="entity-name">{getDisplayName(entity)}</span>
                  <span class="entity-meta">
                    <span class="entity-state">{getStateDisplay(entity)}</span>
                    {#if entity.area}
                      <span class="entity-area">📍 {entity.area}</span>
                    {/if}
                  </span>
                </div>
              </button>
            {/each}
            {#if filteredEntities.length === 0}
              <div class="no-results">No entities match your search</div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="browse-layout">
          <div class="browse-sidebar">
            <div class="browse-tabs">
              <button class="browse-tab" class:active={browseMode === "type"} onclick={() => { browseMode = "type"; resetFilters(); }}>📦 Type</button>
              <button class="browse-tab" class:active={browseMode === "device"} onclick={() => { browseMode = "device"; resetFilters(); }}>🔧 Device</button>
              <button class="browse-tab" class:active={browseMode === "area"} onclick={() => { browseMode = "area"; resetFilters(); }}>🏠 Room</button>
            </div>

            <div class="filter-list">
              {#if browseMode === "type"}
                {#each availableDomains as { domain, count } (domain)}
                  <button
                    class="filter-item"
                    class:active={selectedDomain === domain}
                    onclick={() => (selectedDomain = domain)}
                  >
                    <span class="filter-icon">{getDomainIcon(domain)}</span>
                    <span class="filter-name">{getDomainLabel(domain)}</span>
                    <span class="filter-count">{count}</span>
                  </button>
                {/each}
              {:else if browseMode === "device"}
                {#each availableDevices as device (device.id)}
                  <button
                    class="filter-item"
                    class:active={selectedDeviceId === device.id}
                    onclick={() => (selectedDeviceId = device.id)}
                  >
                    <span class="filter-icon">🔧</span>
                    <div class="filter-details">
                      <span class="filter-name">{device.friendly_name}</span>
                      {#if device.manufacturer}
                        <span class="filter-subtitle">{device.manufacturer}</span>
                      {/if}
                    </div>
                    <span class="filter-count">{device.entity_ids?.length ?? 0}</span>
                  </button>
                {/each}
              {:else if browseMode === "area"}
                {#each availableAreas as area (area.id || area.name)}
                  <button
                    class="filter-item"
                    class:active={selectedDomain === area.name}
                    onclick={() => (selectedDomain = area.name)}
                  >
                    <span class="filter-icon">{area.icon || "🏠"}</span>
                    <span class="filter-name">{area.name}</span>
                  </button>
                {/each}
              {/if}
            </div>
          </div>

          <div class="browse-content">
            {#if filteredEntities.length > 0}
              <div class="panel-header">
                <span>
                  {#if browseMode === "type" && selectedDomain}
                    {getDomainIcon(selectedDomain)} {getDomainLabel(selectedDomain)}
                  {:else if browseMode === "device" && selectedDeviceId}
                    {availableDevices.find((d: Device) => d.id === selectedDeviceId)?.friendly_name}
                  {:else if browseMode === "area" && selectedDomain}
                    🏠 {selectedDomain}
                  {/if}
                </span>
                <span class="result-count">{filteredEntities.length} entities</span>
              </div>
              <div class="entity-grid">
                {#each filteredEntities as entity (entity.entity_id)}
                  <button
                    class="entity-card"
                    class:selected={selectedEntity?.entity_id === entity.entity_id}
                    onclick={() => selectEntity(entity)}
                  >
                    <span class="entity-icon">{getDomainIcon(entity.domain)}</span>
                    <div class="entity-info">
                      <span class="entity-name">{getDisplayName(entity)}</span>
                      <span class="entity-meta">
                        <span class="entity-state">{getStateDisplay(entity)}</span>
                        {#if browseMode !== "area" && entity.area}
                          <span class="entity-area">📍 {entity.area}</span>
                        {/if}
                      </span>
                    </div>
                  </button>
                {/each}
              </div>
            {:else}
              <div class="browse-empty">
                <span class="browse-empty-icon">👈</span>
                <span class="browse-empty-text">Select a category to browse entities</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if selectedEntity}
      <div class="modal-footer">
        <div class="selection-preview">
          <div class="selected-entity-row">
            <span class="sel-icon">{getDomainIcon(selectedEntity.domain)}</span>
            <div class="sel-info">
              <span class="sel-name">{getDisplayName(selectedEntity)}</span>
              <span class="sel-id">{selectedEntity.entity_id}</span>
            </div>
            <div class="sel-current-value">
              <span class="current-label">current</span>
              <span class="current-value">{getStateDisplay(selectedEntity) || "—"}</span>
            </div>
          </div>

          <div class="attribute-picker">
            <button class="attribute-toggle" onclick={() => (showAttributes = !showAttributes)}>
              <span class="attribute-label">
                Showing: <strong>{selectedAttribute === "state" ? "state (main value)" : selectedAttribute.replace(/_/g, " ")}</strong>
              </span>
              <span class="toggle-arrow">{showAttributes ? "▲" : "▼"}</span>
            </button>
            {#if showAttributes}
              <div class="attribute-list">
                <button
                  class="attribute-item"
                  class:active={selectedAttribute === "state"}
                  onclick={() => { selectedAttribute = "state"; showAttributes = false; }}
                >
                  <span class="attr-name">state</span>
                  <span class="attr-hint">Main value</span>
                </button>
                {#each getEntityAttributes(selectedEntity) as attr (attr)}
                  <button
                    class="attribute-item"
                    class:active={selectedAttribute === attr}
                    onclick={() => { selectedAttribute = attr; showAttributes = false; }}
                  >
                    <span class="attr-name">{attr.replace(/_/g, " ")}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <div class="value-preview-box">
            <span class="preview-label">Will insert:</span>
            <code class="preview-code">{resolvedValue || "—"}</code>
            <span class="preview-hint">from {selectedEntity.entity_id}</span>
          </div>
        </div>

        <div class="footer-actions">
          <button class="btn-cancel" onclick={onClose}>Cancel</button>
          <button class="btn-insert" onclick={insertValue} disabled={!selectedEntity}>Add Binding</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
  }

  .modal {
    background: var(--color-bg-secondary, #1e1e1e);
    border-radius: 12px;
    width: 100%;
    max-width: 750px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px 8px;
    font-size: 16px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: var(--color-hover);
    color: var(--color-text-primary);
  }

  .modal-search {
    position: relative;
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-search .search-icon {
    position: absolute;
    left: 32px;
    font-size: 13px;
    pointer-events: none;
  }

  .modal-search input {
    width: 100%;
    padding: 9px 32px 9px 34px;
    font-size: 13px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.2s;
  }

  .modal-search input:focus {
    border-color: var(--color-primary, #0066cc);
  }

  .modal-search input::placeholder {
    color: var(--color-text-muted);
  }

  .search-clear {
    position: absolute;
    right: 32px;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px 8px;
    font-size: 11px;
  }

  .search-clear:hover {
    color: var(--color-text-primary);
  }

  .modal-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }

  .browse-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .browse-sidebar {
    width: 200px;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .browse-tabs {
    display: flex;
    padding: 6px;
    gap: 3px;
    border-bottom: 1px solid var(--color-border);
  }

  .browse-tab {
    flex: 1;
    padding: 7px 3px;
    font-size: 10px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: all 0.15s;
  }

  .browse-tab:hover {
    background: var(--color-hover);
    color: var(--color-text-primary);
  }

  .browse-tab.active {
    background: var(--color-primary, #0066cc);
    color: white;
  }

  .filter-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    color: var(--color-text-secondary);
  }

  .filter-item:hover {
    background: var(--color-hover);
    color: var(--color-text-primary);
  }

  .filter-item.active {
    background: var(--color-primary, #0066cc);
    color: white;
  }

  .filter-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .filter-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .filter-name {
    flex: 1;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .filter-subtitle {
    font-size: 9px;
    opacity: 0.7;
  }

  .filter-count {
    font-size: 9px;
    padding: 1px 6px;
    background: var(--color-bg-primary);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .filter-item.active .filter-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .browse-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .browse-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--color-text-muted);
  }

  .browse-empty-icon {
    font-size: 28px;
    opacity: 0.5;
  }

  .browse-empty-text {
    font-size: 12px;
  }

  .results-panel {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-primary);
    position: sticky;
    top: 0;
    background: var(--color-bg-secondary, #1e1e1e);
    z-index: 1;
  }

  .result-count {
    font-size: 10px;
    font-weight: normal;
    color: var(--color-text-muted);
  }

  .entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 6px;
    padding: 10px 16px;
  }

  .entity-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }

  .entity-card:hover {
    border-color: var(--color-primary, #0066cc);
    background: var(--color-hover);
  }

  .entity-card.selected {
    border-color: var(--color-accent, #4ec9b0);
    background: color-mix(in srgb, var(--color-accent, #4ec9b0) 12%, var(--color-bg-primary));
  }

  .entity-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .entity-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .entity-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entity-meta {
    display: flex;
    gap: 6px;
    font-size: 9px;
    flex-wrap: wrap;
  }

  .entity-state {
    color: var(--color-accent, #4ec9b0);
    font-weight: 500;
  }

  .entity-area {
    color: var(--color-text-muted);
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 30px 20px;
    color: var(--color-text-muted);
  }

  .modal-footer {
    border-top: 1px solid var(--color-border);
    padding: 12px 20px;
  }

  .selection-preview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .selected-entity-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--color-bg-primary);
    border-radius: 6px;
    border: 1px solid var(--color-border);
  }

  .sel-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .sel-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .sel-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .sel-id {
    font-size: 10px;
    color: var(--color-text-muted);
    font-family: monospace;
  }

  .sel-current-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex-shrink: 0;
  }

  .current-label {
    font-size: 9px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    letter-spacing: 0.5px;
  }

  .current-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent, #4ec9b0);
  }

  .attribute-picker {
    position: relative;
  }

  .attribute-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 7px 10px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    color: var(--color-text-secondary);
    transition: background 0.2s;
  }

  .attribute-toggle:hover {
    background: var(--color-hover);
  }

  .attribute-label strong {
    color: var(--color-text-primary);
  }

  .toggle-arrow {
    font-size: 9px;
    color: var(--color-text-muted);
  }

  .attribute-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 6px;
    max-height: 130px;
    overflow-y: auto;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 4px;
  }

  .attribute-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 10px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .attribute-item:hover {
    background: var(--color-hover);
  }

  .attribute-item.active {
    background: var(--color-primary, #0066cc);
  }

  .attr-name {
    font-size: 11px;
    color: var(--color-text-primary);
    text-transform: capitalize;
  }

  .attr-hint {
    font-size: 9px;
    color: var(--color-text-muted);
  }

  .attribute-item.active .attr-name,
  .attribute-item.active .attr-hint {
    color: white;
  }

  .value-preview-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
  }

  .preview-label {
    font-size: 11px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .preview-code {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent, #4ec9b0);
    font-family: monospace;
  }

  .preview-hint {
    font-size: 9px;
    color: var(--color-text-muted);
    margin-left: auto;
  }

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }

  .btn-cancel {
    padding: 8px 16px;
    font-size: 12px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel:hover {
    background: var(--color-hover);
    color: var(--color-text-primary);
  }

  .btn-insert {
    padding: 8px 16px;
    font-size: 12px;
    background: var(--color-primary, #0066cc);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s;
  }

  .btn-insert:hover:not(:disabled) {
    filter: brightness(1.15);
  }

  .btn-insert:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .filter-list::-webkit-scrollbar,
  .browse-content::-webkit-scrollbar,
  .results-panel::-webkit-scrollbar,
  .attribute-list::-webkit-scrollbar {
    width: 5px;
  }

  .filter-list::-webkit-scrollbar-track,
  .browse-content::-webkit-scrollbar-track,
  .results-panel::-webkit-scrollbar-track,
  .attribute-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .filter-list::-webkit-scrollbar-thumb,
  .browse-content::-webkit-scrollbar-thumb,
  .results-panel::-webkit-scrollbar-thumb,
  .attribute-list::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  .filter-list::-webkit-scrollbar-thumb:hover,
  .browse-content::-webkit-scrollbar-thumb:hover,
  .results-panel::-webkit-scrollbar-thumb:hover,
  .attribute-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
  }
</style>
