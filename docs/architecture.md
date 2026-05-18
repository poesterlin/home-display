# Recommended architecture

Use a lightweight retained UI architecture:

```text
StateManager
   |
   v
ScreenController
   |
   +--> Current Screen
          |
          +--> Widgets / controls
                  |
                  +--> Button, Slider, Tabs, List, Card, Label
```

Each screen owns a list of widgets. Each widget knows:

- its rectangle
- how to draw itself
- how to handle touch
- what action it emits

Then you have a central dispatcher that turns UI events into Home Assistant actions.

---

# Core idea

Instead of this:

```cpp
if (gState.currentView == VIEW_DETAIL_LIGHTS) {
  if (gState.lightStehlampe.btn.processTap(...)) return;
  if (gState.lightWohnzimmer.btn.processTap(...)) return;
  if (gState.lightKleineLampe.btn.processTap(...)) return;
}
```

You want something more like:

```cpp
currentScreen->handleTouch(event);
currentScreen->draw(renderer);
```

The screen contains the buttons. The touch handler does not need to know about every individual button in the app.

---

# Big performance point: avoid full-frame redraws

On a 480x480 RGB565 display, a full frame is:

```text
480 * 480 * 2 bytes = 460,800 bytes
```

If this is an SPI display, pushing the whole frame repeatedly is expensive. Even at good SPI speeds, full-screen updates can easily become the bottleneck.

So the architecture should support:

1. drawing only what changed
2. avoiding full-screen clears
3. avoiding expensive animation unless necessary
4. avoiding string parsing/allocation inside render loops
5. caching layout and parsed data
6. making static UI chrome cheap

---

# Separate these responsibilities

Right now your `Button` does too much:

```cpp
bool processTap(...)
void draw(...)
```

And `draw()` also contains this:

```cpp
if (loading && (millis() - loadingStartTime > timeout)) {
  loading = false;
}
```

That means drawing mutates state. That is convenient, but it makes timing/state bugs harder to reason about.

A cleaner split:

```text
Widget geometry        -> where it is
Widget render          -> how it looks
Widget interaction     -> emits event
Action dispatcher      -> performs side effect
State manager          -> receives HA/device data
Render scheduler       -> decides what needs repainting
```

---

# Suggested structure

## 1. Define touch events

Instead of passing raw `x`, `y`, `touched` everywhere, convert touch into events:

```cpp
enum class TouchType {
  Down,
  Move,
  Up,
  Tap,
  LongPress,
  Drag,
  SwipeLeft,
  SwipeRight
};

struct TouchEvent {
  TouchType type;
  int x;
  int y;
  int startX;
  int startY;
  int dx;
  int dy;
};
```

Then your touch handler becomes generic.

---

## 2. Define UI actions

Instead of every button mutating its own `actionRequested` flag, emit an action enum:

```cpp
enum class UiAction {
  None,

  OpenClimate,
  OpenTimer,
  OpenScenes,
  OpenTodo,
  OpenMusic,
  OpenVacuum,
  OpenLights,

  GoBack,
  NextPage,
  PrevPage,

  ToggleTimer,
  ResetTimer,
  TimerPlus,
  TimerMinus,

  MusicPlayPause,
  MusicLike,
  MusicSkip,
  MusicPrev,
  MusicNext,
  MusicTransferOffice,
  MusicTransferLiving,

  SceneAllOff,
  SceneCozy,
  SceneBeamer,
  SceneDay,

  ToggleLightStehlampe,
  ToggleLightWohnzimmer,
  ToggleLightKleineLampe,
  ToggleLightWLED,
  ToggleLightOffice,

  VacuumStartStop,
  DismissNotification
};
```

Then a central dispatcher handles it:

```cpp
void dispatchAction(UiAction action) {
  switch (action) {
    case UiAction::OpenTimer:
      openView(VIEW_DETAIL_TIMER);
      break;

    case UiAction::ToggleTimer:
      gState.timerActive = !gState.timerActive;
      gPendingTapSound = true;
      break;

    case UiAction::MusicSkip:
      gState.musicSkipLoading = true;
      gState.musicSkipLoadingStartTime = millis();
      gState.musicSkipActionRequested = true;
      gPendingTapSound = true;
      break;

    default:
      break;
  }
}
```

This makes the UI code less tangled with HA action flags.

---

## 3. Make Button lightweight

Your current button stores geometry, handles hit testing, handles loading, and draws itself. I would make it more declarative:

