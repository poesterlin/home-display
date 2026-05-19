import type {
  Project,
  Component,
  LightStateComponent,
  TabContainerComponent,
  TextComponent,
  ButtonComponent,
  OnTapAction,
} from "@esphome-designer/schema";
import {
  toCppIdentifier,
  escapeCString,
  stateVarFromEntity,
  type ScreenDescriptor,
  type WidgetFactory,
} from "./utils";

const TAB_BAR_HEIGHT = 36;

function dashboardScreenId(name: string, index: number): string {
  if (index === 0) return 'Home';
  return toCppIdentifier(name) || `Page${index + 1}`;
}

function detailScreenId(id: string, title: string): string {
  return 'Detail' + (toCppIdentifier(id) || toCppIdentifier(title) || 'View');
}

function collectScreens(project: Project): ScreenDescriptor[] {
  const screens: ScreenDescriptor[] = [];
  const seen = new Set<string>();
  for (const [index, page] of project.dashboardPages.entries()) {
    const cppName = dashboardScreenId(page.name, index);
    if (seen.has(cppName)) continue;
    seen.add(cppName);
    screens.push({ cppName, name: page.name || cppName });
  }
  for (const view of project.detailViews) {
    const cppName = detailScreenId(view.id, view.title);
    if (seen.has(cppName)) continue;
    seen.add(cppName);
    screens.push({ cppName, name: view.title });
  }
  if (screens.length === 0) {
    screens.push({ cppName: 'Home', name: 'Home' });
  }
  return screens;
}

function emitTapAction(action: OnTapAction | undefined): string {
  if (!action) return '';
  if (action.type === 'SERVICE_CALL') {
    const entity = action.target?.entityId ?? action.target?.deviceId ?? '';
    return `make_ha_callback("${entity}", "${action.service}")`;
  }
  if (action.type === 'OPEN_DETAIL') {
    const detailId = detailScreenId(action.targetId ?? '', '');
    return `[&screens]() { screens.navigate_to(UiScreenId::${detailId}); }`;
  }
  if (action.type === 'GO_BACK') {
    return `[&screens]() { screens.navigate_to(UiScreenId::Home); }`;
  }
  if (action.type === 'NEXT_PAGE') {
    return `[&state]() {
      state.home_page_index = (state.home_page_index + 1) % state.home_total_pages;
      UiInvalidation::request_full();
    }`;
  }
  if (action.type === 'PREV_PAGE') {
    return `[&state]() {
      state.home_page_index = (state.home_page_index - 1 + state.home_total_pages) % state.home_total_pages;
      UiInvalidation::request_full();
    }`;
  }
  return '';
}

function generateLightWidget(c: LightStateComponent, stateVar: string,
    factory: WidgetFactory, indent: string, offX = 0, offY = 0): string {
  const x = c.position.x + offX;
  const y = c.position.y + offY;
  const w = c.size?.width ?? 200;
  const h = c.size?.height ?? 90;
  const label = c.label ?? 'Light';
  const onText = c.onText ?? 'ON';
  const offText = c.offText ?? 'OFF';
  const callback = emitTapAction(c.onTap);

  let out = '';
  out += `${indent}${factory('RectWidget', `UiRect{${x}, ${y}, ${w}, 20}, g_theme.info_bg`)};\n`;
  out += `${indent}{\n`;
  out += `${indent}  auto *lbl = ${factory('LabelWidget', `UiRect{${x}, ${y}, ${w}, 20}, "", g_theme.label`)};\n`;
  out += `${indent}  lbl->bind(state.${stateVar}.ptr(), "${onText}", "${offText}");\n`;
  out += `${indent}}\n`;
  if (callback) {
    out += `${indent}${factory('ButtonWidget', `UiRect{${x + 10}, ${y + 30}, ${w - 20}, ${h - 30}}, "${escapeCString(label)}", ${callback}, g_theme.primary`)};\n`;
  }
  return out;
}

