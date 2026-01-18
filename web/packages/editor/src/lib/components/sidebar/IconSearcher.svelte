<script lang="ts">
  import * as mdiIcons from '@mdi/js';

  interface Props {
    value: string;
    onSelect: (iconName: string) => void;
  }

  let { value, onSelect }: Props = $props();
  let searchQuery = $state('');
  let isOpen = $state(false);
  let selectedIndex = $state(-1);

  // Sync searchQuery when value prop changes
  $effect(() => {
    searchQuery = value;
  });

  // Get all available MDI icon names (exported as mdiXxx format)
  const allIconNames = $derived.by(() => {
    return Object.keys(mdiIcons)
      .map(key => {
        // Convert from mdiHome format to kebab-case
        const name = key.replace(/^mdi/, '');
        return name.charAt(0).toLowerCase() + name.slice(1)
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase();
      })
      .sort();
  });

  // Filter icons based on search query
  const filteredIcons = $derived.by(() => {
    if (!searchQuery) return allIconNames.slice(0, 50);
    
    const query = searchQuery.toLowerCase();
    return allIconNames
      .filter(name => name.includes(query))
      .slice(0, 100);
  });

  // Get icon SVG path for a given icon name
  function getIconPath(iconName: string): string | null {
    const iconKey = 'mdi' + iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    const path = (mdiIcons as Record<string, unknown>)[iconKey];
    return typeof path === 'string' ? path : null;
  }

  function selectIcon(iconName: string) {
    searchQuery = iconName;
    onSelect(iconName);
    isOpen = false;
    selectedIndex = -1;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        isOpen = true;
        selectedIndex = 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredIcons.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectIcon(filteredIcons[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        isOpen = false;
        selectedIndex = -1;
        break;
    }
  }

  function handleInput(e: Event) {
    searchQuery = (e.target as HTMLInputElement).value;
    selectedIndex = -1;
    if (searchQuery) isOpen = true;
  }

  function handleFocus() {
    if (searchQuery) {
      isOpen = true;
    }
  }
</script>

<div class="icon-searcher">
  <div class="search-input-wrapper">
    <input
      type="text"
      placeholder="Search icons..."
      value={searchQuery}
      oninput={handleInput}
      onfocus={handleFocus}
      onkeydown={handleKeydown}
      class="search-input"
    />
    {#if searchQuery}
      <button
        class="clear-btn"
        onclick={() => {
          searchQuery = '';
          onSelect('');
          isOpen = false;
        }}
      >
        ✕
      </button>
    {/if}
  </div>

  {#if isOpen && filteredIcons.length > 0}
    <div class="dropdown">
      <div class="icon-grid">
        {#each filteredIcons as icon, index}
          {@const iconPath = getIconPath(icon)}
          <button
            class="icon-item {index === selectedIndex ? 'selected' : ''}"
            onclick={() => selectIcon(icon)}
            onmouseover={() => (selectedIndex = index)}
            onfocus={() => (selectedIndex = index)}
            title={icon}
          >
            {#if iconPath}
              <svg viewBox="0 0 24 24" class="icon-preview">
                <path d={iconPath} fill="currentColor" />
              </svg>
            {/if}
            <span class="icon-label">{icon}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .icon-searcher {
    position: relative;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    padding-right: 32px;
    font-size: 13px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-input-bg, #1e1e1e);
    color: var(--color-text-primary);
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary, #0066cc);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    transition: color 0.2s;
  }

  .clear-btn:hover {
    color: var(--color-text-secondary);
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--color-bg-secondary, #252526);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
    padding: 8px;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 70px;
    justify-content: center;
    overflow: hidden;
  }

  .icon-item:hover,
  .icon-item.selected {
    background: var(--color-hover, rgba(255, 255, 255, 0.1));
    border-color: var(--color-primary, #0066cc);
  }

  .icon-item.selected {
    background: var(--color-primary, #0066cc);
    border-color: var(--color-primary, #0066cc);
  }

  .icon-preview {
    width: 24px;
    height: 24px;
    color: var(--color-text-primary);
  }

  .icon-label {
    font-size: 10px;
    color: var(--color-text-secondary);
    text-align: center;
    word-break: break-word;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .icon-item.selected .icon-label {
    color: var(--color-text-primary);
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
  }
</style>
