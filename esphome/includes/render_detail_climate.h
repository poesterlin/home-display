#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"

void renderDetail_Climate(display::Display& it) {
  int ly = 45; 
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  drawRetroBox(it, 10, getSY(ly), 220, 110, "AIR_QUALITY", C_GREEN);
  
  float co2_val = gState.co2;
  Color co2_color = co2_val < 800.0f ? C_GREEN : (co2_val < 1200.0f ? C_AMBER : C_RED);
  
  it.printf(30, getSY(ly + 25), font_tiny, C_DIM, TextAlign::TOP_LEFT, "CO2 CONCENTRATION");
  it.printf(30, getSY(ly + 45), font_large, co2_color, TextAlign::TOP_LEFT, "%.0f", co2_val);
  it.printf(110, getSY(ly + 60), font_tiny, C_DIM, TextAlign::TOP_LEFT, "PPM");

  it.rectangle(30, getSY(ly + 80), 180, 10, C_DIMMER);
  float mapped = (co2_val - 400.0f) / 1600.0f;
  if (mapped < 0) mapped = 0; if (mapped > 1) mapped = 1;
  it.filled_rectangle(32, getSY(ly + 82), (int)(mapped * 176), 6, co2_color);
  
  ly += 125;

  drawRetroBox(it, 10, getSY(ly), 220, 115, "THERMAL_DYNAMICS", C_AMBER);
  
  auto drawReadout = [&](int x, int y, const char* label, float val, const char* unit, Color c) {
    it.printf(x, getSY(y), font_tiny, C_DIM, TextAlign::TOP_LEFT, "%s", label);
    it.printf(x, getSY(y + 15), font_medium, c, TextAlign::TOP_LEFT, "%.1f%s", val, unit);
  };

  drawReadout(30, ly + 25, "INDOOR_TEMP", gState.indoorTemp, "C", C_AMBER);
  drawReadout(130, ly + 25, "INDOOR_HUM", gState.indoorHumidity, "%", C_DIM);
  
  drawReadout(30, ly + 70, "OUTDOOR_TEMP", gState.outsideTemp, "C", C_CYAN);
  drawReadout(130, ly + 70, "OUTDOOR_HUM", gState.outsideHumidity, "%", C_DIM);
  
  ly += 130;

  drawRetroBox(it, 10, getSY(ly), 220, 60, "ENVIRONMENT_STATS", C_DIM);
  it.printf(30, getSY(ly + 20), font_tiny, C_DIM, TextAlign::TOP_LEFT, "INDOOR_LIGHT");
  it.printf(30, getSY(ly + 35), font_small, C_WHITE, TextAlign::TOP_LEFT, "%.0f lx", gState.indoorLight);
  ly += 70;

  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "CLIMATE DETAIL");
}