function generateComponentSetup(c: Component, screenVar: string, indent: string): string {
  const factory: WidgetFactory = (typeName, args) =>
    `${screenVar}->emplace_widget<${typeName}>(${args})`;

  switch (c.type) {
    case 'text': {
      const tc = c;
      const text = tc.text ?? '';
      const fontSize = tc.fontSize ?? 'small';
      const fontMap: Record<string, string> = {
        small: 'g_theme.label',
        medium: 'g_theme.header',
        large: 'g_theme.header',
      };
      return `${indent}${factory('LabelWidget', `UiRect{${c.position.x}, ${c.position.y}, ${c.size?.width ?? 100}, ${c.size?.height ?? 40}}, "${escapeCString(text)}", ${fontMap[fontSize]}`)};\n`;
    }
    case 'button': {
      const label = c.label ?? '';
      const callback = emitTapAction(c.pressAction);
      return `${indent}${factory('ButtonWidget', `UiRect{${c.position.x}, ${c.position.y}, ${c.size?.width ?? 80}, ${c.size?.height ?? 36}}, "${escapeCString(label)}", ${callback || '[](){}'}, g_theme.primary`)};\n`;
    }
    case 'light_state': {
      const stateVar = stateVarFromEntity(c.stateBinding?.entityId ?? c.id);
      return generateLightWidget(c, stateVar, factory, indent);
    }
    case 'tab_container':
      return generateTabContainerWidget(c, screenVar, indent);
    default:
      return `${indent}// TODO: component type '${c.type}' (id: ${c.id})\n`;
  }
}

function generateTabContainerWidget(c: TabContainerComponent, screenVar: string, indent: string): string {
  const x = c.position.x;
  const y = c.position.y;
  const w = c.size?.width ?? 200;
  const h = c.size?.height ?? 200;
  const clip = c.clipContent ?? false;
  const varName = `tc_${c.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const bgVar = `${varName}_bg`;

  let out = '';
  out += `${indent}auto *${varName} = ${screenVar}->emplace_widget<TabContainerWidget>(UiRect{${x}, ${y}, ${w}, ${h}}, Color(0,0,0), g_theme.primary, ${clip});\n`;
  out += `${indent}const Color ${bgVar}(0, 0, 0);\n`;

  for (const tab of c.tabs) {
    out += `${indent}${varName}->add_tab("${escapeCString(tab.name)}");\n`;
  }

  if (c.defaultTabId) {
    const defaultIdx = c.tabs.findIndex(t => t.id === c.defaultTabId);
    if (defaultIdx >= 0) {
      out += `${indent}${varName}->set_default_tab(${defaultIdx});\n`;
    }
  }

  for (let i = 0; i < c.tabs.length; i++) {
    for (const child of c.tabs[i]!.components) {
      out += generateNestedComponent(child, varName, i, indent, x, y + TAB_BAR_HEIGHT, bgVar);
    }
  }

  return out;
}

function generateNestedComponent(c: Component, containerVar: string, tabIndex: number, indent: string,
    offsetX: number, offsetY: number, tabBgVar?: string): string {
  const x = c.position.x + offsetX;
  const y = c.position.y + offsetY;
  const w = c.size?.width ?? 60;
  const h = c.size?.height ?? 20;

  const factory: WidgetFactory = (typeName, args) =>
    `${containerVar}->emplace_child<${typeName}>(${tabIndex}, ${args})`;

  switch (c.type) {
    case 'text': {
      const text = c.text ?? '';
      const fontSize = c.fontSize ?? 'small';
      const fontMap: Record<string, string> = {
        small: 'g_theme.label',
        medium: 'g_theme.header',
        large: 'g_theme.header',
      };
      const wargs = `UiRect{${x}, ${y}, ${w}, ${h}}, "${escapeCString(text)}", ${fontMap[fontSize]}`;
      if (tabBgVar) {
        return `${indent}{\n${indent}  auto *l = ${factory('LabelWidget', wargs)};\n${indent}  l->set_bg_color(${tabBgVar});\n${indent}}\n`;
      }
      return `${indent}${factory('LabelWidget', wargs)};\n`;
    }
    case 'button': {
      const label = c.label ?? '';
      const callback = emitTapAction(c.pressAction);
      return `${indent}${factory('ButtonWidget', `UiRect{${x}, ${y}, ${w}, ${h}}, "${escapeCString(label)}", ${callback || '[](){}'}, g_theme.primary`)};\n`;
    }
    case 'light_state': {
      const stateVar = stateVarFromEntity(c.stateBinding?.entityId ?? c.id);
      return generateLightWidget(c, stateVar, factory, indent, offsetX, offsetY);
    }
    default:
      return `${indent}// TODO: nested ${c.type} (id: ${c.id}) in tab ${tabIndex}\n`;
  }
}

