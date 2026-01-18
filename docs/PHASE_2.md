# PHASE 2: State Management Code Generation

**Status:** Planning & Implementation
**Scope:** Auto-generate `state_manager.h` from project schema
**Deliverable:** Complete `DisplayState` struct with `ViewState` enum and gState global

---

## Overview

Phase 2 generates the central state management header that governs navigation, scrolling, and sensor state. This is the **single source of truth** for the display's runtime behavior.

### Input
- Project schema (JSON from web editor)
- Component bindings and detail view definitions

### Output
- `esphome/includes/state_manager.h` - Complete state management header

---

## Part 1: Schema Extensions for State

Before generating code, we need to extend the schema to define:
1. All detail views and their properties
2. Sensor fields the user wants to track
3. Navigation structure

### New Schema Properties

#### DetailView Definition
```json
{
  "DetailView": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "pattern": "^[A-Z_]+$",
        "description": "Short view name in UPPER_SNAKE_CASE (e.g., TEMPS, VACUUM). Generator prepends VIEW_DETAIL_ prefix for enum."
      },
      "title": { "type": "string" },
      "height": {
        "type": "number",
        "description": "Total virtual height in pixels; maxScrollY = height - headerHeight"
      },
      "headerHeight": {
        "type": "number",
        "default": 45,
        "description": "Height of the detail view header (default: 45px)"
      },
      "components": {
        "type": "array",
        "items": { "$ref": "#/definitions/Component" }
      }
    },
    "required": ["id", "title", "height", "components"]
  }
}
```

#### StateField Definition (Manual Sensor Declaration)
```json
{
  "StateField": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "pattern": "^[a-z_]+$",
        "description": "Variable name in gState (e.g., outsideTemp)"
      },
      "cppType": {
        "type": "string",
        "enum": ["float", "int", "bool", "std::string"],
        "description": "C++ type"
      },
      "haEntity": {
        "type": "string",
        "pattern": "^[a-z_]+\\.[a-z_0-9]+$",
        "description": "Home Assistant entity (sensor.outside_temp)"
      },
      "defaultValue": {
        "type": ["string", "number", "boolean"],
        "description": "Initial value (e.g., 0, false, '')"
      }
    },
    "required": ["name", "cppType", "haEntity"]
  }
}
```

#### ActionBinding Extension (Unified with WEB_ARCHITECTURE.md)

The existing `ActionBinding` in WEB_ARCHITECTURE.md only supports HA service calls. We extend it to support navigation actions:

```json
{
  "ActionBinding": {
    "oneOf": [
      { "$ref": "#/definitions/ServiceAction" },
      { "$ref": "#/definitions/NavigationAction" }
    ]
  },
  "ServiceAction": {
    "type": "object",
    "properties": {
      "type": { "const": "SERVICE" },
      "service": { "type": "string", "pattern": "^[a-z_]+\\.[a-z_0-9]+$" },
      "target": { "$ref": "#/definitions/EntityBinding" },
      "data": { "type": "object" }
    },
    "required": ["type", "service"]
  },
  "NavigationAction": {
    "type": "object",
    "properties": {
      "type": { "enum": ["OPEN_DETAIL", "GO_BACK", "NEXT_PAGE", "PREV_PAGE"] },
      "targetId": {
        "type": "string",
        "pattern": "^[A-Z_]+$",
        "description": "Detail view ID (without VIEW_DETAIL_ prefix). Required for OPEN_DETAIL."
      }
    },
    "required": ["type"]
  }
}
```

**Usage Examples:**
```json
// Navigation action
"onTap": { "type": "OPEN_DETAIL", "targetId": "TEMPS" }

// Service action
"onTap": { "type": "SERVICE", "service": "light.toggle", "target": { "entityId": "light.living_room" } }

// Back navigation
"onTap": { "type": "GO_BACK" }
```

#### Project Schema Additions
```json
{
  "Project": {
    "properties": {
      "state": {
        "type": "object",
        "properties": {
          "fields": {
            "type": "array",
            "items": { "$ref": "#/definitions/StateField" },
            "description": "Sensor fields to include in DisplayState"
          }
        }
      },
      "pages": {
        "type": "array",
        "items": {
          "properties": {
            "details": {
              "type": "array",
              "items": { "$ref": "#/definitions/DetailView" },
              "description": "Detail views for this page"
            }
          }
        }
      }
    }
  }
}
```

