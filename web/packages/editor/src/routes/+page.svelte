<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { onMount } from "svelte";

  let projects = $state<{ id: string; name: string; updatedAt: string }[]>([]);
  let newProjectName = $state("");

  onMount(() => {
    projects = projectStore.listProjects();
  });

  function createProject() {
    if (!newProjectName.trim()) return;
    const project = projectStore.createNewProject(newProjectName);
    window.location.href = `/project/${project.id}`;
  }

  function deleteProject(id: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      projectStore.deleteProject(id);
      projects = projectStore.listProjects();
    }
  }
</script>

<div class="project-selector">
  <header>
    <h1>ESPHome Designer</h1>
    <p>Visual editor for ESPHome display configurations</p>
  </header>

  <main>
    <section class="create-project">
      <h2>Create New Project</h2>
      <div class="input-group">
        <input
          type="text"
          placeholder="My Awesome Display"
          bind:value={newProjectName}
          onkeydown={(e) => e.key === "Enter" && createProject()}
        />
        <button class="primary" onclick={createProject}>Create Project</button>
      </div>
    </section>

    <section class="project-list">
      <h2>Your Projects</h2>
      {#if projects.length === 0}
        <div class="empty-state">
          <p>No projects yet. Create one to get started!</p>
        </div>
      {:else}
        <div class="grid">
          {#each projects as project}
            <a href="/project/{project.id}" class="project-card">
              <div class="project-info">
                <h3>{project.name}</h3>
                <span class="date">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
              <button class="delete-btn" onclick={(e) => deleteProject(project.id, e)} title="Delete Project">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </button>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>

<style>
  .project-selector {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--spacing-xl);
  }

  header {
    text-align: center;
    margin-bottom: var(--spacing-xxl);
  }

  h1 {
    font-size: 3rem;
    margin-bottom: var(--spacing-xs);
    background: linear-gradient(135deg, var(--color-accent), #4facfe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  header p {
    color: var(--color-text-secondary);
    font-size: 1.2rem;
  }

  section {
    margin-bottom: var(--spacing-xxl);
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-sm);
  }

  .input-group {
    display: flex;
    gap: var(--spacing-md);
    max-width: 500px;
  }

  input {
    flex: 1;
    font-size: 1rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
  }

  .project-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-lg);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all 0.2s;
  }

  .project-card:hover {
    border-color: var(--color-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .project-info h3 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
  }

  .date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .delete-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: all 0.2s;
  }

  .project-card:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: #ff5252;
    background: rgba(255, 82, 82, 0.1);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xxl);
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    border: 2px dashed var(--color-border);
  }
</style>
