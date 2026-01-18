import type { Project, Color } from "@esphome-designer/schema";

export function generateRenderHelpers(project: Project): string {
   const lines: string[] = [];
   const theme = project.theme!;

   lines.push(`#pragma once`);
   lines.push(`#include "esphome.h"`);
   lines.push(`#include "state_manager.h"`);
   lines.push(``);
   
   lines.push(`// Forward declarations for ESPHome-generated fonts and time`);
   lines.push(`extern esphome::font::Font *font_tiny;`);
   lines.push(`extern esphome::font::Font *font_small;`);
   lines.push(`extern esphome::font::Font *font_medium;`);
   lines.push(`extern esphome::font::Font *font_large;`);
   lines.push(``);

   // drawThemedBox helper
   lines.push(`void drawThemedBox(display::Display& it, int x, int y, int w, int h, const char* label = nullptr) {`);
   lines.push(`  // Background`);
   lines.push(`  it.filled_rectangle(x, y, w, h, Theme::BACKGROUND_SECONDARY);`);
   lines.push(``);
   if (theme.style.containerCorners) {
     const cs = theme.values.cornerSize ?? 10;
     lines.push(`  // Retro Corners`);
     lines.push(`  it.line(x, y, x + ${cs}, y, Theme::ACCENT);`);
     lines.push(`  it.line(x, y, x, y + ${cs}, Theme::ACCENT);`);
     lines.push(`  it.line(x + 3, y + 3, x + ${cs}, y + 3, Theme::ACCENT);`);
     lines.push(`  it.line(x + 3, y + 3, x + 3, y + ${cs}, Theme::ACCENT);`);
     lines.push(``);
     lines.push(`  it.line(x + w - ${cs}, y, x + w, y, Theme::ACCENT);`);
     lines.push(`  it.line(x + w, y, x + w, y + ${cs}, Theme::ACCENT);`);
     lines.push(`  it.line(x + w - ${cs}, y + 3, x + w - 3, y + 3, Theme::ACCENT);`);
     lines.push(`  it.line(x + w - 3, y + 3, x + w - 3, y + ${cs}, Theme::ACCENT);`);
     lines.push(``);
     lines.push(`  it.line(x, y + h - ${cs}, x, y + h, Theme::ACCENT);`);
     lines.push(`  it.line(x, y + h, x + ${cs}, y + h, Theme::ACCENT);`);
     lines.push(`  it.line(x + 3, y + h - ${cs}, x + 3, y + h - 3, Theme::ACCENT);`);
     lines.push(`  it.line(x + 3, y + h - 3, x + ${cs}, y + h - 3, Theme::ACCENT);`);
     lines.push(``);
     lines.push(`  it.line(x + w - ${cs}, y + h, x + w, y + h, Theme::ACCENT);`);
     lines.push(`  it.line(x + w, y + h, x + w, y + h - ${cs}, Theme::ACCENT);`);
     lines.push(`  it.line(x + w - ${cs}, y + h - 3, x + w - 3, y + h - 3, Theme::ACCENT);`);
     lines.push(`  it.line(x + w - 3, y + h - 3, x + w - 3, y + h - ${cs}, Theme::ACCENT);`);
   }
   lines.push(`  if (label) {`);
   lines.push(`    it.printf(x + 10, y + 15, font_small, Theme::ACCENT, TextAlign::TOP_LEFT, "%s", label);`);
   lines.push(`  }`);
   lines.push(`}`);
   lines.push(``);

   // drawCommonHeader helper
   lines.push(`void drawCommonHeader(display::Display& it) {`);
   lines.push(`  it.line(0, 40, 240, 40, Theme::ACCENT);`);
   lines.push(`  auto time = id(sntp_time).now();`);
   lines.push(`  if (time.is_valid()) {`);
   lines.push(`    it.strftime(10, 20, font_medium, Theme::FOREGROUND, TextAlign::CENTER_LEFT, "%H:%M", time);`);
   lines.push(`    it.strftime(230, 20, font_small, Theme::FOREGROUND_MUTED, TextAlign::CENTER_RIGHT, "%d.%m.%y", time);`);
   lines.push(`  }`);
   lines.push(`}`);
   lines.push(``);

   // drawPageIndicator helper
   lines.push(`void drawPageIndicator(display::Display& it, int activePage, int totalPages) {`);
   lines.push(`  if (totalPages <= 1) return;`);
   lines.push(`  int startX = (240 - (totalPages * 15)) / 2;`);
   lines.push(`  for (int i = 0; i < totalPages; i++) {`);
   lines.push(`    Color c = (i == activePage) ? Theme::ACCENT : Theme::FOREGROUND_MUTED;`);
   lines.push(`    it.filled_circle(startX + (i * 15), 310, 3, c);`);
   lines.push(`  }`);
   lines.push(`}`);
   lines.push(``);

    // drawDetailHeader helper
    lines.push(`void drawDetailHeader(display::Display& it, const char* title) {`);
    lines.push(`  it.filled_rectangle(0, 0, 240, 40, Theme::BACKGROUND);`);
    lines.push(`  it.line(0, 40, 240, 40, Theme::ACCENT);`);
    lines.push(`  `);
    lines.push(`  // Back button`);
    lines.push(`  it.rectangle(5, 5, 60, 30, Theme::ACCENT);`);
    lines.push(`  it.print(35, 20, font_small, Theme::FOREGROUND, TextAlign::CENTER, "< BACK");`);
    lines.push(`  `);
    lines.push(`  // Title`);
    lines.push(`  it.printf(150, 20, font_medium, Theme::FOREGROUND, TextAlign::CENTER, "%s", title);`);
    lines.push(`}`);
    lines.push(``);

    // Notification color mapping helper
    lines.push(`Color getNotificationColor(const char* severity) {`);
    lines.push(`  if (strcmp(severity, "warn") == 0) return Color(255, 180, 0);    // Amber`);
    lines.push(`  if (strcmp(severity, "alert") == 0) return Color(255, 60, 60);   // Red`);
    lines.push(`  if (strcmp(severity, "question") == 0) return Color(0, 255, 100); // Green`);
    lines.push(`  return Color(80, 140, 255); // Default: Info Blue`);
    lines.push(`}`);
    lines.push(``);

    // Draw notification icon based on severity
    lines.push(`void drawNotificationIcon(display::Display& it, int x, int y, const char* severity, Color color, font::Font* font) {`);
    lines.push(`  if (strcmp(severity, "alert") == 0) {`);
    lines.push(`    // Exclamation Mark Icon`);
    lines.push(`    it.filled_rectangle(x - 4, y - 20, 8, 30, color);`);
    lines.push(`    it.filled_circle(x, y + 20, 5, color);`);
    lines.push(`  } else if (strcmp(severity, "warn") == 0) {`);
    lines.push(`    // Triangle Warning Icon`);
    lines.push(`    it.line(x, y - 20, x - 25, y + 20, color);`);
    lines.push(`    it.line(x, y - 20, x + 25, y + 20, color);`);
    lines.push(`    it.line(x - 25, y + 20, x + 25, y + 20, color);`);
    lines.push(`    it.printf(x, y + 5, font, color, TextAlign::CENTER, "!");`);
    lines.push(`  } else if (strcmp(severity, "question") == 0) {`);
    lines.push(`    // Question Mark Icon`);
    lines.push(`    it.circle(x, y, 20, color);`);
    lines.push(`    it.printf(x, y, font, color, TextAlign::CENTER, "?");`);
    lines.push(`  } else {`);
    lines.push(`    // Info Icon - Circle with 'i'`);
    lines.push(`    it.circle(x, y, 20, color);`);
    lines.push(`    it.filled_rectangle(x - 2, y - 5, 4, 15, color);`);
    lines.push(`    it.filled_circle(x, y - 10, 3, color);`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);

    // Draw wrapped text for notification body
    lines.push(`void drawWrappedText(display::Display& it, int x, int y, int maxWidth, const char* text, font::Font* font, Color color) {`);
    lines.push(`  int lineHeight = 20;`);
    lines.push(`  int currentY = y;`);
    lines.push(`  int maxY = y + 130; // Safety limit to prevent overflow`);
    lines.push(`  `);
    lines.push(`  // Simple word-wrap algorithm`);
    lines.push(`  const char* start = text;`);
    lines.push(`  const char* space = nullptr;`);
    lines.push(`  const char* lastBreak = text;`);
    lines.push(`  `);
    lines.push(`  while (*start && currentY < maxY) {`);
    lines.push(`    // Find next space or end of string`);
    lines.push(`    space = strchr(start, ' ');`);
    lines.push(`    if (!space) space = strchr(start, '\\0');`);
    lines.push(`    `);
    lines.push(`    // Extract word`);
    lines.push(`    int wordLen = space - start;`);
    lines.push(`    char word[256];`);
    lines.push(`    strncpy(word, start, wordLen);`);
    lines.push(`    word[wordLen] = '\\0';`);
    lines.push(`    `);
    lines.push(`    // Check if word fits on current line`);
    lines.push(`    int x1, y1, w, h;`);
    lines.push(`    it.get_text_bounds(x, currentY, word, font, TextAlign::TOP_LEFT, &x1, &y1, &w, &h);`);
    lines.push(`    `);
    lines.push(`    if (w > maxWidth && lastBreak != start) {`);
    lines.push(`      // Word doesn't fit, output current line and move to next`);
    lines.push(`      int lineLen = start - lastBreak - 1;`);
    lines.push(`      char line[256];`);
    lines.push(`      strncpy(line, lastBreak, lineLen);`);
    lines.push(`      line[lineLen] = '\\0';`);
    lines.push(`      it.printf(x, currentY, font, color, TextAlign::TOP_LEFT, "%s", line);`);
    lines.push(`      currentY += lineHeight;`);
    lines.push(`      lastBreak = start;`);
    lines.push(`    }`);
    lines.push(`    `);
    lines.push(`    // Move to next word`);
    lines.push(`    start = space + (*space ? 1 : 0);`);
    lines.push(`  }`);
    lines.push(`  `);
    lines.push(`  // Draw remaining text`);
    lines.push(`  if (lastBreak && currentY < maxY) {`);
    lines.push(`    int lineLen = strlen(lastBreak);`);
    lines.push(`    char line[256];`);
    lines.push(`    strncpy(line, lastBreak, lineLen);`);
    lines.push(`    line[lineLen] = '\\0';`);
    lines.push(`    it.printf(x, currentY, font, color, TextAlign::TOP_LEFT, "%s", line);`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);

    // Main notification drawing function
    lines.push(`void drawNotification(display::Display& it, const char* severity, const char* title, const char* body) {`);
    lines.push(`  Color themeColor = getNotificationColor(severity);`);
    lines.push(`  `);
    lines.push(`  // Background`);
    lines.push(`  it.fill(Color(15, 15, 15)); // Deep dark background`);
    lines.push(`  `);
    lines.push(`  // Top colored bar`);
    lines.push(`  it.filled_rectangle(0, 0, 240, 4, themeColor);`);
    lines.push(`  `);
    lines.push(`  // Draw icon`);
    lines.push(`  drawNotificationIcon(it, 120, 50, severity, themeColor, font_medium);`);
    lines.push(`  `);
    lines.push(`  // Title (or default to severity if title is empty)`);
    lines.push(`  const char* displayTitle = (title && strlen(title) > 0) ? title : severity;`);
    lines.push(`  it.printf(120, 100, font_medium, themeColor, TextAlign::CENTER, "%s", displayTitle);`);
    lines.push(`  `);
    lines.push(`  // Separator line`);
    lines.push(`  it.line(40, 125, 200, 125, Color(40, 40, 40));`);
    lines.push(`  `);
    lines.push(`  // Body text with word wrapping`);
    lines.push(`  if (body && strlen(body) > 0) {`);
    lines.push(`    drawWrappedText(it, 20, 145, 200, body, font_small, Color(220, 220, 220));`);
    lines.push(`  }`);
    lines.push(`}`);

    return lines.join("\n");
  }
