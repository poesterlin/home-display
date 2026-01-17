/**
 * AUTO-GENERATED - DO NOT EDIT
 *
 * Generated from components.json schema
 * Run: bun run generate:types
 */

export type Component =
  | TextComponent
  | ButtonComponent
  | SliderComponent
  | GaugeComponent
  | IconComponent
  | ProceduralIconComponent
  | ContainerComponent;
export type TextComponent = BaseComponent & {
  type: "text";
  text?: string;
  textBinding?: EntityBinding;
  fontSize?: "small" | "medium" | "large";
  color?: Color;
  align?: "left" | "center" | "right";
};
export type OnTapAction = ActionBinding | NavigationAction;
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
export type ProceduralIconComponent = BaseComponent & {
  type: "procedural_icon";
  iconType: "bulb" | "window" | "vacuum" | "climate";
  stateBinding?: EntityBinding;
  color?: Color;
};
export type ContainerComponent = BaseComponent & {
  type: "container";
  label?: string;
  backgroundColor?: Color;
};

export interface Project {
  /**
   * Schema version. ALWAYS increment this if there are breaking changes to the JSON structure.
   */
  version?: string;
  name: string;
  theme?: Theme;
  display: DisplayConfig;
  dashboardPages: Page[];
  detailViews: DetailView[];
  fonts?: FontDefinition[];
}
export interface Theme {
  id: string;
  name: string;
  colors: {
    background: Color;
    backgroundSecondary?: Color;
    foreground: Color;
    foregroundMuted?: Color;
    accent: Color;
    accentSecondary?: Color;
    success?: Color;
    warning?: Color;
    error?: Color;
  };
  style?: {
    buttonShadow?: boolean;
    buttonCornerAccents?: boolean;
    containerCorners?: boolean;
    headerBorders?: boolean;
  };
  values?: {
    shadowOffset?: number;
    cornerSize?: number;
    borderRadius?: number;
  };
}
export interface Color {
  r: number;
  g: number;
  b: number;
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
export interface BaseComponent {
  id: string;
  type: string;
  position: Position;
  size?: Size;
  visible?: boolean;
  visibleWhen?: EntityBinding;
  loadingBinding?: EntityBinding;
  onTap?: OnTapAction;
  variant?: "default" | "retro" | "minimal";
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
export interface NavigationAction {
  type: "OPEN_DETAIL" | "GO_BACK" | "NEXT_PAGE" | "PREV_PAGE";
  targetId?: string;
}
export interface DetailView {
  id: string;
  title: string;
  height?: number;
  components: Component[];
  maxScrollY?: number;
}
export interface FontDefinition {
  id: string;
  file: string;
  size: number;
}
