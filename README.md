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
- Mode IA optionnel avec Ollama pour piloter les LEDs et les fonctions de
  l'application (configuration, thème, méthode HTTP et panneaux), avec repli
  automatique vers l'interpréteur standard.
- Écoute active optionnelle avec le mot d'activation « Irina », qui lance les
  commandes vocales en temps réel.
- Gestes sonores dédiés : un tapement de mains ou un claquement de doigts
  allume toutes les LEDs ; deux gestes du même type les éteignent.
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

### Accès local au navigateur

Au premier lancement, l'application demande la création d'un nom d'utilisateur
et d'un mot de passe. Le compte est conservé uniquement dans le stockage local
du navigateur : le mot de passe n'est jamais enregistré en clair, mais cette
protection ne remplace pas une authentification serveur. Une session locale
persistante permet ensuite d'ouvrir l'application sans se reconnecter à chaque
visite. Effacer les données du site du navigateur supprimera le compte local.

### Mode IA local avec Ollama

Le mode IA est désactivé par défaut. Pour l'activer, installez [Ollama](https://ollama.com/),
puis téléchargez un modèle :

```powershell
ollama pull llama3.2
ollama serve
```

Ouvrez ensuite l'application via le serveur local et cochez **Mode IA** dans
la section de commande vocale. L'application utilise
`http://localhost:11434/api/chat`. Si Ollama est arrêté ou inaccessible, la
commande est automatiquement traitée par l'interpréteur vocal standard.

Quand le mode IA est actif, Irina reçoit le nom d'utilisateur du compte local
pour personnaliser naturellement ses salutations, confirmations et questions.
Elle peut répondre sans action, demander une précision (par exemple la LED
concernée) ou proposer une action. En cas d'indisponibilité d'Ollama, les
salutations et demandes d'aide courantes disposent d'un secours conversationnel
local.

Les salutations vocales suivent également l'heure locale du navigateur :
**Bonjour** en journée, **Bonsoir** en soirée et durant la nuit, **Good morning**
le matin et **Good evening** le reste du temps. Une formule familière comme
**Salut / Hi** est conservée lorsque l'utilisateur l'emploie.

L'utilisateur peut aussi changer son nom d'appel à tout moment avec une phrase
comme **« Appelle-moi Alex »**, **« Je préfère que tu m'appelles Alex »**,
**« Call me Alex »** ou **« My name is Alex »**. Ce nom d'appel est conservé
localement séparément du nom d'utilisateur de connexion et est utilisé par
Irina dans les échanges suivants.

Lorsqu'Irina utilise pour la première fois le nom de connexion, elle demande
également si elle peut appeler l'utilisateur ainsi. Une réponse affirmative
confirme ce nom ; une réponse négative lui permet de demander puis d'enregistrer
un autre nom d'appel. Cette confirmation n'est demandée qu'une seule fois dans
ce navigateur.

Le nom « Irina » s'anime lettre par lettre en suivant une trajectoire en huit :
chaque lettre suit la précédente, puis rejoint progressivement sa position
sous le symbole. La pause automatique d'une minute commence après l'arrêt de
la dernière lettre. Lorsque le mode IA est actif, un toucher sur le nom peut
également lancer immédiatement cette animation si elle n'est pas déjà en cours.

Pour utiliser les gestes sonores, cochez **Gestes sonores** dans la commande
vocale et autorisez l'accès au microphone. Un geste unique (tapement de mains
ou claquement de doigts) allume toutes les LEDs ; deux gestes rapprochés du
même type les éteignent. Ces gestes ne modifient pas le mode IA.

Pour utiliser l'écoute active, cochez **Écoute active « Irina »**. La
reconnaissance reste alors en attente du mot **Irina**, puis passe en écoute
temps réel. Le **Mode IA** reste indépendant : vous pouvez le cocher avant
d'activer l'écoute active si vous souhaitez qu'Irina utilise Ollama. Pour
terminer la session, dites **Stop**, **Arrête-toi**, **Au-revoir** ou
**Bye bye**, éventuellement suivi de **Irina**.

Le mode IA accepte les formulations naturelles en français, y compris les
phrases polies ou indirectes. Par exemple, « Irina, est-ce que tu pourrais
mettre la verte à moitié et faire clignoter la jaune ? » est interprété comme
une demande de luminosité et d'effet. Une phrase peut appeler Irina et contenir
la commande immédiatement ; il n'est pas nécessaire de parler en deux fois.

## Déploiement avec GitHub Pages

Le déploiement est automatisé par
[`.github/workflows/pages.yml`](./.github/workflows/pages.yml). Chaque push sur
`main` publie automatiquement le contenu de `public/` avec GitHub Actions. Le
workflow peut aussi être relancé manuellement depuis l'onglet **Actions**.

L'application sera ensuite disponible à l'adresse suivante :

```text
https://deraub1.github.io/home_assistant/
```

Le workflow configure les permissions Pages, construit l'artefact statique et
le publie dans l'environnement `github-pages`. La page d'accueil racine du
dépôt redirige également vers `public/` pour les consultations directes du
repository.

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
