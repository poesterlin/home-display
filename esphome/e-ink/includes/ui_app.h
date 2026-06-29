#pragma once
#include "ui_clock_widget.h"
#include "ui_departures_widget.h"
#include "esp_http_client.h"
#include <algorithm>
#include <vector>

class UiApp {
  UiState state_;
  ClockWidget clock_;
  DeparturesWidget departures_;
  GenericScreen screen_;
  bool fetch_in_progress_ = false;
  uint32_t last_fetch_ms_ = 0;

 public:
  UiApp()
      : clock_({0, 0, 400, 82}),
        departures_({0, 90, 400, 210}, &state_) {
    screen_.add(&clock_);
    screen_.add(&departures_);
    UiInvalidation::request_full();
  }

  UiState &state() { return state_; }

  void poll_widgets() {
    screen_.update(millis());
  }

  void render(Display &it) {
    ESP_LOGI("vrn", "render() called, full_dirty=%d", UiInvalidation::is_full_dirty());
    it.fill(Color::WHITE);
    screen_.draw(it, state_);
    UiInvalidation::clear();
  }

  void fetch_departures() {
    if (fetch_in_progress_)
      return;

    uint32_t now = millis();
    if (now - last_fetch_ms_ < 10000)
      return;

    fetch_in_progress_ = true;
    last_fetch_ms_ = now;

    static const char *telesec_root_ca =
        "-----BEGIN CERTIFICATE-----\n"
        "MIIDwzCCAqugAwIBAgIBATANBgkqhkiG9w0BAQsFADCBgjELMAkGA1UEBhMCREUxKzApBgNVBAoM\n"
        "IlQtU3lzdGVtcyBFbnRlcnByaXNlIFNlcnZpY2VzIEdtYkgxHzAdBgNVBAsMFlQtU3lzdGVtcyBU\n"
        "cnVzdCBDZW50ZXIxJTAjBgNVBAMMHFQtVGVsZVNlYyBHbG9iYWxSb290IENsYXNzIDIwHhcNMDgx\n"
        "MDAxMTA0MDE0WhcNMzMxMDAxMjM1OTU5WjCBgjELMAkGA1UEBhMCREUxKzApBgNVBAoMIlQtU3lz\n"
        "dGVtcyBFbnRlcnByaXNlIFNlcnZpY2VzIEdtYkgxHzAdBgNVBAsMFlQtU3lzdGVtcyBUcnVzdCBD\n"
        "ZW50ZXIxJTAjBgNVBAMMHFQtVGVsZVNlYyBHbG9iYWxSb290IENsYXNzIDIwggEiMA0GCSqGSIb3\n"
        "DQEBAQUAA4IBDwAwggEKAoIBAQCqX9obX+hzkeXaXPSi5kfl82hVYAUdAqSzm1nzHoqvNK38DcLZ\n"
        "SBnuaY/JIPwhqgcZ7bBcrGXHX+0CfHt8LRvWurmAwhiCFoT6ZrAIxlQjgeTNuUk/9k9uN0goOA/F\n"
        "vudocP05l03Sx5iRUKrERLMjfTlH6VJi1hKTXrcxlkIF+3anHqP1wvzpesVsqXFP6st4vGCvx970\n"
        "2cu+fjOlbpSD8DT6IavqjnKgP6TeMFvvhk1qlVtDRKgQFRzlAVfFmPHmBiiRqiDFt1MmUUOyCxGV\n"
        "WOHAD3bZwI18gfNycJ5v/hqO2V81xrJvNHy+SE/iWjnX2J14np+GPgNeGYtEotXHAgMBAAGjQjBA\n"
        "MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS/WSA2AHmgoCJrjNXy\n"
        "YdK4LMuCSjANBgkqhkiG9w0BAQsFAAOCAQEAMQOiYQsfdOhyNsZt+U2e+iKo4YFWz827n+qrkRk4\n"
        "r6p8FU3ztqONpfSO9kSpp+ghla0+AGIWiPACuvxhI+YzmzB6azZie60EI4RYZeLbK4rnJVM3YlNf\n"
        "vNoBYimipidx5joifsFvHZVwIEoHNN/q/xWA5brXethbdXwFeilHfkCoMRN3zUA7tFFHei4R40cR\n"
        "3p1m0IvVVGb6g1XqfMIpiRvpb7PO4gWEyS8+eIVibslfwXhjdFjASBgMmTnrpMwatXlajRWc2BQN\n"
        "9noHV8cigwUtPJslJj0Ys6lDfMjIq2SPDqO/nBudMNva0Bkuqjzx+zOAduTNrRlPBSeOE6Fuwg==\n"
        "-----END CERTIFICATE-----\n";

    esp_http_client_config_t config = {};
    config.url = "https://www.vrn.de/mngvrn/XSLT_DM_REQUEST"
                 "?outputFormat=JSON&depType=stopEvents&useRealtime=1"
                 "&mode=direct&name_dm=Paradeplatz&type_dm=stop"
                 "&place_dm=Mannheim&limit=10&stateless=1";
    config.timeout_ms = 15000;
    config.disable_auto_redirect = false;
    config.cert_pem = telesec_root_ca;

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
      ESP_LOGW("vrn", "Failed to init HTTP client");
      fetch_in_progress_ = false;
      return;
    }

