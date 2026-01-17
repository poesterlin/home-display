import type { Project, Component, ButtonComponent } from "@esphome-designer/schema";

export function generateTouchHandler(project: Project): string {
  const lines: string[] = [];

  lines.push(`#pragma once`);
  lines.push(`#include "esphome.h"`);
  lines.push(`#include "state_manager.h"`);
  lines.push(``);
  lines.push(`class TouchHandler {`);
  lines.push(` public:`);
  lines.push(`  static void handleTouch(float x, float y, bool touched) {`);
  lines.push(`    static bool was_touched = false;`);
  lines.push(`    static float start_x = 0;`);
  lines.push(`    static float start_y = 0;`);
  lines.push(``);
  lines.push(`    if (touched && !was_touched) {`);
  lines.push(`      start_x = x;`);
  lines.push(`      start_y = y;`);
  lines.push(`    } else if (!touched && was_touched) {`);
  lines.push(`      float dx = x - start_x;`);
  lines.push(`      float dy = y - start_y;`);
  lines.push(``);
  lines.push(`      if (gState.viewMode == DASHBOARD) {`);
  lines.push(`        if (dx > 30) prevPage();`);
  lines.push(`        else if (dx < -30) nextPage();`);
  lines.push(`        else if (abs(dx) < 10 && abs(dy) < 10) handleTap(start_x, start_y);`);
  lines.push(`      } else {`);
  lines.push(`        if (abs(dx) < 20 && abs(dy) < 20) handleTap(start_x, start_y);`);
  lines.push(`      }`);
  lines.push(`    } else if (touched && was_touched && gState.viewMode == DETAIL) {`);
  lines.push(`      float dy = y - start_y;`);
  lines.push(`      gState.scrollY += dy;`);
  lines.push(`      start_y = y;`);
  lines.push(`      if (gState.scrollY > 0) gState.scrollY = 0;`);
  lines.push(`      if (gState.scrollY < -gState.maxScrollY) gState.scrollY = -gState.maxScrollY;`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    was_touched = touched;`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(` private:`);
  lines.push(`  static void handleTap(float x, float y) {`);
  lines.push(`    if (gState.viewMode == DASHBOARD) {`);
  lines.push(`      switch (gState.mainPageIndex) {`);
  
  project.dashboardPages.forEach((page, index) => {
    lines.push(`        case ${index}:`);
    page.components.filter(c => c.onTap).forEach(comp => {
      lines.push(`          if (x >= ${comp.position.x} && x <= ${comp.position.x + comp.size.width} && y >= ${comp.position.y} && y <= ${comp.position.y + comp.size.height}) {`);
      lines.push(`            ${generateActionCode(comp.onTap)}`);
      lines.push(`            return;`);
      lines.push(`          }`);
    });
    lines.push(`          break;`);
  });
  
  lines.push(`      }`);
  lines.push(`    } else {`);
  lines.push(`      // Detail view hit-test`);
  lines.push(`      float ty = y - gState.scrollY;`);
  lines.push(`      switch (gState.currentView) {`);
  
  project.detailViews.forEach(view => {
    const enumName = `VIEW_DETAIL_${view.id.toUpperCase().replace(/-/g, '_')}`;
    lines.push(`        case ${enumName}:`);
    view.components.filter(c => c.onTap).forEach(comp => {
      lines.push(`          if (x >= ${comp.position.x} && x <= ${comp.position.x + comp.size.width} && ty >= ${comp.position.y} && ty <= ${comp.position.y + comp.size.height}) {`);
      lines.push(`            ${generateActionCode(comp.onTap)}`);
      lines.push(`            return;`);
      lines.push(`          }`);
    });
    lines.push(`          break;`);
  });
  
  lines.push(`      }`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`};`);

  return lines.join("\n");
}

function generateActionCode(onTap: any): string {
  if (onTap.type === 'OPEN_DETAIL') {
    const enumName = `VIEW_DETAIL_${onTap.targetId.toUpperCase().replace(/-/g, '_')}`;
    return `openView(${enumName});`;
  }
  if (onTap.type === 'NEXT_PAGE') return `nextPage();`;
  if (onTap.type === 'PREV_PAGE') return `prevPage();`;
  if (onTap.type === 'GO_BACK') return `goBack();`;
  return `// Unknown action`;
}
