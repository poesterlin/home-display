#pragma once

#include "esphome.h"
#include "ui_types.h"
#include <memory>
#include <vector>
#include <functional>

namespace esphome {
namespace font {
class Font;
}
}  // namespace esphome

void ui_fast_filled_rectangle(display::Display &it, int x, int y, int w, int h, Color color);

struct UiState;

struct UiRect {
  int x;
  int y;
  int w;
  int h;

  bool contains(int tx, int ty, int slop_x = 0, int slop_y = 0) const {
    return tx >= x - slop_x && tx <= x + w + slop_x && ty >= y - slop_y && ty <= y + h + slop_y;
  }
};

struct Theme {
  struct TextStyle {
    esphome::font::Font *font = nullptr;
    Color color = Color(255, 255, 255);
    TextAlign align = TextAlign::TOP_LEFT;
  };

  struct ButtonStyle {
    Color border_color = Color(0, 200, 255);
    Color text_color = Color(255, 255, 255);
    esphome::font::Font *font = nullptr;
  };

  TextStyle header   = {nullptr, Color(255, 255, 255), TextAlign::TOP_LEFT};
  TextStyle label    = {nullptr, Color(180, 180, 180), TextAlign::TOP_LEFT};
  Color     info_bg  = Color(0, 0, 0);

  ButtonStyle primary = {Color(0, 200, 255), Color(255, 255, 255), nullptr};
  ButtonStyle accent  = {Color(255, 180, 0), Color(255, 255, 255), nullptr};
  ButtonStyle neutral = {Color(170, 170, 170), Color(255, 255, 255), nullptr};
  ButtonStyle success = {Color(0, 220, 120), Color(255, 255, 255), nullptr};
};

inline Theme g_theme;

class Widget {
 public:
  virtual ~Widget() = default;
  virtual void enter() {}
  virtual void exit() {}
  virtual void layout() {}
  virtual void update(uint32_t now) {}
  virtual bool handle_touch(const TouchEvent &event, uint32_t now) { return false; }
  virtual void draw(display::Display &it, const UiState &state) = 0;

  virtual bool is_visible(const UiState &state) const {
    (void)state;
    if (visibility_check_) return visibility_check_();
    return true;
  }

  void set_visibility_condition(std::function<bool()> check) {
    visibility_check_ = std::move(check);
  }

 protected:
  std::function<bool()> visibility_check_;
};

class RectWidget : public Widget {
 public:
  RectWidget(UiRect rect, Color color) : rect_(rect), color_(color) {}

  void draw(display::Display &it, const UiState &state) override {
    (void)state;
    ui_fast_filled_rectangle(it, rect_.x, rect_.y, rect_.w, rect_.h, color_);
  }

 private:
  UiRect rect_;
  Color color_;
};

class LabelWidget : public Widget {
 public:
  LabelWidget(UiRect rect, const char *text, const Theme::TextStyle &style)
      : rect_(rect), text_(text), style_(&style) {}

  template<typename T>
  LabelWidget(UiRect rect, const char *fmt, const T *value)
      : rect_(rect), text_(fmt), style_(&g_theme.label) {
    printer_ = [value, fmt](display::Display &it, int x, int y,
                             esphome::font::Font *f, Color c, TextAlign a) {
      it.printf(x, y, f, c, a, fmt, *value);
    };
  }

  void bind(const bool *value, const char *on_text = "ON", const char *off_text = "OFF") {
    bound_bool_ = value;
    on_text_ = on_text;
    off_text_ = off_text;
  }

  template<typename T>
  void bind(const T *value, const char *fmt) {
    printer_ = [value, fmt](display::Display &it, int x, int y,
                             esphome::font::Font *f, Color c, TextAlign a) {
      it.printf(x, y, f, c, a, fmt, *value);
    };
  }

  void draw(display::Display &it, const UiState &state) override {
    (void)state;

    if (style_ == nullptr || style_->font == nullptr) return;

    auto *f = style_->font;
    auto c = style_->color;
    auto a = style_->align;

    if (bound_bool_ != nullptr) {
      const char *display = *bound_bool_ ? on_text_ : off_text_;
      it.printf(rect_.x, rect_.y, f, c, a, "%s", display);
    } else if (printer_) {
      printer_(it, rect_.x, rect_.y, f, c, a);
    } else {
      it.printf(rect_.x, rect_.y, f, c, a, "%s", text_);
    }
  }

 private:
  UiRect rect_;
  const char *text_;
  const Theme::TextStyle *style_ = nullptr;
  const bool *bound_bool_ = nullptr;
  const char *on_text_ = "ON";
  const char *off_text_ = "OFF";
  std::function<void(display::Display&, int, int, esphome::font::Font*, Color, TextAlign)> printer_;
};

struct EntityAction {
  const char *entity_id;
  const char *service;
};

inline std::function<void()> make_service_callback(const EntityAction &action) {
  return [action]() {
    (void)action;
    // Override with ESPHome service call, e.g.:
    // esphome::api::call_service(action.service, ..., {{"entity_id", action.entity_id}});
  };
}

