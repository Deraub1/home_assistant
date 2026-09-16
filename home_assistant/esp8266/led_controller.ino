#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>

const char* WIFI_SSID = "VOTRE_WIFI_SSID";
const char* WIFI_PASSWORD = "VOTRE_WIFI_PASSWORD";

ESP8266WebServer server(80);

const uint8_t LED_COUNT = 8;
const uint8_t LED_PINS[LED_COUNT] = {D1, D2, D5, D6, D7, D8, D0, D3};

struct LedState {
  bool on;
  uint8_t brightness;
  String mode;
};

LedState leds[LED_COUNT];
unsigned long lastEffectUpdate = 0;

void sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(int status, const String& body) {
  sendCorsHeaders();
  server.send(status, "application/json", body);
}

uint16_t pwmValue(const LedState& led) {
  if (!led.on) return 0;
  return map(led.brightness, 0, 100, 0, 1023);
}

void writeLed(uint8_t index, bool enabled) {
  if (index >= LED_COUNT) return;
  LedState current = leds[index];
  if (!enabled) current.on = false;
  analogWrite(LED_PINS[index], pwmValue(current));
}

void updateLeds() {
  const unsigned long now = millis();
  if (now - lastEffectUpdate < 40) return;
  lastEffectUpdate = now;

  for (uint8_t index = 0; index < LED_COUNT; index++) {
    const String& mode = leds[index].mode;
    bool enabled = leds[index].on;

    if (mode == "blink" && now % 1000 >= 500) enabled = false;
    if (mode == "strobe" && now % 200 >= 100) enabled = false;
    if (mode == "pulse") {
      const uint16_t phase = now % 2000;
      const uint16_t level = phase < 1000 ? phase : 2000 - phase;
      analogWrite(LED_PINS[index], enabled ? map(level, 0, 1000, 0, pwmValue(leds[index])) : 0);
      continue;
    }
    writeLed(index, enabled);
  }
}

void handleOptions() {
  sendCorsHeaders();
  server.send(204);
}

void handleHealth() {
  sendJson(200, "{\"status\":\"ok\",\"device\":\"esp8266-led-controller\",\"ledCount\":8}");
}

void handleLedCommand() {
  if (!server.hasArg("plain")) {
    sendJson(400, "{\"error\":\"JSON body required\"}");
    return;
  }

  StaticJsonDocument<2048> document;
  const DeserializationError error = deserializeJson(document, server.arg("plain"));
  if (error) {
    sendJson(400, "{\"error\":\"Invalid JSON\"}");
    return;
  }

  JsonArray requestedLeds = document["leds"].as<JsonArray>();
  if (requestedLeds.isNull()) {
    sendJson(400, "{\"error\":\"leds array required\"}");
    return;
  }

  for (JsonObject requested : requestedLeds) {
    const int id = requested["id"] | 0;
    if (id < 1 || id > LED_COUNT) continue;

    LedState& led = leds[id - 1];
    led.on = strcmp(requested["state"] | "OFF", "ON") == 0;
    led.brightness = constrain(requested["brightness"] | 100, 0, 100);
    led.mode = requested["mode"] | "solid";
  }

  updateLeds();
  sendJson(200, "{\"status\":\"ok\",\"message\":\"LEDs updated\"}");
}

void setup() {
  Serial.begin(115200);
  for (uint8_t index = 0; index < LED_COUNT; index++) {
    pinMode(LED_PINS[index], OUTPUT);
    leds[index] = {false, 0, "solid"};
    analogWrite(LED_PINS[index], 0);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP8266 disponible sur http://");
  Serial.println(WiFi.localIP());

  server.on("/api/led", HTTP_OPTIONS, handleOptions);
  server.on("/api/led", HTTP_POST, handleLedCommand);
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/health", HTTP_GET, handleHealth);
  server.onNotFound([]() {
    sendJson(404, "{\"error\":\"Route not found\"}");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  updateLeds();
}
