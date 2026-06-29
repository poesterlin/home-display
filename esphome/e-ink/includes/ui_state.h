#pragma once
#include <vector>
#include <string>

struct VrnDeparture {
  std::string line;
  std::string direction;
  int countdown;
  int delay_m;
};

struct UiState {
  std::vector<VrnDeparture> departures;
  std::string last_update;
  bool data_valid = false;
  bool ha_connected = false;
};
