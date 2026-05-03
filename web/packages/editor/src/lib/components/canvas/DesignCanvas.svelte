<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { selectionStore } from "$lib/stores/selection.svelte";
  import { historyStore } from "$lib/stores/history.svelte";
  import ComponentRenderer from "./renderers/ComponentRenderer.svelte";
  import SelectionOverlay from "./SelectionOverlay.svelte";
  import DetailHeader from "./DetailHeader.svelte";
  import PageIndicator from "./PageIndicator.svelte";
  import type { Component } from "@esphome-designer/schema";
  import { createComponent } from "$lib/utils/component-factory";

  let canvasEl: HTMLDivElement | undefined = $state();
  let headerEl: HTMLDivElement | undefined = $state();

  const canvasHeight = $derived(
    projectStore.project &&
      projectStore.viewMode === "detail" &&
      projectStore.currentDetailView
      ? projectStore.currentDetailView.height || projectStore.display!.height
      : (projectStore.display?.height ?? 320),
  );

  const hasHeader = $derived(
    projectStore.viewMode === "dashboard" && !!projectStore.pageHeader,
  );

  const headerHeight = $derived(
    hasHeader ? projectStore.pageHeader!.height : 0,
  );

  const contentHeight = $derived(
    projectStore.viewMode === "detail"
      ? canvasHeight
      : (projectStore.display?.height ?? 320) - headerHeight,
  );

  function handleCanvasClick(e: MouseEvent) {
    if (e.target === canvasEl || e.target === headerEl) {
      selectionStore.clear();
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const componentType = e.dataTransfer?.getData("component-type");
    if (!componentType || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    historyStore.record(`Add ${componentType}`);

    const newComponent = createComponent(componentType, x, y);
    projectStore.addComponent(newComponent);
    selectionStore.select(newComponent.id);
  }

  function handleHeaderDrop(e: DragEvent) {
    e.preventDefault();
    const componentType = e.dataTransfer?.getData("component-type");
    if (!componentType || !headerEl) return;

    const rect = headerEl.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    historyStore.record(`Add ${componentType} to header`);

    const newComponent = createComponent(componentType, x, y);
    projectStore.addHeaderComponent(newComponent);
    selectionStore.select(newComponent.id);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  // Keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    // Check if the event target is a form input field
    const isFormInput =
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.contentEditable === "true");

    // Delete selected components (but not when editing form inputs)
    if ((e.key === "Delete" || e.key === "Backspace") && !isFormInput) {
      if (selectionStore.hasSelection) {
        e.preventDefault();
        historyStore.record("Delete components");
        for (const id of selectionStore.selectedIds) {
          projectStore.deleteComponent(id);
        }
        selectionStore.clear();
      }
    }

    // Undo/Redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        historyStore.undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        historyStore.redo();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="canvas-wrapper"
  style:width="{projectStore.display?.width ?? 240}px"
  style:height="{canvasHeight}px"
>
  {#if projectStore.viewMode === "detail" && projectStore.currentDetailView}
    <DetailHeader
      title={projectStore.currentDetailView.title}
      onBack={() => projectStore.setViewMode("dashboard")}
    />
  {/if}

  {#if hasHeader}
    <!-- Page header region -->
    <div
      bind:this={headerEl}
      class="header-region"
      role="application"
      tabindex="-1"
      aria-label="Page header region"
      onclick={handleCanvasClick}
      ondrop={handleHeaderDrop}
      ondragover={handleDragOver}
      style:height="{headerHeight}px"
      style:background-color={projectStore.pageHeader?.backgroundColor
        ? `rgb(${projectStore.pageHeader.backgroundColor.r}, ${projectStore.pageHeader.backgroundColor.g}, ${projectStore.pageHeader.backgroundColor.b})`
        : undefined}
    >
      {#each projectStore.headerComponents as component (component.id)}
        <ComponentRenderer {component} />
      {/each}
      <SelectionOverlay region="header" regionOffset={0} />
    </div>
    <div class="header-divider"></div>
  {/if}

  <div
    bind:this={canvasEl}
    class="canvas"
    role="application"
    tabindex="0"
    aria-label="Design canvas"
    onclick={handleCanvasClick}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    style:height="{contentHeight}px"
  >
    {#if projectStore.activeComponents}
      {#each projectStore.activeComponents as component (component.id)}
        <ComponentRenderer {component} />
      {/each}
    {/if}

    <SelectionOverlay region="content" regionOffset={headerHeight} />

    {#if projectStore.viewMode === "dashboard"}
      <PageIndicator
        count={projectStore.dashboardPages.length}
        currentIndex={projectStore.currentPageIndex}
      />
    {/if}
  </div>

  <!-- Display size indicator -->
  <div class="size-indicator">
    {projectStore.display?.width ?? 240} x {canvasHeight}
    {#if projectStore.viewMode === "dashboard" && projectStore.currentDashboardPage}
      (Dashboard: {projectStore.currentDashboardPage.name})
    {:else}
      (Detail: {projectStore.currentDetailView?.title || "Unknown"})
    {/if}
  </div>
</div>

<style>
  .canvas-wrapper {
    position: relative;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
    background: #1a1a1a;
  }

  .header-region {
    width: 100%;
    position: relative;
    overflow: hidden;
    cursor: crosshair;
  }

  .header-divider {
    width: 100%;
    height: 1px;
    background: var(--color-border);
    opacity: 0.5;
  }

  .canvas {
    width: 100%;
    position: relative;
    overflow: hidden;
    cursor: crosshair;
  }

  .canvas:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .size-indicator {
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }
</style>