export function generateUIScreensHeader(project: Project): string {
  const screens = collectScreens(project);
  const screenIds = screens.map(s => s.cppName);
  const firstScreen = screens[0]?.cppName ?? 'Home';
  const lastScreen = screenIds.length > 0 ? screenIds[screenIds.length - 1] : 'Home';

  const screenCtor = `    // Pre-create all screen slots
    for (int i = 0; i <= static_cast<int>(UiScreenId::${lastScreen}); i++) {
      auto id = static_cast<UiScreenId>(i);
      auto screen = std::make_unique<GenericScreen>();
      screens_[id] = screen.get();
      owned_screens_.push_back(std::move(screen));
    }
    current_ = screens_.at(UiScreenId::${firstScreen});`

  let setupBody = '';
  for (const [index, page] of project.dashboardPages.entries()) {
    const cppName = dashboardScreenId(page.name, index);
    const screenVar = cppName.toLowerCase();
    if (page.components.length === 0) continue;
    setupBody += `  auto *${screenVar} = screens.get_screen(UiScreenId::${cppName});\n`;
    setupBody += `  // Page: ${page.name}\n`;
    for (const c of page.components) {
      setupBody += generateComponentSetup(c, screenVar, '  ');
      setupBody += '\n';
    }
    setupBody += '\n';
  }

  for (const view of project.detailViews) {
    const cppName = detailScreenId(view.id, view.title);
    const screenVar = cppName.toLowerCase();
    setupBody += `  auto *${screenVar} = screens.get_screen(UiScreenId::${cppName});\n`;
    setupBody += `  ${screenVar}->emplace_widget<DetailHeaderWidget>(g_theme.header.font, g_theme.label.font, "${escapeCString(view.title)}",\n`;
    setupBody += `      [&screens]() { screens.navigate_to(UiScreenId::Home); });\n`;
    if (view.components.length === 0) {
      setupBody += '\n';
      continue;
    }
    setupBody += `  // Detail: ${view.title}\n`;
    for (const c of view.components) {
      setupBody += generateComponentSetup(c, screenVar, '  ');
      setupBody += '\n';
    }
    setupBody += '\n';
  }

  if (!setupBody.trim()) {
    setupBody = `  (void)state;\n  (void)on_action;\n  // No components\n`;
  }

  return `#pragma once

#include "esphome.h"
#include "ui_state.h"
#include "ui_types.h"
#include "ui_widgets.h"
#include "ui_screen_base.h"
#include "ui_invalidation.h"
#include "ui_redraw.h"
#include "ui_scrollable_detail.h"
#include <memory>
#include <vector>
#include <map>

namespace esphome {
namespace font {
class Font;
}
}  // namespace esphome

class ScreenController {
 public:
  ScreenController() {
${screenCtor}
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

  bool handle_touch(const TouchEvent &event, uint32_t now, const UiState &state) {
    (void)state;
    if (current_id_ == UiScreenId::Home &&
        event.type == TouchType::Up &&
        abs(event.dx) > 60 && abs(event.dx) > abs(event.dy)) {
      UiState& s = const_cast<UiState&>(state);
      if (event.dx < 0) {
        s.home_page_index = (s.home_page_index + 1) % s.home_total_pages;
      } else {
        s.home_page_index = (s.home_page_index - 1 + s.home_total_pages) % s.home_total_pages;
      }
      UiInvalidation::request_full();
      return true;
    }

    return current_->handle_touch(event, now, state);
  }

  void draw(display::Display &it, const UiState &state) { current_->draw(it, state); }

  Screen* current() { return current_; }

 private:
  UiScreenId current_id_ = UiScreenId::${firstScreen};
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
  auto make_ha_callback = [on_action](const char* entity, const char* service) {
    return [on_action, entity, service]() {
      if (on_action) on_action(entity, service);
    };
  };

${setupBody}}
`;
}
