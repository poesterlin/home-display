<script lang="ts">
  import type { ProceduralIconComponent } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";
  import { projectStore } from "../../../stores/project.svelte";
  import { colorToCss } from "../../../utils/color-utils";

  interface Props {
    component: ProceduralIconComponent;
  }

  let { component }: Props = $props();
  const theme = $derived(projectStore.theme);
  const iconColor = $derived(colorToCss(component.color, colorToCss(theme.colors.accent)));
</script>

<Draggable {component}>
  <div class="icon-wrapper" style:width="100%" style:height="100%">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 {component.size.width} {component.size.height}"
    >
      {#if component.iconType === 'bulb'}
        <g stroke={iconColor} stroke-width="2" fill="none">
          <circle cx={component.size.width / 2} cy={component.size.height / 2} r={component.size.width / 4} />
          {#each Array(8) as _, i}
            {@const angle = (i * 45 * Math.PI) / 180}
            {@const r1 = component.size.width / 4 + 4}
            {@const r2 = component.size.width / 4 + 10}
            <line
              x1={component.size.width / 2 + Math.cos(angle) * r1}
              y1={component.size.height / 2 + Math.sin(angle) * r1}
              x2={component.size.width / 2 + Math.cos(angle) * r2}
              y2={component.size.height / 2 + Math.sin(angle) * r2}
            />
          {/each}
        </g>
      {:else if component.iconType === 'window'}
        <g stroke={iconColor} stroke-width="2" fill="none">
          <rect
            x={component.size.width * 0.2}
            y={component.size.height * 0.1}
            width={component.size.width * 0.6}
            height={component.size.height * 0.8}
          />
          <line
            x1={component.size.width * 0.5}
            y1={component.size.height * 0.1}
            x2={component.size.width * 0.5}
            y2={component.size.height * 0.9}
          />
          <line
            x1={component.size.width * 0.2}
            y1={component.size.height * 0.4}
            x2={component.size.width * 0.8}
            y2={component.size.height * 0.4}
          />
        </g>
      {:else if component.iconType === 'vacuum'}
        <g stroke={iconColor} stroke-width="2" fill="none">
          <circle cx={component.size.width / 2} cy={component.size.height / 2} r={component.size.width * 0.35} />
          <circle cx={component.size.width / 2} cy={component.size.height * 0.4} r={component.size.width * 0.1} />
        </g>
      {:else if component.iconType === 'climate'}
        <g stroke={iconColor} stroke-width="2" fill="none">
          <path d="M {component.size.width * 0.5} {component.size.height * 0.2} 
                   L {component.size.width * 0.5} {component.size.height * 0.6} 
                   A {component.size.width * 0.15} {component.size.width * 0.15} 0 1 0 {component.size.width * 0.6} {component.size.height * 0.6} 
                   Z" />
        </g>
      {/if}
    </svg>
  </div>
</Draggable>
