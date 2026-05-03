<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { selectionStore } from "$lib/stores/selection.svelte";
  import { historyStore } from "$lib/stores/history.svelte";

  interface Props {
    region?: "header" | "content";
    regionOffset?: number;
  }

  let { region = "content", regionOffset = 0 }: Props = $props();

  // Resize handles
  type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

  let resizing = $state<{ id: string; handle: Handle } | null>(null);
  let resizeStart = $state<{
    x: number;
    y: number;
    width: number;
    height: number;
    compX: number;
    compY: number;
  } | null>(null);

  function handleResizeStart(id: string, handle: Handle, e: MouseEvent) {
    e.stopPropagation();
    const component = projectStore.getComponent(id);
    if (!component || !component.size) return;

    historyStore.record("Resize component");

    resizing = { id, handle };
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: component.size.width,
      height: component.size.height,
      compX: component.position.x,
      compY: component.position.y,
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  }

  function handleResizeMove(e: MouseEvent) {
    if (!resizing || !resizeStart) return;

    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.compX;
    let newY = resizeStart.compY;

    const handle = resizing.handle;

    // Handle width changes
    if (handle.includes("e")) {
      newWidth = resizeStart.width + dx;
    } else if (handle.includes("w")) {
      newWidth = resizeStart.width - dx;
      newX = resizeStart.compX + dx;
    }

    // Handle height changes
    if (handle.includes("s")) {
      newHeight = resizeStart.height + dy;
    } else if (handle.includes("n")) {
      newHeight = resizeStart.height - dy;
      newY = resizeStart.compY + dy;
    }

    // Apply constraints
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);

    projectStore.updateComponent(resizing.id, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) },
      size: { width: newWidth, height: newHeight },
    });
  }

  function handleResizeEnd() {
    resizing = null;
    resizeStart = null;
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeEnd);
  }

  // Get bounding box for selection (filtered by region)
  function getSelectionBounds() {
    const bounds: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    for (const id of selectionStore.selectedIds) {
      const component = projectStore.getComponent(id);
      if (!component) continue;

      // Filter: only show components that belong to this region
      const isInHeader = projectStore.isHeaderComponent(id);
      if (region === "header" && !isInHeader) continue;
      if (region === "content" && isInHeader) continue;

      const pos = projectStore.getComponentAbsolutePosition(id);
      bounds.push({
        id,
        x: pos.x,
        y: pos.y,
        width: component.size?.width ?? 50,
        height: component.size?.height ?? 20,
      });
    }

    return bounds;
  }

  const selectedBounds = $derived(getSelectionBounds());
</script>

{#each selectedBounds as bound (bound.id)}
  <div
    class="selection-box"
    style:left="{bound.x}px"
    style:top="{bound.y}px"
    style:width="{bound.width}px"
    style:height="{bound.height}px"
  >
    <!-- Resize handles -->
    <div
      class="handle nw"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "nw", e)}
    ></div>
    <div
      class="handle n"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "n", e)}
    ></div>
    <div
      class="handle ne"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "ne", e)}
    ></div>
    <div
      class="handle e"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "e", e)}
    ></div>
    <div
      class="handle se"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "se", e)}
    ></div>
    <div
      class="handle s"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "s", e)}
    ></div>
    <div
      class="handle sw"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "sw", e)}
    ></div>
    <div
      class="handle w"
      role="button"
      tabindex="-1"
      onmousedown={(e: MouseEvent) => handleResizeStart(bound.id, "w", e)}
    ></div>
  </div>
{/each}

<style>
  .selection-box {
    position: absolute;
    border: 2px solid var(--color-accent);
    pointer-events: none;
    box-sizing: border-box;
  }

  .handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--color-accent);
    border: 1px solid white;
    pointer-events: auto;
  }

  .handle.nw {
    left: -4px;
    top: -4px;
    cursor: nwse-resize;
  }
  .handle.n {
    left: 50%;
    top: -4px;
    transform: translateX(-50%);
    cursor: ns-resize;
  }
  .handle.ne {
    right: -4px;
    top: -4px;
    cursor: nesw-resize;
  }
  .handle.e {
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    cursor: ew-resize;
  }
  .handle.se {
    right: -4px;
    bottom: -4px;
    cursor: nwse-resize;
  }
  .handle.s {
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    cursor: ns-resize;
  }
  .handle.sw {
    left: -4px;
    bottom: -4px;
    cursor: nesw-resize;
  }
  .handle.w {
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
    cursor: ew-resize;
  }
</style>
