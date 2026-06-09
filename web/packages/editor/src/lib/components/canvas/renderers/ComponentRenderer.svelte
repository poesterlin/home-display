<script lang="ts">
  import type { Component } from "@esphome-designer/schema";
  import { getRenderer } from "./renderer-registry";

  interface Props {
    component: Component;
    parentOffset?: { x: number; y: number };
  }

  let { component, parentOffset = { x: 0, y: 0 } }: Props = $props();

  let Renderer = $derived(getRenderer(component.type));
</script>

{#if Renderer}
  <Renderer {component} {parentOffset} />
{:else}
  <div class="unknown-component">
    Unknown component
  </div>
{/if}

<style>
  .unknown-component {
    position: absolute;
    background: #ff0000;
    color: white;
    padding: 4px 8px;
    font-size: 10px;
  }
</style>
