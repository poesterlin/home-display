<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
</script>

<div class="view-selector">
  <button 
    class:active={projectStore.viewMode === 'dashboard'} 
    onclick={() => projectStore.setViewMode('dashboard')}
  >
    Pages
  </button>
  <button 
    class:active={projectStore.viewMode === 'detail'} 
    onclick={() => projectStore.setViewMode('detail')}
  >
    Detail Views
  </button>
</div>

<style>
  .view-selector {
    display: flex;
    padding: 8px;
    gap: 8px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
  }

  button {
    flex: 1;
    padding: 6px 12px;
    background: #2a2a2a;
    border: 1px solid #444;
    color: #ccc;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  button:hover {
    background: #333;
    color: white;
  }

  button.active {
    background: #4a9eff;
    border-color: #4a9eff;
    color: white;
    font-weight: bold;
  }
</style>
