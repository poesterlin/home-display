# Basic UI Architecture (Buttons Only)

This folder contains a minimal ESPHome UI prototype with a cleaner architecture.
It is configured for the Guition ESP32-S3-4848S040 hardware (`st7701s` + `gt911`) without LVGL.

- `TouchEvent` model
- `UiAction` dispatching
- `Screen` abstraction with a `ScreenController`
- lightweight button widgets
- fixed display refresh at the configured update interval

## Files

- `basic-buttons.yaml` - standalone config entry point
- `hardware.yaml` - local hardware/display + touch config (non-LVGL)
- `includes/ui_types.h` - event and action enums
- `includes/ui_state.h` - UI state
- `includes/ui_widgets.h` - button widget
- `includes/ui_screens.h` - screen classes
- `includes/ui_app.h` - dispatcher + app orchestration
- `includes/ui_touch.h` - touch-to-event conversion
- `includes/ui_renderer.h` - display render hook

## Run

From the `esphome` directory:

```bash
esphome run basic_ui_arch/basic-buttons.yaml
```

This is intentionally basic and only demonstrates navigation + button toggles.
