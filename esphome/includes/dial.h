#pragma once
#include "esphome.h"

class Dial {
public:
  static void draw(
    display::Display& display,
    int centerX, int centerY, int radius,
    float value, float minVal, float maxVal,
    Color bgColor, Color fgColor, Color needleColor,
    font::Font* font = nullptr,
    const char* label = nullptr
  ) {
    // Draw background arc
    display.filled_circle(centerX, centerY, radius, bgColor);
    
    // Calculate needle angle (270° sweep from -135° to +135°)
    float normalized = (value - minVal) / (maxVal - minVal);
    normalized = (normalized < 0.0f) ? 0.0f : ((normalized > 1.0f) ? 1.0f : normalized);
    float angle = -135.0f + (normalized * 270.0f);
    float radians = angle * 3.14159265f / 180.0f;
    
    // Draw needle
    int needleLen = radius - 10;
    int endX = centerX + (int)(needleLen * cosf(radians));
    int endY = centerY + (int)(needleLen * sinf(radians));
    display.line(centerX, centerY, endX, endY, needleColor);
    
    // Draw value text
    if (font != nullptr) {
      char buf[16];
      snprintf(buf, sizeof(buf), "%.1f", value);
      display.printf(centerX, centerY + radius/2, font, 
                     TextAlign::CENTER, "%s", buf);
    }
    
    // Draw label
    if (label != nullptr && font != nullptr) {
      display.printf(centerX, centerY + radius + 15, font,
                     TextAlign::CENTER, "%s", label);
    }
  }
};
