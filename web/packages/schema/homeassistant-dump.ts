/**
 * CORE TYPES
 */
export interface HomeAssistantDump {
  version: string;
  generated_at: Date | string;
  entities: Entity[];
  devices: Device[];
  services: Services;
}

export interface Device {
  name: string;
  friendly_name: string;
  area_id?: string;
}

export interface Entity {
  entity_id: string;
  domain: string;
  name: string;
  state: string;
  attributes: string[];
  last_changed: Date | string;
  last_updated: Date | string;
  device_class?: string;
  area?: string;
  unit?: string;
  numeric_state?: number;
  state_class?: "measurement" | "total_increasing";
  suggested_display?: "gauge" | "graph" | "value";
  suggested_actions?: string[];
  state_options?: string[];
  icon?: `mdi:${string}`;
}

/**
 * SERVICE INFRASTRUCTURE
 * Replaces ~500 lines of specific "Field" and "Action" interfaces
 */

// Basic field definition (for selectors, requirements, etc.)
export interface ServiceField {
  name: string;
  required?: boolean;
  selector?: Record<string, any>;
}

// A generic Action (Replaces Announce, Press, StopClass, etc.)
export interface ServiceAction {
  name: string;
  friendly_name: string;
  icon?: string;
  common_targets?: string[];
  fields?: Record<string, ServiceField>;
}

/**
 * MAPPED SERVICES
 * This single Record type handles all domains (light, climate, vacuum, etc.)
 */
export type ServiceDomain = Record<string, ServiceAction>;

export interface Services {
  // Common Home Assistant Domains
  homeassistant: ServiceDomain;
  light: ServiceDomain;
  switch: ServiceDomain;
  climate: ServiceDomain;
  vacuum: ServiceDomain;
  cover: ServiceDomain;
  camera: ServiceDomain;
  media_player?: ServiceDomain;
  
  // Notification Services
  notify: Record<string, ServiceAction>;
  telegram_bot: ServiceDomain;
  
  // Logic & System
  automation?: ServiceDomain;
  script?: ServiceDomain;
  scene: ServiceDomain;
  input_boolean: ServiceDomain;
  input_select: ServiceDomain;
  
  // Custom/Integration Specific
  [domain: string]: ServiceDomain | undefined;
}

/**
 * UTILITY TYPE 
 * Example of how to strictly type a specific known action if needed
 */
export type ClimateActions = "set_temperature" | "set_hvac_mode" | "turn_on" | "turn_off";