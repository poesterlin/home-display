#pragma once
#include "esphome.h"
#include "ui_widget_base.h"

class ClockWidget : public Widget {
  int last_hour_ = -1;
  int last_minute_ = -1;
  int last_day_ = -1;
  int last_month_ = -1;
  bool baseline_set_ = false;
  UiRect bounds_;

 public:
  explicit ClockWidget(const UiRect &r) : bounds_(r) {}

  UiRect bounds() const override { return bounds_; }

  void update(uint32_t now) override {
    auto t = id(sntp_time).now();
    if (!t.is_valid())
      return;
    if (!baseline_set_ || t.hour != last_hour_ || t.minute != last_minute_ ||
        t.day_of_month != last_day_ || t.month != last_month_) {
      last_hour_ = t.hour;
      last_minute_ = t.minute;
      last_day_ = t.day_of_month;
      last_month_ = t.month;
      baseline_set_ = true;
      mark_dirty();
    }
  }

  void draw(Display &it, const UiState &state) override {
    int cx = bounds_.x + bounds_.w / 2;

    auto t = id(sntp_time).now();
    if (t.is_valid()) {
      std::string ts = t.strftime("%H:%M");
      it.printf(cx, bounds_.y + 4, &id(font_display), Color::BLACK,
                TextAlign::TOP_CENTER, "%s", ts.c_str());

      std::string ds = t.strftime("%a, %d %b");
      it.printf(cx, bounds_.y + 58, &id(font_small), Color::BLACK,
                TextAlign::TOP_CENTER, "%s", ds.c_str());
    } else {
      it.printf(cx, bounds_.y + bounds_.h / 2, &id(font_medium),
                Color::BLACK, TextAlign::CENTER, "--:--");
    }
  }
};
