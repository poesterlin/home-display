#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"

void renderDetail_Vacuum(display::Display& it) {
  int ly = 40; 
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  int sy = getSY(ly);
  it.rectangle(10, sy, 220, 60, C_DIM);
  it.printf(20, sy + 5, font_tiny, C_DIM, TextAlign::TOP_LEFT, "STATUS");
  it.printf(20, sy + 25, font_small, gState.vacuumCleaning ? C_GREEN : C_CYAN, TextAlign::TOP_LEFT, "%s", 
            gState.vacuumStatus.c_str());
  ly += 70;
  
  sy = getSY(ly);
  it.rectangle(10, sy, 220, 60, C_DIM);
  it.printf(20, sy + 5, font_tiny, C_DIM, TextAlign::TOP_LEFT, "BATTERY");
  it.rectangle(20, sy + 25, 140, 14, C_DIM);
  Color batt_color = gState.vacuumBattery > 50.0f ? C_GREEN : (gState.vacuumBattery > 20.0f ? C_AMBER : C_RED);
  it.filled_rectangle(22, sy + 27, (int)((gState.vacuumBattery / 100.0f) * 136), 10, batt_color);
  it.printf(170, sy + 25, font_tiny, batt_color, TextAlign::TOP_LEFT, "%.0f%%", gState.vacuumBattery);
  ly += 70;
  
  gState.vacuumBtn.y = ly; 
  if (!gState.vacuumCleaning) {
    gState.vacuumBtn.draw(it, "START CLEANING", C_GREEN, gState.vacuumLoading, gState.vacuumLoadingStartTime, 5000, font_small, gState.scrollY);
  } else {
    gState.vacuumBtn.draw(it, "STOP VACUUM", C_RED, gState.vacuumLoading, gState.vacuumLoadingStartTime, 5000, font_small, gState.scrollY);
  }
  ly += 60;
  
  it.printf(10, getSY(ly), font_tiny, C_DIM, TextAlign::TOP_LEFT, "Last Clean: Today 10:00");
  ly += 20;
  it.printf(10, getSY(ly), font_tiny, C_DIM, TextAlign::TOP_LEFT, "Map Saved: Yes");
  ly += 20;
  it.printf(10, getSY(ly), font_tiny, C_DIM, TextAlign::TOP_LEFT, "Total Runtime: 2h 34m");
  ly += 30;
  
  it.printf(10, getSY(ly), font_small, C_WHITE, TextAlign::TOP_LEFT, "CONSUMABLES");
  ly += 25;
  
  auto drawConsumable = [&](int logicalY, const char* name, int pct) {
    int cur_sy = getSY(logicalY);
    it.printf(20, cur_sy, font_tiny, C_DIM, TextAlign::TOP_LEFT, "%s", name);
    it.rectangle(80, cur_sy + 2, 100, 8, C_DIM);
    it.filled_rectangle(82, cur_sy + 4, (int)(pct * 0.96f), 4, pct > 20 ? C_CYAN : C_RED);
    it.printf(190, cur_sy, font_tiny, C_DIM, TextAlign::TOP_LEFT, "%d%%", pct);
  };
  
  drawConsumable(ly, "Filter", 85); ly += 18;
  drawConsumable(ly, "Side B.", 42); ly += 18;
  drawConsumable(ly, "Main B.", 91); ly += 18;
  drawConsumable(ly, "Sensor", 12); ly += 30;
  
  it.printf(10, getSY(ly), font_small, C_WHITE, TextAlign::TOP_LEFT, "RECENT HISTORY");
  ly += 25;
  
  auto drawHistory = [&](int logicalY, const char* date, const char* dur, const char* area) {
    int cur_sy = getSY(logicalY);
    it.printf(20, cur_sy, font_tiny, C_WHITE, TextAlign::TOP_LEFT, "%s", date);
    it.printf(120, cur_sy, font_tiny, C_DIM, TextAlign::TOP_LEFT, "%s", dur);
    it.printf(190, cur_sy, font_tiny, C_AMBER, TextAlign::TOP_LEFT, "%s", area);
  };
  
  drawHistory(ly, "05 JAN", "45m", "32m2"); ly += 18;
  drawHistory(ly, "04 JAN", "12m", "8m2"); ly += 18;
  drawHistory(ly, "03 JAN", "52m", "41m2"); ly += 18;
  drawHistory(ly, "01 JAN", "38m", "29m2"); ly += 18;
  ly += 20;

  ly += 10;
  
  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "VACUUM DETAIL");
}
