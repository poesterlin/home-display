<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { colorToCss } from "$lib/utils/color-utils";

  const theme = $derived(projectStore.theme);
  const currentDetail = $derived(projectStore.currentDetailView);

  const accentColor = $derived(colorToCss(theme.colors.accent));
  const foregroundColor = $derived(colorToCss(theme.colors.foreground));
  const shadowColor = $derived(colorToCss(theme.colors.background, "black"));
  const shadowOffset = $derived(theme.values.shadowOffset ?? 3);
  const cornerSize = $derived(theme.values.cornerSize ?? 10);
</script>

{#if projectStore.viewMode === 'detail' && currentDetail}
  <div class="detail-header" style:height="45px" style:background={colorToCss(theme.colors.background)}>
    <svg width="100%" height="100%">
      <!-- Bottom Border -->
      <line x1="0" y1="44" x2="240" y2="44" stroke={accentColor} stroke-width="1" />
      
      <!-- Back Button Mockup (Simplified for Header) -->
      <g class="back-btn" onclick={() => projectStore.setViewMode('dashboard')}>
         <rect x="5" y="8" width="50" height="28" fill={colorToCss(theme.colors.backgroundSecondary)} stroke={accentColor} />
         <text x="30" y="22" fill="white" font-family="monospace" font-size="12" text-anchor="middle" dominant-baseline="central">&lt; BACK</text>
      </g>

      <!-- Title -->
      <text 
        x="130" 
        y="22" 
        fill={foregroundColor} 
        font-family="monospace" 
        font-size="14" 
        font-weight="bold"
        text-anchor="middle" 
        dominant-baseline="central"
      >
        {currentDetail.title.toUpperCase()}
      </text>
    </svg>
  </div>
{/if}

<style>
  .detail-header {
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 100;
    pointer-events: all;
  }
  .back-btn {
    cursor: pointer;
  }
  .back-btn:hover rect {
    fill: #444;
  }
</style>