```cpp
struct Rect {
  int x;
  int y;
  int w;
  int h;

  bool contains(int tx, int ty, int slopX = 0, int slopY = 0) const {
    return tx >= x - slopX && tx <= x + w + slopX && ty >= y - slopY &&
           ty <= y + h + slopY;
  }
};

struct ButtonStyle {
  Color color;
  esphome::font::Font* font;
  const char* header = nullptr;
};

struct ButtonWidget {
  Rect rect;
  const char* label;
  UiAction action;
  ButtonStyle style;
  bool loading = false;
  uint32_t loadingStart = 0;
  uint32_t loadingTimeout = 0;

  bool hitTest(int x, int y, int scrollY = 0) const {
    Rect r = rect;
    r.y += scrollY;

    int sx = r.w < 40 ? 15 : r.w < 60 ? 10 : 0;
    int sy = r.h < 40 ? 15 : r.h < 60 ? 10 : 0;

    return r.contains(x, y, sx, sy);
  }

  void update(uint32_t now) {
    if (loading && loadingTimeout > 0 && now - loadingStart > loadingTimeout) {
      loading = false;
    }
  }

  void draw(display::Display& it, int scrollY = 0) const {
    Rect r = rect;
    r.y += scrollY;

    Color shadowColor = Color(20, 20, 20);

    it.rectangle(r.x + 3, r.y + 3, r.w, r.h, shadowColor);
    it.rectangle(r.x, r.y, r.w, r.h, Color(40, 40, 40));
    it.rectangle(r.x - 1, r.y - 1, r.w + 2, r.h + 2, style.color);

    if (style.header != nullptr) {
      int tx, ty, tw, th;
      it.get_text_bounds(
        r.x + 12,
        r.y - 7,
        style.header,
        font_tiny,
        TextAlign::TOP_LEFT,
        &tx,
        &ty,
        &tw,
        &th
      );
      it.filled_rectangle(tx - 2, ty, tw + 4, th, C_BLACK);
      it.printf(
        r.x + 12,
        r.y - 7,
        font_tiny,
        style.color,
        TextAlign::TOP_LEFT,
        " %s ",
        style.header
      );
    }

    if (loading) {
      float angle = (millis() % 1000) * 2.0f * 3.14159265f / 1000.0f;
      int cx = r.x + r.w / 2;
      int cy = r.y + r.h / 2;
      int radius = 10;

      it.line(
        cx,
        cy,
        cx + static_cast<int>(cosf(angle) * radius),
        cy + static_cast<int>(sinf(angle) * radius),
        style.color
      );

      return;
    }

    if (label != nullptr && label[0] != '\0') {
      it.printf(
        r.x + r.w / 2,
        r.y + r.h / 2,
        style.font,
        style.color,
        TextAlign::CENTER,
        "%s",
        label
      );
    }

    int s = 8;

    it.line(r.x - 1, r.y - 1, r.x + s, r.y - 1, C_WHITE);
    it.line(r.x - 1, r.y - 1, r.x - 1, r.y + s, C_WHITE);

    it.line(
      r.x + r.w + 1,
      r.y + r.h + 1,
      r.x + r.w + 1 - s,
      r.y + r.h + 1,
      C_WHITE
    );

    it.line(
      r.x + r.w + 1,
      r.y + r.h + 1,
      r.x + r.w + 1,
      r.y + r.h + 1 - s,
      C_WHITE
    );
  }
};
```

The important change: the button returns an action instead of directly setting a random action flag.

---

## 4. Make screens own their controls

Example:

```cpp
class Screen {
public:
  virtual ~Screen() = default;

  virtual void enter() {}
  virtual void exit() {}
  virtual void update(uint32_t now) {}
  virtual void draw(display::Display& it) = 0;
  virtual UiAction handleTouch(const TouchEvent& event) = 0;
};
```

Then a specific screen:

