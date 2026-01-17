/**
 * Project Store - Central state management for the ESPHome Designer project
 *
 * Uses Svelte 5 runes for reactive state management.
 */

import type {
  Project,
  Page,
  Component,
  DisplayConfig,
  FontDefinition,
} from "@esphome-designer/schema";

function createProjectStore() {
  // Core project state
  let project = $state<Project>({
    name: "New Project",
    display: {
      width: 240,
      height: 320,
      platform: "ili9xxx",
    },
    pages: [
      {
        id: "page-1",
        name: "Home",
        components: [],
      },
    ],
    fonts: [],
  });

  // Current page tracking
  let currentPageId = $state("page-1");

  // Derived state
  const currentPage = $derived(
    project.pages.find((p) => p.id === currentPageId) ?? project.pages[0]
  );

  const currentPageIndex = $derived(
    project.pages.findIndex((p) => p.id === currentPageId)
  );

  return {
    // Getters
    get project() {
      return project;
    },
    get currentPage() {
      return currentPage;
    },
    get currentPageId() {
      return currentPageId;
    },
    get currentPageIndex() {
      return currentPageIndex;
    },
    get display() {
      return project.display;
    },
    get pages() {
      return project.pages;
    },
    get fonts() {
      return project.fonts ?? [];
    },

    // Page management
    setCurrentPage(id: string) {
      if (project.pages.some((p) => p.id === id)) {
        currentPageId = id;
      }
    },

    addPage(page?: Partial<Page>) {
      const newPage: Page = {
        id: page?.id ?? `page-${Date.now()}`,
        name: page?.name ?? `Page ${project.pages.length + 1}`,
        components: page?.components ?? [],
        backgroundColor: page?.backgroundColor,
      };
      project.pages.push(newPage);
      currentPageId = newPage.id;
      return newPage;
    },

    deletePage(id: string) {
      if (project.pages.length <= 1) return; // Keep at least one page
      const idx = project.pages.findIndex((p) => p.id === id);
      if (idx !== -1) {
        project.pages.splice(idx, 1);
        if (currentPageId === id) {
          currentPageId = project.pages[0].id;
        }
      }
    },

    updatePage(id: string, updates: Partial<Page>) {
      const page = project.pages.find((p) => p.id === id);
      if (page) {
        Object.assign(page, updates);
      }
    },

    // Component management
    addComponent(component: Component) {
      currentPage.components.push(component);
      return component;
    },

    updateComponent(id: string, updates: Partial<Component>) {
      const idx = currentPage.components.findIndex((c) => c.id === id);
      if (idx !== -1) {
        currentPage.components[idx] = {
          ...currentPage.components[idx],
          ...updates,
        } as Component;
      }
    },

    deleteComponent(id: string) {
      const idx = currentPage.components.findIndex((c) => c.id === id);
      if (idx !== -1) {
        currentPage.components.splice(idx, 1);
      }
    },

    getComponent(id: string): Component | undefined {
      return currentPage.components.find((c) => c.id === id);
    },

    moveComponent(id: string, dx: number, dy: number) {
      const component = currentPage.components.find((c) => c.id === id);
      if (component) {
        component.position.x += dx;
        component.position.y += dy;
        // Clamp to display bounds
        component.position.x = Math.max(
          0,
          Math.min(component.position.x, project.display.width - 1)
        );
        component.position.y = Math.max(
          0,
          Math.min(component.position.y, project.display.height - 1)
        );
      }
    },

    resizeComponent(id: string, width: number, height: number) {
      const component = currentPage.components.find((c) => c.id === id);
      if (component && component.size) {
        component.size.width = Math.max(10, width);
        component.size.height = Math.max(10, height);
      }
    },

    // Display config
    updateDisplay(config: Partial<DisplayConfig>) {
      Object.assign(project.display, config);
    },

    // Font management
    addFont(font: FontDefinition) {
      if (!project.fonts) project.fonts = [];
      project.fonts.push(font);
    },

    deleteFont(id: string) {
      if (project.fonts) {
        const idx = project.fonts.findIndex((f) => f.id === id);
        if (idx !== -1) {
          project.fonts.splice(idx, 1);
        }
      }
    },

    // Project management
    updateProject(updates: Partial<Project>) {
      Object.assign(project, updates);
    },

    loadProject(p: Project) {
      project = p;
      currentPageId = p.pages[0]?.id ?? "";
    },

    newProject() {
      project = {
        name: "New Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        pages: [{ id: "page-1", name: "Home", components: [] }],
        fonts: [],
      };
      currentPageId = "page-1";
    },

    // Serialization
    exportJSON(): string {
      return JSON.stringify(project, null, 2);
    },

    importJSON(json: string): boolean {
      try {
        const parsed = JSON.parse(json) as Project;
        // Basic validation
        if (!parsed.name || !parsed.display || !parsed.pages) {
          throw new Error("Invalid project structure");
        }
        this.loadProject(parsed);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const projectStore = createProjectStore();
