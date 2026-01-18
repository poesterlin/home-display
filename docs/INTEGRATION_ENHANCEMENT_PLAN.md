# Home Assistant Integration Enhancement Plan

This document outlines the comprehensive enhancement of the ESPHome Display project with a full-featured Home Assistant integration and live editor capabilities.

## Overview

The goal is to transform the ESPHome Display from a technical project into a polished product that non-technical users can easily set up and use. This involves creating a bidirectional bridge between the Svelte editor and Home Assistant, enabling live preview, visual entity selection, and seamless project deployment.

## Task Checklist

### Legend

| State | Meaning |
|-------|---------|
| `[ ]` | Todo |
| `[~]` | In Progress |
| `[?]` | Help Required |
| `[x]` | Done |

---

## Phase 1: WebSocket API Foundation

### `[ ]` Create WebSocket API Module
**File**: `custom_components/esphome_display/websocket_api.py`

**Tasks**:
- [ ] Implement `esphome_display/entities` command
  - [ ] Support domain filtering (light, sensor, switch, etc.)
  - [ ] Support device class filtering
  - [ ] Support text search across entity names and IDs
  - [ ] Return structured entity data with state and attributes

- [ ] Implement `esphome_display/subscribe` command
  - [ ] Accept array of entity IDs to subscribe to
  - [ ] Send current states immediately
  - [ ] Push real-time updates on state changes
  - [ ] Handle subscription lifecycle and cleanup

- [ ] Implement `esphome_display/validate_project` command
  - [ ] Parse project JSON structure
  - [ ] Check all entity bindings exist in HA
  - [ ] Return validation errors and warnings
  - [ ] Support path-based error reporting

- [ ] Implement `esphome_display/entity_history` command
  - [ ] Fetch historical data for chart components
  - [ ] Support configurable time ranges
  - [ ] Return simplified data structure for charts

- [ ] Implement `esphome_display/devices` command
  - [ ] List all registered ESPHome displays
  - [ ] Report connection status and current state
  - [ ] Include device metadata and capabilities

### `[ ]` Register WebSocket API in Integration
**File**: `custom_components/esphome_display/__init__.py`

**Tasks**:
- [ ] Import `async_setup_websocket_api`
- [ ] Call setup in `async_setup_entry`
- [ ] Add error handling and logging

---

## Phase 2: Editor Frontend Integration

### `[ ]` HA Connection Management
**File**: `web/packages/editor/src/lib/ha/connection.ts`

**Tasks**:
- [ ] Create connection management utilities
- [ ] Implement authentication with long-lived tokens
- [ ] Handle connection state and reconnection
- [ ] Create typed WebSocket message interface

### `[ ]` Entity Service Layer
**File**: `web/packages/editor/src/lib/ha/entities.ts`

**Tasks**:
- [ ] Create `fetchEntities()` function with filtering
- [ ] Create `fetchEntityHistory()` for chart data
- [ ] Create `subscribeToEntities()` for live updates
- [ ] Create `validateProject()` for project validation
- [ ] Add TypeScript interfaces for all data structures

### `[ ]` Entity Picker Component
**File**: `web/packages/editor/src/lib/components/EntityPicker.svelte`

**Tasks**:
- [ ] Design dropdown interface with search
- [ ] Show entity icons, names, and current states
- [ ] Implement domain/device class filtering
- [ ] Add keyboard navigation support
- [ ] Handle selection and callback events
- [ ] Style to match editor theme

### `[ ]` Live Preview Integration
**File**: `web/packages/editor/src/lib/components/LivePreview.svelte`

**Tasks**:
- [ ] Create container for live preview mode
- [ ] Collect all bound entity IDs from project
- [ ] Subscribe to entity state changes
- [ ] Provide live data to DesignCanvas
- [ ] Add connection status indicator
- [ ] Handle subscription lifecycle

---

## Phase 3: Canvas Enhancement

### `[ ]` Enhance DesignCanvas for Live Data
**File**: `web/packages/editor/src/lib/components/canvas/DesignCanvas.svelte`

**Tasks**:
- [ ] Accept live data provider function as prop
- [ ] Modify component rendering to use live values when available
- [ ] Add visual indicators for live mode
- [ ] Handle different data types (numbers, strings, booleans)
- [ ] Update binding resolution logic

### `[ ]` Update Property Editor
**File**: `web/packages/editor/src/lib/components/sidebar/PropertyEditor.svelte`

**Tasks**:
- [ ] Replace text inputs with EntityPicker for entity bindings
- [ ] Add "Test Live Data" toggle
- [ ] Show entity state next to binding inputs
- [ ] Add validation indicators
- [ ] Support entity search in binding context

---

## Phase 4: Service Enhancement

### `[ ]` Extended Service Definitions
**File**: `custom_components/esphome_display/services.yaml`

