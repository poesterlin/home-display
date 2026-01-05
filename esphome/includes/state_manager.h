#pragma once
#include "esphome.h"

// Centralized state for the display
struct DisplayState {
  // Page management
  int currentPage = 0;
  int totalPages = 4;
  
  // Touch State
  uint32_t lastTouchTime = 0;
  
  struct TouchDebug {
    uint8_t raw[16];
    uint8_t status;
    int fingerCount;
    
    // Format 1
    uint16_t x1_fmt1, y1_fmt1;
    // Format 2
    uint16_t x1_fmt2, y1_fmt2;
    // Format 3
    uint16_t x1_fmt3, y1_fmt3;
  } touchDebug;
  
  // --- SENSORS ---
  
  // Climate
  float outsideTemp = 0;
  float outsideHumidity = 0;
  float indoorTemp = 0;
  float indoorHumidity = 0;
  float co2 = 0;
  float indoorLight = 0;
  
  // Status
  bool wifiConnected = false;
  
  // Windows (true = open)
  bool windowLiving = false;
  bool windowBath = false;
  bool windowWork = false;
  
  // Lights (true = on)
  bool lightLiving = false;
  bool lightDesk = false;
  bool lightLamp = false;
  
  // Presence
  bool motionLiving = false;
  bool occupancyRadar = false;
  
  // Devices
  float vacuumBattery = 0;
  bool vacuumCleaning = false;
  std::string vacuumStatus = "Unknown";
  
  float printerProgress = 0;
  std::string printerFilename = "";
  
  std::string washingMachineStatus = "";
  
  bool beamerOn = false;
  float beamerPower = 0;
  
  // To-Do List (Title, Due, Overdue)
  struct TodoItem {
    std::string title;
    std::string due;
    bool isOverdue;
    bool hasData;
  } todos[3];

  // --- UI HELPERS ---
  
  // Helper to count open windows
  int getOpenWindowCount() {
    return (windowLiving ? 1 : 0) + (windowBath ? 1 : 0) + (windowWork ? 1 : 0);
  }
};

// Global instance
static DisplayState gState;

// State update helpers
void nextPage() {
  gState.currentPage = (gState.currentPage + 1) % gState.totalPages;
  gState.lastTouchTime = millis();
}

void prevPage() {
  gState.currentPage = (gState.currentPage - 1 + gState.totalPages) % gState.totalPages;
  gState.lastTouchTime = millis();
}

void setPage(int page) {
  if (page >= 0 && page < gState.totalPages) {
    gState.currentPage = page;
    gState.lastTouchTime = millis();
  }
}