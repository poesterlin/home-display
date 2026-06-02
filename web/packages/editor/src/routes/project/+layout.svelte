<script lang="ts">
  let { children } = $props();
</script>

<div class="editor-layout">
  {@render children()}
</div>

<style>
  .editor-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
</style>