### Example Project JSON

```json
{
  "name": "Home Display",
  "display": { "width": 240, "height": 320, "platform": "ili9xxx" },
  "state": {
    "fields": [
      {
        "name": "outsideTemp",
        "cppType": "float",
        "haEntity": "sensor.outside_temperature",
        "defaultValue": 0
      },
      {
        "name": "humidity",
        "cppType": "float",
        "haEntity": "sensor.humidity",
        "defaultValue": 0
      },
      {
        "name": "vacuumStatus",
        "cppType": "std::string",
        "haEntity": "vacuum.roborock_status",
        "defaultValue": "offline"
      }
    ]
  },
  "pages": [
    {
      "id": "page-0",
      "name": "Status",
      "components": [
        {
          "id": "btn-temps",
          "type": "button",
          "position": { "x": 49, "y": 49 },
          "size": { "width": 80, "height": 36 },
          "label": "details",
          "onTap": { "type": "OPEN_DETAIL", "targetId": "TEMPS" }
        }
      ],
      "details": [
        {
          "id": "TEMPS",
          "title": "TEMPS",
          "height": 320,
          "headerHeight": 45,
          "components": [
            {
              "id": "temp-gauge",
              "type": "gauge",
              "position": { "x": 20, "y": 60 },
              "size": { "width": 100, "height": 100 },
              "min": -20,
              "max": 50,
              "valueBinding": { "entityId": "sensor.outside_temperature" },
              "unit": "°C"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Part 2: ViewState Enum Generation

The generator discovers all unique detail view IDs across all pages and creates an enum.

### Algorithm

```
1. Iterate all pages
2. For each page, iterate details array
3. Collect all detail.id values (short names like TEMPS, VACUUM)
4. Prepend VIEW_DETAIL_ prefix to each id
5. Generate enum:
   enum ViewState {
     DASHBOARD,
     VIEW_DETAIL_[id_1],
     VIEW_DETAIL_[id_2],
     ...
   }
```

### Output

```cpp
#pragma once
#include "esphome.h"

// View IDs: TEMPS -> VIEW_DETAIL_TEMPS, VACUUM -> VIEW_DETAIL_VACUUM, etc.
enum ViewState {
  DASHBOARD = 0,
  VIEW_DETAIL_TEMPS = 1,
  VIEW_DETAIL_VACUUM = 2,
  VIEW_DETAIL_LIGHTS = 3,
};
```

**Validation Rules:**
- Each detail.id must be unique across the entire project
- IDs must match pattern `[A-Z_]+` (UPPER_SNAKE_CASE, without VIEW_DETAIL_ prefix)
- Generator automatically prepends `VIEW_DETAIL_` prefix
- If duplicate found, generator throws error with file:line reference

---

## Part 3: DisplayState Struct Generation

Generate the global state struct with:
1. Navigation fields (viewMode, mainPageIndex, currentView, scrollY)
2. Scroll bounds (per-detail-view constants)
3. User-defined sensor fields

### Algorithm

```
1. Start with hardcoded nav fields:
   int mainPageIndex = 0
   int numPages = [project.pages.length]
   ViewState currentView = DASHBOARD
   int scrollY = 0
   int maxScrollY = 0

2. For each detail view:
   const int SCROLL_Y_MAX_VIEW_DETAIL_[ID] = height - headerHeight

3. For each state.fields entry:
   [cppType] [name] = [defaultValue]
```

### Output Template

```cpp
#pragma once
#include "esphome.h"

// Navigation constants
const int DISPLAY_WIDTH = 240;
const int DISPLAY_HEIGHT = 320;
const int DEFAULT_HEADER_HEIGHT = 45;

// Scroll bounds for each detail view (height - headerHeight)
const int SCROLL_Y_MAX_VIEW_DETAIL_TEMPS = 275;   // 320 - 45
const int SCROLL_Y_MAX_VIEW_DETAIL_VACUUM = 355;  // 400 - 45

