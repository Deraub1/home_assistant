# Firmware ESP8266

Le fichier [`led_controller.ino`](./led_controller.ino) expose l'API attendue par
l'application web :

- `POST /api/led` avec un body JSON contenant `state`, `selectedLed`, `brightness`,
  `mode` et `leds[]`.
- `GET /api/health` pour vérifier la connexion.
- CORS activé pour permettre un hébergement de l'application sur un autre serveur.

## Mise en service

1. Installer le support de carte ESP8266 dans l'IDE Arduino.
2. Installer la bibliothèque **ArduinoJson**.
3. Renseigner `WIFI_SSID` et `WIFI_PASSWORD`.
4. Adapter `LED_PINS` au câblage réel. Les sorties doivent commander des LEDs
   via une résistance ou un transistor adapté, pas une charge forte directement.
5. Téléverser le sketch et noter l'adresse IP affichée dans le moniteur série.
6. Dans l'application, utiliser `http://ADRESSE_IP/api/led` avec le mode
   **Via Proxy Local Node**, ou `/api/led` si l'application est servie par l'ESP8266.

Les valeurs `solid`, `pulse`, `blink` et `strobe` sont prises en charge. La
luminosité est convertie en PWM sur 10 bits.