```cpp
class StatusScreen : public Screen {
public:
  ButtonWidget climateButton;
  ButtonWidget timerButton;
  ButtonWidget scenesButton;
  ButtonWidget todoButton;
  ButtonWidget vacuumButton;

  StatusScreen() {
    climateButton = {
      {10, 40, 220, 40},
      "",
      UiAction::OpenClimate,
      {C_CYAN, font_tiny, nullptr},
      false,
      0,
      0
    };

    timerButton = {
      {15, 195, 100, 35},
      "   TIMER",
      UiAction::OpenTimer,
      {C_AMBER, font_small, nullptr},
      false,
      0,
      0
    };

    scenesButton = {
      {125, 195, 100, 35},
      "   SCENES",
      UiAction::OpenScenes,
      {C_AMBER, font_small, nullptr},
      false,
      0,
      0
    };

    todoButton = {
      {10, 95, 220, 80},
      "",
      UiAction::OpenTodo,
      {C_AMBER, font_tiny, nullptr},
      false,
      0,
      0
    };

    vacuumButton = {
      {15, 273, 45, 14},
      "VAC",
      UiAction::OpenVacuum,
      {C_GREEN, font_tiny, nullptr},
      false,
      0,
      200
    };
  }

  UiAction handleTouch(const TouchEvent& event) override {
    if (event.type != TouchType::Tap) {
      return UiAction::None;
    }

    if (climateButton.hitTest(event.x, event.y)) return climateButton.action;
    if (timerButton.hitTest(event.x, event.y)) return timerButton.action;
    if (scenesButton.hitTest(event.x, event.y)) return scenesButton.action;
    if (todoButton.hitTest(event.x, event.y)) return todoButton.action;

    if (gState.vacuumCleaning && vacuumButton.hitTest(event.x, event.y)) {
      return vacuumButton.action;
    }

    return UiAction::None;
  }

  void draw(display::Display& it) override {
    climateButton.draw(it);

    drawMetrics(it);
    drawTodoPreview(it);

    timerButton.draw(it);
    drawTimerIcon(it);

    scenesButton.draw(it);
    drawScenesIcon(it);

    drawStatusBadges(it);
  }

private:
  void drawMetrics(display::Display& it) {
    drawMetric(it, 45, gState.outsideTemp, "C", C_CYAN);
    drawMetric(it, 95, gState.avgTemp, "C", C_AMBER);
    drawMetric(it, 145, gState.avgHumidity, "%", C_DIM);

    Color co2Color = gState.co2 < 800
                       ? C_GREEN
                       : gState.co2 < 1200 ? C_AMBER : C_RED;

    drawMetric(it, 195, gState.co2, "", co2Color);
  }

  void drawMetric(
    display::Display& it,
    int x,
    float value,
    const char* unit,
    Color color
  ) {
    if (value != 0) {
      it.printf(x, 53, font_small, color, TextAlign::CENTER, "%.0f%s", value, unit);
    } else {
      it.printf(x, 53, font_small, C_DIMMER, TextAlign::CENTER, "--");
    }
  }

  void drawTodoPreview(display::Display& it) {
    // Draw from pre-parsed todo items, not from raw string parsing every frame.
  }

  void drawTimerIcon(display::Display& it) {
    int tcx = 30;
    int tcy = 195 + 17;

    it.circle(tcx, tcy, 7, C_AMBER);
    it.line(tcx, tcy, tcx, tcy - 4, C_AMBER);
    it.line(tcx, tcy, tcx + 3, tcy, C_AMBER);
  }

  void drawScenesIcon(display::Display& it) {
    int scx = 140;
    int scy = 195 + 17;

    it.filled_circle(scx, scy, 7, C_AMBER);
  }

  void drawStatusBadges(display::Display& it) {
    // Draw active badges.
  }
};
```

---

# Important improvement: do not set button layout inside render

You currently do this:

```cpp
gState.timerLinkBtn.x = 15;
gState.timerLinkBtn.y = btnY;
gState.timerLinkBtn.w = 100;
gState.timerLinkBtn.h = 35;
gState.timerLinkBtn.draw(...);
```

That means the touch geometry depends on render having already run. It works, but it creates subtle bugs.

Better:

- define geometry once when the screen is constructed
- update geometry in a layout pass
- then render and input both use the same cached layout

Good pattern:

```cpp
void layout() {
  timerButton.rect = {15, 195, 100, 35};
  scenesButton.rect = {125, 195, 100, 35};
}

void draw(display::Display& it) {
  timerButton.draw(it);
  scenesButton.draw(it);
}
```

Call `layout()` when:

- screen changes
- orientation changes
- content changes
- scroll bounds change

Not every frame unless needed.

---

# Avoid parsing strings during every draw

This is a big performance issue in your current code.

You do this inside `renderPage0_Status()`:

```cpp
std::string listStr = gState.todoListFormatted;
while (...) {
  ...
}
```

And similarly in touch handling:

```cpp
std::string listStr = ...
while (...) {
  ...
}
```

