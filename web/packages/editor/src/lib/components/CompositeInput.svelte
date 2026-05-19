<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    disabled?: boolean;
  }

  let { children, disabled = false }: Props = $props();

</script>

<div
  class="composite-input"
  class:disabled
>
  {@render children()}
</div>

<style>
  .composite-input {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 4px;
    min-height: 28px;
    min-width: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 12px;
    line-height: 1;
    cursor: text;
    transition: border-color 0.15s ease;
    width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .composite-input::-webkit-scrollbar {
    display: none;
  }

  .composite-input:focus-within {
    border-color: var(--color-accent);
    outline: none;
  }

  .composite-input.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-bg-secondary);
  }

  /* Style native inputs inside to blend in */
  .composite-input :global(input[type="text"]),
  .composite-input :global(input[type="number"]),
  .composite-input :global(input[type="search"]),
  .composite-input :global(input[type="url"]),
  .composite-input :global(input[type="email"]),
  .composite-input :global(input[type="password"]),
  .composite-input :global(textarea) {
    flex: 0 0 auto;
    min-width: 12px;
    width: auto;
    field-sizing: content;
    padding: 4px 2px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    outline: none;
    margin: 0;
    line-height: inherit;
  }

  /* Remove number spinners */
  .composite-input :global(input[type="number"]::-webkit-outer-spin-button),
  .composite-input :global(input[type="number"]::-webkit-inner-spin-button) {
    -webkit-appearance: none;
    margin: 0;
  }

  .composite-input :global(input[type="number"]) {
    -moz-appearance: textfield;
  }

  /* Style select elements inside */
  .composite-input :global(select) {
    flex: 1 0 auto;
    min-width: 20px;
    padding: 4px 2px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    outline: none;
    margin: 0;
    cursor: pointer;
  }

  /* Style foreign/computed elements */
  .composite-input :global(.composite-foreign) {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    padding: 2px 4px;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    user-select: none;
    pointer-events: none;
  }

  /* Optional divider between sections */
  .composite-input :global(.composite-divider) {
    width: 1px;
    align-self: stretch;
    background: var(--color-border);
    margin: 4px 0;
    opacity: 0.6;
  }

  /* Optional action button inside */
  .composite-input :global(.composite-action) {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 4px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .composite-input :global(.composite-action:hover) {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
</style>
