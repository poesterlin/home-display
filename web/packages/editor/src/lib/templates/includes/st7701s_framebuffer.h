#pragma once

#include "esphome/components/st7701s/st7701s.h"
#include <esp_err.h>

namespace esphome {
namespace st7701s {

class ST7701SWithFrameBuffer : public ST7701S {
 public:
  esp_err_t get_frame_buffer(void **fb) {
    if (this->handle_ == nullptr) {
      return ESP_ERR_INVALID_STATE;
    }
    return esp_lcd_rgb_panel_get_frame_buffer(this->handle_, 1, fb);
  }
};

}  // namespace st7701s
}  // namespace esphome
