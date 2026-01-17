<script lang="ts">
  import DesignCanvas from "$lib/components/canvas/DesignCanvas.svelte";
  import ComponentPalette from "$lib/components/sidebar/ComponentPalette.svelte";
  import PropertyEditor from "$lib/components/sidebar/PropertyEditor.svelte";
  import Toolbar from "$lib/components/toolbar/Toolbar.svelte";
  import ExportPanel from "$lib/components/ExportPanel.svelte";

  let showExport = $state(false);
</script>

<svelte:head>
  <title>ESPHome Designer</title>
</svelte:head>

<Toolbar onExport={() => (showExport = !showExport)} />

<div class="editor-container">
  <aside class="sidebar left">
    <ComponentPalette />
  </aside>

  <main class="canvas-area">
    <DesignCanvas />
  </main>

  <aside class="sidebar right">
    <PropertyEditor />
  </aside>
</div>

{#if showExport}
  <div class="modal-overlay" onclick={() => (showExport = false)}>
    <div class="modal-content" onclick={(e: MouseEvent) => e.stopPropagation()}>
      <ExportPanel onClose={() => (showExport = false)} />
    </div>
  </div>
{/if}

<style>
  .editor-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 280px;
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
    overflow-y: auto;
  }

  .sidebar.left {
    border-right: 1px solid var(--color-border);
  }

  .sidebar.right {
    border-left: 1px solid var(--color-border);
  }

  .canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-primary);
    overflow: auto;
    padding: var(--spacing-lg);
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    max-width: 900px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: var(--shadow-lg);
  }
</style>