**Tasks**:
- [ ] Add `upload_project` service with JSON schema
- [ ] Add `navigate` service with page targeting
- [ ] Enhance `notify` service with icon and priority support
- [ ] Add `set_brightness` with transition support
- [ ] Add `wake` and `sleep` services
- [ ] Add proper device targeting and validation

### `[ ]` Service Implementation
**File**: `custom_components/esphome_display/services.py`

**Tasks**:
- [ ] Implement all new service handlers
- [ ] Add proper error handling and validation
- [ ] Add device registry lookups
- [ ] Implement project JSON validation
- [ ] Add async support for all operations

### `[ ]` Enhanced Coordinator
**File**: `custom_components/esphome_display/coordinator.py`

**Tasks**:
- [ ] Add methods for new service operations
- [ ] Implement project upload protocol
- [ ] Add notification queue management
- [ ] Add brightness transition handling
- [ ] Improve error reporting and logging

---

## Phase 5: User Experience Enhancements

### `[ ]] Lovelace Card
**File**: `custom_components/esphome_display/frontend/esphome-display-card.js`

**Tasks**:
- [ ] Create card definition and editor
- [ ] Show display preview and status
- [ ] Add quick action buttons (navigate, notify, brightness)
- [ ] Include notification composer
- [ ] Support multiple displays
- [ ] Add card configuration schema

### `[ ]` Config Flow Improvements
**File**: `custom_components/esphome_display/config_flow.py`

**Tasks**:
- [ ] Add device discovery via mDNS
- [ ] Implement automatic device detection
- [ ] Add device capability detection
- [ ] Improve error messages and validation
- [ ] Add device pairing process

### `[ ]] OTA Project Updates
**Files**: ESPHome firmware enhancements

**Tasks**:
- [ ] Add custom ESPHome command for project upload
- [ ] Implement project validation on device
- [ ] Add configuration backup/restore
- [ ] Handle update failures gracefully
- [ ] Add progress reporting

---

## Phase 6: Testing and Documentation

### `[ ]` Unit Tests
**Tasks**:
- [ ] WebSocket API command tests
- [ ] Service handler tests
- [ ] Entity picker component tests
- [ ] Project validation tests
- [ ] Connection management tests

### `[ ]` Integration Tests
**Tasks**:
- [ ] End-to-end entity binding flow
- [ ] Live preview functionality
- [ ] Project upload and deployment
- [ ] Service execution tests
- [ ] Multi-device scenarios

### `[ ]` Documentation
**Tasks**:
- [ ] Update integration setup guide
- [ ] Create editor usage documentation
- [ ] Document new services and their usage
- [ ] Add troubleshooting guide
- [ ] Create video tutorials for key features

---

## Implementation Dependencies

```
Phase 1 (WebSocket API) → Phase 2 (Editor Integration) → Phase 3 (Canvas Enhancement)
           ↓                           ↓                           ↓
Phase 4 (Services) → Phase 5 (UX Enhancements) → Phase 6 (Testing & Documentation)
```

## Key Technical Decisions

### 1. Authentication Strategy
- Use long-lived access tokens for editor authentication
- Store tokens securely in editor settings
- Implement token rotation support

### 2. Data Synchronization
- Use WebSocket subscriptions for real-time updates
- Implement local caching for performance
- Handle connection drops gracefully

### 3. Project Upload Protocol
- Use ESPHome's native API with custom commands
- Compress project data before transmission
- Implement delta updates for efficiency

### 4. Entity Resolution
- Support both entity_id and friendly_name lookups
- Cache entity metadata to reduce HA queries
- Handle entity creation/deletion gracefully

## Success Metrics

1. **Setup Time**: Reduce from manual YAML editing to <5 minutes UI setup
2. **Entity Binding**: Enable visual selection of any HA entity
3. **Live Preview**: Show real data in editor within 100ms of HA state changes
4. **Deployment**: One-click project upload to display
5. **Reliability**: 99.9% uptime for WebSocket connections
6. **User Experience**: Professional-grade UI/UX matching HA standards

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebSocket connection stability | Implement exponential backoff reconnection |
| Large project upload failures | Implement chunked upload with progress tracking |
| Entity ID changes in HA | Use both entity_id and friendly_name for lookups |
| ESPHome firmware limitations | Custom commands via ESPHome API extension |
| Browser security restrictions | Use CORS properly and secure WebSocket protocols |

## Next Steps

1. Begin with Phase 1 WebSocket API implementation
2. Set up development environment with HA instance
3. Create test entities and scenarios
4. Implement entity picker as proof of concept
5. Iterate based on user testing and feedback

This plan provides a clear roadmap for transforming the ESPHome Display project into a polished, user-friendly Home Assistant integration with professional-grade editing capabilities.