<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { deploymentStore } from "$lib/stores/deployment.svelte";
  import * as mdiIcons from "@mdi/js";

  let activeBuild = $state<{ published: boolean } | null>(null);

  $effect(() => {
    checkActiveBuild();
    const interval = setInterval(checkActiveBuild, 10000);
    return () => clearInterval(interval);
  });

  async function checkActiveBuild() {
    if (!projectStore.serverProjectId) return;
    try {
      const res = await fetch(`/api/compile?projectId=${projectStore.serverProjectId}&latest=true`);
      if (res.ok) {
        const job = await res.json();
        activeBuild = job?.id ? { published: !!job.published } : null;
      }
    } catch {
      activeBuild = null;
    }
  }

  const href = $derived(`/project/${projectStore.serverProjectId}/deploy`);
</script>

{#if deploymentStore.state.compiling}
  <div class="bottom-console">
    <div class="console-left">
      <div class="status-badge compiling">
        <div class="spinner"></div>
        <span>{deploymentStore.state.status}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: {deploymentStore.state.progress}%"></div>
      </div>
    </div>
  </div>
{:else if deploymentStore.state.error}
  <div class="bottom-console">
    <div class="console-left">
      <div class="status-badge error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>Build failed</span>
      </div>
      <span class="hint">{deploymentStore.state.error}</span>
    </div>
  </div>
{:else}
  <a href={href} class="bottom-console interactive">
    <div class="console-left">
      {#if activeBuild?.published}
        <div class="status-badge live">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d={mdiIcons.mdiCheckCircle} />
          </svg>
          <span>Live</span>
        </div>
      {:else}
        <div class="status-badge idle">
          <span>Idle</span>
        </div>
      {/if}
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" class="chevron" fill="none">
      <path d={mdiIcons.mdiChevronRight} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </a>
{/if}

<style>
  .bottom-console {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-md);
    height: 52px;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .bottom-console.interactive {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color 0.15s;
  }

  .bottom-console.interactive:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  .console-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .chevron {
    opacity: 0.4;
    flex-shrink: 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .status-badge.compiling {
    color: var(--color-accent);
  }

  .status-badge.error {
    color: #f44336;
    background: rgba(244, 67, 54, 0.1);
  }

  .status-badge.live {
    color: var(--color-accent);
    background: rgba(74, 158, 255, 0.12);
  }

  .status-badge.idle {
    color: var(--color-text-secondary);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .progress-track {
    width: 120px;
    height: 3px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .hint {
    font-size: 11px;
    color: var(--color-text-secondary);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