That means every render/tap creates string copies and parses the whole list. On ESP32, repeated `std::string` allocation can hurt performance and fragment heap.

Instead, parse when the Home Assistant sensor changes.

For example:

```cpp
struct TodoItem {
  std::string summary;
  std::string due;
  bool overdue = false;
};

static constexpr int MAX_TODO_ITEMS = 12;

struct ParsedTodoList {
  TodoItem items[MAX_TODO_ITEMS];
  int count = 0;
};
```

Then when the raw string changes:

```cpp
void parseTodoList(const std::string& raw, ParsedTodoList& output) {
  output.count = 0;

  size_t start = 0;

  while (start < raw.length() && output.count < MAX_TODO_ITEMS) {
    size_t end = raw.find('\n', start);
    if (end == std::string::npos) {
      end = raw.length();
    }

    std::string line = raw.substr(start, end - start);
    start = end + 1;

    trim(line);

    if (line.empty() || line == "LIST EMPTY") {
      continue;
    }

    TodoItem& item = output.items[output.count++];

    size_t p1 = line.find('|');

    if (p1 == std::string::npos) {
      item.summary = line;
      item.due = "";
      item.overdue = false;
      continue;
    }

    item.summary = line.substr(0, p1);

    std::string rest = line.substr(p1 + 1);
    size_t p2 = rest.find('|');

    if (p2 == std::string::npos) {
      item.due = rest;
      item.overdue = false;
    } else {
      item.due = rest.substr(0, p2);
      item.overdue = rest.substr(p2 + 1).find("overdue") != std::string::npos;
    }

    trim(item.summary);
    trim(item.due);
  }
}
```

Then drawing becomes cheap:

```cpp
void drawTodoPreview(display::Display& it, const ParsedTodoList& list) {
  int y = 105;

  if (list.count == 0) {
    it.printf(120, y + 22, font_tiny, C_DIMMER, TextAlign::CENTER, "LIST EMPTY");
    return;
  }

  for (int i = 0; i < list.count && i < 3; i++) {
    const TodoItem& item = list.items[i];

    it.printf(25, y, font_small, C_AMBER, TextAlign::TOP_LEFT, "[ ]");

    int textX = 55;
    int textWidth = 170;

    if (!item.due.empty() && item.due != "none") {
      Color dueColor = item.overdue ? C_RED : C_AMBER;

      it.printf(
        55,
        y + 2,
        font_tiny,
        dueColor,
        TextAlign::TOP_LEFT,
        "%s",
        item.due.c_str()
      );

      textX = 100;
      textWidth = 125;
    }

    ScrollingText::draw(
      it,
      textX,
      y,
      textWidth,
      item.summary,
      font_small,
      C_WHITE
    );

    y += 22;
  }
}
```

This one change alone may help a lot.

---

# Avoid `std::string` for frequently changing UI labels where possible

For Home Assistant values, `std::string` is sometimes unavoidable, but for static UI strings prefer `const char*`.

Good:

```cpp
const char* label = "START MUSIC";
```

Less ideal on embedded devices:

```cpp
std::string label = "START MUSIC";
```

Your button draw signature currently takes:

```cpp
const std::string& label
```

That means string handling is encouraged. I would change it to:

```cpp
const char* label
```

For dynamic strings, pass `myString.c_str()`.

---

# Avoid `volatile` unless you truly need it

Your button code uses:

```cpp
volatile bool& loading
volatile bool& actionRequested
```

On ESP32/ESPHome, `volatile` is usually not what you want for normal app state. It does not make things thread-safe. It just prevents some compiler optimizations.

If the state is modified from interrupt context, use proper synchronization. If it is normal ESPHome loop/lambda state, use plain `bool`.

So prefer:

```cpp
bool& loading
bool& actionRequested
```

or better: do not pass these into the button at all. Let the button emit `UiAction`.

---

# Introduce a render scheduler

Instead of constantly redrawing everything at a fixed rate, track whether a redraw is needed.

Example:

```cpp
struct RenderScheduler {
  bool fullRedraw = true;
  uint32_t lastFrame = 0;
  uint32_t minIdleInterval = 250;
  uint32_t minActiveInterval = 33;

  bool hasAnimation = false;
  bool touchActive = false;

  void invalidateAll() {
    fullRedraw = true;
  }

  bool shouldDraw(uint32_t now) {
    uint32_t interval = hasAnimation || touchActive ? minActiveInterval
                                                    : minIdleInterval;

    if (fullRedraw) {
      return true;
    }

    return now - lastFrame >= interval && hasAnimation;
  }

  void didDraw(uint32_t now) {
    lastFrame = now;
    fullRedraw = false;
  }
};
```

