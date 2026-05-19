import type { Component, TabContainerComponent } from "@esphome-designer/schema";

export function toCppIdentifier(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function firstScreenId(_project: { dashboardPages: { name: string }[] }): string {
  return 'Home';
}

export function cppDefaultValue(cppType: string): string {
  switch (cppType) {
    case 'bool': return 'false';
    case 'int': return '0';
    case 'float': return '0.0f';
    case 'std::string': return '""';
    default: return '{}';
  }
}

export function cppTypeFor(cppType: string): string {
  switch (cppType) {
    case 'std::string': return 'std::string';
    default: return cppType;
  }
}

export function sanitizeDeviceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stateVarFromEntity(entityId: string): string {
  return entityId.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

export function escapeCString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function collectAllComponents(components: Component[]): Component[] {
  const result: Component[] = [];
  for (const c of components) {
    result.push(c);
    if (c.type === 'tab_container') {
      const tc = c as TabContainerComponent;
      for (const tab of tc.tabs) {
        result.push(...collectAllComponents(tab.components));
      }
    }
  }
  return result;
}

export interface ScreenDescriptor {
  cppName: string;
  name: string;
}

export type WidgetFactory = (typeName: string, args: string) => string;
