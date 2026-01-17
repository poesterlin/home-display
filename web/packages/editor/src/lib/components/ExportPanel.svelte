<script lang="ts">
  import { projectStore } from "$lib/stores/project.svelte";
  import { generateESPHomeYAML } from "$lib/codegen/esphome";
  import { generateCppRenderer } from "$lib/codegen/cpp";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let yamlOutput = $state("");
  let cppOutput = $state("");
  let activeTab = $state<"yaml" | "cpp" | "json">("yaml");

  // Generate on mount
  $effect(() => {
    generate();
  });

  function generate() {
    try {
      yamlOutput = generateESPHomeYAML(projectStore.project);
      cppOutput = generateCppRenderer(projectStore.project);
    } catch (err) {
      console.error("Code generation failed:", err);
      yamlOutput = `# Error generating YAML: ${err}`;
      cppOutput = `// Error generating C++: ${err}`;
    }
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    const projectName = projectStore.project.name.toLowerCase().replace(/\s+/g, "-");
    download(`${projectName}.yaml`, yamlOutput);
    download(`${projectName}_renderer.h`, cppOutput);
    download(`${projectName}.json`, projectStore.exportJSON());
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const currentOutput = $derived(
    activeTab === "yaml" ? yamlOutput : activeTab === "cpp" ? cppOutput : projectStore.exportJSON()
  );

  const currentFilename = $derived(
    activeTab === "yaml"
      ? "display.yaml"
      : activeTab === "cpp"
        ? "display_renderer.h"
        : "project.json"
  );
</script>

<div class="export-panel">
  <div class="header">
    <h2>Export Code</h2>
    <button class="close-btn" onclick={onClose}>Close</button>
  </div>

  <div class="actions">
    <button onclick={generate}>Regenerate</button>
    <button onclick={() => copyToClipboard(currentOutput)}>Copy to Clipboard</button>
    <button onclick={() => download(currentFilename, currentOutput)}>
      Download {currentFilename}
    </button>
    <button class="primary" onclick={downloadAll}>Download All</button>
  </div>

  <div class="tabs">
    <button class:active={activeTab === "yaml"} onclick={() => (activeTab = "yaml")}>
      ESPHome YAML
    </button>
    <button class:active={activeTab === "cpp"} onclick={() => (activeTab = "cpp")}>
      C++ Renderer
    </button>
    <button class:active={activeTab === "json"} onclick={() => (activeTab = "json")}>
      Project JSON
    </button>
  </div>

  <div class="code-container">
    <pre><code>{currentOutput}</code></pre>
  </div>
</div>

<style>
  .export-panel {
    width: 800px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  h2 {
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .actions {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  .tabs {
    display: flex;
    padding: 0 var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .tabs button {
    background: transparent;
    border-radius: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tabs button.active {
    border-bottom-color: var(--color-accent);
    color: var(--color-accent);
  }

  .tabs button:hover:not(.active) {
    background: var(--color-bg-tertiary);
  }

  .code-container {
    flex: 1;
    overflow: auto;
    max-height: 50vh;
  }

  pre {
    margin: 0;
    padding: var(--spacing-md);
    background: var(--color-bg-primary);
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  code {
    color: var(--color-text-primary);
  }
</style>
