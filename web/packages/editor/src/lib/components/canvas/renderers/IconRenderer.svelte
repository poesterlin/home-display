<script lang="ts">
  import type { Component } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";

  interface Props {
    component: Component & { type: "icon" };
  }

  let { component }: Props = $props();

  const colorStyle = $derived(
    component.color
      ? `rgb(${component.color.r}, ${component.color.g}, ${component.color.b})`
      : "#ffffff"
  );

  const scale = $derived(component.scale ?? 1);
</script>

<Draggable {component}>
  <div class="icon-component" style:color={colorStyle} style:transform="scale({scale})">
    <!-- Icon placeholder - would use MDI icons in real implementation -->
    <span class="icon-placeholder">{component.icon}</span>
  </div>
</Draggable>

<style>
  .icon-component {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-placeholder {
    font-size: 10px;
    font-family: monospace;
    background: #333;
    padding: 2px 4px;
    border-radius: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