Use faster redraw only when:

- scrolling
- dragging slider
- loading spinner active
- scrolling text active
- music visualizer active
- notification animation active

Otherwise redraw slowly or only on state change.

---

# Be careful with animations

This in `renderPage1_Music()` is expensive and forces constant visual change:

```cpp
int h = 5 + (rand() % 15);
it.filled_rectangle(bx + i * 12, by - h, 8, h, C_CYAN);
```

Because the bars change every frame, the whole music area is always dirty.

Better:

- update equalizer bars at 5–10 FPS, not every render
- store the values
- redraw only that region
- or remove the random visualizer on slower panels

Example:

```cpp
struct EqualizerState {
  uint8_t bars[15];
  uint32_t lastUpdate = 0;

  void update(uint32_t now) {
    if (now - lastUpdate < 120) {
      return;
    }

    lastUpdate = now;

    for (int i = 0; i < 15; i++) {
      bars[i] = 5 + esp_random() % 15;
    }
  }
};
```

Then draw from stored values.

---

# Use dirty regions if your display path allows it

A lightweight dirty-rect system:

```cpp
struct DirtyRect {
  int x;
  int y;
  int w;
  int h;
};

struct DirtyManager {
  bool full = true;
  DirtyRect rects[8];
  int count = 0;

  void invalidateAll() {
    full = true;
    count = 0;
  }

  void invalidate(Rect r) {
    if (count >= 8) {
      invalidateAll();
      return;
    }

    rects[count++] = {r.x, r.y, r.w, r.h};
  }

  void clear() {
    full = false;
    count = 0;
  }
};
```

However, whether this helps depends on your display driver. Some ESPHome display components still effectively flush the whole buffer. If your driver pushes the full framebuffer regardless, dirty rectangles help CPU draw time but not bus transfer time.

If you control the driver or use a lower-level driver like LovyanGFX, partial push can help a lot.

---

# Static layer + dynamic layer

For each screen, split drawing into:

```text
Static:
- borders
- labels
- boxes
- card outlines
- headers
- icons

Dynamic:
- sensor values
- loading indicators
- scrolling text
- sliders
- changing buttons
- progress bars
```

Then on state changes, only overpaint dynamic regions.

For example, instead of clearing the whole display, clear only the value box:

```cpp
void drawClimateValue(display::Display& it, int x, int y, float value, Color color) {
  it.filled_rectangle(x - 25, y - 5, 50, 20, C_BLACK);

  if (value != 0) {
    it.printf(x, y, font_small, color, TextAlign::CENTER, "%.0fC", value);
  } else {
    it.printf(x, y, font_small, C_DIMMER, TextAlign::CENTER, "--");
  }
}
```

This is one reason custom rendering can beat LVGL on microcontrollers: you can be very deliberate about pixels.

---

# Use a screen stack instead of manual view/back logic

You currently have:

```cpp
openView(VIEW_DETAIL_TIMER);
goBack();
```

That is okay, but a stack is cleaner:

```cpp
class ScreenManager {
public:
  void push(Screen* screen) {
    if (current != nullptr) {
      current->exit();
    }

    stack[depth++] = screen;
    current = screen;
    current->enter();

    gRender.invalidateAll();
  }

  void pop() {
    if (depth <= 1) {
      return;
    }

    current->exit();
    depth--;
    current = stack[depth - 1];
    current->enter();

    gRender.invalidateAll();
  }

  Screen* getCurrent() {
    return current;
  }

private:
  Screen* stack[8];
  int depth = 0;
  Screen* current = nullptr;
};
```

Then back button emits:

```cpp
UiAction::GoBack
```

And the dispatcher handles it.

---

# Suggested app loop

Your app should look conceptually like this:

```cpp
void loopUi(display::Display& it) {
  uint32_t now = millis();

  TouchEvent event;
  if (touchManager.poll(event)) {
    UiAction action = screenManager.getCurrent()->handleTouch(event);

    if (action != UiAction::None) {
      dispatchAction(action);
      renderScheduler.invalidateAll();
    }
  }

  screenManager.getCurrent()->update(now);

  if (renderScheduler.shouldDraw(now)) {
    screenManager.getCurrent()->draw(it);
    renderScheduler.didDraw(now);
  }
}
```

