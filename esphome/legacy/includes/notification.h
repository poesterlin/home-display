#pragma once
#include "esphome.h"
#include <sstream>

class NotificationRenderer {
public:
  static void draw(
    display::Display& display,
    const std::string& severity,
    const std::string& title,
    const std::string& body,
    font::Font* titleFont,
    font::Font* bodyFont
  ) {
    // 1. Determine Colors and Icon
    Color themeColor = Color(80, 140, 255); // Info Blue
    if (severity == "warn") themeColor = Color(255, 180, 0);   // Amber
    else if (severity == "alert") themeColor = Color(255, 60, 60); // Red
    else if (severity == "question") themeColor = Color(0, 255, 100); // Green

    // 2. Background
    display.fill(Color(15, 15, 15)); // Deep dark background
    
    // Top colored bar
    display.filled_rectangle(0, 0, 240, 4, themeColor);
    
    // 3. Draw Icon
    int ix = 120, iy = 50;
    if (severity == "alert") {
      // Exclamation Mark
      display.filled_rectangle(ix-4, iy-20, 8, 30, themeColor);
      display.filled_circle(ix, iy+20, 5, themeColor);
    } else if (severity == "warn") {
      // Triangle
      display.line(ix, iy-20, ix-25, iy+20, themeColor);
      display.line(ix, iy-20, ix+25, iy+20, themeColor);
      display.line(ix-25, iy+20, ix+25, iy+20, themeColor);
      display.printf(ix, iy + 5, titleFont, themeColor, TextAlign::CENTER, "!");
    } else if (severity == "question") {
      // Question Mark
      display.circle(ix, iy, 20, themeColor);
      display.printf(ix, iy, titleFont, themeColor, TextAlign::CENTER, "?");
    } else {
      // Info - Circle with i
      display.circle(ix, iy, 20, themeColor);
      display.filled_rectangle(ix-2, iy-5, 4, 15, themeColor);
      display.filled_circle(ix, iy-10, 3, themeColor);
    }

    // 4. Title
    display.printf(120, 100, titleFont, themeColor, TextAlign::CENTER, "%s", 
                   title.empty() ? severity.c_str() : title.c_str());
    
    // 5. Separator
    display.line(40, 125, 200, 125, Color(40, 40, 40));

    // 6. Body
    drawWrappedText(display, 20, 145, 200, body, bodyFont, Color(220, 220, 220));
  }
  
private:
  static void drawWrappedText(
    display::Display& display,
    int x, int y, int maxWidth,
    const std::string& text,
    font::Font* font,
    Color color
  ) {
    int lineHeight = 20;
    int currentY = y;
    std::string word;
    std::string line;
    std::stringstream ss(text);

    while (ss >> word) {
      std::string testLine = line + (line.empty() ? "" : " ") + word;
      int x1, y1, width, height;
      display.get_text_bounds(x, currentY, testLine.c_str(), font, TextAlign::TOP_LEFT, &x1, &y1, &width, &height);

      if (width > maxWidth && !line.empty()) {
        display.printf(x, currentY, font, color, TextAlign::TOP_LEFT, "%s", line.c_str());
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
      
      // Safety break to prevent infinite vertical growth
      if (currentY > y + 130) break;
    }
    
    if (!line.empty() && currentY <= y + 130) {
      display.printf(x, currentY, font, color, TextAlign::TOP_LEFT, "%s", line.c_str());
    }
  }
};