// Global display state
struct DisplayState {
  // Navigation
  int mainPageIndex = 0;
  int numPages = 4;  // Generated from project.pages.length
  ViewState currentView = DASHBOARD;
  int scrollY = 0;
  int maxScrollY = 0;

  // Sensor fields
  float outsideTemp = 0;
  float humidity = 0;
  std::string vacuumStatus = "";

  // Helper: check if we're in the main dashboard
  bool isDashboard() const {
    return currentView == DASHBOARD;
  }

  // Utility function to set scroll bounds based on current view
  void updateScrollBounds() {
    switch (currentView) {
      case VIEW_DETAIL_TEMPS:
        maxScrollY = SCROLL_Y_MAX_VIEW_DETAIL_TEMPS;
        break;
      case VIEW_DETAIL_VACUUM:
        maxScrollY = SCROLL_Y_MAX_VIEW_DETAIL_VACUUM;
        break;
      default:
        maxScrollY = 0;
    }
  }
};

// Global state instance
DisplayState gState;
```

### Default Value Handling

| CppType   | Example Input | Generated Code                    |
|-----------|---------------|-----------------------------------|
| float     | 0             | `float temp = 0.0f;`              |
| float     | 23.5          | `float temp = 23.5f;`             |
| float     | (undefined)   | `float temp = 0.0f;`              |
| int       | 42            | `int count = 42;`                 |
| int       | (undefined)   | `int count = 0;`                  |
| bool      | false         | `bool enabled = false;`           |
| bool      | true          | `bool enabled = true;`            |
| std::string | "offline"   | `std::string status = "offline";` |
| std::string | (undefined) | `std::string status = "";`        |

**Notes:**
- String defaults in schema are **unquoted** (e.g., `"defaultValue": "offline"`)
- Generator adds C++ quotes automatically
- Float values get `f` suffix for proper C++ typing
- Undefined/null defaults are handled gracefully with sensible defaults

---

## Part 4: Generator Implementation (TypeScript)

### File: `packages/schema/generators/state-manager-generator.ts`

```typescript
import type { Project, DetailView, StateField } from "../dist/types";
import fs from "fs/promises";

interface GeneratedState {
  enumDefinition: string;
  structDefinition: string;
  scrollConstants: string;
}

export async function generateStateManager(
  project: Project
): Promise<GeneratedState> {
  // Step 1: Discover all detail views
  const detailViews = discoverDetailViews(project);
  const viewStateEnum = generateViewStateEnum(detailViews);

  // Step 2: Generate scroll constants
  const scrollConstants = generateScrollConstants(detailViews);

  // Step 3: Generate DisplayState struct (with numPages from project)
  const numPages = project.pages?.length ?? 0;
  const structDefinition = generateDisplayStateStruct(
    project.state?.fields ?? [],
    detailViews,
    numPages
  );

  return {
    enumDefinition: viewStateEnum,
    structDefinition,
    scrollConstants,
  };
}

function discoverDetailViews(project: Project): DetailView[] {
  const views: DetailView[] = [];
  const seen = new Set<string>();

  for (const page of project.pages) {
    if (page.details) {
      for (const detail of page.details) {
        if (seen.has(detail.id)) {
          throw new Error(
            `Duplicate detail view ID: ${detail.id} (must be unique across all pages)`
          );
        }
        seen.add(detail.id);
        views.push(detail);
      }
    }
  }

  return views;
}

function generateViewStateEnum(views: DetailView[]): string {
  const lines: string[] = [];

  lines.push("enum ViewState {");
  lines.push("  DASHBOARD = 0,");

  views.forEach((view, idx) => {
    // Prepend VIEW_DETAIL_ prefix to short ID
    lines.push(`  VIEW_DETAIL_${view.id} = ${idx + 1},`);
  });

  lines.push("};");

  return lines.join("\n");
}

function generateScrollConstants(views: DetailView[]): string {
  const lines: string[] = [];

  lines.push("// Scroll bounds for detail views (height - headerHeight)");
  views.forEach((view) => {
    const headerHeight = view.headerHeight ?? 45;
    const maxScroll = view.height - headerHeight;
    const viewEnumName = `VIEW_DETAIL_${view.id}`;
    lines.push(`const int SCROLL_Y_MAX_${viewEnumName} = ${maxScroll};  // ${view.height} - ${headerHeight}`);
  });

  return lines.join("\n");
}

