#pragma once
#include "ui_types.h"

class UiInvalidation {
  inline static bool needs_redraw_ = true;
  inline static bool full_dirty_ = true;
  inline static UiDirtyRect dirty_rects_[16];
  inline static int dirty_count_ = 0;

 public:
  static void request_full() {
    full_dirty_ = true;
    needs_redraw_ = true;
    dirty_count_ = 0;
  }

  static void request_rect(const UiDirtyRect &r) {
    needs_redraw_ = true;
    if (full_dirty_)
      return;
    if (dirty_count_ >= 16) {
      request_full();
      return;
    }
    dirty_rects_[dirty_count_++] = r;
  }

  static bool needs_redraw() { return needs_redraw_; }
  static bool is_full_dirty() { return full_dirty_; }
  static int dirty_count() { return dirty_count_; }

  static bool needs_redraw_in(int x, int y, int w, int h) {
    if (full_dirty_)
      return true;
    if (dirty_count_ == 0 && needs_redraw_)
      return true;
    for (int i = 0; i < dirty_count_; i++) {
      const auto &r = dirty_rects_[i];
      if (x + w <= r.x || r.x + r.w <= x)
        continue;
      if (y + h <= r.y || r.y + r.h <= y)
        continue;
      return true;
    }
    return false;
  }

  static void clear() {
    needs_redraw_ = false;
    full_dirty_ = false;
    dirty_count_ = 0;
  }
};
