<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { projectStore } from "$lib/stores/project.svelte";
  import { deploymentStore } from "$lib/stores/deployment.svelte";
  import ConfirmCompileModal from "$lib/components/ConfirmCompileModal.svelte";
  import { onMount } from "svelte";

  let creditBalance = $state<number | null>(null);
  let activeBuild = $state<{ id: string; published: boolean; createdAt: string } | null>(null);
  let showConfirm = $state(false);

  const isCloud = page.data.isCloud;

  onMount(() => {
    loadCreditBalance();
    checkActiveBuild();
    const interval = setInterval(checkActiveBuild, 10000);
    return () => clearInterval(interval);
  });

  async function loadCreditBalance() {
    if (!isCloud) return;
    try {
      const res = await fetch("/api/credits/balance");
      if (!res.ok) return;
      const payload = await res.json();
      creditBalance = typeof payload.balance === "number" ? payload.balance : null;
    } catch {
      creditBalance = null;
    }
  }

  async function checkActiveBuild() {
    if (!projectStore.serverProjectId) return;
    try {
      const res = await fetch(`/api/compile?projectId=${projectStore.serverProjectId}&latest=true`);
      if (res.ok) {
        const job = await res.json();
        if (job?.id) {
          activeBuild = {
            id: job.id,
            published: !!job.published,
            createdAt: job.createdAt,
          };
        } else {
          activeBuild = null;
        }
      }
    } catch {
      activeBuild = null;
    }
  }

  function handleCompile() {
    showConfirm = true;
  }

  function confirmCompile() {
    showConfirm = false;
    deploymentStore.compile("update");
  }

  function handlePublish() {
    if (deploymentStore.state.jobId) {
      deploymentStore.publishBuild();
    }
  }

  function handleFlash() {
    goto(`/project/${projectStore.serverProjectId}/deploy`);
  }

  const insufficientCreditsRegex = /Insufficient credits\. Cost: (?<cost>\d+), balance: (?<balance>\d+)/;

  let insufficientCredits = $derived.by(() => {
    const err = deploymentStore.state.error;
    if (!err) return null;
    const match = err.match(insufficientCreditsRegex);
    if (!match?.groups) return null;
    return {
      cost: Number(match.groups.cost),
      balance: Number(match.groups.balance),
    };
  });
</script>

<div class="bottom-console">
  <div class="console-left">
    {#if deploymentStore.state.compiling}
      <div class="status-badge compiling">
        <div class="spinner"></div>
        <span>{deploymentStore.state.status}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: {deploymentStore.state.progress}%"></div>
      </div>
    {:else if deploymentStore.state.error}
      <div class="status-badge error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>Build failed</span>
      </div>
      {#if insufficientCredits}
        <span class="hint">Out of credits</span>
      {:else}
        <span class="hint">{deploymentStore.state.error}</span>
      {/if}
    {:else if deploymentStore.state.step === "ready"}
      <div class="status-badge success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Firmware ready</span>
      </div>
    {:else if deploymentStore.state.step === "done" || deploymentStore.state.published}
      <div class="status-badge success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Build successful</span>
      </div>
    {:else if activeBuild?.published}
      <div class="status-badge published">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M22 2L16 8M22 2V8M22 2H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Active Release: {activeBuild.id.slice(0, 8)}</span>
      </div>
    {:else}
      <div class="status-badge idle">
        <span>Idle</span>
      </div>
    {/if}
  </div>

  <div class="console-center">
    {#if deploymentStore.state.compiling}
      <!-- compiling -->
    {:else if deploymentStore.state.error}
      <button class="action-btn" onclick={handleCompile}>Retry</button>
    {:else if deploymentStore.state.step === "ready"}
      <button class="action-btn" onclick={handleFlash}>Flash Device</button>
      <button class="action-btn secondary" onclick={handlePublish}>Publish OTA</button>
    {:else if deploymentStore.state.step === "done" || deploymentStore.state.published}
      <button class="action-btn" onclick={handleFlash}>Flash Device</button>
      <button class="action-btn secondary" onclick={handlePublish}>Publish OTA</button>
    {:else if deploymentStore.state.step === "flash" && deploymentStore.state.manifestUrl}
      <button class="action-btn" onclick={handleFlash}>Flash Device</button>
      <button class="action-btn secondary" onclick={handlePublish}>Publish OTA</button>
    {:else if deploymentStore.state.step === "publish"}
      <button class="action-btn" onclick={handlePublish}>Publish OTA</button>
      <button class="action-btn secondary" onclick={handleFlash}>Flash Device</button>
    {:else}
      <button class="action-btn" onclick={handleCompile}>Compile Update</button>
    {/if}
  </div>

  <div class="console-right">
    {#if isCloud && creditBalance !== null}
      <span class="credits">Credits: {creditBalance}</span>
    {/if}
    <a href="/project/{projectStore.serverProjectId}/deploy" class="deploy-link">
      Release Control Room →
    </a>
  </div>
</div>

{#if showConfirm}
  <ConfirmCompileModal
    flow="update"
    onConfirm={confirmCompile}
    onCancel={() => (showConfirm = false)}
  />
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
    gap: var(--spacing-md);
    flex-shrink: 0;
  }

  .console-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .console-center {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .console-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
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

  .status-badge.success {
    color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
  }

  .status-badge.published {
    color: #ffb74d;
    background: rgba(255, 152, 0, 0.1);
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

  .action-btn {
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .action-btn:hover {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: white;
  }

  .action-btn.secondary {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .action-btn.secondary:hover {
    color: var(--color-text-primary);
  }

  .credits {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .deploy-link {
    font-size: 12px;
    color: var(--color-accent);
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .deploy-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
</style>
