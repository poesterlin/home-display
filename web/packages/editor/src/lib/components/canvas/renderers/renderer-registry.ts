const rendererMap = new Map<string, any>();

export function registerRenderer(type: string, component: any): void {
  rendererMap.set(type, component);
}

export function getRenderer(type: string): any {
  return rendererMap.get(type);
}
