# ESPHome Visual Display Editor

A comprehensive visual design system and code generation suite for ESPHome-powered displays. This project allows you to design rich, interactive user interfaces for microcontrollers using a modern web-based editor and deploy them with Home Assistant integration.

## Tech Stack

- **Frontend**: Svelte 5, TypeScript, Tailwind CSS, Bun.
- **Backend/Codegen**: Bun, JSON Schema, `json-schema-to-typescript`.
- **Firmware**: ESPHome, C++20.
- **Integration**: Python (Home Assistant Custom Component).

## Getting Started

### Web Editor
1. Navigate to `web/`.
2. Install dependencies: `bun install`.
3. Start the dev server: `bun run dev`.

### Home Assistant Component
Copy `custom_components/esphome_display` to your Home Assistant `config/custom_components/` directory.

### ESPHome Test Firmware
1. Ensure you have ESPHome installed.
2. Navigate to `esphome/`.
3. Compile the display config: `esphome compile my-display.yaml`.

## TODOs

- [ ] https://hacs.xyz/docs/publish/action/
- [ ] [add hacks manifest in /](https://hacs.xyz/docs/publish/integration/#manifestjson)
- [ ] add account emails for account/pw recovery
- [ ] add more analytics
- [ ] allow flashing older builds / store in s3
- [ ] test ota update flow
- [ ] record demo
- [ ] record instructions
- [ ] make export model not a modal
- [ ] derive build preview images from the canvas