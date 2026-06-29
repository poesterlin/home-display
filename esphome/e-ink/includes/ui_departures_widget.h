#pragma once
#include "esphome.h"
#include "ui_widget_base.h"
#include <algorithm>

class DeparturesWidget : public Widget {
  static const int MAX_VISIBLE = 5;
  static const int ROW_H = 30;
  static const int LINE_RX = 52;
  static const int DEST_X = 62;
  static const int MAX_DEST_LEN = 26;

  UiRect bounds_;
  const UiState *state_;

  int last_count_ = -1;
  int last_countdowns_[5] = {-1, -1, -1, -1, -1};
  std::string last_lines_[5];
  bool last_ha_connected_ = false;

 public:
  DeparturesWidget(const UiRect &r, const UiState *s)
      : bounds_(r), state_(s) {}

  UiRect bounds() const override { return bounds_; }

  void update(uint32_t now) override {
    if (!state_)
      return;

    if (state_->ha_connected != last_ha_connected_) {
      last_ha_connected_ = state_->ha_connected;
      mark_dirty();
      return;
    }

    if (!state_->data_valid) {
      if (last_count_ != -2) {
        last_count_ = -2;
        mark_dirty();
      }
      return;
    }

    const auto &deps = state_->departures;
    int count = deps.size();

    if (count != last_count_) {
      cache_and_dirty(deps);
      return;
    }

    for (int i = 0; i < count && i < MAX_VISIBLE; i++) {
      if (deps[i].countdown != last_countdowns_[i] ||
          deps[i].line != last_lines_[i]) {
        cache_and_dirty(deps);
        return;
      }
    }
  }

  void draw(Display &it, const UiState &state) override {
    int W = bounds_.x + bounds_.w;
    int y = bounds_.y;

    it.printf(W / 2, y + 2, &id(font_medium), Color::BLACK,
              TextAlign::TOP_CENTER, "PARADEPLATZ");

    int table_y = y + 38;

    if (!state.data_valid) {
      it.printf(W / 2, table_y + 36, &id(font_medium), Color::BLACK,
                TextAlign::TOP_CENTER, "Warte auf Daten...");
      return;
    }

    int visible = std::min((int) state.departures.size(), MAX_VISIBLE);

    if (visible == 0) {
      it.printf(W / 2, table_y + 36, &id(font_medium), Color::BLACK,
                TextAlign::TOP_CENTER, "Keine Abfahrten");
      return;
    }

    for (int i = 0; i < visible; i++) {
      const auto &d = state.departures[i];
      int ry = table_y + i * ROW_H;

      it.printf(LINE_RX, ry, &id(font_medium), Color::BLACK,
                TextAlign::TOP_RIGHT, "%s", d.line.c_str());

      std::string dir = d.direction;
      if ((int) dir.length() > MAX_DEST_LEN)
        dir = dir.substr(0, MAX_DEST_LEN - 1) + "...";
      it.printf(DEST_X, ry + 3, &id(font_small), Color::BLACK,
                TextAlign::TOP_LEFT, "%s", dir.c_str());

      char buf[32];
      if (d.countdown == 0)
        snprintf(buf, sizeof(buf), "jetzt");
      else
        snprintf(buf, sizeof(buf), "%d min", d.countdown);
      it.printf(W - 10, ry + 2, &id(font_medium), Color::BLACK,
                TextAlign::TOP_RIGHT, "%s", buf);

      if (d.delay_m > 0) {
        snprintf(buf, sizeof(buf), "+%d", d.delay_m);
        it.printf(W - 10, ry + 18, &id(font_small), Color::BLACK,
                  TextAlign::TOP_RIGHT, "%s", buf);
      }
    }
  }

 private:
  void cache_and_dirty(const std::vector<VrnDeparture> &deps) {
    last_count_ = deps.size();
    for (int i = 0; i < MAX_VISIBLE; i++) {
      if (i < (int) deps.size()) {
        last_countdowns_[i] = deps[i].countdown;
        last_lines_[i] = deps[i].line;
      } else {
        last_countdowns_[i] = -1;
        last_lines_[i].clear();
      }
    }
    mark_dirty();
  }
};