In ESPHome, this may be split between the display lambda, touch callback, and interval components, but the conceptual separation still helps.

---

# What I would change in your current code immediately

## 1. Do not mutate loading timeout inside `draw()`

Current:

```cpp
if (loading && (millis() - loadingStartTime > timeout)) {
  loading = false;
}
```

Move this to an update function:

```cpp
void updateLoading(
  bool& loading,
  unsigned long loadingStartTime,
  unsigned long timeout
) {
  if (timeout == 0) {
    return;
  }

  if (loading && millis() - loadingStartTime > timeout) {
    loading = false;
  }
}
```

Also note: with `timeout == 0`, this condition becomes true almost immediately:

```cpp
millis() - loadingStartTime > 0
```

So buttons with `timeout = 0` may clear loading state almost instantly.

---

## 2. Return after successful music transfer taps

You currently have:

```cpp
if (gState.musicTransferOfficeBtn.processTap(...)) {
  gState.lastTouchTime = millis();
  ESP_LOGI("touch", "Music Transfer Office button processed");
}
if (gState.musicTransferLivingBtn.processTap(...)) {
  gState.lastTouchTime = millis();
  ESP_LOGI("touch", "Music Transfer Living Room button processed");
}
```

If buttons ever overlap due to scroll/layout bugs, both can trigger. Prefer:

```cpp
if (gState.musicTransferOfficeBtn.processTap(...)) {
  gState.lastTouchTime = millis();
  ESP_LOGI("touch", "Music Transfer Office button processed");
  return;
}

if (gState.musicTransferLivingBtn.processTap(...)) {
  gState.lastTouchTime = millis();
  ESP_LOGI("touch", "Music Transfer Living Room button processed");
  return;
}
```

---

## 3. Pre-parse todo/shopping lists

Do not parse list strings in `renderPage0_Status()` and `handleTap()`.

Keep arrays of parsed list items.

---

## 4. Make touch routing generic

Instead of this giant `handleTap()`:

```cpp
if (gState.currentView == VIEW_MAIN_DASHBOARD) {
  if (gState.mainPageIndex == 0) {
    ...
  }
}
```

Move tap handling to the current screen/page object.

---

## 5. Avoid layout assignment in render

Current:

```cpp
gState.lightsDetailBtn.x = 10;
gState.lightsDetailBtn.y = 140;
gState.lightsDetailBtn.w = 220;
gState.lightsDetailBtn.h = 75;
```

Move that to setup/layout.

---

## 6. Remove dynamic allocation from hot paths

Try to avoid these in functions called every frame:

```cpp
std::string listStr = ...
std::string line = ...
std::string summary = ...
line.substr(...)
listStr.erase(...)
```

Use pre-parsed data or fixed buffers.


# Best architecture for your product idea

Given your earlier product idea — configurable dashboards for ESP32 displays — I would build your own tiny declarative UI runtime.

Something like:

```cpp
struct WidgetConfig {
  WidgetType type;
  Rect rect;
  const char* label;
  EntityId entity;
  UiAction action;
  StyleId style;
};
```

Then dashboards can be generated from config:

```cpp
WidgetConfig statusPage[] = {
  {WidgetType::ClimateSummary, {10, 40, 220, 45}, nullptr, EntityId::Climate, UiAction::OpenClimate, StyleId::Cyan},
  {WidgetType::TodoPreview, {10, 95, 220, 80}, nullptr, EntityId::Todo, UiAction::OpenTodo, StyleId::Amber},
  {WidgetType::Button, {15, 195, 100, 35}, "TIMER", EntityId::None, UiAction::OpenTimer, StyleId::Amber},
  {WidgetType::Button, {125, 195, 100, 35}, "SCENES", EntityId::None, UiAction::OpenScenes, StyleId::Amber},
};
```

Then the renderer loops through widgets:

```cpp
void drawWidgets(display::Display& it, WidgetConfig* widgets, int count) {
  for (int i = 0; i < count; i++) {
    drawWidget(it, widgets[i]);
  }
}
```

And the input system loops through widgets in reverse order:

```cpp
UiAction hitTestWidgets(WidgetConfig* widgets, int count, int x, int y) {
  for (int i = count - 1; i >= 0; i--) {
    if (rectContains(widgets[i].rect, x, y)) {
      return widgets[i].action;
    }
  }

  return UiAction::None;
}
```

This is the path toward your commercial editor:

```text
Editor config -> JSON/binary layout -> ESP32 runtime -> custom renderer
```
