#pragma once
#include "esphome.h"
#include "ui_app.h"

void render_dashboard(Display &it) {
  g_app.render(it);
}
