#pragma once
#include "esphome.h"
#include "state_manager.h"

void drawRetroBox(display::Display& it, int x, int y, int w, int h, const char* label = nullptr, Color color = C_DIM) {
  it.rectangle(x, y, w, h, C_DIMMER);
  
  int s = 10;
  it.line(x, y, x + s, y, color);
  it.line(x, y, x, y + s, color);
  it.line(x+1, y+1, x + s, y+1, color);
  it.line(x+1, y+1, x+1, y + s, color);
  
  it.line(x + w, y, x + w - s, y, color);
  it.line(x + w, y, x + w, y + s, color);
  it.line(x + w - 1, y+1, x + w - s, y+1, color);
  it.line(x + w - 1, y+1, x + w - 1, y + s, color);
  
  it.line(x, y + h, x + s, y + h, color);
  it.line(x, y + h, x, y + h - s, color);
  it.line(x+1, y + h - 1, x + s, y + h - 1, color);
  it.line(x+1, y + h - 1, x+1, y + h - s, color);
  
  it.line(x + w, y + h, x + w - s, y + h, color);
  it.line(x + w, y + h, x + w, y + h - s, color);
  it.line(x + w - 1, y + h - 1, x + w - s, y + h - 1, color);
  it.line(x + w - 1, y + h - 1, x + w - 1, y + h - s, color);

  if (label) {
    int tx, ty, tw, th;
    it.get_text_bounds(x + 12, y - 7, label, font_tiny, TextAlign::TOP_LEFT, &tx, &ty, &tw, &th);
    it.filled_rectangle(tx - 2, ty, tw + 4, th, C_BLACK);
    it.printf(x + 12, y - 7, font_tiny, color, TextAlign::TOP_LEFT, " %s ", label);
  }

}

void drawCommonHeader(display::Display& it) {
  it.line(0, 0, 0, 320, C_DIMMER);
  it.line(239, 0, 239, 320, C_DIMMER);

  if (gState.timerActive) {
    int minutes = gState.timerRemaining / 60;
    int seconds = gState.timerRemaining % 60;
    Color timerColor = (gState.timerRemaining == 0) ? C_RED : C_CYAN;
    
    it.circle(25, 20, 8, timerColor);
    it.line(25, 20, 25, 15, timerColor);
    it.line(25, 20, 29, 20, timerColor);
    
    it.printf(42, 10, font_medium, timerColor, TextAlign::TOP_LEFT, "%02d:%02d", minutes, seconds);
    it.printf(230, 12, font_tiny, timerColor, TextAlign::TOP_RIGHT, "TIMER RUNNING");
  } else {
    auto time_now = sntp_time->now();
    if (time_now.is_valid()) {
      it.printf(10, 10, font_medium, C_WHITE, TextAlign::TOP_LEFT, "%02d:%02d", 
                time_now.hour, time_now.minute);
      it.printf(75, 12, font_tiny, C_DIM, TextAlign::TOP_LEFT, ":%02d", time_now.second);

      const char* days[] = {"SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"};
      const char* months[] = {"JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                              "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"};
      int dayIdx = time_now.day_of_week - 1;
      if(dayIdx < 0) dayIdx = 0;
      
      it.printf(230, 12, font_tiny, C_DIM, TextAlign::TOP_RIGHT, "%s %02d %s", 
                days[dayIdx], time_now.day_of_month, months[time_now.month-1]);
    }
  }
  
  it.line(10, 35, 230, 35, C_DIM);
}

void drawPageIndicator(display::Display& it, int page, int count) {
  for (int i = 0; i < count; i++) {
    int dot_x = 120 - (count * 7) + (i * 14) + 7;
    if (i == page) {
      it.filled_circle(dot_x, 306, 4, C_CYAN);
    } else {
      it.circle(dot_x, 306, 3, C_DIM);
    }
  }
}

void drawDetailHeader(display::Display& it, const char* title) {
  it.filled_rectangle(0, 0, 240, 40, C_DIMMER);
  it.line(0, 40, 240, 40, C_DIM);
  
  gState.backBtn.draw(it, "<", C_CYAN, gState.backLoading, gState.backLoadingStartTime, 150, font_small);
  
  it.printf(135, 20, font_small, C_WHITE, TextAlign::CENTER, "%s", title);
}

void drawWindowIcon(display::Display& it, int x, int y, const char* label, bool is_open) {
  Color c = is_open ? C_RED : C_GREEN;
  it.rectangle(x-12, y, 24, 28, c);
  it.line(x, y, x, y+28, c);
  it.line(x-12, y+14, x+12, y+14, c);
  it.printf(x, y + 35, font_tiny, c, TextAlign::CENTER, "%s", is_open ? "OPEN" : "SHUT");
  it.printf(x, y + 48, font_tiny, C_DIM, TextAlign::CENTER, "%s", label);
}

void drawBulbIcon(display::Display& it, int x, int y, const char* label, bool is_on) {
  Color c = is_on ? C_AMBER : C_DIM;
  it.circle(x, y, 10, c);
  if (is_on) {
    it.filled_circle(x, y, 6, C_AMBER);
    for (int i = 0; i < 8; i++) {
      float a = i * 3.14159265f / 4.0f;
      it.line(x + (int)(cosf(a)*13), y + (int)(sinf(a)*13), x + (int)(cosf(a)*17), y + (int)(sinf(a)*17), C_AMBER);
    }
  }
  it.printf(x, y + 22, font_tiny, c, TextAlign::CENTER, "%s", label);
}
