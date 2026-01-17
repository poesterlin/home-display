<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<div class="app-layout">
  {@render children()}
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
</style>
