# ESPHome Display - Metadata Export API

This document describes the API used to export Home Assistant environment data for use in the ESPHome Display Web Editor. This "Offline Mode" ensures user privacy by removing the need for the editor to have direct access to the user's Home Assistant instance.

## Overview

Instead of real-time requests, the integration generates a **Metadata Bundle**. The user downloads this bundle from Home Assistant and uploads it to the Web Editor to enable autocomplete, icons, and service validation.

## Endpoint: Export Metadata

### GET `/api/esphome_display/export`

Generates a complete snapshot of entities and services.

**Response Body:**
```json
{
  "version": "1.0.0",
  "generated_at": "2026-01-18T19:00:00Z",
  "entities": [
    {
      "entity_id": "sensor.living_room_temp",
      "domain": "sensor",
      "name": "Living Room Temp",
      "device_class": "temperature",
      "unit": "°C",
      "attributes": ["battery_level", "offset"]
    }
  ],
  "services": {
    "light": {
      "turn_on": {
        "name": "Turn on",
        "description": "Turn on a light",
        "fields": {
          "brightness": {
            "name": "Brightness",
            "selector": { "number": { "min": 0, "max": 255 } }
          }
        }
      }
    }
  },
  "devices": [
    {
      "name": "kitchen_display",
      "friendly_name": "Kitchen Display"
    }
  ]
}
```

---

## Implementation Logic (Python/Integration Side)

To make this efficient, the integration should compile the following data points into the JSON response:

1.  **Entity Registry**: Map through `hass.states.all()` to extract IDs and attributes.
2.  **Service Registry**: Map through `hass.services.async_services()` to extract schemas.
3.  **Area/Device Mapping**: (Optional) Include area names so the editor can group entities.

### Recommended Privacy Filtering
To keep the export file "safe" for users to handle, the integration should:
*   **Strip States**: Do not export actual state values (e.g., don't include that the light is currently "on"). Only export the *capability* (domain/attributes).
*   **Strip Sensitive Attributes**: Remove attributes like `latitude`, `longitude`, or `access_token`.

---

## Editor Workflow

### 1. Import Flow
1.  User opens the Web Editor.
2.  User clicks **"Sync with Home Assistant"**.
3.  Editor provides a link to the user's local HA instance: `http://homeassistant.local:8123/api/esphome_display/export`.
4.  User saves the JSON file and uploads it to the Editor.

### 2. Editor Consumption
The Editor stores this JSON in a local variable (or user profile). 

*   **Autocomplete**: When the user types `{{ `, the editor searches the `entities` array in the JSON.
*   **Service Builder**: When the user adds a button action, the editor populates the dropdowns using the `services` object from the JSON.
*   **Validation**: If a user types `light.turn_on` but passes a string to a `brightness` field, the editor flags it as an error based on the `selector` type in the metadata.

---

## Benefits of this Update

*   **Zero Credential Sharing**: The Web Editor never sees the user's Long-Lived Access Token.
*   **No CORS Issues**: Since the user is downloading a file via their browser and uploading it, there are no cross-origin security blocks.
*   **Persistence**: The user can continue designing their display while offline (e.g., on a plane) as long as they have their metadata file.
*   **Speed**: Autocomplete is instantaneous because the data is local to the browser.
