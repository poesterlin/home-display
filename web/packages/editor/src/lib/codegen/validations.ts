import type {
  Project,
  Component,
  ButtonComponent,
  OnTapAction,
  ActionBinding,
  TabContainerComponent,
  ConditionalAreaComponent,
  ContainerComponent,
} from "@esphome-designer/schema";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  componentId?: string;
  field?: string;
}

export type ValidationRule = (project: Project) => ValidationError[];

const RULES: ValidationRule[] = [
  validateActionTargets,
];

export function validateProject(project: Project): ValidationError[] {
  return RULES.flatMap((rule) => rule(project));
}

function collectAllComponents(project: Project): Component[] {
  const result: Component[] = [];

  const walk = (components: Component[]) => {
    for (const c of components) {
      result.push(c);
      if (c.type === "container") {
        const container = c as ContainerComponent;
        if (container.children) walk(container.children);
      } else if (c.type === "tab_container") {
        const tc = c as TabContainerComponent;
        for (const tab of tc.tabs) {
          walk(tab.components);
        }
      } else if (c.type === "conditional_area") {
        const ca = c as ConditionalAreaComponent;
        for (const variant of ca.variants) {
          walk(variant.components);
        }
      }
    }
  };

  for (const page of project.dashboardPages ?? []) {
    walk(page.components ?? []);
  }
  for (const view of project.detailViews ?? []) {
    walk(view.components ?? []);
  }
  if (project.pageHeader?.components) {
    walk(project.pageHeader.components);
  }

  return result;
}

function validateAction(action: OnTapAction | ActionBinding | undefined, fieldName: string, componentId: string): ValidationError[] {
  if (!action) return [];

  if (action.type === "SERVICE_CALL") {
    const hasTarget = !!(action.target?.entityId || action.target?.deviceId);
    if (!hasTarget) {
      return [
        {
          type: "error" as const,
          message: `Button "${componentId}" has a "${fieldName}" SERVICE_CALL without a target entity or device`,
          componentId,
          field: fieldName,
        },
      ];
    }
  }

  if (action.type === "OPEN_DETAIL") {
    if (!action.targetId) {
      return [
        {
          type: "error" as const,
          message: `Button "${componentId}" has a "${fieldName}" OPEN_DETAIL without a target detail view`,
          componentId,
          field: fieldName,
        },
      ];
    }
  }

  return [];
}

function validateActionTargets(project: Project): ValidationError[] {
  const errors: ValidationError[] = [];
  const components = collectAllComponents(project);

  for (const c of components) {
    const baseActions: { action: OnTapAction | undefined; field: string }[] = [
      { action: c.onTap, field: "onTap" },
      { action: c.onHold, field: "onHold" },
      { action: c.onDragStart, field: "onDragStart" },
      { action: c.onDragEnd, field: "onDragEnd" },
    ];

    for (const { action, field } of baseActions) {
      errors.push(...validateAction(action, field, c.id));
    }

    if (c.type === "button") {
      const btn = c as ButtonComponent;
      errors.push(...validateAction(btn.pressAction, "pressAction", c.id));
      errors.push(...validateAction(btn.holdAction, "holdAction", c.id));
    }
  }

  return errors;
}
