#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"

void renderDetail_Timer(display::Display& it) {
  int ly = 60;
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  int minutes = gState.timerRemaining / 60;
  int seconds = gState.timerRemaining % 60;
  Color timeColor = gState.timerActive ? C_CYAN : C_WHITE;
  if (gState.timerRemaining == 0 && gState.timerActive) timeColor = C_RED;

  it.printf(120, getSY(ly + 40), font_large, timeColor, TextAlign::CENTER, "%02d:%02d", minutes, seconds);
  
  if (!gState.timerActive) {
    bool dummyLoading = false;
    unsigned long dummyStartTime = 0;
    gState.timerMinusBtn.y = ly + 20;
    gState.timerPlusBtn.y = ly + 20;
    gState.timerMinusBtn.draw(it, "-1", C_CYAN, dummyLoading, dummyStartTime, 0, font_small, gState.scrollY);
    gState.timerPlusBtn.draw(it, "+1", C_CYAN, dummyLoading, dummyStartTime, 0, font_small, gState.scrollY);
  }

  ly += 90;

  drawRetroBox(it, 10, getSY(ly), 220, 60, "TIME_ADJUST", gState.timerActive ? C_DIMMER : C_DIM);
  
  int sliderX = 25;
  int sliderW = 190;
  int sliderY = getSY(ly + 35);
  
  Color trackColor = gState.timerActive ? C_DIMMER : C_DIMMER;
  it.line(sliderX, sliderY, sliderX + sliderW, sliderY, trackColor);
  it.line(sliderX, sliderY+1, sliderX + sliderW, sliderY+1, trackColor);
  
  float progress = (float)gState.timerRemaining / 3600.0f;
  if (progress > 1.0f) progress = 1.0f;
  int handleX = sliderX + (int)(progress * sliderW);
  
  Color sliderColor = gState.timerActive ? C_DIMMER : C_CYAN;
  it.line(sliderX, sliderY, handleX, sliderY, sliderColor);
  it.line(sliderX, sliderY+1, handleX, sliderY+1, sliderColor);
  
  Color handleColor = gState.timerActive ? C_DIMMER : C_CYAN;
  it.filled_circle(handleX, sliderY, 8, handleColor);
  it.circle(handleX, sliderY, 10, gState.timerActive ? C_DIMMER : C_WHITE);
  
  const char* sliderText = gState.timerActive ? "TIMER RUNNING - SLIDER LOCKED" : "SLIDE TO SET (MAX 60M)";
  Color textColor = gState.timerActive ? C_DIMMER : C_DIM;
  it.printf(120, getSY(ly + 15), font_tiny, textColor, TextAlign::CENTER, "%s", sliderText);
  
  ly += 80;

  gState.timerStartBtn.y = ly;
  gState.timerResetBtn.y = ly;
  
  const char* startLabel = gState.timerActive ? "STOP" : "START";
  Color startColor = gState.timerActive ? C_RED : C_GREEN;
  
  bool dummyLoading = false;
  unsigned long dummyStartTime = 0;
  
  gState.timerStartBtn.draw(it, startLabel, startColor, dummyLoading, dummyStartTime, 0, font_small, gState.scrollY);
  gState.timerResetBtn.draw(it, "RESET", C_AMBER, dummyLoading, dummyStartTime, 0, font_small, gState.scrollY);

  ly += 60;

  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "KITCHEN TIMER");
}