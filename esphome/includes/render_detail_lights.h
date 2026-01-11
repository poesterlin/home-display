#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"

void renderDetail_Lights(display::Display& it) {
  int ly = 45; 
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  it.printf(120, getSY(ly), font_small, C_WHITE, TextAlign::CENTER, "LIVING ROOM");
  ly += 25;

  int col1 = 15;
  int col2 = 125;
  int btnW = 100;
  int btnH = 40;
  int spacing = 10;

  gState.lightStehlampe.btn.x = col1;
  gState.lightStehlampe.btn.y = ly;
  gState.lightStehlampe.btn.w = btnW;
  gState.lightStehlampe.btn.h = btnH;
  gState.lightStehlampe.btn.draw(it, "STEH-L.", gState.lightStehlampe.state, gState.lightStehlampe.loading, gState.lightStehlampe.loadingStartTime, font_tiny, gState.scrollY);

  gState.lightWohnzimmer.btn.x = col2;
  gState.lightWohnzimmer.btn.y = ly;
  gState.lightWohnzimmer.btn.w = btnW;
  gState.lightWohnzimmer.btn.h = btnH;
  gState.lightWohnzimmer.btn.draw(it, "WOHNZ.", gState.lightWohnzimmer.state, gState.lightWohnzimmer.loading, gState.lightWohnzimmer.loadingStartTime, font_tiny, gState.scrollY);
  
  ly += btnH + spacing;

  gState.lightKleineLampe.btn.x = col1;
  gState.lightKleineLampe.btn.y = ly;
  gState.lightKleineLampe.btn.w = btnW;
  gState.lightKleineLampe.btn.h = btnH;
  gState.lightKleineLampe.btn.draw(it, "KLEINE L.", gState.lightKleineLampe.state, gState.lightKleineLampe.loading, gState.lightKleineLampe.loadingStartTime, font_tiny, gState.scrollY);

  gState.lightWLED.btn.x = col2;
  gState.lightWLED.btn.y = ly;
  gState.lightWLED.btn.w = btnW;
  gState.lightWLED.btn.h = btnH;
  gState.lightWLED.btn.draw(it, "WLED", gState.lightWLED.state, gState.lightWLED.loading, gState.lightWLED.loadingStartTime, font_tiny, gState.scrollY);

  ly += btnH + spacing;

  gState.lightStehlampeOben.btn.x = col1;
  gState.lightStehlampeOben.btn.y = ly;
  gState.lightStehlampeOben.btn.w = btnW;
  gState.lightStehlampeOben.btn.h = btnH;
  gState.lightStehlampeOben.btn.draw(it, "ST-OBEN", gState.lightStehlampeOben.state, gState.lightStehlampeOben.loading, gState.lightStehlampeOben.loadingStartTime, font_tiny, gState.scrollY);

  gState.lightKamera.btn.x = col2;
  gState.lightKamera.btn.y = ly;
  gState.lightKamera.btn.w = btnW;
  gState.lightKamera.btn.h = btnH;
  gState.lightKamera.btn.draw(it, "KAMERA", gState.lightKamera.state, gState.lightKamera.loading, gState.lightKamera.loadingStartTime, font_tiny, gState.scrollY);

  ly += btnH + spacing + 10;

  it.printf(120, getSY(ly), font_small, C_WHITE, TextAlign::CENTER, "OFFICE");
  ly += 25;

  gState.lightOffice.btn.x = col1;
  gState.lightOffice.btn.y = ly;
  gState.lightOffice.btn.w = btnW;
  gState.lightOffice.btn.h = btnH;
  gState.lightOffice.btn.draw(it, "OFFICE", gState.lightOffice.state, gState.lightOffice.loading, gState.lightOffice.loadingStartTime, font_tiny, gState.scrollY);

  gState.lightGrosseLED.btn.x = col2;
  gState.lightGrosseLED.btn.y = ly;
  gState.lightGrosseLED.btn.w = btnW;
  gState.lightGrosseLED.btn.h = btnH;
  gState.lightGrosseLED.btn.draw(it, "GR. LED", gState.lightGrosseLED.state, gState.lightGrosseLED.loading, gState.lightGrosseLED.loadingStartTime, font_tiny, gState.scrollY);

  ly += btnH + spacing;

  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "LIGHTS CONTROL");
}
