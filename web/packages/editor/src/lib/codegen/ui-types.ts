import type { Project } from "@esphome-designer/schema";
import { toCppIdentifier } from "./utils";

export function generateUITypesHeader(project: Project): string {
  const screenIds: string[] = [];

  for (const page of project.dashboardPages) {
    const id = toCppIdentifier(page.name);
    if (id && !screenIds.includes(id)) {
      screenIds.push(id);
    }
  }

  for (const view of project.detailViews) {
    const id = 'Detail' + toCppIdentifier(view.title);
    if (id && !screenIds.includes(id)) {
      screenIds.push(id);
    }
  }

  if (screenIds.length === 0) {
    screenIds.push('Home');
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
