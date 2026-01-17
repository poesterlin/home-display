<script lang="ts">
  import type { Component } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";

  interface Props {
    component: Component & { type: "slider" };
  }

  let { component }: Props = $props();

  // Mock value for preview
  let previewValue = $state(50);

  const isVertical = $derived(component.orientation === "vertical");
  const percentage = $derived(
    ((previewValue - (component.min ?? 0)) / ((component.max ?? 100) - (component.min ?? 0))) * 100
  );
</script>

<Draggable {component}>
  <div class="slider-component" class:vertical={isVertical}>
    <div class="track">
      <div
        class="fill"
        style={isVertical ? `height: ${percentage}%` : `width: ${percentage}%`}
      ></div>
      <div
        class="thumb"
        style={isVertical ? `bottom: ${percentage}%` : `left: ${percentage}%`}
      ></div>
    </div>
    {#if component.valueBinding}
      <span class="binding-indicator">{component.valueBinding.entityId}</span>
    {/if}
  </div>
</Draggable>

<style>
  .slider-component {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
  }

  .slider-component.vertical {
    flex-direction: column;
  }

  .track {
    flex: 1;
    background: #333;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }

  .slider-component:not(.vertical) .track {
    height: 8px;
    width: 100%;
  }

  .slider-component.vertical .track {
    width: 8px;
    height: 100%;
  }

  .fill {
    position: absolute;
    background: var(--color-accent);
    border-radius: 4px;
  }

  .slider-component:not(.vertical) .fill {
    height: 100%;
    left: 0;
  }

  .slider-component.vertical .fill {
    width: 100%;
    bottom: 0;
  }

  .thumb {
    position: absolute;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    transform: translate(-50%, -50%);
  }

  .slider-component:not(.vertical) .thumb {
    top: 50%;
  }

  .slider-component.vertical .thumb {
    left: 50%;
    transform: translate(-50%, 50%);
  }

  .binding-indicator {
    position: absolute;
    bottom: -14px;
    left: 0;
    font-size: 9px;
    color: var(--color-accent);
  }
</style>
