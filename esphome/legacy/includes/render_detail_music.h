#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_helpers.h"

void renderDetail_Music(display::Display& it) {
  int ly = 50;
  auto getSY = [&](int logicalY) { return logicalY + gState.scrollY; };

  it.printf(120, getSY(ly), font_small, C_WHITE, TextAlign::CENTER, "TRANSFER PLAYBACK");
  ly += 25;

  gState.musicTransferOfficeBtn.x = 10;
  gState.musicTransferOfficeBtn.y = ly;
  gState.musicTransferOfficeBtn.w = 105;
  gState.musicTransferOfficeBtn.h = 45;
  gState.musicTransferOfficeBtn.draw(it, "OFFICE", C_CYAN, gState.musicTransferOfficeLoading, gState.musicTransferOfficeStartTime, 2000, font_small, gState.scrollY);

  gState.musicTransferLivingBtn.x = 125;
  gState.musicTransferLivingBtn.y = ly;
  gState.musicTransferLivingBtn.w = 105;
  gState.musicTransferLivingBtn.h = 45;
  gState.musicTransferLivingBtn.draw(it, "LIVING", C_CYAN, gState.musicTransferLivingLoading, gState.musicTransferLivingStartTime, 2000, font_small, gState.scrollY);
  
  ly += 60;

  drawRetroBox(it, 10, getSY(ly), 220, 70, "VOLUME_CONTROL", C_DIM);
  
  float currentVol = (gState.musicViewTab == 0) ? gState.mediaVolume : gState.mediaVolumeBose;
  
  int sliderX = 25;
  int sliderW = 190;
  int sliderY = getSY(ly + 40);
  
  it.line(sliderX, sliderY, sliderX + sliderW, sliderY, C_DIMMER);
  it.line(sliderX, sliderY+1, sliderX + sliderW, sliderY+1, C_DIMMER);
  
  float visualProgress = currentVol / 0.25f;
  if (visualProgress > 1.0f) visualProgress = 1.0f;
  if (visualProgress < 0.0f) visualProgress = 0.0f;
  int handleX = sliderX + (int)(visualProgress * sliderW);
  
  it.line(sliderX, sliderY, handleX, sliderY, C_CYAN);
  it.line(sliderX, sliderY+1, handleX, sliderY+1, C_CYAN);
  
  it.filled_circle(handleX, sliderY, 8, C_CYAN);
  it.circle(handleX, sliderY, 10, C_WHITE);
  
  it.printf(120, getSY(ly + 15), font_tiny, C_DIM, TextAlign::CENTER, "VOLUME: %.0f%%", currentVol * 100);
  
  ly += 80;

  gState.musicPrevBtn.y = ly;
  gState.musicNextBtn.y = ly;
  
  gState.musicPrevBtn.draw(it, "PREV", C_AMBER, gState.musicPrevLoading, gState.musicPrevStartTime, 500, font_small, gState.scrollY);
  gState.musicNextBtn.draw(it, "NEXT", C_AMBER, gState.musicNextLoading, gState.musicNextStartTime, 500, font_small, gState.scrollY);

  ly += 60;

  int totalContentHeight = ly - 40;
  gState.maxScrollY = totalContentHeight > 280 ? (totalContentHeight - 280) : 0;

  drawDetailHeader(it, "MUSIC OPTIONS");
}