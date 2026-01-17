/**
 * AUTO-GENERATED - DO NOT EDIT
 *
 * Generated from components.json schema
 * Run: bun run generate:types
 */

export type Component = TextComponent | ButtonComponent | SliderComponent | GaugeComponent | IconComponent;
export type TextComponent = BaseComponent & {
  type: "text";
  text?: string;
  textBinding?: EntityBinding;
  fontSize?: "small" | "medium" | "large";
  color?: Color;
  align?: "left" | "center" | "right";
};
export type ButtonComponent = BaseComponent & {
  type: "button";
  label?: string;
  icon?: string;
  backgroundColor?: Color;
  pressAction?: ActionBinding;
  holdAction?: ActionBinding;
};
export type SliderComponent = BaseComponent & {
  type: "slider";
  min?: number;
  max?: number;
  step?: number;
  valueBinding?: EntityBinding;
  onChange?: ActionBinding;
  orientation?: "horizontal" | "vertical";
};
export type GaugeComponent = BaseComponent & {
  type: "gauge";
  min: number;
  max: number;
  valueBinding?: EntityBinding;
  unit?: string;
  segments?: {
    from: number;
    to: number;
    color: Color;
  }[];
};
export type IconComponent = BaseComponent & {
  type: "icon";
  icon: string;
  color?: Color;
  scale?: number;
};

export interface Project {
  name: string;
  display: DisplayConfig;
  pages: Page[];
  fonts?: FontDefinition[];
}
export interface DisplayConfig {
  width: number;
  height: number;
  platform: "ili9xxx" | "st7789" | "ssd1306" | "waveshare_epaper";
}
export interface Page {
  id: string;
  name: string;
  backgroundColor?: Color;
  components: Component[];
}
export interface Color {
  r: number;
  g: number;
  b: number;
}
export interface BaseComponent {
  id: string;
  type: string;
  position: Position;
  size?: Size;
  visible?: boolean;
  visibleWhen?: EntityBinding;
}
export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface EntityBinding {
  entityId: string;
  attribute?: string | null;
}
export interface ActionBinding {
  service: string;
  target?: EntityBinding;
  data?: {};
}
export interface FontDefinition {
  id: string;
  file: string;
  size: number;
}
