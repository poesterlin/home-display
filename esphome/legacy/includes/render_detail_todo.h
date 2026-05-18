#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"
#include "scrolling_text.h"

void renderDetail_Todo(display::Display& it) {
  int ly = 95;
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  bool shopActive = (gState.todoViewTab == 0);
  bool todoActive = (gState.todoViewTab == 1);
  
  bool dummyLoading = false;
  unsigned long dummyTime = 0;
  
  gState.shoppingTabBtn.draw(it, "", shopActive ? C_CYAN : C_DIM, dummyLoading, dummyTime, 0, font_tiny);
  gState.todoTabBtn.draw(it, "", todoActive ? C_AMBER : C_DIM, dummyLoading, dummyTime, 0, font_tiny);

  auto drawTabContent = [&](int x, int y, const char* label, int count, bool active, Color color) {
    Color c = active ? color : C_DIM;
    int ix = x + 10;
    int iy = y + 12;
    for(int i=0; i<3; i++) it.line(ix, iy + i*4, ix + 8, iy + i*4, c);
    
    it.printf(x + 25, y + 10, font_tiny, c, TextAlign::TOP_LEFT, "%s", label);
    it.printf(x + 95, y + 10, font_tiny, c, TextAlign::TOP_RIGHT, "%d", count);
  };

  it.start_clipping(0, 85, 240, 320);

  auto drawList = [&](std::string listStr) {
    size_t pos = 0;
    bool empty = true;
    while ((pos = listStr.find("\n")) != std::string::npos || !listStr.empty()) {
      std::string line;
      if (pos != std::string::npos) {
        line = listStr.substr(0, pos);
        listStr.erase(0, pos + 1);
      } else {
        line = listStr;
        listStr.clear();
      }

      auto trim = [](std::string& s) {
          size_t first = s.find_first_not_of(" \t\r\n");
          if (first == std::string::npos) { s = ""; return; }
          size_t last = s.find_last_not_of(" \t\r\n");
          s = s.substr(first, (last - first + 1));
      };
      trim(line);

      if (line.empty() || line == "LIST EMPTY") continue;

      size_t p1 = line.find("|");
      std::string summary = line;
      std::string due = "";
      bool overdue = false;
      if (p1 != std::string::npos) {
          summary = line.substr(0, p1);
          std::string rest = line.substr(p1 + 1);
          size_t p2 = rest.find("|");
          if (p2 != std::string::npos) {
              due = rest.substr(0, p2);
              std::string ovrStr = rest.substr(p2 + 1);
              overdue = (ovrStr.find("overdue") != std::string::npos);
          } else {
              due = rest;
          }
      }

      trim(summary);
      trim(due);
      if (summary.empty()) continue;

      int sy = getSY(ly);
      
      it.rectangle(10, sy, 220, 40, C_DIM);
      
      if (gState.todoActionLoading && gState.todoActionSummary == summary) {
          float angle = (millis() % 1000) * 2.0f * 3.14159265f / 1000.0f;
          it.line(30, sy + 20, 30 + (int)(cosf(angle)*8), sy + 20 + (int)(sinf(angle)*8), C_WHITE);
      } else {
          it.printf(20, sy + 10, font_small, C_CYAN, TextAlign::TOP_LEFT, "[ ]");
      }

      int textX = 55;
      int textWidth = 165;
      if (due != "none" && !due.empty()) {
          Color dColor = overdue ? C_RED : C_AMBER;
          it.printf(55, sy + 12, font_tiny, dColor, TextAlign::TOP_LEFT, "%s", due.c_str());
          textX = 100;
          textWidth = 120;
      }
      ScrollingText::draw(it, textX, sy + 10, textWidth, summary, font_small, C_WHITE);
      
      ly += 50;
      empty = false;
    }

    if (empty) {
      it.printf(120, getSY(ly + 40), font_small, C_DIMMER, TextAlign::CENTER, "LIST EMPTY");
      ly += 100;
    }
  };
  
  if (shopActive) drawList(gState.shoppingListFormatted);
  else drawList(gState.todoListFormatted);
  
  it.end_clipping();
  
  drawTabContent(10, 45, "SHOP", gState.shoppingListCount, shopActive, C_CYAN);
  drawTabContent(125, 45, "TASKS", gState.todoListCount, todoActive, C_AMBER);

  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "LOGISTICS DETAIL");
}