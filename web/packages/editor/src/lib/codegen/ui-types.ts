import type { Project } from "@esphome-designer/schema";
import { toCppIdentifier } from "./utils";

function detailScreenId(id: string, title: string): string {
  return 'Detail' + (toCppIdentifier(id) || toCppIdentifier(title) || 'View');
}

export function generateUITypesHeader(project: Project): string {
  const screenIds: string[] = ['Home'];

  for (const [index, page] of project.dashboardPages.entries()) {
    if (index === 0) continue;
    const id = toCppIdentifier(page.name);
    if (id && !screenIds.includes(id)) {
      screenIds.push(id);
    }
  }

  for (const view of project.detailViews) {
    const id = detailScreenId(view.id, view.title);
    if (id && !screenIds.includes(id)) {
      screenIds.push(id);
    }
  }

  const screenEnum = screenIds.map(id => `  ${id}`).join(',\n');

  return `#pragma once

enum class TouchType {
  Down,
  Move,
  Up,
  Tap
};

struct TouchEvent {
  TouchType type;
  int x;
  int y;
  int start_x;
  int start_y;
  int dx;
  int dy;
};

enum class UiScreenId {
${screenEnum}
};
`;
}
