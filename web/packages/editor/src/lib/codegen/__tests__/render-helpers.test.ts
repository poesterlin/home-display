/**
 * Unit tests for render helpers code generator
 *
 * Tests the generateRenderHelpers function which creates C++ helper
 * functions for themed boxes, headers, page indicators, and notifications.
 */

import { describe, test, expect } from "bun:test";
import { generateRenderHelpers } from "../render-helpers";
import type { Project, Theme } from "@esphome-designer/schema";

const baseTheme: Theme = {
  id: "retro",
  name: "Retro",
  colors: {
    background: { r: 0, g: 0, b: 0 },
    backgroundSecondary: { r: 30, g: 30, b: 30 },
    foreground: { r: 255, g: 255, b: 255 },
    foregroundMuted: { r: 128, g: 128, b: 128 },
    accent: { r: 255, g: 107, b: 0 },
  },
  style: {
    containerCorners: true,
    buttonShadow: true,
  },
  values: {
    cornerSize: 10,
  },
};

describe("Render Helpers Generator", () => {
  describe("generateRenderHelpers", () => {
    test("generates valid C++ header with pragma once", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("#pragma once");
      expect(cpp).toContain('#include "esphome.h"');
      expect(cpp).toContain('#include "state_manager.h"');
    });

    test("includes font extern declarations", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("extern esphome::font::Font *font_tiny;");
      expect(cpp).toContain("extern esphome::font::Font *font_small;");
      expect(cpp).toContain("extern esphome::font::Font *font_medium;");
      expect(cpp).toContain("extern esphome::font::Font *font_large;");
    });
  });

  describe("drawThemedBox helper", () => {
    test("generates drawThemedBox function signature", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawThemedBox(display::Display& it, int x, int y, int w, int h, const char* label = nullptr)"
      );
    });

    test("draws background with Theme::BACKGROUND_SECONDARY", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "it.filled_rectangle(x, y, w, h, Theme::BACKGROUND_SECONDARY);"
      );
    });

    test("generates retro corners when theme has containerCorners enabled", () => {
      const themeWithCorners: Theme = {
        ...baseTheme,
        style: { containerCorners: true },
        values: { cornerSize: 15 },
      };

      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: themeWithCorners,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      // Check for corner lines with custom corner size
      expect(cpp).toContain("// Retro Corners");
      expect(cpp).toContain("it.line(x, y, x + 15, y, Theme::ACCENT);");
      expect(cpp).toContain("it.line(x, y, x, y + 15, Theme::ACCENT);");
    });

    test("does not generate corners when containerCorners is disabled", () => {
      const themeNoCorners: Theme = {
        ...baseTheme,
        style: { containerCorners: false },
      };

      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: themeNoCorners,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).not.toContain("// Retro Corners");
    });

    test("uses default corner size of 10 when not specified", () => {
      const themeNoCornerSize: Theme = {
        ...baseTheme,
        style: { containerCorners: true },
        values: {},
      };

      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: themeNoCornerSize,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("it.line(x, y, x + 10, y, Theme::ACCENT);");
    });

    test("handles optional label parameter", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("if (label) {");
      expect(cpp).toContain('it.printf(x + 10, y + 15, font_small, Theme::ACCENT, TextAlign::TOP_LEFT, "%s", label);');
    });
  });

  describe("drawCommonHeader helper", () => {
    test("generates drawCommonHeader function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("void drawCommonHeader(display::Display& it) {");
    });

    test("draws header divider line", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("it.line(0, 40, 240, 40, Theme::ACCENT);");
    });

    test("displays time from SNTP", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("auto time = id(sntp_time).now();");
      expect(cpp).toContain("if (time.is_valid()) {");
      expect(cpp).toContain('it.strftime(10, 20, font_medium, Theme::FOREGROUND, TextAlign::CENTER_LEFT, "%H:%M", time);');
    });

    test("displays date in header", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain('it.strftime(230, 20, font_small, Theme::FOREGROUND_MUTED, TextAlign::CENTER_RIGHT, "%d.%m.%y", time);');
    });
  });

  describe("drawPageIndicator helper", () => {
    test("generates drawPageIndicator function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawPageIndicator(display::Display& it, int activePage, int totalPages) {"
      );
    });

    test("returns early if only one page", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("if (totalPages <= 1) return;");
    });

    test("calculates centered starting position", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("int startX = (240 - (totalPages * 15)) / 2;");
    });

    test("draws circles for page indicators", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("for (int i = 0; i < totalPages; i++) {");
      expect(cpp).toContain(
        "Color c = (i == activePage) ? Theme::ACCENT : Theme::FOREGROUND_MUTED;"
      );
      expect(cpp).toContain("it.filled_circle(startX + (i * 15), 310, 3, c);");
    });
  });

  describe("drawDetailHeader helper", () => {
    test("generates drawDetailHeader function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawDetailHeader(display::Display& it, const char* title) {"
      );
    });

    test("fills header background", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "it.filled_rectangle(0, 0, 240, 40, Theme::BACKGROUND);"
      );
    });

    test("draws back button", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("// Back button");
      expect(cpp).toContain("it.rectangle(5, 5, 60, 30, Theme::ACCENT);");
      expect(cpp).toContain('it.print(35, 20, font_small, Theme::FOREGROUND, TextAlign::CENTER, "< BACK");');
    });

    test("displays title in header", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain("// Title");
      expect(cpp).toContain('it.printf(150, 20, font_medium, Theme::FOREGROUND, TextAlign::CENTER, "%s", title);');
    });
  });

  describe("Notification helpers", () => {
    test("generates getNotificationColor function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "Color getNotificationColor(const char* severity) {"
      );
    });

    test("maps severity levels to colors", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain('if (strcmp(severity, "warn") == 0) return Color(255, 180, 0);');
      expect(cpp).toContain('if (strcmp(severity, "alert") == 0) return Color(255, 60, 60);');
      expect(cpp).toContain('if (strcmp(severity, "question") == 0) return Color(0, 255, 100);');
      expect(cpp).toContain("return Color(80, 140, 255); // Default: Info Blue");
    });

    test("generates drawNotificationIcon function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawNotificationIcon(display::Display& it, int x, int y, const char* severity, Color color, font::Font* font) {"
      );
    });

    test("generates drawWrappedText function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawWrappedText(display::Display& it, int x, int y, int maxWidth, const char* text, font::Font* font, Color color) {"
      );
    });

    test("generates drawNotification function", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      expect(cpp).toContain(
        "void drawNotification(display::Display& it, const char* severity, const char* title, const char* body) {"
      );
      expect(cpp).toContain("Color themeColor = getNotificationColor(severity);");
    });
  });

  describe("Code Quality", () => {
    test("generates balanced braces", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      const openBraces = (cpp.match(/{/g) || []).length;
      const closeBraces = (cpp.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test("generates all helper functions", () => {
      const project: Project = {
        name: "Test",
        display: { width: 240, height: 320, platform: "ili9xxx" },
        theme: baseTheme,
        dashboardPages: [],
        detailViews: [],
      };

      const cpp = generateRenderHelpers(project);

      const expectedFunctions = [
        "void drawThemedBox",
        "void drawCommonHeader",
        "void drawPageIndicator",
        "void drawDetailHeader",
        "Color getNotificationColor",
        "void drawNotificationIcon",
        "void drawWrappedText",
        "void drawNotification",
      ];

      for (const fn of expectedFunctions) {
        expect(cpp).toContain(fn);
      }
    });
  });
});
