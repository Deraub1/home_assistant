# Home Assistant - LED Controller avec ESP8266

Application de pilotage de LEDs via un ESP8266 (NodeMCU ou Wemos D1 mini),
avec prise en charge d'un expanseur GPIO MCP23017 pour piloter davantage de
LEDs. Disponible sur le Web, Android et Windows : les trois versions
réutilisent l'interface de `public/` ; Capacitor l'intègre dans l'application
Android et Electron la fournit dans un véritable installateur Windows.

## Fonctionnalités

- Interface responsive adaptée aux ordinateurs, tablettes et téléphones.
- Nombre de LEDs configuré en fonction du matériel : jusqu'à 5 avec l'ESP8266
  seul, ou jusqu'à 19 avec l'ESP8266 et un MCP23017.
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
- Chatbot Irina intégré à l'interface, capable d'exécuter les mêmes actions
  que la commande vocale et exposant une API JavaScript pour un adaptateur de
  messagerie externe.
- Sélecteur multilingue : français, anglais, espagnol, allemand, italien,
  portugais, néerlandais, japonais et chinois simplifié.
- Thèmes clair et sombre conservant leurs palettes natives, avec choix d'une
  couleur d'accent indépendante pour les boutons, textes, contrôles et cases à
  cocher.
- Mode **Couleur personnalisée** appliquant la couleur choisie à l'ensemble
  de l'interface, y compris les conteneurs, panneaux et contrôles internes.
- Préférence de thème et de couleur conservée localement, avec cohérence sur
  les pages de confidentialité, de conditions d'utilisation et d'erreur.
- Favicon rendu gris après 60 minutes d'inactivité, puis restauré après une
  interaction avec la page.
- Préférences conservées dans le stockage local du navigateur.

## Structure du projet

```text
home-assistant/
├── public/
│   ├── index.html
│   ├── downloads.html
│   ├── app.js
│   ├── style.css
│   ├── theme.js
│   ├── privacy.html
│   ├── terms.html
│   ├── legal.html
│   ├── 404.html
│   ├── home-assistant-logo.png
│   ├── favicon.png
│   ├── favicon-tab.png
│   ├── app-icon.png
│   ├── app-icon-512.png
│   └── splash-circuits.svg
├── android/                  # Projet Android natif généré/maintenu avec Capacitor
├── desktop/
│   ├── main.cjs              # Processus principal Electron
│   └── create-icon.cjs       # Génération de l'icône Windows .ico
├── capacitor.config.json
├── package.json
├── .github/
│   ├── agents/
│   └── workflows/            # GitHub Pages et publication des installateurs
├── index.html
└── README.md
```

Le dossier `public/` contient l'application Web et ses pages statiques
associées ; il est également embarqué tel quel dans les paquets Android et
Windows. Le firmware Arduino est généré à la demande depuis l'application ;
aucun dossier de firmware séparé n'est requis dans ce dépôt.

## Versions Web, Android et Windows

### Web

