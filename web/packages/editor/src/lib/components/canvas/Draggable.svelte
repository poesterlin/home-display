<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { selectionStore } from "$lib/stores/selection.svelte";
  import { historyStore } from "$lib/stores/history.svelte";
  import type { Component } from "@esphome-designer/schema";
  import type { Snippet } from "svelte";

  interface Props {
    component: Component;
    children: Snippet;
  }

  let { component, children }: Props = $props();

  let dragging = $state(false);
  let dragStart = $state<{ x: number; y: number; compX: number; compY: number } | null>(null);

  const isSelected = $derived(selectionStore.isSelected(component.id));
  const isHovered = $derived(selectionStore.isHovered(component.id));

  function handleMouseDown(e: MouseEvent) {
    e.stopPropagation();

    // Select if not already selected
    if (!selectionStore.isSelected(component.id)) {
      if (e.shiftKey) {
        selectionStore.addToSelection(component.id);
      } else {
        selectionStore.select(component.id);
      }
    }

    historyStore.record("Move component");

    dragging = true;
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      compX: component.position.x,
      compY: component.position.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging || !dragStart) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const newX = Math.max(0, dragStart.compX + dx);
    const newY = Math.max(0, dragStart.compY + dy);

    projectStore.updateComponent(component.id, {
      position: { x: Math.round(newX), y: Math.round(newY) },
    });
  }

  function handleMouseUp() {
    dragging = false;
    dragStart = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  function handleMouseEnter() {
    selectionStore.setHovered(component.id);
  }

  function handleMouseLeave() {
    if (selectionStore.hoveredId === component.id) {
      selectionStore.setHovered(null);
    }
  }
</script>

<div
  class="draggable"
  class:selected={isSelected}
  class:hovered={isHovered}
  class:dragging
  style:left="{component.position.x}px"
  style:top="{component.position.y}px"
  style:width="{component.size?.width ?? 'auto'}px"
  style:height="{component.size?.height ?? 'auto'}px"
  role="button"
  tabindex="0"
  onmousedown={handleMouseDown}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  {@render children()}
</div>

<style>
  .draggable {
    position: absolute;
    cursor: move;
    user-select: none;
  }

  .draggable.hovered {
    outline: 1px dashed var(--color-accent);
    outline-offset: 1px;
  }

  .draggable.selected {
    /* Selection box is handled by SelectionOverlay */
  }

  .draggable.dragging {
    opacity: 0.8;
    cursor: grabbing;
  }
</style>