class ButtonWidget : public Widget {
 public:
  using Callback = std::function<void()>;

  ButtonWidget(UiRect rect, const char *label, Callback callback, const Theme::ButtonStyle &style)
      : rect_(rect), label_(label), callback_(callback), style_(&style) {}

  ButtonWidget(UiRect rect, const char *label, const EntityAction &action, const Theme::ButtonStyle &style)
      : rect_(rect), label_(label), callback_(make_service_callback(action)), style_(&style) {}

  void update(uint32_t now) override {
    if (loading_timeout_ms_ > 0 && loading_ && (now - loading_start_ms_ > loading_timeout_ms_)) {
      loading_ = false;
    }
  }

  bool handle_touch(const TouchEvent &event, uint32_t now) override {
    if (event.type != TouchType::Tap) return false;
    if (loading_) return false;
    if (!hit_test(event.x, event.y)) return false;
    loading_ = true;
    loading_start_ms_ = now;
    if (callback_) callback_();
    return true;
  }

  void draw(display::Display &it, const UiState &state) override {
    (void)state;

    if (style_ == nullptr || style_->font == nullptr) return;

    auto *f = style_->font;
    auto bc = style_->border_color;
    auto tc = style_->text_color;

    it.rectangle(rect_.x, rect_.y, rect_.w, rect_.h, bc);
    ui_fast_filled_rectangle(it, rect_.x + 1, rect_.y + 1, rect_.w - 2, rect_.h - 2, Color(40, 40, 40));
    if (loading_) {
      it.printf(rect_.x + rect_.w / 2, rect_.y + rect_.h / 2, f, tc, TextAlign::CENTER, "...");
      return;
    }
    it.printf(rect_.x + rect_.w / 2, rect_.y + rect_.h / 2, f, tc, TextAlign::CENTER, "%s", label_);
  }

 private:
  bool hit_test(int tx, int ty) const {
    const int sx = rect_.w < 40 ? 15 : (rect_.w < 60 ? 10 : 0);
    const int sy = rect_.h < 40 ? 15 : (rect_.h < 60 ? 10 : 0);
    return rect_.contains(tx, ty, sx, sy);
  }

  UiRect rect_;
  const char *label_;
  Callback callback_;
  const Theme::ButtonStyle *style_ = nullptr;
  bool loading_ = false;
  uint32_t loading_start_ms_ = 0;
  uint32_t loading_timeout_ms_ = 350;
};

class VBox : public Widget {
 public:
  VBox(UiRect rect) : rect_(rect) {}
  VBox(int x, int y, int w, int h) : rect_{x, y, w, h} {}

  void add_child(std::unique_ptr<Widget> child) {
    children_.push_back(std::move(child));
  }

  template<typename T, typename... Args>
  T* emplace_child(Args&&... args) {
    auto child = std::make_unique<T>(std::forward<Args>(args)...);
    T* ptr = child.get();
    children_.push_back(std::move(child));
    return ptr;
  }

  void layout() override {
    int y_offset = rect_.y;
    for (auto &child : children_) {
      child->layout();
      y_offset += spacing_;
    }
    cached_child_count_ = children_.size();
  }

  void update(uint32_t now) override {
    for (auto &child : children_) child->update(now);
  }

  bool handle_touch(const TouchEvent &event, uint32_t now) override {
    for (auto &child : children_) {
      if (child->handle_touch(event, now)) return true;
    }
    return false;
  }

  void draw(display::Display &it, const UiState &state) override {
    for (auto &child : children_) child->draw(it, state);
  }

  void set_spacing(int s) { spacing_ = s; }

 private:
  UiRect rect_;
  int spacing_ = 4;
  size_t cached_child_count_ = 0;
  std::vector<std::unique_ptr<Widget>> children_;
};

class HBox : public Widget {
 public:
  HBox(UiRect rect) : rect_(rect) {}
  HBox(int x, int y, int w, int h) : rect_{x, y, w, h} {}

  void add_child(std::unique_ptr<Widget> child) {
    children_.push_back(std::move(child));
  }

  template<typename T, typename... Args>
  T* emplace_child(Args&&... args) {
    auto child = std::make_unique<T>(std::forward<Args>(args)...);
    T* ptr = child.get();
    children_.push_back(std::move(child));
    return ptr;
  }

  void layout() override {
    int x_offset = rect_.x;
    for (auto &child : children_) {
      child->layout();
      x_offset += spacing_;
    }
  }

  void update(uint32_t now) override {
    for (auto &child : children_) child->update(now);
  }

  bool handle_touch(const TouchEvent &event, uint32_t now) override {
    for (auto &child : children_) {
      if (child->handle_touch(event, now)) return true;
    }
    return false;
  }

  void draw(display::Display &it, const UiState &state) override {
    for (auto &child : children_) child->draw(it, state);
  }

  void set_spacing(int s) { spacing_ = s; }

 private:
  UiRect rect_;
  int spacing_ = 4;
  std::vector<std::unique_ptr<Widget>> children_;
};
