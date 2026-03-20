import { SvelteMap } from "svelte/reactivity";

/**
 * Store to track which variant of a conditional area is currently being edited.
 */
class ConditionalEditorStore {
  // Map of componentId -> activeVariantId
  activeVariants = new SvelteMap<string, string>();
  // Map of componentId -> activeTabId
  activeTabs = new SvelteMap<string, string>();

  setActiveVariant(componentId: string, variantId: string) {
    this.activeVariants.set(componentId, variantId);
  }

  getActiveVariant(componentId: string, defaultVariantId?: string): string {
    return this.activeVariants.get(componentId) ?? defaultVariantId ?? "";
  }

  setActiveTab(componentId: string, tabId: string) {
    this.activeTabs.set(componentId, tabId);
  }

  getActiveTab(componentId: string, defaultTabId?: string): string {
    return this.activeTabs.get(componentId) ?? defaultTabId ?? "";
  }
}

export const conditionalEditorStore = new ConditionalEditorStore();
