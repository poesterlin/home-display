import { x as attr_class, y as attr_style, z as stringify, F as attr, G as ensure_array_like, J as head } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/context.js";
function createProjectStore() {
  let project = {
    name: "New Project",
    display: { width: 240, height: 320, platform: "ili9xxx" },
    pages: [{ id: "page-1", name: "Home", components: [] }],
    fonts: []
  };
  let currentPageId = "page-1";
  const currentPage = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0];
  const currentPageIndex = project.pages.findIndex((p) => p.id === currentPageId);
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
    setCurrentPage(id) {
      if (project.pages.some((p) => p.id === id)) {
        currentPageId = id;
      }
    },
    addPage(page) {
      const newPage = {
        id: page?.id ?? `page-${Date.now()}`,
        name: page?.name ?? `Page ${project.pages.length + 1}`,
        components: page?.components ?? [],
        backgroundColor: page?.backgroundColor
      };
      project.pages.push(newPage);
      currentPageId = newPage.id;
      return newPage;
    },
    deletePage(id) {
      if (project.pages.length <= 1) return;
      const idx = project.pages.findIndex((p) => p.id === id);
      if (idx !== -1) {
        project.pages.splice(idx, 1);
        if (currentPageId === id) {
          currentPageId = project.pages[0].id;
        }
      }
    },
    updatePage(id, updates) {
      const page = project.pages.find((p) => p.id === id);
      if (page) {
        Object.assign(page, updates);
      }
    },
    // Component management
    addComponent(component) {
      currentPage.components.push(component);
      return component;
    },
    updateComponent(id, updates) {
      const idx = currentPage.components.findIndex((c) => c.id === id);
      if (idx !== -1) {
        currentPage.components[idx] = { ...currentPage.components[idx], ...updates };
      }
    },
    deleteComponent(id) {
      const idx = currentPage.components.findIndex((c) => c.id === id);
      if (idx !== -1) {
        currentPage.components.splice(idx, 1);
      }
    },
    getComponent(id) {
      return currentPage.components.find((c) => c.id === id);
    },
    moveComponent(id, dx, dy) {
      const component = currentPage.components.find((c) => c.id === id);
      if (component) {
        component.position.x += dx;
        component.position.y += dy;
        component.position.x = Math.max(0, Math.min(component.position.x, project.display.width - 1));
        component.position.y = Math.max(0, Math.min(component.position.y, project.display.height - 1));
      }
    },
    resizeComponent(id, width, height) {
      const component = currentPage.components.find((c) => c.id === id);
      if (component && component.size) {
        component.size.width = Math.max(10, width);
        component.size.height = Math.max(10, height);
      }
    },
    // Display config
    updateDisplay(config) {
      Object.assign(project.display, config);
    },
    // Font management
    addFont(font) {
      if (!project.fonts) project.fonts = [];
      project.fonts.push(font);
    },
    deleteFont(id) {
      if (project.fonts) {
        const idx = project.fonts.findIndex((f) => f.id === id);
        if (idx !== -1) {
          project.fonts.splice(idx, 1);
        }
      }
    },
    // Project management
    updateProject(updates) {
      Object.assign(project, updates);
    },
    loadProject(p) {
      project = p;
      currentPageId = p.pages[0]?.id ?? "";
    },
    newProject() {
      project = {
        name: "New Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        pages: [{ id: "page-1", name: "Home", components: [] }],
        fonts: []
      };
      currentPageId = "page-1";
    },
    // Serialization
    exportJSON() {
      return JSON.stringify(project, null, 2);
    },
    importJSON(json) {
      try {
        const parsed = JSON.parse(json);
        if (!parsed.name || !parsed.display || !parsed.pages) {
          throw new Error("Invalid project structure");
        }
        this.loadProject(parsed);
        return true;
      } catch {
        return false;
      }
    }
  };
}
const projectStore = createProjectStore();
function createSelectionStore() {
  let selectedIds = /* @__PURE__ */ new Set();
  let hoveredId = null;
  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;
  const firstSelectedId = selectedIds.size > 0 ? [...selectedIds][0] : null;
  return {
    // Getters
    get selectedIds() {
      return selectedIds;
    },
    get hoveredId() {
      return hoveredId;
    },
    get hasSelection() {
      return hasSelection;
    },
    get selectedCount() {
      return selectedCount;
    },
    get firstSelectedId() {
      return firstSelectedId;
    },
    // Selection operations
    select(id) {
      selectedIds = /* @__PURE__ */ new Set([id]);
    },
    toggle(id) {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      selectedIds = newSet;
    },
    addToSelection(id) {
      const newSet = new Set(selectedIds);
      newSet.add(id);
      selectedIds = newSet;
    },
    removeFromSelection(id) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      selectedIds = newSet;
    },
    clear() {
      selectedIds = /* @__PURE__ */ new Set();
    },
    selectMultiple(ids) {
      selectedIds = new Set(ids);
    },
    isSelected(id) {
      return selectedIds.has(id);
    },
    // Hover operations
    setHovered(id) {
      hoveredId = id;
    },
    isHovered(id) {
      return hoveredId === id;
    }
  };
}
const selectionStore = createSelectionStore();
function createHistoryStore() {
  let undoStack = [];
  let redoStack = [];
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  return {
    // Getters
    get canUndo() {
      return canUndo;
    },
    get canRedo() {
      return canRedo;
    },
    get undoCount() {
      return undoStack.length;
    },
    get redoCount() {
      return redoStack.length;
    },
    // Record current state before making a change
    record(description) {
      const snapshot = projectStore.exportJSON();
      undoStack = [
        ...undoStack.slice(-49),
        { snapshot, description, timestamp: Date.now() }
      ];
      redoStack = [];
    },
    // Undo last action
    undo() {
      if (undoStack.length === 0) return;
      const currentSnapshot = projectStore.exportJSON();
      const lastEntry = undoStack[undoStack.length - 1];
      redoStack = [
        ...redoStack,
        {
          snapshot: currentSnapshot,
          description: lastEntry.description,
          timestamp: Date.now()
        }
      ];
      const newUndoStack = [...undoStack];
      const entry = newUndoStack.pop();
      undoStack = newUndoStack;
      const project = JSON.parse(entry.snapshot);
      projectStore.loadProject(project);
    },
    // Redo last undone action
    redo() {
      if (redoStack.length === 0) return;
      const currentSnapshot = projectStore.exportJSON();
      const lastEntry = redoStack[redoStack.length - 1];
      undoStack = [
        ...undoStack,
        {
          snapshot: currentSnapshot,
          description: lastEntry.description,
          timestamp: Date.now()
        }
      ];
      const newRedoStack = [...redoStack];
      const entry = newRedoStack.pop();
      redoStack = newRedoStack;
      const project = JSON.parse(entry.snapshot);
      projectStore.loadProject(project);
    },
    // Clear all history
    clear() {
      undoStack = [];
      redoStack = [];
    }
  };
}
const historyStore = createHistoryStore();
function Draggable($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component, children } = $$props;
    let dragging = false;
    const isSelected = selectionStore.isSelected(component.id);
    const isHovered = selectionStore.isHovered(component.id);
    $$renderer2.push(`<div${attr_class("draggable svelte-14cdafw", void 0, {
      "selected": isSelected,
      "hovered": isHovered,
      "dragging": dragging
    })} role="button" tabindex="0"${attr_style("", {
      left: `${stringify(component.position.x)}px`,
      top: `${stringify(component.position.y)}px`,
      width: `${stringify(component.size?.width ?? "auto")}px`,
      height: `${stringify(component.size?.height ?? "auto")}px`
    })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function TextRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    const fontSize = component.fontSize === "small" ? 12 : component.fontSize === "large" ? 20 : 14;
    const textAlign = component.align ?? "left";
    const colorStyle = component.color ? `rgb(${component.color.r}, ${component.color.g}, ${component.color.b})` : "#ffffff";
    Draggable($$renderer2, {
      component,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="text-component svelte-75tebk"${attr_style("", {
          "font-size": `${stringify(fontSize)}px`,
          "text-align": textAlign,
          color: colorStyle
        })}>${escape_html(component.text ?? "Text")} `);
        if (component.textBinding) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="binding-indicator svelte-75tebk">(${escape_html(component.textBinding.entityId)})</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
  });
}
function ButtonRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    const bgColor = component.backgroundColor ? `rgb(${component.backgroundColor.r}, ${component.backgroundColor.g}, ${component.backgroundColor.b})` : "#333333";
    Draggable($$renderer2, {
      component,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="button-component svelte-j5j2oz"${attr_style("", { "background-color": bgColor })}>`);
        if (component.icon) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="icon svelte-j5j2oz">${escape_html(component.icon)}</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> <span class="label svelte-j5j2oz">${escape_html(component.label ?? "Button")}</span></div>`);
      }
    });
  });
}
function SliderRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    let previewValue = 50;
    const isVertical = component.orientation === "vertical";
    const percentage = (previewValue - (component.min ?? 0)) / ((component.max ?? 100) - (component.min ?? 0)) * 100;
    Draggable($$renderer2, {
      component,
      children: ($$renderer3) => {
        $$renderer3.push(`<div${attr_class("slider-component svelte-1tf33mu", void 0, { "vertical": isVertical })}><div class="track svelte-1tf33mu"><div class="fill svelte-1tf33mu"${attr_style(isVertical ? `height: ${percentage}%` : `width: ${percentage}%`)}></div> <div class="thumb svelte-1tf33mu"${attr_style(isVertical ? `bottom: ${percentage}%` : `left: ${percentage}%`)}></div></div> `);
        if (component.valueBinding) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="binding-indicator svelte-1tf33mu">${escape_html(component.valueBinding.entityId)}</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
  });
}
function GaugeRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    let previewValue = 65;
    const normalizedValue = (previewValue - component.min) / (component.max - component.min);
    const angle = -135 + normalizedValue * 270;
    const cx = (component.size?.width ?? 80) / 2;
    const cy = (component.size?.height ?? 80) / 2;
    const radius = Math.min(cx, cy) - 8;
    const needleLen = radius - 10;
    const radians = angle * Math.PI / 180;
    const needleX = cx + needleLen * Math.cos(radians);
    const needleY = cy + needleLen * Math.sin(radians);
    Draggable($$renderer2, {
      component,
      children: ($$renderer3) => {
        $$renderer3.push(`<svg class="gauge-component svelte-16ug2u4"${attr("width", component.size?.width ?? 80)}${attr("height", component.size?.height ?? 80)}><circle${attr("cx", cx)}${attr("cy", cy)}${attr("r", radius)} fill="#2a2a2a" stroke="#444" stroke-width="2"></circle>`);
        if (component.segments) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(component.segments);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            each_array[$$index];
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--><line${attr("x1", cx)}${attr("y1", cy)}${attr("x2", needleX)}${attr("y2", needleY)} stroke="#ff6b00" stroke-width="2" stroke-linecap="round"></line><circle${attr("cx", cx)}${attr("cy", cy)} r="4" fill="#ff6b00"></circle><text${attr("x", cx)}${attr("y", cy + radius / 2)} text-anchor="middle" fill="white" font-size="12">65${escape_html(component.unit ?? "")}</text></svg> `);
        if (component.valueBinding) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="binding-indicator svelte-16ug2u4">${escape_html(component.valueBinding.entityId)}</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function IconRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    const colorStyle = component.color ? `rgb(${component.color.r}, ${component.color.g}, ${component.color.b})` : "#ffffff";
    const scale = component.scale ?? 1;
    Draggable($$renderer2, {
      component,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="icon-component svelte-1obukyq"${attr_style("", { color: colorStyle, transform: `scale(${stringify(scale)})` })}><span class="icon-placeholder svelte-1obukyq">${escape_html(component.icon)}</span></div>`);
      }
    });
  });
}
function ComponentRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    if (component.type === "text") {
      $$renderer2.push("<!--[-->");
      TextRenderer($$renderer2, { component });
    } else {
      $$renderer2.push("<!--[!-->");
      if (component.type === "button") {
        $$renderer2.push("<!--[-->");
        ButtonRenderer($$renderer2, { component });
      } else {
        $$renderer2.push("<!--[!-->");
        if (component.type === "slider") {
          $$renderer2.push("<!--[-->");
          SliderRenderer($$renderer2, { component });
        } else {
          $$renderer2.push("<!--[!-->");
          if (component.type === "gauge") {
            $$renderer2.push("<!--[-->");
            GaugeRenderer($$renderer2, { component });
          } else {
            $$renderer2.push("<!--[!-->");
            if (component.type === "icon") {
              $$renderer2.push("<!--[-->");
              IconRenderer($$renderer2, { component });
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<div class="unknown-component svelte-il58qs">Unknown: ${escape_html(component.type)}</div>`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function SelectionOverlay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function getSelectionBounds() {
      const bounds = [];
      for (const id of selectionStore.selectedIds) {
        const component = projectStore.getComponent(id);
        if (component) {
          bounds.push({
            id,
            x: component.position.x,
            y: component.position.y,
            width: component.size?.width ?? 50,
            height: component.size?.height ?? 20
          });
        }
      }
      return bounds;
    }
    const selectedBounds = getSelectionBounds();
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(selectedBounds);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let bound = each_array[$$index];
      $$renderer2.push(`<div class="selection-box svelte-1strj1n"${attr_style("", {
        left: `${stringify(bound.x)}px`,
        top: `${stringify(bound.y)}px`,
        width: `${stringify(bound.width)}px`,
        height: `${stringify(bound.height)}px`
      })}><div class="handle nw svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle n svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle ne svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle e svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle se svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle s svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle sw svelte-1strj1n" role="button" tabindex="-1"></div> <div class="handle w svelte-1strj1n" role="button" tabindex="-1"></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function DesignCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="canvas-wrapper svelte-1oyyt6v"${attr_style("", {
      width: `${stringify(projectStore.display.width)}px`,
      height: `${stringify(projectStore.display.height)}px`
    })}><div class="canvas svelte-1oyyt6v" role="application" tabindex="0" aria-label="Design canvas"><!--[-->`);
    const each_array = ensure_array_like(projectStore.currentPage.components);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let component = each_array[$$index];
      ComponentRenderer($$renderer2, { component });
    }
    $$renderer2.push(`<!--]--> `);
    SelectionOverlay($$renderer2);
    $$renderer2.push(`<!----></div> <div class="size-indicator svelte-1oyyt6v">${escape_html(projectStore.display.width)} x ${escape_html(projectStore.display.height)}</div></div>`);
  });
}
function ComponentPalette($$renderer) {
  const components = [
    {
      type: "text",
      label: "Text",
      icon: "T",
      description: "Display text or entity value"
    },
    {
      type: "button",
      label: "Button",
      icon: "B",
      description: "Tap to trigger action"
    },
    {
      type: "slider",
      label: "Slider",
      icon: "S",
      description: "Adjust numeric value"
    },
    {
      type: "gauge",
      label: "Gauge",
      icon: "G",
      description: "Visual meter display"
    },
    {
      type: "icon",
      label: "Icon",
      icon: "I",
      description: "MDI icon display"
    }
  ];
  $$renderer.push(`<div class="palette svelte-1evy3ad"><h3 class="svelte-1evy3ad">Components</h3> <div class="component-list svelte-1evy3ad"><!--[-->`);
  const each_array = ensure_array_like(components);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let comp = each_array[$$index];
    $$renderer.push(`<div class="palette-item svelte-1evy3ad" draggable="true" role="button" tabindex="0"><span class="item-icon svelte-1evy3ad">${escape_html(comp.icon)}</span> <div class="item-info svelte-1evy3ad"><span class="item-label svelte-1evy3ad">${escape_html(comp.label)}</span> <span class="item-desc svelte-1evy3ad">${escape_html(comp.description)}</span></div></div>`);
  }
  $$renderer.push(`<!--]--></div> <div class="help-text svelte-1evy3ad">Drag components onto the canvas to add them.</div></div>`);
}
function EntityPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    const currentBinding = () => {
      if (component.type === "text") {
        return component.textBinding;
      }
      return component.valueBinding;
    };
    let entityId = currentBinding?.entityId ?? "";
    let attribute = currentBinding?.attribute ?? "";
    const domainHints = [
      "sensor",
      "binary_sensor",
      "switch",
      "light",
      "climate",
      "cover",
      "media_player",
      "input_number",
      "input_boolean"
    ];
    $$renderer2.push(`<div class="entity-picker svelte-4afv7w"><div class="field svelte-4afv7w"><span class="field-label svelte-4afv7w">Entity</span> <input type="text" placeholder="sensor.temperature"${attr("value", entityId)} list="entity-domains" class="svelte-4afv7w"/> <datalist id="entity-domains"><!--[-->`);
    const each_array = ensure_array_like(domainHints);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let domain = each_array[$$index];
      $$renderer2.option({ value: `${stringify(domain)}.` }, ($$renderer3) => {
      });
    }
    $$renderer2.push(`<!--]--></datalist></div> <div class="field svelte-4afv7w"><span class="field-label svelte-4afv7w">Attribute</span> <input type="text" placeholder="(optional)"${attr("value", attribute)} class="svelte-4afv7w"/></div> `);
    if (entityId) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="preview svelte-4afv7w">Binding: <code class="svelte-4afv7w">${escape_html(entityId)}${escape_html(attribute ? `.${attribute}` : "")}</code></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function PropertyEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const selectedComponent = selectionStore.firstSelectedId ? projectStore.getComponent(selectionStore.firstSelectedId) : null;
    function updateProperty(key, value) {
      if (!selectedComponent) return;
      historyStore.record(`Update ${key}`);
      projectStore.updateComponent(selectedComponent.id, { [key]: value });
    }
    $$renderer2.push(`<div class="property-editor svelte-7r1onb">`);
    if (selectedComponent) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<h3 class="svelte-7r1onb">Properties</h3> <div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Component</label> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Type</span> <span class="field-value svelte-7r1onb">${escape_html(selectedComponent.type)}</span></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">ID</span> <input type="text"${attr("value", selectedComponent.id)} readonly class="readonly svelte-7r1onb"/></div></div> <div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Position</label> <div class="field-row svelte-7r1onb"><div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">X</span> <input type="number"${attr("value", selectedComponent.position.x)} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Y</span> <input type="number"${attr("value", selectedComponent.position.y)} class="svelte-7r1onb"/></div></div></div> `);
      if (selectedComponent.size) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Size</label> <div class="field-row svelte-7r1onb"><div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">W</span> <input type="number"${attr("value", selectedComponent.size.width)} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">H</span> <input type="number"${attr("value", selectedComponent.size.height)} class="svelte-7r1onb"/></div></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedComponent.type === "text") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Text</label> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Content</span> <input type="text"${attr("value", selectedComponent.text ?? "")} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Size</span> `);
        $$renderer2.select(
          {
            value: selectedComponent.fontSize ?? "medium",
            onchange: (e) => updateProperty("fontSize", e.currentTarget.value),
            class: ""
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "small" }, ($$renderer4) => {
              $$renderer4.push(`Small`);
            });
            $$renderer3.option({ value: "medium" }, ($$renderer4) => {
              $$renderer4.push(`Medium`);
            });
            $$renderer3.option({ value: "large" }, ($$renderer4) => {
              $$renderer4.push(`Large`);
            });
          },
          "svelte-7r1onb"
        );
        $$renderer2.push(`</div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Align</span> `);
        $$renderer2.select(
          {
            value: selectedComponent.align ?? "left",
            onchange: (e) => updateProperty("align", e.currentTarget.value),
            class: ""
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "left" }, ($$renderer4) => {
              $$renderer4.push(`Left`);
            });
            $$renderer3.option({ value: "center" }, ($$renderer4) => {
              $$renderer4.push(`Center`);
            });
            $$renderer3.option({ value: "right" }, ($$renderer4) => {
              $$renderer4.push(`Right`);
            });
          },
          "svelte-7r1onb"
        );
        $$renderer2.push(`</div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedComponent.type === "button") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Button</label> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Label</span> <input type="text"${attr("value", selectedComponent.label ?? "")} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Icon</span> <input type="text"${attr("value", selectedComponent.icon ?? "")} placeholder="mdi:icon-name" class="svelte-7r1onb"/></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedComponent.type === "slider") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Slider</label> <div class="field-row svelte-7r1onb"><div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Min</span> <input type="number"${attr("value", selectedComponent.min ?? 0)} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Max</span> <input type="number"${attr("value", selectedComponent.max ?? 100)} class="svelte-7r1onb"/></div></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Orientation</span> `);
        $$renderer2.select(
          {
            value: selectedComponent.orientation ?? "horizontal",
            onchange: (e) => updateProperty("orientation", e.currentTarget.value),
            class: ""
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "horizontal" }, ($$renderer4) => {
              $$renderer4.push(`Horizontal`);
            });
            $$renderer3.option({ value: "vertical" }, ($$renderer4) => {
              $$renderer4.push(`Vertical`);
            });
          },
          "svelte-7r1onb"
        );
        $$renderer2.push(`</div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedComponent.type === "gauge") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Gauge</label> <div class="field-row svelte-7r1onb"><div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Min</span> <input type="number"${attr("value", selectedComponent.min ?? 0)} class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Max</span> <input type="number"${attr("value", selectedComponent.max ?? 100)} class="svelte-7r1onb"/></div></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Unit</span> <input type="text"${attr("value", selectedComponent.unit ?? "")} placeholder="e.g. %" class="svelte-7r1onb"/></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (selectedComponent.type === "icon") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Icon</label> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Icon</span> <input type="text"${attr("value", selectedComponent.icon ?? "")} placeholder="mdi:home" class="svelte-7r1onb"/></div> <div class="field svelte-7r1onb"><span class="field-label svelte-7r1onb">Scale</span> <input type="number" step="0.1" min="0.1" max="5"${attr("value", selectedComponent.scale ?? 1)} class="svelte-7r1onb"/></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="property-section svelte-7r1onb"><label class="section-label svelte-7r1onb">Entity Binding</label> `);
      EntityPicker($$renderer2, {
        component: selectedComponent
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="no-selection svelte-7r1onb"><p class="svelte-7r1onb">Select a component to edit its properties</p></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Toolbar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<header class="toolbar svelte-13354df"><div class="toolbar-left svelte-13354df"><div class="logo svelte-13354df">ESPHome Designer</div></div> <div class="toolbar-center svelte-13354df"><input type="text" class="project-name svelte-13354df"${attr("value", projectStore.project.name)}/></div> <div class="toolbar-right svelte-13354df"><button title="New Project" class="svelte-13354df">New</button> <button title="Load Project" class="svelte-13354df">Load</button> <button title="Save Project" class="svelte-13354df">Save</button> <div class="separator svelte-13354df"></div> <button${attr("disabled", !historyStore.canUndo, true)} title="Undo (Ctrl+Z)" class="svelte-13354df">Undo</button> <button${attr("disabled", !historyStore.canRedo, true)} title="Redo (Ctrl+Y)" class="svelte-13354df">Redo</button> <div class="separator svelte-13354df"></div> <button class="primary svelte-13354df">Export Code</button></div></header>`);
  });
}
function _page($$renderer) {
  head("1uha8ag", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>ESPHome Designer</title>`);
    });
  });
  Toolbar($$renderer);
  $$renderer.push(`<!----> <div class="editor-container svelte-1uha8ag"><aside class="sidebar left svelte-1uha8ag">`);
  ComponentPalette($$renderer);
  $$renderer.push(`<!----></aside> <main class="canvas-area svelte-1uha8ag">`);
  DesignCanvas($$renderer);
  $$renderer.push(`<!----></main> <aside class="sidebar right svelte-1uha8ag">`);
  PropertyEditor($$renderer);
  $$renderer.push(`<!----></aside></div> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
export {
  _page as default
};
