# E-Ink Dashboard — Setup Notes

## Paths

```bash
YAML=esphome/e-ink/dashboard.yaml
BUILD=/home/philip/git/home-display/esphome/e-ink/.esphome/build/eink-dashboard/.pioenvs/eink-dashboard
ESPHOME=/tmp/opencode/esphome-venv/bin/esphome
ESPTOOL=/tmp/opencode/esphome-venv/bin/esptool.py
```

ESPHome version: 2026.6.0 (installed in `/tmp/opencode/esphome-venv/`).

## Compile

```bash
$ESPHOME compile $YAML
```

## Flash (factory image, no-stub to avoid USB disconnects)

```bash
$ESPTOOL --before default-reset --after hard-reset --no-stub --baud 115200 \
    --port /dev/ttyACM0 --chip esp32s3 write-flash 0x0 $BUILD/firmware.factory.bin
```

Use `--no-stub` — the stub flasher causes USB disconnects on ESP32-S3 when
the display is attached.

## Logs

```bash
# Serial (USB)
$ESPHOME logs $YAML --device /dev/ttyACM0

# OTA (WiFi)
$ESPHOME logs $YAML --device eink-dashboard.local
```

## OTA upload

```bash
$ESPHOME upload $YAML --device eink-dashboard.local
```

OTA uploads of the full firmware (~934 KB) frequently time out or get
connection-reset. Serial flash with `--no-stub` is more reliable.

## Hardware

| Component | Details |
|-----------|---------|
| MCU | Seeed XIAO ESP32-S3 |
| e-Paper driver | Seeed ePaper Breakout Board for XIAO |
| Display | Waveshare 4.2" B/W V1 (model `4.20in`) |

### XIAO ESP32-S3 Pin Mapping

From the Arduino variant (`pins_arduino.h`, authoritative):

| Silkscreen | GPIO | e-Paper function |
|------------|------|------------------|
| D0         | 1    | RST              |
| D1         | 2    | CS               |
| D3         | 4    | DC               |
| D5         | 6    | BUSY (input, pullup) |
| D8         | 7    | SCK (SPI clock)  |
| D10        | 9    | MOSI (SPI data)  |

The default hardware SPI pins on XIAO ESP32-S3:
- **SCK** = GPIO7 (D8)
- **MOSI** = GPIO9 (D10)
- **MISO** = GPIO8 (D9)
- **SS**   = GPIO44 (D7)

### ESP32-S3 strapping pins (avoid for I/O)

GPIO0, GPIO3, GPIO45, GPIO46. We do not use any of these.

## Firmware Config

### base.yaml — core platform

```yaml
esphome:
  name: ${device_name}

esp32:
  variant: esp32s3
  framework:
    type: arduino
    sdkconfig_options:
      CONFIG_ESP_BROWNOUT_DET: "n"   # disable brownout reset

logger:
  hardware_uart: USB_SERIAL_JTAG      # use USB, not physical UART
  baud_rate: 115200

wifi:
  output_power: 8.5dB                 # reduce current draw
  ap:
    ssid: "${device_name} Fallback"
    password: "password"

captive_portal:

api:
  reboot_timeout: 15min

ota:
  - platform: esphome

time:
  - platform: sntp
    id: sntp_time
```

### hardware.yaml — display pin config

```yaml
spi:
  id: epd_spi
  clk_pin: GPIO7
  mosi_pin: GPIO9

display:
  - platform: waveshare_epaper
    id: epd_display
    model: 4.20in
    cs_pin: GPIO2
    dc_pin: GPIO4
    reset_pin: GPIO1
    busy_pin:
      number: GPIO6
      mode:
        input: true
        pullup: true
    update_interval: 60s
    lambda: |-
      render_dashboard(it);
```

## Known Issues

### Power / Brownout
- ESP32-S3 + WiFi + e-paper refresh draws significant current.
- Brownout detector was triggering reset loops. Fixed with
  `CONFIG_ESP_BROWNOUT_DET: "n"`.
- WiFi TX power lowered to `8.5dB` to reduce current draw.

### USB disconnects during flash
- The stub flasher (default) causes USB disconnect when display is attached.
- Workaround: use `--no-stub` with `esptool.py` directly.

### Safe Mode
- Repeated brownout resets can trigger ESPHome safe mode (300s).
- During safe mode, display/sensors are disabled.
- Clear with a fresh flash (factory image).

### Display Models Tried
| Model | Result |
|-------|--------|
| `4.20in` (Waveshare V1, explicit LUT) | Setup 244ms, no timeout, blank |
| `4.20in-bv2` (Waveshare V2, OTP LUT) | Setup 428ms, refresh BUSY wait 350ms, blank |
| `gdey042t81` (Good Display, SW reset) | Full updates via `full_update_every: 1`, blank |

SPI communication confirmed working (BUSY pin responds, no timeouts).
Display remains blank for unknown reason — possibly power, display revision
mismatch, or an ESP32-S3 compatibility issue with the driver.

### OTA Upload Failures
- Connection reset / timeout during large firmware upload.
- Serial flash is more reliable.

## Key Log Messages

- `Setup display took 244ms` — normal init (no timeout)
- `Timeout while displaying image!` — SPI/BUSY pin issue (wrong GPIO mapping)
- `SAFE MODE IS ACTIVE` — 10+ failed boots, disables all components
- `Full update` — gdey042t81 with `full_update_every: 1`
- `Partial update` — gdey042t81 default (first frame must be full)

## Reference

- XIAO ESP32-S3 Wiki: https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/
- Arduino variant pins: `~/.platformio/packages/framework-arduinoespressif32/variants/XIAO_ESP32S3/pins_arduino.h`
- Schematic: downloaded to `/tmp/xiao-s3-sch.pdf`
