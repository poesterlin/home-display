#pragma once
#include "esphome.h"
#include "ui_types.h"
#include "ui_state.h"
#include "ui_invalidation.h"
#include <vector>

class Widget {
 public:
  virtual ~Widget() = default;
  virtual void enter() {}
  virtual void exit() {}
  virtual void layout() {}
  virtual void update(uint32_t now) {}
  virtual void draw(Display &it, const UiState &state) = 0;
  virtual UiRect bounds() const { return {0, 0, 400, 300}; }

  void mark_dirty() {
    auto b = bounds();
    UiInvalidation::request_rect(UiDirtyRect{b.x, b.y, b.w, b.h});
  }

  bool needs_draw(const UiState &state) const {
    auto b = bounds();
    return UiInvalidation::needs_redraw_in(b.x, b.y, b.w, b.h);
  }
};

class GenericScreen {
  std::vector<Widget *> widgets_;

 public:
  void add(Widget *w) { widgets_.push_back(w); }

  void enter() {
    for (auto *w : widgets_)
      w->enter();
  }
  void exit() {
    for (auto *w : widgets_)
      w->exit();
  }
  void layout() {
    for (auto *w : widgets_)
      w->layout();
  }
  void update(uint32_t now) {
    for (auto *w : widgets_)
      w->update(now);
  }
  void draw(Display &it, const UiState &state) {
    for (auto *w : widgets_)
      w->draw(it, state);
  }
};
