# Home Assistant LED Controller

Interface Web statique de pilotage de LEDs via un ESP8266 (NodeMCU ou
Wemos D1 mini). L'application fonctionne directement dans un navigateur et
ne nécessite ni framework JavaScript ni serveur applicatif pour son interface.

## Fonctionnalités

- Interface responsive adaptée aux ordinateurs, tablettes et téléphones.
- Gestion dynamique de 1 à 5 LEDs.
- Nommage des LEDs par couleur : rouge, jaune, vert, bleu, violet, orange et
  blanc.
- Commande individuelle ou globale des LEDs.
- Contrôle de la luminosité de 0 à 100 %.
- Modes d'éclairage fixe, respiration, clignotement et stroboscope.
- Commandes vocales en français.
- Mot d'activation « Home Assistant » pour lancer une commande vocale.
- Configuration de l'URL et du transport réseau HTTP/HTTPS.
- Génération automatique d'un firmware Arduino adapté au nombre de LEDs choisi.
- Console réseau et historique des commandes.
- Préférences conservées dans le stockage local du navigateur.

## Structure du projet

```text
home-assistant/
├── public/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── home-assistant-logo.png
│   ├── favicon.png
│   └── splash-circuits.svg
├── esp8266/
│   ├── README.md
│   └── led_controller.ino
└── README.md
```

Le dossier `public/` contient l'application Web. Le dossier `esp8266/`
contient un firmware Arduino de référence pour le contrôleur.

## Utilisation locale

Aucun outil de compilation n'est nécessaire pour tester l'interface.

### Méthode simple

Ouvrez le fichier suivant dans un navigateur :

```text
public/index.html
```

### Avec un serveur local

Un serveur local est recommandé pour éviter les restrictions de sécurité du
navigateur et tester correctement les fonctionnalités réseau et vocales.

Avec Python :

```powershell
py -m http.server 8080 --directory public
```

Puis ouvrez :

```text
http://localhost:8080
```

## Déploiement avec GitHub Pages

1. Publiez le projet dans un dépôt GitHub.
2. Ouvrez **Settings > Pages** dans le dépôt.
3. Dans **Build and deployment**, sélectionnez **Deploy from a branch**.
4. Sélectionnez la branche `main`.
5. Sélectionnez le dossier `/public`.
6. Enregistrez la configuration.

L'application sera ensuite disponible à l'adresse suivante :

```text
https://<votre-utilisateur>.github.io/<votre-depot>/
```

Si GitHub Pages est configuré pour publier la racine du dépôt, copiez le
contenu de `public/` à la racine ou utilisez un workflow de déploiement
adapté.

## Configuration de l'ESP8266

Le firmware généré par l'application utilise :

- `ESP8266WiFi.h` ;
- `ESP8266WebServer.h` ;
- `ArduinoJson.h`.

Avant le téléversement :

1. Installez le support des cartes ESP8266 dans l'IDE Arduino.
2. Installez la bibliothèque **ArduinoJson**.
3. Sélectionnez votre carte NodeMCU ou Wemos D1 mini.
4. Remplacez `VOTRE_WIFI_SSID` et `VOTRE_WIFI_PASSWORD`.
5. Vérifiez le nombre de LEDs et les broches utilisées.
6. Téléversez le firmware.
7. Ouvrez le moniteur série pour relever l'adresse IP de l'ESP8266.
8. Saisissez cette adresse dans la configuration réseau de l'application.

Les broches proposées par défaut sont :

| LED | Broche ESP8266 |
| --- | --- |
| LED 1 | D1 |
| LED 2 | D2 |
| LED 3 | D5 |
| LED 4 | D6 |
| LED 5 | D7 |

Pour des LEDs simples à deux broches, utilisez une résistance de 220 à
330 ohms par LED. Respectez les limites électriques de l'ESP8266 et évitez de
brancher directement une charge nécessitant davantage de courant qu'une sortie
GPIO ne peut fournir.

## Communication réseau

L'application envoie les commandes à l'endpoint suivant :

```text
POST http://<adresse-de-l-esp>/api/led
```

Le corps de la requête contient un tableau `leds` similaire à :

```json
{
  "leds": [
    {
      "id": 1,
      "state": "ON",
      "brightness": 80,
      "mode": "solid"
    }
  ]
}
```

Le firmware répond avec une confirmation JSON indiquant notamment le nombre
de LEDs configurées.

## Points importants concernant HTTPS et CORS

GitHub Pages fonctionne généralement en HTTPS. Un navigateur peut bloquer une
requête provenant d'une page HTTPS vers un ESP8266 accessible uniquement en
HTTP : c'est le mécanisme de sécurité appelé *mixed content*.

Pour un fonctionnement local, l'application et l'ESP8266 doivent idéalement
être sur le même réseau. Pour un accès distant sécurisé, il faut mettre en
place HTTPS sur le périphérique ou utiliser un proxy ou un serveur
intermédiaire compatible HTTPS.

Le firmware fournit les en-têtes CORS nécessaires aux requêtes de
l'application, mais CORS ne remplace pas une authentification réseau. Ne
publiez pas directement l'ESP8266 sur Internet sans ajouter une protection
adaptée.

## Reconnaissance vocale

La reconnaissance vocale dépend du navigateur et de ses permissions. Il faut :

- autoriser l'accès au microphone ;
- utiliser un navigateur compatible ;
- effectuer une première interaction avec la page ;
- privilégier une page servie en HTTPS ou depuis `localhost`.

Les commandes vocales peuvent cibler une LED par sa couleur ou toutes les
LEDs, par exemple :

```text
Allume la LED rouge
Éteins toutes les LEDs
Mets la LED bleue à 50 pour cent
Active le mode respiration sur toutes les LEDs
```

## Limites actuelles

- Le pilotage physique doit être testé sur le matériel réel après le
  téléversement du firmware.
- La configuration automatique proposée utilise au maximum cinq sorties GPIO.
- Les LEDs doivent être câblées avec les résistances et l'alimentation
  appropriées.
- La disponibilité de la reconnaissance vocale dépend du navigateur.
- Le firmware fourni n'implémente pas d'authentification réseau.

Pour plus de cinq LEDs, un expanseur GPIO tel qu'un MCP23017 ou un contrôleur
LED dédié devra être ajouté et pris en charge par un firmware spécifique.

## Licence

Ajoutez ici la licence de votre choix avant de distribuer publiquement le
projet. En l'absence de licence, le code reste protégé par le droit d'auteur
et son utilisation ou sa redistribution ne sont pas automatiquement
autorisées.
