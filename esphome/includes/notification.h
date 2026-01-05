#pragma once
#include "esphome.h"

class NotificationRenderer {
public:
  static void draw(
    display::Display& display,
    int x, int y, int width, int height,
    const std::string& title,
    const std::string& body,
    font::Font* titleFont,
    font::Font* bodyFont
  ) {
    // Draw notification card background
    display.filled_rectangle(x, y, width, height, Color(40, 40, 40));
    display.rectangle(x, y, width, height, Color(100, 100, 255));
    
    // Draw title
    display.printf(x + 10, y + 10, titleFont, Color(255, 255, 255),
                   TextAlign::TOP_LEFT, "%s", title.c_str());
    
    // Draw body with word wrap
    drawWrappedText(display, x + 10, y + 35, width - 20,
                    body, bodyFont, Color(200, 200, 200));
  }
  
private:
  static void drawWrappedText(
    display::Display& display,
    int x, int y, int maxWidth,
    const std::string& text,
    font::Font* font,
    Color color
  ) {
    // Simple word-wrap implementation
    int lineHeight = 16;
    int currentY = y;
    std::string remaining = text;
    
    while (!remaining.empty() && currentY < y + 100) {
      size_t cutoff = remaining.length();
      // Find appropriate break point (simplified)
      if (cutoff > 30) cutoff = 30;
      
      std::string line = remaining.substr(0, cutoff);
      remaining = remaining.substr(cutoff);
      
      display.printf(x, currentY, font, color,
                     TextAlign::TOP_LEFT, "%s", line.c_str());
      currentY += lineHeight;
    }
  }
};
