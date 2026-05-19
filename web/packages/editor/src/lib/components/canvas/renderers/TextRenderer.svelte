<script lang="ts">
  import type { Component, EntityBinding } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";
  import { homeAssistantStore } from "$lib/stores/homeassistant.svelte";
  import {
    getBindingDisplay,
    getDomainIcon,
    parseTemplate,
  } from "$lib/utils/template-utils";

  interface Props {
    component: Component & { type: "text" };
  }

  let { component }: Props = $props();

  const fontSize = $derived(
    component.fontSize === "small"
      ? 12
      : component.fontSize === "large"
        ? 20
        : 14,
  );

  const textAlign = $derived(
    component.align === "left" || component.align === undefined
      ? "flex-start"
      : component.align === "right"
        ? "flex-end"
        : "center",
  );

  const colorStyle = $derived(
    component.color
      ? `rgb(${component.color.r}, ${component.color.g}, ${component.color.b})`
      : "#ffffff",
  );

  const getEntity = (id: string) => homeAssistantStore.getEntity(id);

  const segments = $derived(parseTemplate(component.text ?? ""));
  const hasContent = $derived(
    segments.some((s) => (s.type === "text" ? s.value.length > 0 : true)),
  );

  function bindingTitle(b: EntityBinding): string {
    return b.entityId + (b.attribute ? "." + b.attribute : "");
  }
</script>

{#snippet bindingChip(binding: EntityBinding, extraClass = "")}<span
    class="binding-value {extraClass}"
    title={bindingTitle(binding)}
    ><span class="binding-icon">{getDomainIcon(binding)}</span
    >{getBindingDisplay(binding, getEntity)}</span
  >{/snippet}

<Draggable {component}>
  <div
    class="text-component"
    style:font-size="{fontSize}px"
    style:justify-content={textAlign}
    style:color={colorStyle}
  >
    <span class="text-content"
      >{#if !hasContent && !component.textBinding}<span class="placeholder"
          >Text</span
        >{:else}
        {#each segments as segment, i (i)}
          {#if segment.type === "text"}
            {segment.value}
          {:else}
            {@render bindingChip(segment.value)}
          {/if}
        {/each}
        {#if component.textBinding}
          {@render bindingChip(component.textBinding, "legacy")}
        {/if}
      {/if}
    </span>
  </div>
</Draggable>

<style>
  .text-component {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
  }

  .text-content {
    display: inline;
    min-width: 0;
  }

  .placeholder {
    opacity: 0.4;
    font-style: italic;
  }

  .binding-value {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: var(--color-accent, #4a9eff);
    font-weight: 500;
  }

  .binding-icon {
    font-size: 0.85em;
    line-height: 1;
  }

  .binding-value.legacy {
    margin-left: 4px;
    opacity: 0.85;
  }
</style>
