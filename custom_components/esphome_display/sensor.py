"""To-Do Bridge Sensor - Translates HA To-Do API to PSV format for ESP32 display."""

import logging
from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up To-Do bridge sensors from a config entry."""
    if DOMAIN not in hass.data:
        return

    entities = []
    # In config flow, devices are stored in entry.data["devices"]
    devices = entry.data.get("devices", {})

    for device_name, device_config in devices.items():
        todo_entities = _get_todo_entities(device_config)
        for i, todo_entity in enumerate(todo_entities):
            entities.append(_create_sensor(
                hass, device_name, todo_entity,
                is_multi=len(todo_entities) > 1,
                index=i,
            ))

    if entities:
        async_add_entities(entities)


async def async_setup_platform(
    hass: HomeAssistant,
    config: dict,
    async_add_entities: AddEntitiesCallback,
    discovery_info: dict = None,
) -> None:
    """Set up To-Do bridge sensors from YAML."""
    if DOMAIN not in hass.data:
        return

    entities = []
    for device_name, device_config in hass.data[DOMAIN].get("devices", {}).items():
        todo_entities = _get_todo_entities(device_config)
        for i, todo_entity in enumerate(todo_entities):
            entities.append(_create_sensor(
                hass, device_name, todo_entity,
                is_multi=len(todo_entities) > 1,
                index=i,
            ))

    if entities:
        async_add_entities(entities)


def _get_todo_entities(device_config: dict) -> list[str]:
    """Extract todo entities from device config with backward compat."""
    todo_list = list(device_config.get("todo_entities", []))
    single = device_config.get("todo_entity")
    if single and single not in todo_list:
        todo_list.append(single)
    return [e for e in todo_list if e]


def _create_sensor(
    hass: HomeAssistant,
    device_name: str,
    todo_entity: str,
    is_multi: bool = False,
    index: int = 0,
) -> "TodoBridgeSensor":
    """Create a TodoBridgeSensor with appropriate unique ID and name."""
    if is_multi:
        unique_id = f"esphome_display_todo_{device_name}_{index}"
        name = f"{device_name} To-Do Items ({index + 1})"
    else:
        unique_id = f"esphome_display_todo_{device_name}"
        name = f"{device_name} To-Do Items"
    return TodoBridgeSensor(hass, name, unique_id, todo_entity)


class TodoBridgeSensor(SensorEntity):
    """Sensor that bridges Home Assistant To-Do to ESPHome display."""

    def __init__(
        self,
        hass: HomeAssistant,
        name: str,
        unique_id: str,
        todo_entity_id: str,
    ):
        """Initialize the sensor."""
        self.hass = hass
        self._device_name = name
        self._todo_entity_id = todo_entity_id

        # Entity metadata
        self._attr_name = name
        self._attr_unique_id = unique_id
        self._attr_icon = "mdi:clipboard-list"

        # State
        self._items_formatted = ""
        self._count = 0
        self._last_update = None

    async def async_added_to_hass(self) -> None:
        """Set up listeners when added to Home Assistant."""
        self.async_on_remove(
            async_track_state_change_event(
                self.hass,
                [self._todo_entity_id],
                self._on_todo_changed,
            )
        )
        await self._update_items()

    @callback
    async def _on_todo_changed(self, event) -> None:
        """Handle to-do entity state change event."""
        await self._update_items()

    async def _update_items(self) -> None:
        """Fetch to-do items from service and format as PSV."""
        try:
            response = await self.hass.services.async_call(
                "todo",
                "get_items",
                {
                    "status": ["needs_action"],
                },
                target={"entity_id": self._todo_entity_id},
                blocking=True,
                return_response=True,
            )

            items = response.get(self._todo_entity_id, {}).get("items", [])
            self._count = len(items)

            lines = []
            for item in items:
                summary = item.get("summary", "Unknown").replace("|", "-")
                due = item.get("due", "")

                status = "ok"
                if due:
                    try:
                        due_date = datetime.fromisoformat(due)
                        today = datetime.now().replace(
                            hour=0, minute=0, second=0, microsecond=0
                        )
                        if (
                            due_date.replace(hour=0, minute=0, second=0, microsecond=0)
                            < today
                        ):
                            status = "overdue"
                        due_display = due
                    except (ValueError, TypeError):
                        due_display = due
                else:
                    due_display = "no-date"

                lines.append(f"{summary}|{due_display}|{status}")

            self._items_formatted = "\n".join(lines)
            self._last_update = datetime.now()
            self.async_write_ha_state()

        except Exception as err:
            _LOGGER.error(
                f"Error fetching to-do items from {self._todo_entity_id}: {err}"
            )
            self._items_formatted = ""
            self._count = 0
            self.async_write_ha_state()

    @property
    def state(self) -> str | None:
        """Return the state (number of pending items)."""
        return str(self._count) if self._count is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return sensor attributes."""
        return {
            "all_items": self._items_formatted,
            "count": self._count,
            "entity_id": self._todo_entity_id,
            "last_update": self._last_update.isoformat() if self._last_update else None,
        }
