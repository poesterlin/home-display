<script lang="ts">
  import type { Component } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";

  interface Props {
    component: Component & { type: "button" };
  }

  let { component }: Props = $props();

  const bgColor = $derived(
    component.backgroundColor
      ? `rgb(${component.backgroundColor.r}, ${component.backgroundColor.g}, ${component.backgroundColor.b})`
      : "#333333"
  );
</script>

<Draggable {component}>
  <div class="button-component" style:background-color={bgColor}>
    {#if component.icon}
      <span class="icon">{component.icon}</span>
    {/if}
    <span class="label">{component.label ?? "Button"}</span>
  </div>
</Draggable>

<style>
  .button-component {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid #666;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 12px;
    color: white;
  }

  .icon {
    font-size: 14px;
  }

  .label {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
</style>
