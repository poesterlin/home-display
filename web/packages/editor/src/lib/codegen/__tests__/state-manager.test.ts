/**
 * Unit tests for state-manager generator
 * 
 * Tests all functions according to PHASE_2.md specification
 */

import { describe, test, expect } from "bun:test";
import { generateStateManager } from "../state-manager";
import type { Project } from "@esphome-designer/schema";

describe("State Manager Generator", () => {
  describe("ViewState Enum Generation", () => {
    test("generates correct ViewState enum with multiple detail views", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
          { id: "VACUUM", title: "Vacuum", height: 400, components: [] },
        ],
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.enumDefinition).toContain("enum ViewState {");
      expect(state.enumDefinition).toContain("DASHBOARD = 0,");
      expect(state.enumDefinition).toContain("VIEW_DETAIL_TEMPS = 1,");
      expect(state.enumDefinition).toContain("VIEW_DETAIL_VACUUM = 2,");
      expect(state.enumDefinition).toContain("};");
    });

    test("generates enum with no detail views", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [],
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.enumDefinition).toContain("enum ViewState {");
      expect(state.enumDefinition).toContain("DASHBOARD = 0,");
      expect(state.enumDefinition).toContain("};");
    });

    test("throws error on duplicate detail view IDs", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
          { id: "TEMPS", title: "Duplicate", height: 400, components: [] },
        ],
        fonts: [],
      };

      expect(async () => await generateStateManager(project)).toThrow(
        /Duplicate detail view ID: TEMPS/
      );
    });

    test("throws error on invalid detail view ID format", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "view-temps", title: "Temps", height: 320, components: [] },
        ],
        fonts: [],
      };

      expect(async () => await generateStateManager(project)).toThrow(
        /Invalid detail view ID/
      );
    });
  });

  describe("Scroll Constants Generation", () => {
    test("generates scroll constants with default header height", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
        ],
        fonts: [],
      };

      const state = await generateStateManager(project);

      // 320 - 45 (default) = 275
      expect(state.scrollConstants).toContain("const int SCROLL_Y_MAX_VIEW_DETAIL_TEMPS = 275");
      expect(state.scrollConstants).toContain("// 320 - 45");
    });

    test("uses custom headerHeight for scroll bounds", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "CLIMATE", title: "Climate", height: 500, headerHeight: 60, components: [] },
        ],
        fonts: [],
      };

      const state = await generateStateManager(project);

      // 500 - 60 = 440
      expect(state.scrollConstants).toContain("const int SCROLL_Y_MAX_VIEW_DETAIL_CLIMATE = 440");
      expect(state.scrollConstants).toContain("// 500 - 60");
    });

    test("includes display constants", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
        ],
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.scrollConstants).toContain("const int DISPLAY_WIDTH = 240;");
      expect(state.scrollConstants).toContain("const int DISPLAY_HEIGHT = 320;");
      expect(state.scrollConstants).toContain("const int DEFAULT_HEADER_HEIGHT = 45;");
    });
  });

  describe("DisplayState Struct Generation", () => {
    test("generates DisplayState with sensor fields and numPages", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [
          { id: "page-0", name: "Status", components: [] },
          { id: "page-1", name: "Music", components: [] },
        ],
        detailViews: [],
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
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain("float outsideTemp = 0.0f;");
      expect(state.structDefinition).toContain("int numPages = 2;");
      expect(state.structDefinition).toContain("bool isDashboard()");
    });

    test("handles multiple sensor fields with different types", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [],
        state: {
          fields: [
            {
              name: "temperature",
              cppType: "float",
              haEntity: "sensor.temperature",
              defaultValue: 23.5,
            },
            {
              name: "count",
              cppType: "int",
              haEntity: "sensor.count",
              defaultValue: 42,
            },
            {
              name: "enabled",
              cppType: "bool",
              haEntity: "binary_sensor.enabled",
              defaultValue: true,
            },
            {
              name: "status",
              cppType: "std::string",
              haEntity: "sensor.status",
              defaultValue: "offline",
            },
          ],
        },
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain("float temperature = 23.5f;");
      expect(state.structDefinition).toContain("int count = 42;");
      expect(state.structDefinition).toContain("bool enabled = true;");
      expect(state.structDefinition).toContain('std::string status = "offline";');
    });

    test("handles string default values correctly", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [],
        state: {
          fields: [
            {
              name: "status",
              cppType: "std::string",
              haEntity: "sensor.status",
              defaultValue: "offline",
            },
            {
              name: "emptyStr",
              cppType: "std::string",
              haEntity: "sensor.empty",
              // no default
            },
          ],
        },
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain('std::string status = "offline";');
      expect(state.structDefinition).toContain('std::string emptyStr = "";');
    });

    test("generates updateScrollBounds method with all views", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
          { id: "VACUUM", title: "Vacuum", height: 400, components: [] },
        ],
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain("void updateScrollBounds()");
      expect(state.structDefinition).toContain("switch (currentView)");
      expect(state.structDefinition).toContain("case VIEW_DETAIL_TEMPS:");
      expect(state.structDefinition).toContain("maxScrollY = SCROLL_Y_MAX_VIEW_DETAIL_TEMPS;");
      expect(state.structDefinition).toContain("case VIEW_DETAIL_VACUUM:");
      expect(state.structDefinition).toContain("maxScrollY = SCROLL_Y_MAX_VIEW_DETAIL_VACUUM;");
    });

    test("handles undefined state field defaults", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [],
        detailViews: [],
        state: {
          fields: [
            {
              name: "floatVal",
              cppType: "float",
              haEntity: "sensor.float",
              // no default
            },
            {
              name: "intVal",
              cppType: "int",
              haEntity: "sensor.int",
              // no default
            },
            {
              name: "boolVal",
              cppType: "bool",
              haEntity: "binary_sensor.bool",
              // no default
            },
          ],
        },
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain("float floatVal = 0.0f;");
      expect(state.structDefinition).toContain("int intVal = 0;");
      expect(state.structDefinition).toContain("bool boolVal = false;");
    });

    test("includes navigation fields", async () => {
      const project: Project = {
        name: "Test Project",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [
          { id: "page-0", name: "Status", components: [] },
        ],
        detailViews: [],
        fonts: [],
      };

      const state = await generateStateManager(project);

      expect(state.structDefinition).toContain("int mainPageIndex = 0;");
      expect(state.structDefinition).toContain("int numPages = 1;");
      expect(state.structDefinition).toContain("ViewState currentView = DASHBOARD;");
      expect(state.structDefinition).toContain("int scrollY = 0;");
      expect(state.structDefinition).toContain("int maxScrollY = 0;");
    });
  });

  describe("Complete Header Generation", () => {
    test("generates complete valid C++ header", async () => {
      const project: Project = {
        name: "Home Display",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        dashboardPages: [
          { id: "page-0", name: "Status", components: [] },
        ],
        detailViews: [
          { id: "TEMPS", title: "Temps", height: 320, components: [] },
        ],
        state: {
          fields: [
            {
              name: "outsideTemp",
              cppType: "float",
              haEntity: "sensor.outside_temperature",
              defaultValue: 0,
            },
          ],
        },
        fonts: [],
      };

      const state = await generateStateManager(project);

      // Should have all three sections
      expect(state.enumDefinition).toBeTruthy();
      expect(state.scrollConstants).toBeTruthy();
      expect(state.structDefinition).toBeTruthy();

      // Enum should be valid
      expect(state.enumDefinition).toContain("enum ViewState");
      expect(state.enumDefinition).toContain("DASHBOARD");
      expect(state.enumDefinition).toContain("VIEW_DETAIL_TEMPS");

      // Constants should be valid
      expect(state.scrollConstants).toContain("const int");

      // Struct should be valid
      expect(state.structDefinition).toContain("struct DisplayState");
      expect(state.structDefinition).toContain("float outsideTemp");
    });
  });
});
