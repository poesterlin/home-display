import type { Project, Color, Theme } from "@esphome-designer/schema";

export function generateStateHeader(project: Project): string {
  const lines: string[] = [];
  const theme = project.theme!;

  lines.push(`#pragma once`);
  lines.push(`#include "esphome.h"`);
  lines.push(``);
  lines.push(`enum ViewMode { DASHBOARD, DETAIL };`);
  lines.push(``);
  lines.push(`enum ViewState {`);
  lines.push(`  VIEW_MAIN_DASHBOARD,`);
  for (const view of project.detailViews) {
    lines.push(`  VIEW_DETAIL_${view.id.toUpperCase().replace(/-/g, '_')},`);
  }
  lines.push(`};`);
  lines.push(``);
  lines.push(`struct DisplayState {`);
  lines.push(`  ViewMode viewMode = DASHBOARD;`);
  lines.push(`  ViewState currentView = VIEW_MAIN_DASHBOARD;`);
  lines.push(`  int mainPageIndex = 0;`);
  lines.push(`  int scrollY = 0;`);
  lines.push(`  int maxScrollY = 0;`);
  lines.push(``);
  
  // Entity bindings as state
  const entities = extractEntities(project);
  for (const entity of entities) {
    const id = entity.replace(/\./g, '_');
    lines.push(`  float ${id} = 0.0f;`);
    lines.push(`  std::string ${id}_text = "";`);
  }
  
  lines.push(`};`);
  lines.push(``);
  lines.push(`extern DisplayState gState;`);
  lines.push(``);
  
  // Theme colors
  lines.push(`namespace Theme {`);
  for (const [key, color] of Object.entries(theme.colors)) {
    lines.push(`  const Color ${key.toUpperCase()} = ${colorToCpp(color as Color)};`);
  }
  lines.push(`}`);

  return lines.join("\n");
}

function extractEntities(project: Project): Set<string> {
  const entities = new Set<string>();
  const allViews = [...project.dashboardPages, ...project.detailViews];
  for (const view of allViews) {
    for (const comp of view.components) {
      if ('valueBinding' in comp && comp.valueBinding) entities.add(comp.valueBinding.entityId);
      if ('textBinding' in comp && comp.textBinding) entities.add(comp.textBinding.entityId);
      if ('stateBinding' in comp && comp.stateBinding) entities.add(comp.stateBinding.entityId);
    }
  }
  return entities;
}

function colorToCpp(c: Color): string {
  return `Color(${c.r}, ${c.g}, ${c.b})`;
}
