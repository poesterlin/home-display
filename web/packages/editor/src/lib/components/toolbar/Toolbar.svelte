<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { historyStore } from "$lib/stores/history.svelte";
  import * as mdiIcons from '@mdi/js';

  interface Props {
    onExport: () => void;
    onSettings: () => void;
    onDebug: () => void;
  }

  let { onExport, onSettings, onDebug }: Props = $props();
</script>

<header class="toolbar">
   <div class="toolbar-left">
     <a href="/" class="projects-link">
       <svg width="18" height="18" viewBox="0 0 24 24" class="icon">
         <path d={mdiIcons.mdiHome} />
       </svg>
       <span>Projects</span>
     </a>
    <div class="separator"></div>
    <div class="logo">ESPHome Designer</div>
  </div>

  <div class="toolbar-center">
    <input
      type="text"
      class="project-name"
      value={projectStore.project?.name ?? ""}
      oninput={(e: Event) =>
        projectStore.updateProject({ name: (e.target as HTMLInputElement).value })
      }
    />
  </div>

  <div class="toolbar-right">
     <button onclick={onSettings} title="Project Settings">
       <svg width="16" height="16" viewBox="0 0 24 24" class="icon">
         <path d={mdiIcons.mdiCog} />
       </svg>
       <span>Settings</span>
     </button>
     <button onclick={onDebug} title="Debug JSON">
       <svg width="16" height="16" viewBox="0 0 24 24" class="icon">
         <path d={mdiIcons.mdiFlash} />
       </svg>
       <span>Debug</span>
     </button>
    <div class="separator"></div>
    <button onclick={() => historyStore.undo()} disabled={!historyStore.canUndo} title="Undo (Ctrl+Z)">
      Undo
    </button>
    <button onclick={() => historyStore.redo()} disabled={!historyStore.canRedo} title="Redo (Ctrl+Y)">
      Redo
    </button>
    <div class="separator"></div>
    <button class="primary" onclick={onExport}>Export Code</button>
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    height: 48px;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .toolbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .projects-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: 13px;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: background 0.2s;
  }

  .projects-link:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .logo {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-accent);
  }

  .project-name {
    background: transparent;
    border: 1px solid transparent;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    padding: var(--spacing-xs) var(--spacing-md);
    min-width: 200px;
    border-radius: var(--radius-sm);
  }

  .project-name:hover {
    border-color: var(--color-border);
  }

  .project-name:focus {
    border-color: var(--color-accent);
    background: var(--color-bg-tertiary);
  }

  .separator {
    width: 1px;
    height: 24px;
    background: var(--color-border);
    margin: 0 var(--spacing-xs);
  }

   button {
     font-size: 12px;
     padding: var(--spacing-xs) var(--spacing-sm);
   }

   .icon {
     fill: currentColor;
     stroke: none;
   }
</style>
