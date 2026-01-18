# ESPHome Display - Editor API

This document describes the HTTP API endpoints exposed by the ESPHome Display integration for use by the web editor.

## Overview

The API allows the ESPHome Designer web editor to fetch entity and service information from Home Assistant, enabling autocomplete and validation features without requiring direct WebSocket access.

## Base URL

```
http://<home-assistant-url>/api/esphome_display
```

## Authentication

All endpoints require a valid Home Assistant authentication. The editor should include either:

1. **Long-Lived Access Token** (recommended for editor):
   ```
   Authorization: Bearer <token>
   ```

2. **Session Cookie** (if editor is served from HA):
   ```
   Cookie: <ha_session_cookie>
   ```

## Endpoints

### GET /api/esphome_display/entities

Returns all entities suitable for display bindings, filtered and formatted for the editor.

**Response:**
```json
{
  "entities": [
    {
      "entity_id": "sensor.living_room_temperature",
      "domain": "sensor",
      "name": "Living Room Temperature",
      "state": "21.5",
      "unit": "°C",
      "device_class": "temperature",
      "attributes": ["temperature", "humidity", "battery"]
    },
    {
      "entity_id": "light.kitchen",
      "domain": "light",
      "name": "Kitchen Light",
      "state": "on",
      "attributes": ["brightness", "color_temp", "rgb_color"]
    }
  ],
  "domains": [
    { "domain": "sensor", "count": 45 },
    { "domain": "light", "count": 12 },
    { "domain": "switch", "count": 8 }
  ]
}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | string | Filter by domain (e.g., `sensor`, `light`) |
| `device_class` | string | Filter by device class (e.g., `temperature`, `motion`) |
| `include_internal` | boolean | Include internal/hidden entities (default: false) |

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://homeassistant.local:8123/api/esphome_display/entities?domain=light"
```

---

### GET /api/esphome_display/services

Returns all available services with their schemas, formatted for the editor's service call builder.

**Response:**
```json
{
  "services": {
    "light": {
      "turn_on": {
        "name": "Turn on",
        "description": "Turn on a light",
        "target": {
          "entity": { "domain": ["light"] }
        },
        "fields": {
          "brightness": {
            "name": "Brightness",
            "description": "Brightness level (0-255)",
            "selector": { "number": { "min": 0, "max": 255 } }
          },
          "color_temp": {
            "name": "Color Temperature",
            "selector": { "number": { "min": 153, "max": 500 } }
          },
          "transition": {
            "name": "Transition",
            "description": "Transition duration in seconds",
            "selector": { "number": { "min": 0, "max": 300, "unit_of_measurement": "seconds" } }
          }
        }
      },
      "turn_off": {
        "name": "Turn off",
        "description": "Turn off a light",
        "target": {
          "entity": { "domain": ["light"] }
        },
        "fields": {}
      },
      "toggle": {
        "name": "Toggle",
        "description": "Toggle a light",
        "target": {
          "entity": { "domain": ["light"] }
        },
        "fields": {}
      }
    },
    "switch": {
      "turn_on": { "..." : "..." },
      "turn_off": { "..." : "..." }
    }
  },
  "domains": ["light", "switch", "climate", "cover", "media_player", "script", "automation", "scene"]
}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | string | Filter by domain (e.g., `light`, `climate`) |

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://homeassistant.local:8123/api/esphome_display/services?domain=light"
```

---

### GET /api/esphome_display/states

Returns current states for specific entities. Useful for live preview in the editor.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `entity_id` | string | Comma-separated list of entity IDs |

**Response:**
```json
{
  "states": {
    "sensor.temperature": {
      "state": "21.5",
      "attributes": {
        "unit_of_measurement": "°C",
        "friendly_name": "Temperature"
      },
      "last_changed": "2024-01-15T10:30:00Z"
    },
    "light.living_room": {
      "state": "on",
      "attributes": {
        "brightness": 255,
        "friendly_name": "Living Room"
      },
      "last_changed": "2024-01-15T09:00:00Z"
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://homeassistant.local:8123/api/esphome_display/states?entity_id=sensor.temperature,light.living_room"
```

---

### GET /api/esphome_display/devices

Returns ESPHome devices configured in the integration, for targeting service calls.

**Response:**
```json
{
  "devices": [
    {
      "name": "kitchen_display",
      "esphome_device": "abcd1234",
      "friendly_name": "Kitchen Display",
      "todo_entity": "todo.shopping_list"
    },
    {
      "name": "hallway_panel",
      "esphome_device": "efgh5678",
      "friendly_name": "Hallway Panel",
      "todo_entity": null
    }
  ]
}
```

---

### POST /api/esphome_display/validate_service

Validates a service call configuration without executing it.

**Request:**
```json
{
  "service": "light.turn_on",
  "target": {
    "entity_id": "light.living_room"
  },
  "data": {
    "brightness": 255,
    "transition": 2
  }
}
```

**Response (valid):**
```json
{
  "valid": true,
  "warnings": []
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "data.brightness",
      "message": "Value must be between 0 and 255"
    }
  ],
  "warnings": [
    {
      "field": "target.entity_id",
      "message": "Entity 'light.living_room' is currently unavailable"
    }
  ]
}
```

---

## WebSocket Events (Optional)

For real-time updates, the integration can expose a WebSocket subscription:

### Subscribe to State Changes

```json
{
  "type": "esphome_display/subscribe_states",
  "entity_ids": ["sensor.temperature", "light.living_room"]
}
```

**Event:**
```json
{
  "type": "event",
  "event": {
    "event_type": "esphome_display_state_changed",
    "data": {
      "entity_id": "sensor.temperature",
      "new_state": "22.0",
      "old_state": "21.5"
    }
  }
}
```

---

## Error Responses

All endpoints return standard HTTP error codes:

| Code | Description |
|------|-------------|
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - User lacks permission |
| 404 | Not found - Endpoint or entity doesn't exist |
| 500 | Internal error - Check HA logs |

**Error Response Format:**
```json
{
  "error": "unauthorized",
  "message": "Invalid access token"
}
```

---

## Editor Integration

### Connection Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Web Editor     │────>│  HA HTTP API    │────>│  Integration    │
│                 │     │  /api/esphome_  │     │  (Python)       │
│  Settings:      │     │  display/*      │     │                 │
│  - HA URL       │     └─────────────────┘     └────────┬────────┘
│  - Access Token │                                      │
└─────────────────┘                                      ▼
                                                ┌─────────────────┐
                                                │  HA Core        │
                                                │  - States       │
                                                │  - Services     │
                                                │  - Registry     │
                                                └─────────────────┘
```

### Recommended Editor Settings

Store in browser localStorage (encrypted/hashed if possible):

```typescript
interface HAConnection {
  url: string;        // "http://homeassistant.local:8123"
  token: string;      // Long-lived access token
  deviceId?: string;  // Default target device
}
```

### Caching Strategy

- **Entities**: Cache for 5 minutes, refresh on editor focus
- **Services**: Cache for 1 hour (rarely changes)
- **States**: Don't cache, fetch on demand for preview

---

## Security Considerations

1. **Token Scope**: Editor only needs read access to states and services. Consider creating a dedicated user with limited permissions.

2. **CORS**: If editor is hosted externally, HA needs CORS configuration:
   ```yaml
   # configuration.yaml
   http:
     cors_allowed_origins:
       - "https://your-editor-domain.com"
   ```

3. **Local Network**: For security, consider only allowing API access from local network.

4. **Token Storage**: Editor should warn users about token storage in browser. Consider using session-only storage option.
