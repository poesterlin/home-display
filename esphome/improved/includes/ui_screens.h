#pragma once

#include "esphome.h"
#include "ui_state.h"
#include "ui_types.h"
#include "ui_widgets.h"
#include "ui_invalidation.h"
#include "ui_redraw.h"
#include <memory>
#include <vector>
#include <map>

namespace esphome {
namespace font {
class Font;
}
}  // namespace esphome

class Screen {
 public:
  virtual ~Screen() = default;
  virtual void enter() {}
  virtual void exit() {}
  virtual void layout() {}
  virtual void update(uint32_t now) = 0;
  virtual bool handle_touch(const TouchEvent &event, uint32_t now, const UiState &state) = 0;
  virtual void draw(display::Display &it, const UiState &state) = 0;
};

class GenericScreen : public Screen {
 public:
  GenericScreen() = default;

  void add_widget(std::unique_ptr<Widget> widget) {
    widgets_.push_back(std::move(widget));
  }

  template<typename T, typename... Args>
  T* emplace_widget(Args&&... args) {
    auto widget = std::make_unique<T>(std::forward<Args>(args)...);
    T* ptr = widget.get();
    widgets_.push_back(std::move(widget));
    return ptr;
  }

  void enter() override {
    for (auto &w : widgets_) w->enter();
  }

  void exit() override {
    for (auto &w : widgets_) w->exit();
  }

  void layout() override {
    for (auto &w : widgets_) w->layout();
  }

  void update(uint32_t now) override {
    for (auto &w : widgets_) w->update(now);
  }

  bool handle_touch(const TouchEvent &event, uint32_t now, const UiState &state) override {
    for (auto &w : widgets_) {
      if (w->is_visible(state) && w->handle_touch(event, now)) return true;
    }
    return false;
  }

  void draw(display::Display &it, const UiState &state) override {
    for (auto &w : widgets_) {
      if (w->is_visible(state)) w->draw(it, state);
    }
  }

 private:
  std::vector<std::unique_ptr<Widget>> widgets_;
};

class ScreenController {
 public:
  ScreenController() {
    {
      auto home = std::make_unique<GenericScreen>();
      screens_[UiScreenId::Home] = home.get();
      owned_screens_.push_back(std::move(home));
    }
    {
      auto actions = std::make_unique<GenericScreen>();
      screens_[UiScreenId::Actions] = actions.get();
      owned_screens_.push_back(std::move(actions));
    }
    current_ = screens_.at(UiScreenId::Home);
  }

  GenericScreen* get_screen(UiScreenId id) {
    auto it = screens_.find(id);
    if (it != screens_.end()) {
      return static_cast<GenericScreen*>(it->second);
    }
    return nullptr;
  }

  GenericScreen* create_screen(UiScreenId id) {
    auto screen = std::make_unique<GenericScreen>();
    auto *ptr = screen.get();
    screens_[id] = ptr;
    owned_screens_.push_back(std::move(screen));
    return ptr;
  }

  void register_screen(UiScreenId id, Screen *screen) {
    screens_[id] = screen;
  }

  void set_current(UiScreenId id) {
    current_->exit();
    current_id_ = id;
    current_ = screens_.at(id);
    current_->enter();
    current_->layout();
    UiRedraw::request_full();
  }

  void navigate_to(UiScreenId id) {
    set_current(id);
  }

  UiScreenId current_id() const { return current_id_; }

  void update(uint32_t now) { current_->update(now); }

  bool handle_touch(const TouchEvent &event, uint32_t now, const UiState &state) { return current_->handle_touch(event, now, state); }

  void draw(display::Display &it, const UiState &state) { current_->draw(it, state); }

  Screen* current() { return current_; }

 private:
  UiScreenId current_id_ = UiScreenId::Home;
  Screen *current_ = nullptr;
  std::map<UiScreenId, Screen*> screens_;
  std::vector<std::unique_ptr<GenericScreen>> owned_screens_;
};

struct EntityAction {
  const char *entity_id;
  const char *service;
};

inline void setup_ui_screens(ScreenController &screens, UiState &state, 
                           std::function<void(const std::string&, const std::string&)> on_action) {
  auto *home = screens.get_screen(UiScreenId::Home);
  auto *actions = screens.get_screen(UiScreenId::Actions);

  auto make_ha_callback = [on_action](const char* entity, const char* service) {
    return [on_action, entity, service]() {
      if (on_action) on_action(entity, service);
    };
  };

  home->emplace_widget<LabelWidget>(UiRect{10, 10, 100, 20}, "HOME", g_theme.header);

  home->emplace_widget<RectWidget>(UiRect{10, 40, 220, 20}, g_theme.info_bg);

  {
    auto *info = home->emplace_widget<LabelWidget>(UiRect{10, 40, 220, 20}, "", g_theme.label);
    info->bind(state.button_a_on.ptr(), "Button A: ON", "Button A: OFF");
  }

  home->emplace_widget<ButtonWidget>(UiRect{20, 80, 200, 60}, "ACTIONS",
      [&screens]() { screens.navigate_to(UiScreenId::Actions); }, g_theme.primary);

  home->emplace_widget<ButtonWidget>(UiRect{20, 170, 200, 60}, "TOGGLE A",
      [&state]() { state.button_a_on = !state.button_a_on; }, g_theme.accent);

  // LED Switch Section
  home->emplace_widget<RectWidget>(UiRect{10, 240, 220, 20}, g_theme.info_bg);
  {
    auto *info = home->emplace_widget<LabelWidget>(UiRect{10, 240, 220, 20}, "", g_theme.label);
    info->bind(state.led_switch.ptr(), "LED: ON", "LED: OFF");
  }

  home->emplace_widget<ButtonWidget>(UiRect{20, 270, 200, 60}, "LED SWITCH",
      make_ha_callback("switch.led_stehlampe_switch", "switch.toggle"), g_theme.success);

  actions->emplace_widget<LabelWidget>(UiRect{10, 10, 100, 20}, "ACTIONS", g_theme.header);

  actions->emplace_widget<RectWidget>(UiRect{10, 40, 220, 20}, g_theme.info_bg);

  {
    auto *info = actions->emplace_widget<LabelWidget>(UiRect{10, 40, 220, 20}, "", g_theme.label);
    info->bind(state.button_b_on.ptr(), "Button B: ON", "Button B: OFF");
  }

  actions->emplace_widget<ButtonWidget>(UiRect{20, 80, 200, 60}, "BACK",
      [&screens]() { screens.navigate_to(UiScreenId::Home); }, g_theme.neutral);

  actions->emplace_widget<ButtonWidget>(UiRect{20, 170, 200, 60}, "TOGGLE B",
      [&state]() { state.button_b_on = !state.button_b_on; }, g_theme.success);
}