function generateDisplayStateStruct(
  fields: StateField[],
  views: DetailView[],
  numPages: number
): string {
  const lines: string[] = [];

  lines.push("struct DisplayState {");
  lines.push("  // Navigation");
  lines.push("  int mainPageIndex = 0;");
  lines.push(`  int numPages = ${numPages};`);
  lines.push("  ViewState currentView = DASHBOARD;");
  lines.push("  int scrollY = 0;");
  lines.push("  int maxScrollY = 0;");
  lines.push("");

  lines.push("  // Sensor fields");
  for (const field of fields) {
    const defaultVal = formatDefaultValue(field.cppType, field.defaultValue);
    lines.push(`  ${field.cppType} ${field.name} = ${defaultVal};`);
  }
  lines.push("");

  lines.push("  // Helper: check if we're in the main dashboard");
  lines.push("  bool isDashboard() const {");
  lines.push("    return currentView == DASHBOARD;");
  lines.push("  }");
  lines.push("");

  lines.push("  // Update scroll bounds based on current view");
  lines.push("  void updateScrollBounds() {");
  lines.push("    switch (currentView) {");
  views.forEach((view) => {
    const viewEnumName = `VIEW_DETAIL_${view.id}`;
    lines.push(`      case ${viewEnumName}:`);
    lines.push(`        maxScrollY = SCROLL_Y_MAX_${viewEnumName};`);
    lines.push(`        break;`);
  });
  lines.push("      default:");
  lines.push("        maxScrollY = 0;");
  lines.push("    }");
  lines.push("  }");
  lines.push("};");

  return lines.join("\n");
}

function formatDefaultValue(cppType: string, value: any): string {
  if (cppType === "std::string") {
    if (value === undefined || value === null || value === "") {
      return '""';
    }
    return `"${String(value).replace(/"/g, '\\"')}"`;
  }
  if (cppType === "bool") {
    return value ? "true" : "false";
  }
  if (value === undefined || value === null) {
    return cppType === "float" ? "0.0f" : "0";
  }
  return cppType === "float" ? `${value}f` : String(value);
}

export async function writeStateManagerHeader(
  project: Project,
  outputPath: string
): Promise<void> {
  const generated = await generateStateManager(project);

  const header = `#pragma once
#include "esphome.h"

// AUTO-GENERATED by ESPHome Designer
// Project: ${project.name}
// Generated: ${new Date().toISOString()}
// DO NOT EDIT - regenerate from editor

${generated.enumDefinition}

${generated.scrollConstants}

${generated.structDefinition}

// Global state instance
DisplayState gState;
`;

  await fs.writeFile(outputPath, header, "utf-8");
  console.log(`✓ Generated state_manager.h (${outputPath})`);
}
```

### Usage in Codegen Pipeline

```typescript
// In packages/editor/src/lib/codegen/cpp.ts
import { generateStateManager } from "@esphome-designer/schema";

