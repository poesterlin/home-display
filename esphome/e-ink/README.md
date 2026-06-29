# E-Ink Dashboard (minimal)

Minimal working ESPHome firmware for a Waveshare 7.3" 7-color e-paper
panel driven by a XIAO ESP32-S3. Pulls a small set of values from Home
Assistant and renders them on a single screen. No touch, no
navigation — just a dashboard.

## Hardware

- XIAO ESP32-S3
- Waveshare 7.3" 7-color e-paper, 800×480, 4-line SPI

See `../e-ink/README.md` for full hardware notes, pin map, color
palette, BUSY behaviour, and the bundled-component caveat (the bundled
`Waveshare EPaper 7.3in (S) 800x480` uses a different opcode set than
the original ESP-IDF firmware — color enum matches, but the per-frame
protocol may need a custom display platform later). This minimal
version starts with the bundled component to get something on the
panel quickly; swap to a custom platform once the wiring is verified.

## Files

- `dashboard.yaml` - entry point, single screen, HA bindings
- `base.yaml` - esp32s3, wifi, api, ota, logger
- `hardware.yaml` - spi bus + waveshare 7-color display
- `fonts.yaml` - shared font definitions
- `includes/dashboard.h` - single-screen renderer

## Run

From the `esphome` directory:

```bash
esphome run e-ink/dashboard.yaml
```

## What it shows

A single screen, no interaction. Renders whatever values are bound in
`dashboard.yaml` (time, two HA sensors, one HA binary sensor). Update
the bindings to match whatever entities you want on the dashboard.

A partial refresh runs every 60 s to pull new values. A full refresh
runs every 5 minutes to clear ghosting. Tweak the intervals in
`dashboard.yaml`.