    esp_err_t err = esp_http_client_open(client, 0);
    if (err != ESP_OK) {
      ESP_LOGW("vrn", "HTTP open failed: %d", err);
      esp_http_client_cleanup(client);
      fetch_in_progress_ = false;
      return;
    }

    int content_length = esp_http_client_fetch_headers(client);
    int status = esp_http_client_get_status_code(client);
    ESP_LOGI("vrn", "HTTP status=%d content_length=%d", status, content_length);

    if (status == 200) {
      std::vector<char> buf(81920);
      int total = 0;
      while (total < (int)buf.size() - 1) {
        int r = esp_http_client_read(client, buf.data() + total, buf.size() - total - 1);
        if (r <= 0)
          break;
        total += r;
      }
      buf[total] = '\0';
      ESP_LOGI("vrn", "Read %d/%d bytes", total, content_length);
      parse_json(buf.data());
    } else if (status > 0) {
      ESP_LOGW("vrn", "HTTP status %d", status);
    }

    esp_http_client_close(client);
    esp_http_client_cleanup(client);
    fetch_in_progress_ = false;
  }

  private:
  static const char *find_key(const char *p, const char *key) {
    size_t klen = strlen(key);
    while ((p = strstr(p, key)) != nullptr) {
      const char *after = p + klen;
      while (*after == ' ' || *after == '\t' || *after == '\n' || *after == '\r')
        after++;
      if (*after == ':')
        return after + 1;
      p = after;
    }
    return nullptr;
  }

  static bool extract_string(const char *p, const char *key, char *out, int out_len) {
    const char *vp = find_key(p, key);
    if (!vp) return false;
    while (*vp == ' ' || *vp == '\t' || *vp == '\n' || *vp == '\r')
      vp++;
    if (*vp != '"') return false;
    vp++;
    int i = 0;
    while (*vp && *vp != '"' && i < out_len - 1) {
      if (*vp == '\\') { vp++; if (!*vp) break; }
      out[i++] = *vp++;
    }
    out[i] = '\0';
    return *vp == '"';
  }

  void parse_json(const char *body) {
    ESP_LOGI("vrn", "parse_json START");
    state_.departures.clear();

    const char *start = find_key(body, "\"departureList\"");
    if (!start) {
      state_.data_valid = true;
      update_last_update();
      ESP_LOGW("vrn", "departureList not found");
      return;
    }
    ESP_LOGI("vrn", "parse_json: found departureList at offset %d", (int)(start - body));
    while (*start == ' ' || *start == '\n' || *start == '\r' || *start == '\t')
      start++;
    if (*start != '[') {
      state_.data_valid = true;
      update_last_update();
      ESP_LOGW("vrn", "departureList not array, char=0x%02x", (int)*start);
      return;
    }

    char buf[128];
    const char *ptr = start + 1;
    ESP_LOGI("vrn", "parse_json: starting departure loop");

    while ((ptr = find_key(ptr, "\"countdown\"")) != nullptr) {
      if ((int) state_.departures.size() >= 8)
        break;

      const char *vp = ptr;
      while (*vp == ' ' || *vp == '\t' || *vp == '\n' || *vp == '\r')
        vp++;
      if (*vp == '"')
        vp++;
      else if (*vp >= '0' && *vp <= '9')
        ;
      else {
        ptr = vp;
        continue;
      }

      VrnDeparture d;
      d.countdown = atoi(vp);

      const char *sl = find_key(ptr, "\"servingLine\"");
      if (!sl) { ptr++; continue; }

      if (!extract_string(sl, "\"symbol\"", buf, sizeof(buf)))
        { ptr++; continue; }
      d.line = buf;

      if (!extract_string(sl, "\"direction\"", buf, sizeof(buf)))
        { ptr++; continue; }
      d.direction = buf;

      if (extract_string(sl, "\"delay\"", buf, sizeof(buf)))
        d.delay_m = atoi(buf);
      else
        d.delay_m = 0;

      if (d.countdown + d.delay_m <= 4)
        { ptr = sl + 14; continue; }

      ESP_LOGI("vrn", "parse_json: got dep[%d] line=%s dir=%s cd=%d",
               (int)state_.departures.size(), d.line.c_str(), d.direction.c_str(), d.countdown);
      state_.departures.push_back(d);
      ptr = sl + 14;
    }

    ESP_LOGI("vrn", "parse_json: loop done, %d departures", (int)state_.departures.size());

    std::sort(state_.departures.begin(), state_.departures.end(),
              [](const VrnDeparture &a, const VrnDeparture &b) {
                return a.countdown < b.countdown;
              });

    state_.data_valid = true;
    update_last_update();
    departures_.mark_dirty();

    ESP_LOGI("vrn", "Parsed %d departures", state_.departures.size());
    for (int i = 0; i < (int)state_.departures.size(); i++) {
      auto &d = state_.departures[i];
      ESP_LOGI("vrn", "  [%d] line=%s dir=%s cd=%d del=%d",
               i, d.line.c_str(), d.direction.c_str(),
               d.countdown, d.delay_m);
    }
  }

  void update_last_update() {
    auto t = id(sntp_time).now();
    if (t.is_valid()) {
      state_.last_update = t.strftime("%H:%M");
    } else {
      state_.last_update.clear();
    }
  }
};

inline UiApp g_app;