export function generateAllHeaders(project: Project): Map<string, string> {
  const files = new Map<string, string>();

  // Generate state_manager.h
  const { enumDefinition, structDefinition, scrollConstants } =
    generateStateManager(project);

  files.set(
    "state_manager.h",
    `#pragma once
#include "esphome.h"

${enumDefinition}

${scrollConstants}

${structDefinition}

DisplayState gState;
`
  );

  return files;
}
```

---

## Part 5: Validation Rules

### Schema Validation

| Rule | Error Message | Example |
|------|---------------|---------|
| Detail ID uniqueness | "Duplicate detail view ID: VIEW_TEMPS" | Two pages with same detail.id |
| Detail ID format | "Invalid detail view ID: view-temps (must be UPPER_SNAKE_CASE)" | view-temps instead of VIEW_TEMPS |
| Height > 45 | "Detail view height must be > 45 (header height)" | height: 40 |
| State field name unique | "Duplicate state field: temp" | Two fields named temp |
| State field type valid | "Unknown C++ type: float32" | Misspelled cppType |
| Entity ID format | "Invalid entity format: sensor_temp (must be domain.entity)" | Missing dot |

### Runtime Checks (in touch_handler)

- `scrollY` must stay within `[-maxScrollY, 0]` range
- `mainPageIndex` must stay within `[0, numPages)` range
- `currentView` must match an enum value

---

## Testing

### Unit Test: Enum Generation

```typescript
test("generates correct ViewState enum", async () => {
  const project: Project = {
    name: "Test Project",
    display: { width: 240, height: 320, platform: "ili9xxx" },
    fonts: [],
    pages: [
      {
        id: "page-0",
        name: "Status",
        components: [],
        details: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
          { id: "VACUUM", title: "Vacuum", height: 400, components: [] },
        ],
      },
    ],
  };

  const state = await generateStateManager(project);

  expect(state.enumDefinition).toContain("enum ViewState {");
  expect(state.enumDefinition).toContain("VIEW_DETAIL_TEMPS = 1");
  expect(state.enumDefinition).toContain("VIEW_DETAIL_VACUUM = 2");
});
```

### Unit Test: Struct Generation

```typescript
test("generates DisplayState with sensor fields and numPages", async () => {
  const project: Project = {
    name: "Test Project",
    display: { width: 240, height: 320, platform: "ili9xxx" },
    fonts: [],
    pages: [
      { id: "page-0", name: "Status", components: [] },
      { id: "page-1", name: "Music", components: [] },
    ],
    state: {
      fields: [
        {
          name: "outsideTemp",
          cppType: "float",
          haEntity: "sensor.outside_temp",
          defaultValue: 0,
        },
      ],
    },
  };

  const state = await generateStateManager(project);

  expect(state.structDefinition).toContain("float outsideTemp = 0.0f;");
  expect(state.structDefinition).toContain("int numPages = 2;");
  expect(state.structDefinition).toContain("bool isDashboard()");
});
```

### Unit Test: Header Height Customization

```typescript
test("uses custom headerHeight for scroll bounds", async () => {
  const project: Project = {
    name: "Test Project",
    display: { width: 240, height: 320, platform: "ili9xxx" },
    fonts: [],
    pages: [
      {
        id: "page-0",
        name: "Status",
        components: [],
        details: [
          { id: "CLIMATE", title: "Climate", height: 500, headerHeight: 60, components: [] },
        ],
      },
    ],
  };

  const state = await generateStateManager(project);

  // 500 - 60 = 440
  expect(state.scrollConstants).toContain("SCROLL_Y_MAX_VIEW_DETAIL_CLIMATE = 440");
});
```

### Unit Test: String Default Value Handling

```typescript
test("handles string default values correctly", async () => {
  const project: Project = {
    name: "Test Project",
    display: { width: 240, height: 320, platform: "ili9xxx" },
    fonts: [],
    pages: [],
    state: {
      fields: [
        { name: "status", cppType: "std::string", haEntity: "sensor.status", defaultValue: "offline" },
        { name: "emptyStr", cppType: "std::string", haEntity: "sensor.empty" },  // no default
      ],
    },
  };

  const state = await generateStateManager(project);

  expect(state.structDefinition).toContain('std::string status = "offline";');
  expect(state.structDefinition).toContain('std::string emptyStr = "";');
});
```

### Integration Test: Compile Generated Header

```bash
esphome compile esphome/my-display.yaml
# Should succeed with generated state_manager.h
```

---

## Next Steps (Phase 3)

Once state_manager.h generation is complete:
1. Generate `touch_handler.h` with action dispatcher
2. Generate `sensors.yaml` with HA entity bindings
3. Wire everything together in `display_renderer.h`

See **PHASE_3.md** for details.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Manual sensor field declaration | Full control over state organization; easier to refactor |
| Scroll bounds as constants (not dynamic) | Simpler logic; detail views have fixed height |
| `updateScrollBounds()` method | Called when detail view changes to set maxScrollY |
| ViewState enum (not string IDs) | Type-safe; compiler validates; smaller binary |
| gState global (not class) | Matches ESPHome idiom; compatible with lambda callbacks |

---

## Files Changed/Created

- ✨ `packages/schema/generators/state-manager-generator.ts` - NEW
- 📝 `components.json` - ADD DetailView and StateField definitions
- 📝 `esphome/includes/state_manager.h` - GENERATED (replaces manual)

