<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
</script>

<div class="list-container">
  <div class="header">
    <h3>DETAIL VIEWS</h3>
    <button class="add-btn" onclick={() => projectStore.addDetailView()}>+</button>
  </div>
  
  <div class="items">
    {#each projectStore.detailViews as view}
      <div 
        class="item" 
        class:active={projectStore.currentDetailViewId === view.id}
        onclick={() => projectStore.setDetailView(view.id)}
      >
        <span class="name">{view.title}</span>
        <button class="delete-btn" onclick={(e) => { e.stopPropagation(); projectStore.deleteDetailView(view.id); }}>×</button>
      </div>
    {/each}
    {#if projectStore.detailViews.length === 0}
      <p class="empty">No detail views defined</p>
    {/if}
  </div>
</div>

<style>
  .list-container {
    padding: 12px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  h3 {
    font-size: 11px;
    color: #888;
    margin: 0;
    letter-spacing: 0.05em;
  }
  .add-btn {
    background: #4a9eff;
    border: none;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  .items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  .item:hover {
    background: #333;
  }
  .item.active {
    border-color: #4a9eff;
    background: rgba(74, 158, 255, 0.1);
  }
  .delete-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    padding: 0 4px;
  }
  .delete-btn:hover {
    color: #ff4a4a;
  }
  .empty {
    font-size: 12px;
    color: #666;
    text-align: center;
    margin-top: 12px;
  }
</style>
