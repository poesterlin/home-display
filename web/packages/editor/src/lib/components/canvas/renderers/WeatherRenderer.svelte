<script lang="ts">
  import * as mdiIcons from "@mdi/js";
  import type { WeatherComponent } from "@esphome-designer/schema";
  import Draggable from "../Draggable.svelte";
  import {
    getWeatherConditionColor,
    getWeatherConditionIcon,
    colorToCss as conditionColorToCss,
  } from "$lib/utils/weather-conditions";

  interface Props {
    component: WeatherComponent;
  }

  let { component }: Props = $props();

  const label = $derived(component.label?.trim() || "Weather");
  const iconName = $derived(getWeatherConditionIcon("partlycloudy"));
  const conditionCss = $derived(
    conditionColorToCss(getWeatherConditionColor("partlycloudy")),
  );

  const iconKey = $derived(
    "mdi" +
      iconName
        .split(/[-_]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(""),
  );
  const iconPath = $derived(
    (mdiIcons as Record<string, unknown>)[iconKey],
  );

  const dimFill = "rgb(10, 14, 22)";
  const dimBorder = "rgb(25, 30, 40)";
  const textDim = "rgb(120, 128, 144)";
  const textWhite = "rgb(230, 240, 250)";
  const cornerSize = 9;

  function clippedPolygonPoints(w: number, h: number, c: number): string {
    return `${c},0 ${w - c},0 ${w},${c} ${w},${h - c} ${w - c},${h} ${c},${h} 0,${h - c} 0,${c}`;
  }

  function glowColor(cssColor: string): string {
    return cssColor.replace(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
      (_, r, g, b) =>
        `rgb(${Math.floor(+r / 4)}, ${Math.floor(+g / 4)}, ${Math.floor(+b / 4)})`,
    );
  }
</script>

<Draggable {component} widthOnly>
  {#if component.size}
    {@const w = component.size.width}
    {@const h = component.size.height}

    <div class="weather-wrap" style:width="100%" style:height="100%">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 {w} {h}"
        preserveAspectRatio="none"
        style:position="absolute"
        style:inset="0"
        style:pointer-events="none"
      >
        <polygon
          points={clippedPolygonPoints(w + 6, h + 6, cornerSize + 3)}
          fill="none"
          stroke={glowColor(conditionCss)}
          stroke-width="3"
          transform="translate(-3, -3)"
        />
        <polygon
          points={clippedPolygonPoints(w, h, cornerSize)}
          fill={dimFill}
          stroke={dimBorder}
          stroke-width="1.5"
        />
        <polygon
          points={clippedPolygonPoints(w - 6, h - 6, cornerSize - 3)}
          fill="none"
          stroke={dimBorder}
          stroke-width="0.75"
          transform="translate(3, 3)"
        />
      </svg>

      <div class="top-row">
        <span class="top-label" style:color={textDim}>{label}</span>
      </div>

      <div class="icon-area">
        {#if typeof iconPath === "string"}
          <svg
            viewBox="0 0 24 24"
            class="weather-icon"
            style:color={conditionCss}
          >
            <path d={iconPath} fill="currentColor" />
          </svg>
        {:else}
          <span class="icon-fallback" style:color={conditionCss}>?</span>
        {/if}
        <span class="temperature" style:color={textWhite}>21.4°</span>
      </div>

      <div class="bottom-row">
        <div class="attr">
          <span class="attr-label" style:color={textDim}>Humidity</span>
          <span class="attr-value" style:color={textWhite}>62%</span>
        </div>
        <div class="attr">
          <span class="attr-label" style:color={textDim}>Rain</span>
          <span class="attr-value" style:color={textWhite}>0.4 mm</span>
        </div>
        <div class="attr">
          <span class="attr-label" style:color={textDim}>Wind</span>
          <span class="attr-value" style:color={textWhite}>3.6 m/s</span>
        </div>
      </div>
    </div>
  {/if}
</Draggable>

<style>
  .weather-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 120px;
    min-height: 140px;
    overflow: hidden;
  }

  .top-row {
    position: absolute;
    top: 12px;
    left: 15px;
    right: 15px;
    display: flex;
    align-items: center;
    height: 18px;
  }

  .top-label {
    font-family: var(--display-font, monospace);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .icon-area {
    position: absolute;
    top: 36px;
    bottom: 54px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .weather-icon {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
  }

  .icon-fallback {
    font-family: var(--display-font, monospace);
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
  }

  .temperature {
    font-family: var(--display-font, monospace);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    margin-top: 2px;
  }

  .bottom-row {
    position: absolute;
    bottom: 9px;
    left: 0;
    right: 0;
    display: flex;
    gap: 4px;
    padding: 0 9px;
    height: 42px;
  }

  .attr {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: rgb(18, 22, 32);
    border: 0.75px solid rgb(35, 40, 55);
    border-radius: 4px;
    min-width: 0;
  }

  .attr-label {
    font-family: var(--display-font, monospace);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  .attr-value {
    font-family: var(--display-font, monospace);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
  }
</style>