La version Web est publiée sur GitHub Pages sous le titre **Home Assistant -
LED Controller avec ESP8266** (voir [Déploiement avec GitHub
Pages](#déploiement-avec-github-pages)) et peut aussi être lancée localement
avec le serveur décrit dans [Utilisation locale](#utilisation-locale). Son
titre de site reste distinct du nom affiché par les applications installées.
Les liens d'installation et les versions publiées sont accessibles depuis la
[page de téléchargement](https://deraub1.github.io/home_assistant/downloads.html).

### Android

La version Android utilise Capacitor et porte le nom d'application
**Home Assistant**. `public/app-icon.png` est la source carrée de 1024 × 1024
de l’icône complète et reste inchangée. À chaque build Android, Gradle génère
depuis cette source une variante dédiée agrandie uniformément de 10 % et
recadrée au centre. Elle sert d’arrière-plan adaptatif, sur un fond bleu nuit
qui remplit les transparences ; le premier plan reste vide afin de ne pas
réduire le visuel une seconde fois. Le téléphone applique son masque circulaire
ou arrondi. `public/favicon-tab.png` reste la source de l’icône Windows et du
favicon du site. Prérequis : Node.js/npm, Android Studio et un SDK Android
compatible. Depuis la racine du dépôt :

```powershell
npm install
npm run android:sync
npm run android:open
```

Dans Android Studio, lancez l'application sur un appareil/émulateur ou utilisez
**Build > Build Bundle(s) / APK(s) > Build APK(s)** pour produire un APK.
Pour essayer le rendu de l’icône sans remplacer l’application installée,
générez une APK de prévisualisation distincte avec
`android\gradlew.bat -p android assembleDebug -PiconPreview` ; elle s’installe
à côté sous le nom **Home Assistant**.
Après chaque modification de `public/`, relancez `npm run android:sync` avant
de reconstruire. La connexion HTTP vers un ESP sur le réseau local est activée
pour cette application ; les commandes ne sont pas chiffrées en HTTP.

Pour distribuer un APK, utilisez une clé de signature Android privée et gardez
une sauvegarde sécurisée : toutes les mises à jour doivent être signées avec la
même clé. Ne commitez jamais le fichier de clé ni ses mots de passe.

### Installateur Windows

La version Windows est une application de bureau Electron qui embarque les
mêmes fichiers Web et crée un véritable installateur NSIS `.exe` (Windows
x64). Prérequis : Windows x64 et Node.js/npm. Depuis la racine du dépôt :

```powershell
npm install
npm run windows:dev
npm run windows:dist
```

`windows:dev` lance l'application de bureau. `windows:dist` génère
`artifacts/windows/Home Assistant Setup 1.0.12.exe`, avec raccourcis du menu Démarrer et
du bureau et choix du dossier d'installation. L'icône de l'installateur et de
l'application est générée à partir de l'icône mobile Android. Distribuer un
installateur non signé peut déclencher un avertissement Microsoft Defender
SmartScreen ; la signature de code nécessite un certificat de signature
Windows.

Pour éviter les erreurs de verrouillage pendant l'extraction d'Electron sur
Windows, la commande télécharge et vérifie l'archive officielle, puis prépare
une copie réutilisable dans
`%LOCALAPPDATA%\HomeAssistantBuild\electron-v<version>-win32-x64` avant de
lancer electron-builder. Cette méthode évite le renommage du dossier temporaire
qui peut échouer sous Windows.

Après chaque modification de `public/`, reconstruisez l'installateur pour
inclure les nouveaux fichiers. Les données de l'application et le compte local
restent propres à chaque cible et ne sont pas synchronisés entre navigateur,
téléphone et Windows.

### Téléchargement et publication des versions

La page `public/downloads.html` détecte les fichiers présents dans la dernière
[GitHub Release](https://github.com/Deraub1/home_assistant/releases). Les
boutons restent indisponibles tant que le fichier correspondant n'est pas
publié. Les fichiers binaires ne sont pas ajoutés au dépôt Git.

Le workflow `.github/workflows/release.yml` crée une Release et y joint
l'installateur Windows lors de la publication d'un tag `v*`. Il construit et
ajoute également un APK Android signé lorsque la signature est configurée.
Pour activer cette étape Android :

1. Dans un dossier privé hors du dépôt, créez une clé avec
   `keytool -genkeypair -v -keystore home-assistant-release.jks -alias home-assistant -keyalg RSA -keysize 4096 -validity 10000`.
   Keytool demande interactivement les mots de passe et les informations du
   certificat. Conservez en lieu sûr le fichier `.jks`, l'alias et les mots de
   passe ; la perte de la clé empêche de publier des mises à jour compatibles.
2. Dans **GitHub > Settings > Secrets and variables > Actions**, créez les
   secrets `ANDROID_KEYSTORE_BASE64` (contenu Base64 du fichier `.jks`),
   `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`.
   Sous PowerShell, copiez le contenu Base64 sans l'afficher dans le terminal
   avec `[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\home-assistant-release.jks")) | Set-Clipboard`,
   puis collez-le dans le secret correspondant.
   Ajoutez la variable de dépôt `ANDROID_RELEASE_ENABLED` avec la valeur
   `true`. Ne placez jamais ces valeurs dans le code ou dans un commit.
3. Créez et poussez un tag de version (par exemple `v1.0.12`). Le workflow
   génère l'installateur Windows et, si les secrets sont présents, l'APK signé
   puis les joint à la Release. Les boutons de la page de téléchargement
   s'activent dès que ces fichiers sont disponibles dans la dernière Release.
   Pour chaque mise à jour Android, augmentez également `versionCode` dans
   `android/app/build.gradle` afin que les appareils acceptent le nouvel APK.

### Logique des thèmes

Les modes **Clair** et **Sombre** conservent strictement leurs palettes
respectives. Le sélecteur de couleur reste disponible dans ces deux modes,
mais ne modifie que les accents prévus : boutons, certains textes, contrôles
et cases à cocher. Les fonds, conteneurs et couleurs structurelles restent
inchangés.

Le mode **Couleur personnalisée** utilise la couleur choisie pour l'ensemble
de l'interface, avec un calcul automatique du contraste des textes et des
contrôles pour préserver la lisibilité.

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

Le nom « Irina » s'anime lettre par lettre en suivant un grand huit horizontal,
comme une trajectoire de montagnes russes : chaque lettre suit la précédente
avec un mouvement régulier, puis rejoint progressivement sa position sous le
symbole. La pause automatique d'une minute commence après l'arrêt de la
dernière lettre. Lorsque le mode IA est actif, un toucher sur le nom peut
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

Pendant qu'Irina répond vocalement, la reconnaissance est suspendue afin
qu'elle n'entende pas sa propre voix. L'écoute reprend automatiquement à la
fin de la réponse.

Le mode IA accepte les formulations naturelles en français, y compris les
phrases polies ou indirectes. Par exemple, « Irina, est-ce que tu pourrais
mettre la verte à moitié et faire clignoter la jaune ? » est interprété comme
une demande de luminosité et d'effet. Une phrase peut appeler Irina et contenir
la commande immédiatement ; il n'est pas nécessaire de parler en deux fois.

### Chatbot et intégration de messagerie

Le panneau **Chatbot Irina** permet d'écrire des commandes directement dans
l'application. Il utilise Ollama lorsqu'il est disponible et conserve le
repli local pour les commandes standards. Il peut donc piloter les LEDs, la
luminosité, les effets, le thème, le réseau, les panneaux et le générateur de
firmware.

Pour connecter un adaptateur externe, par exemple un webhook WhatsApp hébergé
sur un serveur, l'application expose l'API suivante dans la page :

```javascript
const response = await window.irinaChatbot.sendMessage('Allume la LED rouge');
```

Un adaptateur WhatsApp doit recevoir le message via son webhook, l'acheminer
vers une session de l'application autorisée, puis renvoyer la réponse au
contact. Une page statique GitHub Pages ne peut pas recevoir directement les
webhooks WhatsApp ; un petit backend sécurisé reste nécessaire. Ne publiez
jamais les identifiants WhatsApp ou les accès Ollama dans le code client.

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
- Pour la configuration avec MCP23017, les bibliothèques **Adafruit
  MCP23X17** et **Adafruit BusIO**.

Avant le téléversement :

1. Installez le support des cartes ESP8266 dans l'IDE Arduino.
2. Installez la bibliothèque **ArduinoJson**.
3. Dans la configuration avec MCP23017, installez aussi **Adafruit
   MCP23X17** et **Adafruit BusIO** depuis le gestionnaire de bibliothèques.
4. Sélectionnez votre carte NodeMCU ou Wemos D1 mini et le matériel utilisé
   dans l'application : ESP8266 seul (1 à 5 LEDs) ou ESP8266 + MCP23017
   (1 à 19 LEDs).
5. Remplacez `VOTRE_WIFI_SSID` et `VOTRE_WIFI_PASSWORD`.
6. Vérifiez le nombre de LEDs et les broches utilisées.
7. Téléversez le firmware.
8. Ouvrez le moniteur série pour relever l'adresse IP de l'ESP8266.
9. Saisissez cette adresse dans la configuration réseau de l'application.

Les broches proposées par défaut sont :

| LED | Broche ESP8266 |
| --- | --- |
| LED 1 | D1 |
| LED 2 | D2 |
| LED 3 | D5 |
| LED 4 | D6 |
| LED 5 | D7 |

### Raccordement du MCP23017

Le mode **ESP8266 + MCP23017** réserve les broches I²C habituelles de
l'ESP8266 : **D1/SCL** et **D2/SDA**. Les LEDs 1 à 3 sont pilotées directement
par **D5, D6 et D7** ; les LEDs 4 à 19 utilisent les 16 sorties du MCP23017,
de **GPA0 à GPA7**, puis de **GPB0 à GPB7**. Le module est configuré à
l'adresse I²C **0x20** : reliez **A0, A1 et A2 à GND**. Reliez aussi SDA, SCL,
VDD (3,3 V) et les masses communes conformément au module utilisé.

Le firmware généré utilise un PWM logiciel sur les sorties du MCP23017 pour
la luminosité et les effets. Les sorties du MCP23017 ne fournissent pas de PWM
matériel. Chaque LED doit avoir sa résistance de limitation de courant.
Respectez les limites de courant du MCP23017 et de l'ESP8266 ; pour des charges
qui dépassent celles des GPIO, utilisez des transistors ou des pilotes adaptés
plutôt que d'alimenter directement la charge depuis le module.

Sans MCP23017, le firmware génère jusqu'à cinq sorties LED sur D1, D2, D5, D6
et D7. Avec le MCP23017, D1/D2 étant réservées à I²C, il génère trois sorties
directes plus 16 sorties MCP, soit 19 LEDs au maximum. Le sélecteur de
matériel ajuste automatiquement la limite du nombre de LEDs dans l'interface,
les commandes vocales/chat et le générateur de firmware.

## Communication réseau

Dans les trois versions, l'application envoie les commandes à l'endpoint
configuré dans le panneau réseau (par défaut, une adresse d'exemple) :

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

Le firmware généré fournit les en-têtes CORS nécessaires aux requêtes de
l'application. Le transport HTTP local est activé côté Android pour permettre
les appels à l'ESP ; dans Electron, la communication réseau utilise également
le firmware et ses en-têtes CORS. CORS ne remplace pas une authentification
réseau : le firmware généré n'authentifie pas les commandes. Gardez l'ESP sur
un réseau de confiance et ne le publiez pas directement sur Internet. Pour un
accès distant, mettez en place HTTPS et une protection adaptée.

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
- Le matériel sélectionné limite le circuit à 5 LEDs (ESP8266 seul) ou à
  19 LEDs (ESP8266 + un MCP23017). La limite correspondante est appliquée dans
  l'interface et lors de la génération du firmware.
- Les LEDs doivent être câblées avec les résistances et l'alimentation
  appropriées.
- La disponibilité de la reconnaissance vocale dépend du navigateur.
- Le firmware fourni n'implémente pas d'authentification réseau.
- Le MCP23017 ne fournit pas de PWM matériel ; la luminosité de ses sorties
  est produite par le PWM logiciel du firmware généré.

## Licence

Le projet est publié sans licence de logiciel : aucun fichier `LICENSE`
n'accorde de droits généraux de réutilisation, de modification ou de
redistribution. Le code reste protégé par le droit d'auteur ; la visibilité
publique du dépôt ne constitue pas, à elle seule, une autorisation de ces
usages. Contactez les titulaires des droits pour demander une autorisation.
