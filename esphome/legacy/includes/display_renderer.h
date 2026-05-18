#pragma once
#include "esphome.h"
#include "state_manager.h"
#include "render_pages.h"
#include "render_details.h"
#include "notification.h"

void renderDisplay(display::Display& it) {
  it.fill(C_BLACK);
  
  if (gState.currentView == VIEW_MAIN_DASHBOARD) {
    drawCommonHeader(it);
    drawPageIndicator(it, gState.mainPageIndex, gState.totalMainPages);
    
    switch (gState.mainPageIndex) {
      case 0: renderPage0_Status(it); break;
      case 1: renderPage1_Music(it); break;
      case 2: renderPage3_House(it); break;
      case 3: renderPage4_Devices(it); break;
    }
  } else {
    renderDetailViews(it, gState.currentView);
  }

  if (!gState.notificationBody.empty()) {
    NotificationRenderer::draw(
      it, 
      gState.notificationSeverity,
      gState.notificationTitle,
      gState.notificationBody,
      font_medium, font_small
    );

    gState.notificationDismissBtn.x = 20;
    gState.notificationDismissBtn.y = 250;
    gState.notificationDismissBtn.w = 200;
    gState.notificationDismissBtn.h = 45;
    gState.notificationDismissBtn.draw(it, "DISMISS", C_WHITE, gState.notificationLoading, gState.notificationLoadingStartTime, 1000, font_small);
  }
}