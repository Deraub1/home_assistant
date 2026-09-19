/**
 * Application Web de Contrôle de Circuit LED Physique (Sélection LED 1 à LED n)
 * Communication REST / HTTP avec ESP32, ESP8266, Arduino ou Raspberry Pi
 * Support complet du Thème Clair/Sombre, de la Sélection de LED et des Commandes Vocales
 */

const AUTH_ACCOUNT_KEY = 'home_assistant_local_account';
const AUTH_SESSION_KEY = 'home_assistant_local_session';
const AUTH_DISPLAY_NAME_KEY = 'home_assistant_preferred_name';
const AUTH_NAME_CONFIRMATION_KEY = 'home_assistant_name_confirmation';

function getLocalUsername() {
 try {
   const account = JSON.parse(localStorage.getItem(AUTH_ACCOUNT_KEY) || 'null');
   return typeof account?.username === 'string' && account.username.trim()
     ? account.username.trim()
     : '';
 } catch {
   return '';
 }
}

function getPreferredUserName() {
 const preferredName = localStorage.getItem(AUTH_DISPLAY_NAME_KEY)?.trim();
 return preferredName || getLocalUsername();
}

function setPreferredUserName(name) {
 const normalizedName = name.replace(/\s+/g, ' ').trim().replace(/[.!?,;:]+$/, '');
 if (!/^[\p{L}\p{N}][\p{L}\p{N}' -]{1,39}$/u.test(normalizedName)) return false;
 localStorage.setItem(AUTH_DISPLAY_NAME_KEY, normalizedName);
 return true;
}

function isNameConfirmationHandled() {
 return localStorage.getItem(AUTH_NAME_CONFIRMATION_KEY) === 'handled';
}

function markNameConfirmationHandled() {
 localStorage.setItem(AUTH_NAME_CONFIRMATION_KEY, 'handled');
}

function getPreferredLanguage() {
 const savedLanguage = localStorage.getItem('language_preference');
 if (savedLanguage === 'fr' || savedLanguage === 'en') return savedLanguage;
 return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

const authLanguageText = {
 fr: {
   eyebrow: 'HOME ASSISTANT',
   createTitle: 'Créer votre accès',
   loginTitle: 'Se connecter',
   createDescription: 'Créez un compte local pour accéder à votre tableau de bord.',
   loginDescription: 'Entrez vos identifiants locaux pour ouvrir votre tableau de bord.',
   username: 'Nom d’utilisateur',
   password: 'Mot de passe',
   confirmPassword: 'Confirmer le mot de passe',
   createSubmit: 'Créer mon accès',
   loginSubmit: 'Ouvrir le tableau de bord',
   invalidCredentials: 'Nom d’utilisateur ou mot de passe invalide.',
   passwordMismatch: 'Les mots de passe ne correspondent pas.',
   wrongCredentials: 'Identifiants incorrects.',
   unexpectedError: 'Impossible de valider les identifiants.'
 },
 en: {
   eyebrow: 'HOME ASSISTANT',
   createTitle: 'Create your access',
   loginTitle: 'Sign in',
   createDescription: 'Create a local account to access your dashboard.',
   loginDescription: 'Enter your local credentials to open your dashboard.',
   username: 'Username',
   password: 'Password',
   confirmPassword: 'Confirm password',
   createSubmit: 'Create my access',
   loginSubmit: 'Open dashboard',
   invalidCredentials: 'Invalid username or password.',
   passwordMismatch: 'Passwords do not match.',
   wrongCredentials: 'Incorrect credentials.',
   unexpectedError: 'Unable to validate credentials.'
 }
};

async function hashLocalPassword(password, salt) {
 const data = new TextEncoder().encode(`${salt}:${password}`);
 const digest = await crypto.subtle.digest('SHA-256', data);
 return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function initializeLocalAuth() {
 const gate = document.getElementById('authGate');
 const form = document.getElementById('authForm');
 const title = document.getElementById('authTitle');
 const description = document.getElementById('authDescription');
 const eyebrow = document.getElementById('authEyebrow');
 const usernameLabel = document.getElementById('authUsernameLabel');
 const passwordLabel = document.getElementById('authPasswordLabel');
 const confirmLabel = document.getElementById('authConfirmLabel');
 const confirmInput = document.getElementById('authPasswordConfirm');
 const submit = document.getElementById('authSubmit');
 const message = document.getElementById('authMessage');
 if (!gate || !form || !title || !description || !eyebrow || !usernameLabel || !passwordLabel || !confirmLabel || !confirmInput || !submit || !message) return;

 const account = JSON.parse(localStorage.getItem(AUTH_ACCOUNT_KEY) || 'null');
 if (account && localStorage.getItem(AUTH_SESSION_KEY) === 'active') {
   gate.remove();
   return;
 }

 const loginMode = Boolean(account);
 const text = authLanguageText[getPreferredLanguage()];
 document.documentElement.lang = getPreferredLanguage();
 eyebrow.textContent = text.eyebrow;
 title.textContent = loginMode ? text.loginTitle : text.createTitle;
 description.textContent = loginMode ? text.loginDescription : text.createDescription;
 usernameLabel.textContent = text.username;
 passwordLabel.textContent = text.password;
 confirmLabel.textContent = text.confirmPassword;
 confirmLabel.hidden = loginMode;
 confirmInput.hidden = loginMode;
 confirmInput.required = !loginMode;
 confirmInput.autocomplete = loginMode ? 'off' : 'new-password';
 submit.textContent = loginMode ? text.loginSubmit : text.createSubmit;

 form.addEventListener('submit', async (event) => {
   event.preventDefault();
   message.textContent = '';
   submit.disabled = true;
   try {
     const username = form.elements.username.value.trim();
     const password = form.elements.password.value;
     if (!username || password.length < 8) throw new Error(text.invalidCredentials);
     if (!loginMode && password !== confirmInput.value) throw new Error(text.passwordMismatch);

     if (loginMode) {
       const passwordHash = await hashLocalPassword(password, account.salt);
       if (username !== account.username || passwordHash !== account.passwordHash) {
         throw new Error(text.wrongCredentials);
       }
     } else {
       const salt = crypto.randomUUID();
       const passwordHash = await hashLocalPassword(password, salt);
       localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ username, salt, passwordHash }));
     }
     localStorage.setItem(AUTH_SESSION_KEY, 'active');
     gate.remove();
     window.dispatchEvent(new Event('local-authenticated'));
   } catch (error) {
     message.textContent = error instanceof Error ? error.message : text.unexpectedError;
   } finally {
     submit.disabled = false;
   }
 });
}

document.addEventListener('DOMContentLoaded', async () => {
 await initializeLocalAuth();
 const appSplash = document.getElementById('appSplash');

  window.setTimeout(() => {
    if (!appSplash) return;
    appSplash.classList.add('app-splash-hidden');
    appSplash.addEventListener('transitionend', () => appSplash.remove(), { once: true });
  }, 1600);

  const faviconLink = document.querySelector('link[rel~="icon"]');
  const faviconInactiveDelay = 30 * 60 * 1000;
  const colorFaviconHref = faviconLink?.href;
  let faviconInactiveTimer;
  let grayscaleFavicon;
  let faviconIsInactive = false;

  function createGrayscaleFavicon() {
    if (!faviconLink || grayscaleFavicon) return;

    const image = new Image();
    image.addEventListener('load', () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.filter = 'grayscale(1)';
      context.drawImage(image, 0, 0);
      grayscaleFavicon = canvas.toDataURL('image/png');
      if (faviconIsInactive) faviconLink.href = grayscaleFavicon;
    }, { once: true });
    image.src = colorFaviconHref;
  }

  function setFaviconInactive(isInactive) {
    if (!faviconLink) return;
    faviconIsInactive = isInactive;
    if (isInactive) {
      createGrayscaleFavicon();
      if (grayscaleFavicon) faviconLink.href = grayscaleFavicon;
    } else {
      faviconLink.href = colorFaviconHref;
    }
  }

  function scheduleInactiveFavicon() {
    window.clearTimeout(faviconInactiveTimer);
    faviconInactiveTimer = window.setTimeout(() => setFaviconInactive(true), faviconInactiveDelay);
  }

  function markAppActive() {
    setFaviconInactive(false);
    scheduleInactiveFavicon();
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
    window.addEventListener(eventName, markAppActive, { passive: true });
  });
  window.addEventListener('focus', markAppActive);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) markAppActive();
  });
  createGrayscaleFavicon();
  scheduleInactiveFavicon();
  
  // --- Éléments du DOM ---
  const btnLanguageToggle = document.getElementById('btnLanguageToggle');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  let currentLanguage = getPreferredLanguage();
  const languageText = {
    fr: {
      language: 'EN', subtitle: 'Pilotez votre circuit physique en temps réel',
      themeTitle: 'Changer le thème (Clair / Sombre)', themeLight: 'Clair', themeDark: 'Sombre',
      connected: 'En ligne', disconnected: 'Non connecté', pingTitle: 'Tester le signal / Ping',
      config: 'Configuration du Circuit Physique', save: 'Enregistrer', apply: 'Appliquer',
      quick: 'Raccourcis Rapides', allOn: 'Allumer tout', allOff: 'Éteindre tout',
      voice: 'Commande Vocale (Speech)', synthesis: 'Synthèse', wake: '« Home Assistant »',
      ai: 'Mode IA', gestures: 'Gestes sonores', enableMic: 'Activer le micro',
      latest: 'Dernière instruction vocale :', supported: 'Commandes supportées :',
      clear: 'Effacer', brightness: 'Luminosité', brightnessAll: 'Appliquer à toutes les LEDs',
      effects: 'Effets simultanés par LED', networkLog: 'Console réseau & Envois HTTP',
      history: 'Historique des LEDs allumées au fil du temps', firmware: 'Générer le firmware',
      code: 'Copier le code dans le presse-papier'
    },
    en: {
      language: 'FR', subtitle: 'Control your physical circuit in real time',
      themeTitle: 'Change theme (Light / Dark)', themeLight: 'Light', themeDark: 'Dark',
      connected: 'Online', disconnected: 'Not connected', pingTitle: 'Test signal / Ping',
      config: 'Physical Circuit Configuration', save: 'Save', apply: 'Apply',
      quick: 'Quick shortcuts', allOn: 'Turn all on', allOff: 'Turn all off',
      voice: 'Voice Control (Speech)', synthesis: 'Speech', wake: '“Home Assistant”',
      ai: 'AI mode', gestures: 'Sound gestures', enableMic: 'Enable microphone',
      latest: 'Latest voice instruction:', supported: 'Supported commands:',
      clear: 'Clear', brightness: 'Brightness', brightnessAll: 'Apply to all LEDs',
      effects: 'Per-LED simultaneous effects', networkLog: 'Network console & HTTP requests',
      history: 'History of LEDs turned on over time', firmware: 'Generate firmware',
      code: 'Copy code to clipboard'
    }
  };
  const t = (key) => languageText[currentLanguage][key] || languageText.fr[key] || key;
  const uiText = (french, english) => currentLanguage === 'en' ? english : french;
  const formatClockTime = (date = new Date()) => date.toLocaleTimeString(
    currentLanguage === 'en' ? 'en-US' : 'fr-FR',
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: currentLanguage === 'en' }
  );
  const allLedsLabel = () => currentLanguage === 'en' ? 'All LEDs' : 'Toutes les LEDs';
  const effectLabel = (mode) => ({
    solid: currentLanguage === 'en' ? 'Solid' : 'Fixe',
    pulse: currentLanguage === 'en' ? 'Pulse' : 'Respiration',
    blink: currentLanguage === 'en' ? 'Blink' : 'Clignotement',
    strobe: currentLanguage === 'en' ? 'Strobe' : 'Stroboscope'
  }[mode] || mode);
  const colorLabel = (color) => currentLanguage === 'en' ? ({
    Rouge: 'Red', Jaune: 'Yellow', Vert: 'Green', Bleu: 'Blue',
    Violet: 'Purple', Orange: 'Orange', Blanc: 'White'
  }[color] || color) : color;
  const connectionLabel = (status) => ({
    connecting: currentLanguage === 'en' ? 'Sending...' : 'Envoi...',
    online: t('connected'),
    offline: currentLanguage === 'en' ? 'Offline' : 'Hors ligne'
  }[status] || status);
  const staticTranslations = {
    'Indicateur du mode IA': 'AI mode indicator',
    'Visualisation de l’écoute vocale': 'Voice listening visualization',
    "Visualisation de l'écoute vocale": 'Voice listening visualization',
    'Chargement de Home Assistant': 'Loading Home Assistant',
    'Adresse IP / URL de la LED (ESP8266 / ESP32 / Arduino / RPi)': 'LED IP address / URL (ESP8266 / ESP32 / Arduino / RPi)',
    'Nombre de LEDs dans le circuit': 'Number of LEDs in the circuit',
    'Méthode HTTP': 'HTTP method', 'POST avec Body JSON': 'POST with JSON body',
    'GET avec Query Params (?state=on...)': 'GET with query params (?state=on...)',
    'POST URL-Encoded': 'POST URL-encoded', 'Mode Réseau': 'Network mode',
    'Connexion sécurisée HTTPS': 'Secure HTTPS connection',
    'HTTPS chiffre les échanges ; le circuit doit disposer d’un certificat TLS et autoriser le CORS.': 'HTTPS encrypts traffic; the circuit must have a TLS certificate and allow CORS.',
    'Ex:': 'Example:',
    "si l'application est hébergée par l'ESP8266, ou": 'if the application is hosted by the ESP8266, or',
    'si l’application est hébergée par l’ESP8266, ou': 'if the application is hosted by the ESP8266, or',
    'depuis un autre serveur.': 'from another server.',
    'Obtenir le Code C++ pour mon ESP32 / Arduino': 'Get C++ code for my ESP32 / Arduino',
    'Miroir visuel des LEDs du circuit': 'Visual mirror of circuit LEDs',
    'Contrôle des trois premières LEDs': 'Control of the first three LEDs',
    'Allumer ou éteindre la LED rouge': 'Turn the red LED on or off',
    'Allumer ou éteindre la LED jaune': 'Turn the yellow LED on or off',
    'Allumer ou éteindre la LED verte': 'Turn the green LED on or off',
    'Configuration indépendante des LEDs': 'Independent LED configuration',
    'Activer les réponses vocales': 'Enable voice responses',
    'Activer le mot d’activation': 'Enable wake word',
    'Interpréter les commandes avec Ollama': 'Interpret commands with Ollama',
    'Détecter un tapement de mains ou un claquement de doigts': 'Detect claps or finger snaps',
    'Dernière instruction vocale :': 'Latest voice instruction:',
    '"Cliquez sur le micro et parlez..."': '"Click the microphone and speak..."',
    'Après autorisation du microphone, dites « Home Assistant » pour commencer une commande.': 'After allowing microphone access, say “Home Assistant” to start a command.',
    'Commandes supportées :': 'Supported commands:',
    'Action : "Allume" / "Éteins"': 'Action: “Turn on” / “Turn off”',
    'Cible : "toutes les LEDs"': 'Target: “all LEDs”',
    '"LED rouge" / "LED jaune" / "LED verte" / "LED bleue"': '“Red LED” / “Yellow LED” / “Green LED” / “Blue LED”',
    'Commandes multiples : "Allume la LED rouge et la LED jaune"': 'Multiple commands: “Turn on the red LED and the yellow LED”',
    'Mode IA : configurez les LEDs, le thème, le réseau et les panneaux par la voix': 'AI mode: configure LEDs, theme, network, and panels by voice',
    'Gestes : tapez des mains ou claquez des doigts pour basculer le mode IA': 'Gestures: clap or snap your fingers to toggle AI mode',
    '"LED violette" / "LED orange" / "LED blanche"': '“Purple LED” / “Orange LED” / “White LED”',
    '"Luminosité de 0 à 100%"': '“Brightness from 0 to 100%”',
    '"Mode fixe" / "Mode respiration"': '“Solid mode” / “Pulse mode”',
    '"Mode clignotement" / "Mode stroboscope"': '“Blink mode” / “Strobe mode”',
    'Arrêt vocal : "Stop", "Bye bye", "Au-revoir" ou "Arrête-toi"': 'Voice stop: “Stop”, “Bye bye”, “Goodbye”, or “Stop listening”',
    'Système initialisé. Prêt à communiquer avec le circuit.': 'System initialized. Ready to communicate with the circuit.',
    'Définit le nombre total de LEDs physiques du circuit.': 'Sets the total number of physical LEDs in the circuit.',
    'Toutes les LEDs éteintes (Initialisation)': 'All LEDs off (Initialization)',
    'Application prête. IP Cible :': 'Application ready. Target IP:',
    'Envoi': 'Sending', 'Cible': 'Target', 'Réponse': 'Response',
    'mise à jour sur le circuit': 'updated on the circuit',
    'Hors ligne': 'Offline', 'Offline': 'Hors ligne',
    'Échec de la connexion vers': 'Connection failed to',
    'Détail :': 'Details:', 'Serveur physique a répondu HTTP': 'Physical server returned HTTP',
    'Thème basculé en mode Clair': 'Theme switched to Light',
    'Thème basculé en mode Sombre': 'Theme switched to Dark',
    'Nombre total de LEDs du circuit configuré à': 'Total circuit LEDs set to',
    'Test de joignabilité de': 'Reachability test for',
    'Configuration enregistrée:': 'Configuration saved:',
    'Mode IA indisponible, interpréteur standard utilisé:': 'AI mode unavailable, standard interpreter used:',
    'Erreur reconnaissance vocale:': 'Speech recognition error:',
    'Code C++ prêt pour ESP8266WebServer': 'C++ code ready for ESP8266WebServer',
    'Console nettoyée.': 'Console cleared.',
    'Code copié dans le presse-papier !': 'Code copied to clipboard!',
    'Générez le firmware avec les options ci-dessus.': 'Generate firmware with the options above.',
    'Carte': 'Board', 'Nombre de LEDs': 'Number of LEDs',
    'Configurez le nombre de LEDs et la carte utilisée pour générer automatiquement le firmware correspondant.': 'Configure the LED count and board to automatically generate the matching firmware.',
    'Pour des LEDs simples, utilisez une résistance de 220 à 330 ohms par LED. Les broches proposées sont D1, D2, D5, D6 et D7.': 'For individual LEDs, use a 220–330 ohm resistor per LED. Available pins are D1, D2, D5, D6, and D7.'
    ,
    'Changer de langue': 'Change language',
    'Changer de langue (Français / English)': 'Switch language (Français / English)',
    'Changer le thème (Clair / Sombre)': 'Change theme (Light / Dark)',
    'Tester le signal / Ping': 'Test signal / Ping',
    'Utiliser une connexion chiffrée vers le circuit': 'Use an encrypted connection to the circuit'
  };
  const translateStatic = (value) => {
    if (currentLanguage === 'en') return staticTranslations[value] || value;
    const entry = Object.entries(staticTranslations).find(([, english]) => english === value);
    return entry ? entry[0] : value;
  };
  const translateFragment = (value) => {
    const entries = currentLanguage === 'en'
      ? Object.entries(staticTranslations)
      : Object.entries(staticTranslations).map(([french, english]) => [english, french]);
    return entries.sort((a, b) => b[0].length - a[0].length)
      .reduce((result, [source, target]) => result.split(source).join(target), value);
  };

  function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    localStorage.setItem('language_preference', currentLanguage);
    if (btnLanguageToggle) btnLanguageToggle.title = currentLanguage === 'fr'
      ? 'Changer de langue (Français / English)' : 'Switch language (Français / English)';
    const replacements = {
      'Pilotez votre circuit physique en temps réel': t('subtitle'),
      'Control your physical circuit in real time': t('subtitle'),
      'Configuration du Circuit Physique': t('config'), Enregistrer: t('save'), Appliquer: t('apply'),
      'Raccourcis Rapides': t('quick'), 'Allumer tout': t('allOn'), 'Éteindre tout': t('allOff'),
      'Commande Vocale (Speech)': t('voice'), Synthèse: t('synthesis'), 'Mode IA': t('ai'),
      'Gestes sonores': t('gestures'), '« Home Assistant »': t('wake'),
      'Activer le micro': t('enableMic'), 'Luminosité': t('brightness'),
      'Appliquer à toutes les LEDs': t('brightnessAll'), 'Effets simultanés par LED': t('effects'),
      'Console réseau & Envois HTTP': t('networkLog'),
      'Historique des LEDs allumées au fil du temps': t('history'),
      'Générer le firmware': t('firmware'), 'Copier le code dans le presse-papier': t('code'),
      Effacer: t('clear'), Clear: t('clear'),
      'Non connecté': t('disconnected'),
      'Physical Circuit Configuration': t('config'), Save: t('save'), Apply: t('apply'),
      'Quick shortcuts': t('quick'), 'Turn all on': t('allOn'), 'Turn all off': t('allOff'),
      'Voice Control (Speech)': t('voice'), Speech: t('synthesis'), 'AI mode': t('ai'),
      'Sound gestures': t('gestures'), 'Enable microphone': t('enableMic'),
      Brightness: t('brightness'), 'Apply to all LEDs': t('brightnessAll'),
      'Per-LED simultaneous effects': t('effects'),
      'Network console & HTTP requests': t('networkLog'),
      'History of LEDs turned on over time': t('history'),
      'Generate firmware': t('firmware'), 'Copy code to clipboard': t('code'),
      'Not connected': t('disconnected'),
      'Solid': currentLanguage === 'fr' ? 'Fixe' : 'Solid',
      Pulse: currentLanguage === 'fr' ? 'Respiration' : 'Pulse',
      Blink: currentLanguage === 'fr' ? 'Clignotement' : 'Blink',
      Strobe: currentLanguage === 'fr' ? 'Stroboscope' : 'Strobe',
      'Not specified': currentLanguage === 'fr' ? 'Non précisée' : 'Not specified',
      'Fixe': currentLanguage === 'en' ? 'Solid' : 'Fixe',
      'Respiration': currentLanguage === 'en' ? 'Pulse' : 'Respiration',
      'Clignotement': currentLanguage === 'en' ? 'Blink' : 'Clignotement',
      'Stroboscope': currentLanguage === 'en' ? 'Strobe' : 'Stroboscope',
      'Non précisée': currentLanguage === 'en' ? 'Not specified' : 'Non précisée',
    };
    const languageEntries = [
      ...Object.entries(staticTranslations).map(([french, english]) => (
        currentLanguage === 'en' ? [french, english] : [english, french]
      )),
      ...Object.entries(replacements)
    ]
      .filter(([source, target]) => source !== target)
      .sort((first, second) => second[0].length - first[0].length);
    const translateCurrentFragment = (value) => languageEntries
      .reduce((result, [source, target]) => result.split(source).join(target), value);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const value = node.nodeValue.trim();
      const translated = translateCurrentFragment(value);
      if (translated && translated !== value) node.nodeValue = node.nodeValue.replace(value, translated);
    });
    document.querySelectorAll('[aria-label]').forEach(element => {
      element.setAttribute('aria-label', translateCurrentFragment(element.getAttribute('aria-label')));
    });
    document.querySelectorAll('[placeholder]').forEach(element => {
      element.setAttribute('placeholder', translateCurrentFragment(element.getAttribute('placeholder')));
    });
    document.querySelectorAll('[title]').forEach(element => {
      const translated = translateCurrentFragment(element.getAttribute('title'));
      if (translated !== element.getAttribute('title')) element.setAttribute('title', translated);
    });
    document.querySelectorAll('[title]').forEach(element => {
      if (element.title === 'Changer le thème (Clair / Sombre)' || element.title === 'Change theme (Light / Dark)') {
        element.title = t('themeTitle');
      }
    });
    if (btnLanguageToggle) document.getElementById('languageToggleText').textContent = t('language');
    const themeToggleText = document.getElementById('themeToggleText');
    if (themeToggleText) themeToggleText.textContent = currentTheme === 'light' ? t('themeLight') : t('themeDark');
    if (statusText) {
      const statusKey = statusText.dataset.status;
      if (statusKey) statusText.textContent = connectionLabel(statusKey);
      else statusText.textContent = translateCurrentFragment(statusText.textContent);
    }
    updateVoiceLanguage();
    rebuildLedSelectDropdown();
    rebuildLedAssignments();
    updateVisualLEDState();
    renderInitialHistoryEntry();
    logConsole?.querySelectorAll('[data-timestamp]').forEach((entry) => {
      const timestamp = Number(entry.dataset.timestamp);
      const timeElement = entry.querySelector('.log-time');
      if (timeElement && Number.isFinite(timestamp)) {
        timeElement.textContent = `[${formatClockTime(new Date(timestamp))}]`;
      }
    });
    ledActivationHistory?.querySelectorAll('[data-timestamp]').forEach((entry) => {
      const timestamp = Number(entry.dataset.timestamp);
      const timeElement = entry.querySelector('.history-time');
      if (timeElement && Number.isFinite(timestamp)) {
        timeElement.textContent = `[${formatClockTime(new Date(timestamp))}]`;
      }
    });
    ledActivationHistory?.querySelectorAll('[data-history-entry="true"]').forEach(renderHistoryEntry);
  }

  btnLanguageToggle?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    applyLanguage();
    addLog(currentLanguage === 'en' ? 'Language switched to English.' : 'Langue changée en français.', 'info');
  });
  
  const deviceUrlInput = document.getElementById('deviceUrl');
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const httpMethodSelect = document.getElementById('httpMethod');
  const secureTransport = document.getElementById('secureTransport');

  const connectionBadge = document.getElementById('connectionBadge');
  const statusText = document.getElementById('statusText');
  const btnCheckPing = document.getElementById('btnCheckPing');
  const pingValue = document.getElementById('pingValue');

  const ledControlButtonsContainer = document.querySelector('.led-control-buttons');
  const ledOrbGrid = document.getElementById('ledOrbGrid');
  const ledStateText = document.getElementById('ledStateText');
  const ledDetailsText = document.getElementById('ledDetailsText');
  const statusPrimaryText = document.getElementById('statusPrimaryText');
  const statusSecondaryText = document.getElementById('statusSecondaryText');
  const statusLiveBadge = document.getElementById('statusLiveBadge');
  const statusIconPill = document.getElementById('statusIconPill');

  const brightnessRange = document.getElementById('brightnessRange');
  const brightnessValue = document.getElementById('brightnessValue');
  const applyBrightnessToAll = document.getElementById('applyBrightnessToAll');

  const ledSelect = document.getElementById('ledSelect');
  const ledChips = document.querySelectorAll('.led-chip');

  const presetChips = document.querySelectorAll('.preset-chip');
  const ledAssignments = document.getElementById('ledAssignments');

  const logConsole = document.getElementById('logConsole');
  const btnClearLog = document.getElementById('btnClearLog');

  const btnOpenCodeModal = document.getElementById('btnOpenCodeModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const codeModal = document.getElementById('codeModal');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const btnGenerateFirmware = document.getElementById('btnGenerateFirmware');
  const firmwareBoard = document.getElementById('firmwareBoard');
  const firmwareLedCount = document.getElementById('firmwareLedCount');
  const espCodeSnippet = document.getElementById('espCodeSnippet');

  // Historique ordonné d'activation des LEDs DOM
  const ledActivationHistory = document.getElementById('ledActivationHistory');
  const btnClearLedHistory = document.getElementById('btnClearLedHistory');

  // Configuration du nombre de LEDs DOM
  const totalLedsInput = document.getElementById('totalLedsInput');
  const btnUpdateTotalLeds = document.getElementById('btnUpdateTotalLeds');

  // Commande Vocale DOM
  const btnVoiceMic = document.getElementById('btnVoiceMic');
  const micBtnText = document.getElementById('micBtnText');
  const voiceTranscript = document.getElementById('voiceTranscript');
  const toggleSpeechFeedback = document.getElementById('toggleSpeechFeedback');
  const toggleVoiceWakeWord = document.getElementById('toggleVoiceWakeWord');
  const toggleVoiceAi = document.getElementById('toggleVoiceAi');
  const toggleSoundGestures = document.getElementById('toggleSoundGestures');
  const voiceCard = document.querySelector('.voice-card');
  class VoiceAiIndicator extends HTMLElement {
    connectedCallback() {
      if (this.childElementCount) return;
      this.innerHTML = `
        <div class="ai-indicator-shell">
          <img class="ai-indicator-image" src="voice-ai-symbol.png" alt="" aria-hidden="true">
        </div>
        <div class="ai-indicator-name" aria-label="Irina">
          <span class="ai-name-letter">I</span><span class="ai-name-letter">r</span><span class="ai-name-letter">i</span><span class="ai-name-letter">n</span><span class="ai-name-letter">a</span>
        </div>`;
      this.nameElement = this.querySelector('.ai-indicator-name');
      this.nameLetters = [...this.querySelectorAll('.ai-name-letter')];
      this.handleNamePointer = () => this.startNameAnimation(true);
      this.nameElement.addEventListener('pointerup', this.handleNamePointer);
      this.nameElement.addEventListener('click', this.handleNamePointer);
      this.addEventListener('pointerup', (event) => {
        if (event.target === this.nameElement) return;
        const nameRect = this.nameElement.getBoundingClientRect();
        if (event.clientX >= nameRect.left && event.clientX <= nameRect.right
          && event.clientY >= nameRect.top && event.clientY <= nameRect.bottom) {
          this.startNameAnimation(true);
        }
      });
      this.setState('idle');
    }

    disconnectedCallback() {
      window.clearTimeout(this.nameAnimationTimer);
      this.nameElement?.removeEventListener('pointerup', this.handleNamePointer);
      this.nameElement?.removeEventListener('click', this.handleNamePointer);
      this.setState('idle');
    }

    setAiActive(active) {
      this.classList.toggle('ai-enabled', Boolean(active));
      if (!active) {
        this.stopNameAnimation();
        this.setState('idle');
        return;
      }
      this.scheduleNameAnimation();
    }

    scheduleNameAnimation() {
      window.clearTimeout(this.nameAnimationTimer);
      if (!this.classList.contains('ai-enabled')) return;
      this.nameAnimationTimer = window.setTimeout(() => {
        this.startNameAnimation(false);
      }, 60000);
    }

    startNameAnimation(manual = false) {
      if ((!manual && !this.classList.contains('ai-enabled')) || this.classList.contains('name-is-rolling')) return;
      this.classList.remove('name-is-rolling');
      void this.offsetWidth;
      this.classList.add('name-is-rolling');
      window.clearTimeout(this.nameAnimationEndTimer);
      this.nameAnimationEndTimer = window.setTimeout(() => {
        this.classList.remove('name-is-rolling');
        this.scheduleNameAnimation();
      }, 4550);
    }

    stopNameAnimation() {
      window.clearTimeout(this.nameAnimationTimer);
      window.clearTimeout(this.nameAnimationEndTimer);
      this.classList.remove('name-is-rolling');
    }

    setState(state) {
      this.classList.remove('is-listening', 'is-thinking', 'is-confirming', 'is-error');
      if (state === 'listening') this.classList.add('is-listening');
      if (state === 'thinking') this.classList.add('is-thinking');
      if (state === 'success' || state === 'error') {
        this.classList.add('is-confirming');
        if (state === 'error') this.classList.add('is-error');
        window.setTimeout(() => this.setState('idle'), 900);
      }
    }

    setVolume(volume) {
      this.style.setProperty('--ai-volume', Math.max(0, Math.min(1, Number(volume) || 0)));
    }

    onActiveMicro(volume = 0.55) {
      this.setVolume(volume);
      this.setState('listening');
    }

    onFinishSpeaking() {
      this.setState('thinking');
    }

    onActionComplete(success = true) {
      this.setState(success ? 'success' : 'error');
    }
  }
  if (!customElements.get('voice-ai-indicator')) {
    customElements.define('voice-ai-indicator', VoiceAiIndicator);
  }
  const voiceAiIndicator = document.getElementById('voiceAiIndicator');
  const ledColors = {
    '1': '#ff304f',
    '2': '#ffd21f',
    '3': '#39ff14'
  };
  const ledColorOptions = ['Rouge', 'Jaune', 'Vert', 'Bleu', 'Violet', 'Orange', 'Blanc'];
  const ledColorValues = {
    Rouge: '#ff304f',
    Jaune: '#ffd21f',
    Vert: '#39ff14',
    Bleu: '#269cff',
    Violet: '#b56bff',
    Orange: '#ff8a1f',
    Blanc: '#f8fafc'
  };
  const savedLedNames = JSON.parse(localStorage.getItem('led_names') || '{}');

  function getDefaultLedName(ledId, savedNames = savedLedNames) {
    const savedName = savedNames[String(ledId)];
    if (savedName && savedName !== `LED ${ledId}`) return savedName;

    return {
      1: 'Rouge',
      2: 'Jaune',
      3: 'Vert'
    }[ledId] || `LED ${ledId}`;
  }

  // --- État Local de la LED & Matériel ---
  const defaultDeviceUrl = 'http://192.168.1.45/api/led';

  let state = {
    isOn: false,
    selectedLed: '1', // '1', '2', '3', ... 'ALL'
    totalLeds: parseInt(localStorage.getItem('led_total_count'), 10) || 1,
    brightness: parseInt(brightnessRange.value, 10) || 80,
    mode: 'solid',
    deviceUrl: localStorage.getItem('led_device_url') || defaultDeviceUrl,
    httpMethod: localStorage.getItem('led_http_method') || 'POST_JSON',
    secureTransport: localStorage.getItem('led_secure_transport') === 'true',
    leds: []
  };

  state.leds = Array.from({ length: state.totalLeds }, (_, index) => ({
    id: String(index + 1),
    name: getDefaultLedName(index + 1),
    isOn: false,
    brightness: state.brightness,
    mode: 'solid'
  }));

  // Initialisation des champs
  deviceUrlInput.value = state.deviceUrl;
  httpMethodSelect.value = state.httpMethod;
  secureTransport.checked = state.secureTransport;
  if (totalLedsInput) totalLedsInput.value = state.totalLeds;

  // --- Regénération dynamique de la liste déroulante de sélection des LEDs ---

  function getLedConfig(ledId) {
    return state.leds.find(led => led.id === String(ledId));
  }

  function getLedColor(ledId) {
    const led = getLedConfig(ledId);
    if (led && ledColorValues[led.name]) {
      return ledColorValues[led.name];
    }
    return ledColors[String(ledId)] || '#9ca3af';
  }

  function getLedName(ledId) {
    const led = getLedConfig(ledId);
    return led ? led.name : `LED ${ledId}`;
  }

  function getVoiceLedName(ledId) {
    const name = getLedName(ledId);
    const feminineColorNames = {
      vert: 'verte',
      bleu: 'bleue',
      violet: 'violette',
      blanc: 'blanche'
    };
    const normalizedName = normalizeVoiceText(name);
    const feminineName = feminineColorNames[normalizedName];
    return feminineName || name;
  }

  function normalizeVoiceText(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getVoiceLedAliases(led) {
    const aliases = [normalizeVoiceText(led.name)];
    const feminineAliases = {
      jaune: 'jaune',
      orange: 'orange',
      rouge: 'rouge',
      vert: 'verte',
      bleu: 'bleue',
      violet: 'violette',
      blanc: 'blanche',
      red: 'red',
      yellow: 'yellow',
      green: 'green',
      blue: 'blue',
      purple: 'purple',
      white: 'white'
    };
    const feminineAlias = feminineAliases[normalizeVoiceText(led.name)];
    if (feminineAlias) aliases.push(feminineAlias);
    const englishAliases = {
      rouge: 'red', jaune: 'yellow', vert: 'green', verte: 'green',
      bleu: 'blue', bleue: 'blue', violet: 'purple', violette: 'purple',
      orange: 'orange', blanc: 'white', blanche: 'white'
    };
    if (englishAliases[normalizeVoiceText(led.name)]) aliases.push(englishAliases[normalizeVoiceText(led.name)]);
    return [...new Set(aliases)].filter(alias => alias && !alias.startsWith('led '));
  }

  function findVoiceLedIds(command) {
    const normalizedCommand = normalizeVoiceText(command);
    const matches = state.leds
      .flatMap(led => getVoiceLedAliases(led).map(alias => ({ led, alias })))
      .sort((first, second) => second.alias.length - first.alias.length);
    const matchedIds = new Set();

    matches.forEach(({ led, alias }) => {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?:\\bled\\s+)?\\b${escapedAlias}\\b`);
      if (pattern.test(normalizedCommand)) matchedIds.add(led.id);
    });

    return [...matchedIds];
  }

  function getTargetLedIds() {
    if (state.selectedLed === 'ALL') {
      return state.leds.map(led => led.id);
    }
    return [state.selectedLed];
  }

  function getBrightnessTargetIds() {
    return applyBrightnessToAll.checked ? state.leds.map(led => led.id) : getTargetLedIds();
  }

  function syncControlsFromSelection() {
    const selected = state.selectedLed === 'ALL'
      ? state.leds[0]
      : getLedConfig(state.selectedLed);
    if (!selected) return;

    state.isOn = state.selectedLed === 'ALL'
      ? state.leds.some(led => led.isOn)
      : selected.isOn;
    state.brightness = selected.brightness;
    state.mode = selected.mode;
    brightnessRange.value = String(state.brightness);
    brightnessValue.textContent = `${state.brightness}%`;
  }

  function rebuildLedControlButtons() {
    if (!ledControlButtonsContainer) return;

    ledControlButtonsContainer.querySelectorAll('.led-control-button-extra').forEach(button => button.remove());
    state.leds.slice(3).forEach(led => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'led-control-button led-control-button-extra';
      button.dataset.led = led.id;
      button.setAttribute('aria-label', currentLanguage === 'en'
        ? `Turn ${colorLabel(led.name)} on or off` : `Allumer ou éteindre ${led.name}`);
      button.innerHTML = `
        <span class="led-control-light" aria-hidden="true"></span>
        <span class="led-control-label">${colorLabel(led.name)}</span>
      `;
      ledControlButtonsContainer.appendChild(button);
    });
  }

  function rebuildLedAssignments() {
    if (!ledAssignments) return;

    ledAssignments.innerHTML = '';
    state.leds.forEach((led) => {
      const row = document.createElement('div');
      row.className = 'led-assignment-row';
      row.innerHTML = `
        <span class="led-assignment-name">LED ${led.id}</span>
        <select class="form-select led-name-select" data-led="${led.id}" aria-label="${currentLanguage === 'en' ? 'LED color' : 'Couleur de la LED'} ${led.id}">
          <option value="">${currentLanguage === 'en' ? 'Not specified' : 'Non précisée'}</option>
          ${ledColorOptions.map(color => `<option value="${color}">${colorLabel(color)}</option>`).join('')}
        </select>
        <select class="form-select led-effect-select" data-led="${led.id}" aria-label="${currentLanguage === 'en' ? 'LED effect' : 'Effet de la LED'} ${led.id} (${colorLabel(led.name)})">
          <option value="solid">${effectLabel('solid')}</option>
          <option value="pulse">${effectLabel('pulse')}</option>
          <option value="blink">${effectLabel('blink')}</option>
          <option value="strobe">${effectLabel('strobe')}</option>
        </select>
        <button
          type="button"
          class="btn-text led-power-button${led.isOn ? ' is-on' : ''}"
          data-led="${led.id}"
          aria-label="${currentLanguage === 'en'
            ? `${led.isOn ? 'Turn off' : 'Turn on'} ${colorLabel(led.name)}`
            : `${led.isOn ? 'Éteindre' : 'Allumer'} ${led.name}`}"
          aria-pressed="${led.isOn}"
        ><span class="led-power-symbol" aria-hidden="true">&#x23FB;&#xFE0E;</span><span class="led-power-label">${led.isOn ? 'On' : 'Off'}</span></button>
      `;
      row.querySelector('.led-name-select').value = ledColorOptions.includes(led.name) ? led.name : '';
      row.querySelector('.led-effect-select').value = led.mode;
      ledAssignments.appendChild(row);
    });

    ledAssignments.querySelectorAll('.led-name-select').forEach(select => {
      select.addEventListener('change', (event) => {
        const led = getLedConfig(event.target.dataset.led);
        led.name = event.target.value || `LED ${led.id}`;
        localStorage.setItem('led_names', JSON.stringify(
          Object.fromEntries(state.leds.map(item => [item.id, item.name]))
        ));
        rebuildLedOrbs();
        updateVisualLEDState();
        rebuildLedAssignments();
      });
    });

    ledAssignments.querySelectorAll('.led-effect-select').forEach(select => {
      select.addEventListener('change', (event) => {
        const led = getLedConfig(event.target.dataset.led);
        led.mode = event.target.value;
        if (state.selectedLed === led.id) syncControlsFromSelection();
        updateVisualLEDState();
        sendHardwareRequest();
      });
    });

    ledAssignments.querySelectorAll('.led-power-button').forEach(button => {
      button.addEventListener('click', () => {
        const led = getLedConfig(button.dataset.led);
        led.isOn = !led.isOn;
        state.selectedLed = led.id;
        syncControlsFromSelection();
        rebuildLedAssignments();
        sendHardwareRequest();
      });
    });
  }

  function rebuildLedSelectDropdown() {
    if (!ledSelect) return;

    const previousSelected = state.selectedLed;
    ledSelect.innerHTML = '';

    for (let i = 1; i <= state.totalLeds; i++) {
      const option = document.createElement('option');
      option.value = i.toString();
      option.textContent = `LED ${i}`;
      if (previousSelected === i.toString()) {
        option.selected = true;
      }

      ledSelect.appendChild(option);
    }

    const allOption = document.createElement('option');
    allOption.value = 'ALL';
    allOption.textContent = currentLanguage === 'en'
      ? `All LEDs (1 to ${state.totalLeds})`
      : `Toutes les LEDs (1 à ${state.totalLeds})`;
    if (previousSelected === 'ALL' || parseInt(previousSelected, 10) > state.totalLeds) {
      allOption.selected = true;
      state.selectedLed = 'ALL';
    }
    ledSelect.appendChild(allOption);

    if (previousSelected !== 'ALL' && parseInt(previousSelected, 10) > state.totalLeds) {
      state.selectedLed = '1';
      ledSelect.value = '1';
    }
  }

  function rebuildLedOrbs() {
    if (!ledOrbGrid) return;

    ledOrbGrid.innerHTML = '';
    ledOrbGrid.dataset.count = String(state.totalLeds);

    for (let i = 1; i <= state.totalLeds; i++) {
      const orb = document.createElement('div');
      orb.className = 'led-orb led-off';
      orb.dataset.led = String(i);
      orb.setAttribute('aria-label', getLedName(i));
      orb.innerHTML = `<div class="led-inner-glow"></div><span class="led-orb-index">${i}</span>`;
      ledOrbGrid.appendChild(orb);
    }
  }

  // --- 🌗 Gestion du Thème Clair / Sombre ---
  let currentTheme = localStorage.getItem('theme_preference') || 'light';

  function updateAiVisualState() {
    const active = Boolean(toggleVoiceAi?.checked);
    voiceCard?.classList.toggle('ai-active', active);
    voiceAiIndicator?.setAiActive(active);
  }

  function setVoiceVisualState(stateName) {
    if (stateName === 'listening') voiceAiIndicator?.onActiveMicro();
    else if (stateName === 'processing') voiceAiIndicator?.onFinishSpeaking();
    else if (stateName === 'confirmation') voiceAiIndicator?.onActionComplete(true);
    else if (stateName === 'error') voiceAiIndicator?.onActionComplete(false);
    else voiceAiIndicator?.setState('idle');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme_preference', theme);

    if (theme === 'light') {
      btnThemeToggle.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-sun"></use></svg><span id="themeToggleText">${t('themeLight')}</span>`;
    } else {
      btnThemeToggle.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-moon"></use></svg><span id="themeToggleText">${t('themeDark')}</span>`;
    }
    btnThemeToggle.title = t('themeTitle');
  }

  btnThemeToggle.addEventListener('click', () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    addLog(`🎨 Thème basculé en mode ${newTheme === 'light' ? 'Clair' : 'Sombre'}`, 'info');
  });

  applyTheme(currentTheme);

  rebuildLedSelectDropdown();
  rebuildLedOrbs();
  rebuildLedControlButtons();
  rebuildLedAssignments();
  syncControlsFromSelection();

  // --- Fonctions d'Affichage & Mise à jour UI ---

  function updateVisualLEDState() {
    // 1. Boutons des trois LEDs principales & texte d'état
    const ledName = state.selectedLed === 'ALL' ? allLedsLabel() : getLedName(state.selectedLed);
    const selectedConfig = getLedConfig(state.selectedLed);
    const activeCount = state.leds.filter(led => led.isOn).length;

    ledControlButtonsContainer?.querySelectorAll('.led-control-button').forEach(button => {
      const led = getLedConfig(button.dataset.led);
      button.classList.toggle('is-on', Boolean(led && led.isOn));
      button.classList.toggle('is-unavailable', !led);
      button.disabled = !led;
      if (led) {
        const assignedColor = ledColorValues[led.name];
        button.classList.toggle('led-control-neutral', !assignedColor);
        button.classList.toggle('led-control-assigned', Boolean(assignedColor));
        if (assignedColor) {
          button.style.setProperty('--led-assigned-color', assignedColor);
        } else {
          button.style.setProperty('--led-assigned-color', getLedColor(led.id));
        }
        button.setAttribute('aria-label', currentLanguage === 'en'
          ? `Turn ${colorLabel(led.name)} on or off` : `Allumer ou éteindre ${led.name}`);
        const label = button.querySelector('.led-control-label');
        if (label) label.textContent = colorLabel(led.name);
      }
    });

    if (activeCount > 0) {
      ledStateText.textContent = currentLanguage === 'en'
        ? `${activeCount} LED${activeCount > 1 ? 's' : ''} ON`
        : `${activeCount} LED${activeCount > 1 ? 'S' : ''} ALLUMÉE${activeCount > 1 ? 'S' : ''}`;
      ledStateText.style.color = 'var(--primary)';
    } else {
      ledStateText.textContent = currentLanguage === 'en' ? 'OFF' : 'ÉTEINT';
      ledStateText.style.color = 'var(--text-muted)';
    }

    // 2. Miroir visuel : une lampe par LED du circuit
    const orbs = ledOrbGrid ? ledOrbGrid.querySelectorAll('.led-orb') : [];
    const opacityFactor = Math.max(0.3, state.brightness / 100);

    orbs.forEach((orb) => {
      const led = getLedConfig(orb.dataset.led);
      const shouldGlow = led && led.isOn;

      orb.classList.remove('led-on', 'led-off', 'led-pulse', 'led-blink', 'led-strobe');

      if (shouldGlow) {
        orb.classList.add('led-on');
        orb.style.setProperty('--current-color', getLedColor(led.id));
        orb.style.opacity = Math.max(0.3, led.brightness / 100);
        if (led.mode !== 'solid') {
          orb.classList.add(`led-${led.mode}`);
        }
      } else {
        orb.classList.add('led-off');
        orb.style.opacity = '1';
      }
    });

    // 4. Badges et détails
    ledDetailsText.textContent = selectedConfig
      ? `${selectedConfig.isOn ? selectedConfig.brightness : 0}% • ${colorLabel(ledName)} • ${effectLabel(selectedConfig.mode)}`
      : `${activeCount > 0 ? state.brightness : 0}% • ${colorLabel(ledName)}`;
    // Mise à jour des puces LED actives
    ledChips.forEach(chip => {
      if (chip.dataset.led === state.selectedLed) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // 5. Mise à jour de la carte d'état détaillé du circuit
    if (statusPrimaryText) {
      if (activeCount > 0) {
        if (statusLiveBadge) {
          statusLiveBadge.className = 'status-badge status-online';
          statusLiveBadge.textContent = currentLanguage === 'en' ? 'Active' : 'Actif';
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-on';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        statusPrimaryText.textContent = currentLanguage === 'en'
          ? `${activeCount} LED${activeCount > 1 ? 's' : ''} active`
          : `${activeCount} LED${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}`;
        if (statusSecondaryText) {
          statusSecondaryText.textContent = currentLanguage === 'en'
            ? `Selected LED: ${selectedConfig ? selectedConfig.brightness : state.brightness}% • Effect: ${effectLabel(selectedConfig ? selectedConfig.mode : state.mode)}`
            : `LED sélectionnée : ${selectedConfig ? selectedConfig.brightness : state.brightness}% • Effet : ${selectedConfig ? selectedConfig.mode : state.mode}`;
        }
      } else {
        if (statusLiveBadge) {
          statusLiveBadge.className = 'status-badge status-offline';
          statusLiveBadge.textContent = currentLanguage === 'en' ? 'Inactive' : 'Inactif';
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-off';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        statusPrimaryText.textContent = currentLanguage === 'en'
          ? `${colorLabel(ledName)} off`
          : `${ledName} éteinte`;
        if (statusSecondaryText) {
          statusSecondaryText.textContent = currentLanguage === 'en'
            ? `Circuit powered off (Last status at ${formatClockTime()})`
            : `Circuit hors tension (Dernier statut à ${formatClockTime()})`;
        }
      }
    }
  }

  // --- Ajout de Log dans la Console ---

  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const timestamp = Date.now();
    const timeStr = formatClockTime(new Date(timestamp));
    entry.dataset.timestamp = String(timestamp);
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${translateFragment(message)}`;
    
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  // --- Ajout d'une entrée dans l'historique ordonné des LEDs ---

  function addLedHistoryEntry(isOn, selectedLed, brightness, mode) {
    if (!ledActivationHistory) return;

    const li = document.createElement('li');
    li.className = `history-item ${isOn ? 'item-on' : 'item-off'} font-mono`;
    li.dataset.historyEntry = 'true';
    li.dataset.isOn = String(isOn);
    li.dataset.selectedLed = selectedLed;
    li.dataset.brightness = String(brightness);
    li.dataset.mode = mode;

    const timestamp = Date.now();
    const timeStr = formatClockTime(new Date(timestamp));
    li.dataset.timestamp = String(timestamp);

    li.innerHTML = `
      <span class="history-time">[${timeStr}]</span>
      <span class="history-badge"></span>
      <span class="history-text"><strong></strong> <small style="opacity: 0.7;"></small></span>
    `;

    ledActivationHistory.appendChild(li);
    renderHistoryEntry(li);
    ledActivationHistory.scrollTop = ledActivationHistory.scrollHeight;
  }

  function renderHistoryEntry(entry) {
    const isOn = entry.dataset.isOn === 'true';
    const selectedLed = entry.dataset.selectedLed || 'ALL';
    const brightness = entry.dataset.brightness || '0';
    const mode = entry.dataset.mode || 'solid';
    const ledTargetName = selectedLed === 'ALL' ? allLedsLabel() : getLedName(selectedLed);
    const badge = entry.querySelector('.history-badge');
    const action = entry.querySelector('.history-text strong');
    const details = entry.querySelector('.history-text small');

    entry.classList.toggle('item-on', isOn);
    entry.classList.toggle('item-off', !isOn);
    badge.className = `history-badge ${isOn ? 'badge-on' : 'badge-off'}`;
    badge.textContent = isOn
      ? (currentLanguage === 'en' ? 'ON' : 'ALLUMÉE')
      : (currentLanguage === 'en' ? 'OFF' : 'ÉTEINTE');
    action.textContent = currentLanguage === 'en'
      ? `${ledTargetName === 'All LEDs' ? ledTargetName : `${colorLabel(ledTargetName)} LED`} ${isOn ? 'on' : 'off'}`
      : `${ledTargetName} ${isOn ? 'allumée' : 'éteinte'}`;
    details.textContent = `(${brightness}% • ${effectLabel(mode)})`;
  }

  function renderInitialHistoryEntry() {
    const entry = ledActivationHistory?.querySelector('li:not([data-history-entry="true"])');
    if (!entry) return;

    const badge = entry.querySelector('.history-badge');
    const text = entry.querySelector('.history-text');
    if (badge) {
      badge.className = 'history-badge badge-off';
      badge.textContent = currentLanguage === 'en' ? 'OFF' : 'ÉTEINT';
    }
    if (text) {
      text.textContent = currentLanguage === 'en'
        ? 'All LEDs off (Initialization)'
        : 'Toutes les LEDs éteintes (Initialisation)';
    }
  }

  // --- Envoi des requêtes vers le composant physique ---

  async function sendHardwareRequest() {
    updateVisualLEDState();
    addLedHistoryEntry(state.isOn, state.selectedLed, state.brightness, state.mode);

    const payload = {
      state: state.isOn ? 'ON' : 'OFF',
      selectedLed: state.selectedLed,
      brightness: state.brightness,
      mode: state.mode,
      color: state.selectedLed === 'ALL' ? null : getLedColor(state.selectedLed),
      leds: state.leds.map(led => ({
        id: led.id,
        state: led.isOn ? 'ON' : 'OFF',
        brightness: led.brightness,
        mode: led.mode,
        color: getLedColor(led.id)
      }))
    };

    let targetFetchUrl = state.deviceUrl;
    let fetchOptions = {
      headers: {}
    };

    const startTime = performance.now();

    if (state.secureTransport && /^http:\/\//i.test(targetFetchUrl)) {
      targetFetchUrl = targetFetchUrl.replace(/^http:\/\//i, 'https://');
    }

    if (state.httpMethod === 'POST_JSON') {
      fetchOptions.method = 'POST';
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(payload);
    } else if (state.httpMethod === 'GET_QUERY') {
      fetchOptions.method = 'GET';
      const params = new URLSearchParams(payload);
      targetFetchUrl += (targetFetchUrl.includes('?') ? '&' : '?') + params.toString();
    } else if (state.httpMethod === 'POST_FORM') {
      fetchOptions.method = 'POST';
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      fetchOptions.body = new URLSearchParams(payload).toString();
    }

    setConnectionStatus('connecting', connectionLabel('connecting'));

    try {
      addLog(`⚡ ${uiText('Envoi', 'Sending')} ${fetchOptions.method} to <code>${targetFetchUrl}</code> (${uiText('Cible', 'Target')}: LED ${state.selectedLed})...`, 'info');

      const response = await fetch(targetFetchUrl, fetchOptions);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        setConnectionStatus('online', connectionLabel('online'), latency);
        addLog(`✅ HTTP ${uiText('Réponse', 'response')} ${response.status} (${latency} ms) - LED #${state.selectedLed} ${uiText('mise à jour sur le circuit', 'updated on the circuit')} !`, 'success');
      } else {
        const errText = await response.text();
        setConnectionStatus('offline', currentLanguage === 'en' ? `Error ${response.status}` : `Erreur ${response.status}`);
        addLog(`⚠️ ${uiText('Serveur physique a répondu HTTP', 'Physical server returned HTTP')} ${response.status}: ${errText}`, 'error');
      }
    } catch (err) {
      setConnectionStatus('offline', connectionLabel('offline'));
      addLog(`❌ Échec de la connexion vers ${targetFetchUrl}. Détail : ${err.message}`, 'error');
    }
  }

  function setConnectionStatus(status, text, pingMs = null) {
    connectionBadge.className = `status-badge status-${status}`;
    statusText.dataset.status = status;
    statusText.textContent = text;
    if (pingMs !== null) {
      pingValue.textContent = `${pingMs} ms`;
    } else {
      pingValue.textContent = '-- ms';
    }
  }

  // --- 🎙️ Moteur de Reconnaissance & Synthèse Vocale ---

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let recognitionMode = 'command';
  let wakeWordEnabled = false;
  let voiceSessionActive = false;
  let waitingForNameConfirmation = false;
  let waitingForAlternateName = false;

  function getSpeechLanguage() {
    return currentLanguage === 'en' ? 'en-US' : 'fr-FR';
  }

  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (currentLanguage === 'en') {
      return hour >= 5 && hour < 12 ? 'Good morning' : 'Good evening';
    }
    return hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir';
  }

  function getIrinaIntroduction() {
    return currentLanguage === 'en'
      ? `${getTimeGreeting()}, I am Irina, Home Assistant AI mode.`
      : `${getTimeGreeting()}, je suis Irina, le mode IA de Home Assistant.`;
  }

  function updateVoiceLanguage() {
    if (recognition) recognition.lang = getSpeechLanguage();
  }

  function isVoiceSessionStopCommand(text) {
    const normalized = normalizeVoiceText(text).replace(/[-']/g, ' ');
    return /^(?:stop|arrete(?: toi)?|au revoir|bye bye|goodbye|good bye)(?:\s+home assistant)?[.!?\s]*$/.test(normalized);
  }

  function speakResponse(text) {
    if (!toggleSpeechFeedback.checked || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLanguage();
    utterance.rate = 0.92;
    utterance.pitch = 1.12;
    utterance.volume = 0.9;
    const preferredVoice = getPreferredVoice(utterance.lang);
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }

  let lastPersonalizedResponseAt = 0;
  function personalizeVoiceResponse(text) {
    const username = getLocalUsername();
    const preferredName = getPreferredUserName();
    const now = Date.now();
    if (!username || now - lastPersonalizedResponseAt < 30000) return text;
    lastPersonalizedResponseAt = now;
    const addressedText = `${text}, ${preferredName}.`;
    if (preferredName !== username || isNameConfirmationHandled()) return addressedText;
    waitingForNameConfirmation = true;
    return currentLanguage === 'en'
      ? `${addressedText} Is it okay if I call you ${username}, or would you prefer another name?`
      : `${addressedText} Est-ce que je peux vous appeler ainsi, ou préférez-vous un autre nom ?`;
  }

  function handleNamePreferenceReply(transcript) {
    if (!waitingForNameConfirmation && !waitingForAlternateName) return false;
    const normalized = normalizeVoiceText(transcript);
    const username = getLocalUsername();
    const acceptsName = /^(?:oui|oui bien sur|daccord|d accord|yes|yeah|sure|okay|ok|that is fine|thats fine)\b/.test(normalized);
    const rejectsName = /^(?:non|pas vraiment|je prefere un autre|no|not really|i prefer another|call me something else)\b/.test(normalized);

    if (waitingForNameConfirmation && acceptsName) {
      setPreferredUserName(username);
      markNameConfirmationHandled();
      waitingForNameConfirmation = false;
      speakResponse(currentLanguage === 'en'
        ? `Perfect, I will call you ${username}.`
        : `Parfait, je vous appellerai ${username}.`);
      return true;
    }
    if (waitingForNameConfirmation && rejectsName) {
      waitingForNameConfirmation = false;
      waitingForAlternateName = true;
      speakResponse(currentLanguage === 'en'
        ? 'Of course. What name would you like me to use?'
        : 'Bien sûr. Sous quel nom souhaitez-vous que je vous appelle ?');
      return true;
    }
    if (waitingForAlternateName) {
      const requestedName = extractPreferredUserName(transcript) || transcript.trim();
      if (setPreferredUserName(requestedName)) {
        markNameConfirmationHandled();
        waitingForAlternateName = false;
        speakResponse(currentLanguage === 'en'
          ? `Understood, I will call you ${getPreferredUserName()} from now on.`
          : `Très bien, je vous appellerai ${getPreferredUserName()} désormais.`);
      } else {
        speakResponse(currentLanguage === 'en'
          ? 'I could not recognize that name. Please repeat it.'
          : "Je n'ai pas reconnu ce nom. Pouvez-vous le répéter ?");
      }
      return true;
    }
    return false;
  }

  function getPreferredVoice(language) {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const languagePrefix = language.toLowerCase().split('-')[0];
    const matchingVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(languagePrefix));
    const femaleHints = /female|woman|femme|amelie|audrey|denise|julie|samantha|zira|google français|google us english|microsoft/i;
    return matchingVoices.find(voice => femaleHints.test(voice.name))
      || matchingVoices.find(voice => !/male|homme|david|marc|thomas/i.test(voice.name))
      || matchingVoices[0]
      || voices.find(voice => voice.lang.toLowerCase().startsWith('fr'))
      || voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
      || voices[0];
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }

  let gestureAudioContext = null;
  let gestureAnalyser = null;
  let gestureStream = null;
  let gestureFrame = null;
  let lastGestureAt = 0;

  function toggleAiModeFromGesture(gestureName) {
    const wasEnabled = Boolean(toggleVoiceAi?.checked);
    if (!toggleVoiceAi) return;
    toggleVoiceAi.checked = !wasEnabled;
    updateAiVisualState();
    addLog(`🎙️ ${gestureName} détecté : mode IA ${toggleVoiceAi.checked ? 'activé' : 'désactivé'}`, 'info');
    if (toggleVoiceAi.checked) speakResponse(getIrinaIntroduction());
  }

  function stopSoundGestureDetection() {
    if (gestureFrame) cancelAnimationFrame(gestureFrame);
    gestureFrame = null;
    gestureAnalyser = null;
    if (gestureAudioContext) gestureAudioContext.close();
    gestureAudioContext = null;
    gestureStream?.getTracks().forEach(track => track.stop());
    gestureStream = null;
  }

  async function startSoundGestureDetection() {
    if (gestureAnalyser) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Le microphone ne permet pas la détection des gestes sonores');
    }

    gestureStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    gestureAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    gestureAnalyser = gestureAudioContext.createAnalyser();
    gestureAnalyser.fftSize = 1024;
    gestureAnalyser.smoothingTimeConstant = 0.15;
    gestureAudioContext.createMediaStreamSource(gestureStream).connect(gestureAnalyser);

    const timeData = new Float32Array(gestureAnalyser.fftSize);
    const frequencyData = new Uint8Array(gestureAnalyser.frequencyBinCount);
    const detectGesture = () => {
      if (!gestureAnalyser) return;
      gestureAnalyser.getFloatTimeDomainData(timeData);
      gestureAnalyser.getByteFrequencyData(frequencyData);
      const rms = Math.sqrt(timeData.reduce((sum, sample) => sum + sample * sample, 0) / timeData.length);
      const peak = Math.max(...timeData.map(sample => Math.abs(sample)));
      const highFrequencyStart = Math.floor(frequencyData.length * 0.45);
      const highFrequencyEnergy = frequencyData
        .slice(highFrequencyStart)
        .reduce((sum, value) => sum + value, 0);
      const totalFrequencyEnergy = frequencyData.reduce((sum, value) => sum + value, 0) || 1;
      const highFrequencyRatio = highFrequencyEnergy / totalFrequencyEnergy;
      const now = performance.now();

      if (now - lastGestureAt > 900 && peak > 0.16 && rms > 0.035) {
        const gestureName = highFrequencyRatio > 0.42 && rms < 0.12
          ? 'Claquement de doigts'
          : 'Tapement de mains';
        lastGestureAt = now;
        toggleAiModeFromGesture(gestureName);
      }
      gestureFrame = requestAnimationFrame(detectGesture);
    };
    detectGesture();
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = getSpeechLanguage();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      setVoiceVisualState('listening');
      btnVoiceMic.classList.add('listening');
      voiceCard?.classList.add('is-listening');
      micBtnText.textContent = recognitionMode === 'wake'
        ? (currentLanguage === 'en' ? 'Waiting for “Home Assistant”...' : 'En attente de « Home Assistant »...')
        : (currentLanguage === 'en' ? 'Listening...' : 'Écoute en cours...');
      voiceTranscript.textContent = recognitionMode === 'wake'
        ? (currentLanguage === 'en' ? 'Say “Home Assistant” or “Irina”...' : 'Dites « Home Assistant » ou « Irina »...')
        : (currentLanguage === 'en' ? 'Speak now...' : 'Parlez maintenant...');
    };

    recognition.onend = () => {
      isListening = false;
      if (!voiceAiIndicator?.classList.contains('is-thinking')) setVoiceVisualState(null);
      btnVoiceMic.classList.remove('listening');
      voiceCard?.classList.remove('is-listening');
      if (wakeWordEnabled && voiceSessionActive) {
        window.setTimeout(() => startRecognition('command'), 250);
      } else if (wakeWordEnabled) {
        window.setTimeout(() => startRecognition('wake'), 250);
      } else {
        micBtnText.textContent = 'Activer le micro';
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      setVoiceVisualState('error');
      btnVoiceMic.classList.remove('listening');
      voiceCard?.classList.remove('is-listening');
      micBtnText.textContent = wakeWordEnabled && voiceSessionActive
        ? 'Écoute continue...'
        : (wakeWordEnabled ? 'En attente de « Home Assistant »...' : 'Activer le micro');
      voiceTranscript.textContent = `Erreur micro: ${event.error}`;
      addLog(`🎙️ Erreur reconnaissance vocale: ${event.error}`, 'error');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      if (isVoiceSessionStopCommand(transcript)) {
        voiceSessionActive = false;
        voiceTranscript.textContent = `"${transcript}"`;
        addLog('🎙️ Session vocale continue arrêtée', 'info');
        recognition.stop();
        window.setTimeout(() => speakResponse('Bye bye.'), 100);
        return;
      }
      if (recognitionMode === 'wake') {
        const normalizedTranscript = normalizeVoiceText(transcript);
        if (normalizedTranscript.includes('home assistant') || normalizedTranscript.includes('irina')) {
          const calledIrina = normalizedTranscript.includes('irina');
          const inlineCommand = transcript
            .replace(/.*?(?:home assistant|irina)\b/i, '')
            .replace(/^[\s,;:.-]+/, '')
            .trim();
          const aiActivatedByName = calledIrina && toggleVoiceAi && !toggleVoiceAi.checked;
          if (calledIrina && toggleVoiceAi && !toggleVoiceAi.checked) {
            toggleVoiceAi.checked = true;
            updateAiVisualState();
            speakResponse(getIrinaIntroduction());
          }
          voiceSessionActive = true;
          voiceTranscript.textContent = currentLanguage === 'en'
            ? 'Yes, I am listening. Speak now...' : 'Oui, je vous écoute. Parlez maintenant...';
          addLog(`🎙️ Mot d’activation « ${calledIrina ? 'Irina' : 'Home Assistant'} » détecté`, 'info');
          recognition.stop();
          if (inlineCommand) {
            window.setTimeout(() => handleRecognizedCommand(inlineCommand), aiActivatedByName ? 1300 : 100);
            return;
          }
          if (!aiActivatedByName) {
            window.setTimeout(() => speakResponse(currentLanguage === 'en'
              ? 'Yes, I am listening.' : 'Oui, je vous écoute.'), 100);
          }
        }
        return;
      }
      handleRecognizedCommand(transcript);
    };
  } else {
    btnVoiceMic.disabled = true;
    if (toggleVoiceWakeWord) toggleVoiceWakeWord.disabled = true;
    micBtnText.textContent = 'Vocale non supportée';
    voiceTranscript.textContent = 'Web Speech API non disponible sur ce navigateur.';
  }

  function startRecognition(mode) {
    if (!recognition || isListening) return;
    recognitionMode = mode;
    try {
      recognition.start();
    } catch (error) {
      addLog(`🎙️ Impossible d’activer le microphone: ${error.message}`, 'error');
    }
  }

  async function handleRecognizedCommand(transcript) {
    voiceTranscript.textContent = `"${transcript}"`;
    addLog(`🎙️ Commande vocale captée: "${transcript}"`, 'info');
    const normalizedTranscript = normalizeVoiceText(transcript);
    if (handleNamePreferenceReply(transcript)) return;
    const requestedName = extractPreferredUserName(transcript);
    if (requestedName) {
      if (setPreferredUserName(requestedName)) {
        markNameConfirmationHandled();
        waitingForNameConfirmation = false;
        waitingForAlternateName = false;
        const response = currentLanguage === 'en'
          ? `Of course, I will call you ${getPreferredUserName()} from now on.`
          : `Bien sûr, je vous appellerai ${getPreferredUserName()} désormais.`;
        speakResponse(response);
        voiceTranscript.textContent = `"${transcript}"`;
        setVoiceVisualState('confirmation');
        window.setTimeout(() => setVoiceVisualState(null), 900);
      } else {
        speakResponse(currentLanguage === 'en'
          ? 'I could not recognize that name. Please repeat it.'
          : "Je n'ai pas reconnu ce nom. Pouvez-vous le répéter ?");
      }
      return;
    }
    if (normalizedTranscript.includes('irina') && toggleVoiceAi && !toggleVoiceAi.checked) {
      toggleVoiceAi.checked = true;
      updateAiVisualState();
      speakResponse(getIrinaIntroduction());
    }

    if (toggleVoiceAi?.checked) {
      setVoiceVisualState('processing');
      voiceTranscript.textContent = `"${transcript}" — analyse IA...`;
      const aiActions = await interpretVoiceCommandWithAI(transcript);
      if (aiActions) {
        const actionFeedback = applyAiActions(aiActions.actions);
        const aiFeedback = aiActions.response || actionFeedback;
        if (aiFeedback || actionFeedback) {
          voiceTranscript.textContent = `"${transcript}"`;
          setVoiceVisualState('confirmation');
          window.setTimeout(() => setVoiceVisualState(null), 900);
          speakResponse(personalizeVoiceResponse(aiFeedback || actionFeedback));
          return;
        }
      }
    }
    parseVoiceCommand(transcript);
    setVoiceVisualState('confirmation');
    window.setTimeout(() => setVoiceVisualState(null), 900);
  }

  function extractPreferredUserName(transcript) {
    const match = transcript.trim().match(
      /^(?:appelle[-\s]moi|tu peux m'appeler|je veux que tu m'appelles|je préfère que tu m'appelles|mon nom est|call me|you can call me|my name is)\s+(.+?)\s*[.!?,;:]*$/i
    );
    if (!match) return '';
    return match[1].replace(/\s+/g, ' ').trim().replace(/[.!?,;:]+$/, '');
  }

  btnVoiceMic.addEventListener('click', () => {
    if (!recognition) return;
    wakeWordEnabled = false;
    voiceSessionActive = false;
    if (toggleVoiceWakeWord) toggleVoiceWakeWord.checked = false;
    if (isListening) {
      recognition.stop();
    } else {
      startRecognition('command');
    }
  });

  toggleVoiceWakeWord?.addEventListener('change', (event) => {
    wakeWordEnabled = event.target.checked;
    if (!recognition) return;
    if (wakeWordEnabled) {
      voiceSessionActive = false;
      startRecognition('wake');
    } else {
      voiceSessionActive = false;
      if (isListening) {
      recognition.stop();
      }
      micBtnText.textContent = 'Activer le micro';
    }
  });

  toggleSoundGestures?.addEventListener('change', async (event) => {
    if (!event.target.checked) {
      stopSoundGestureDetection();
      return;
    }
    try {
      await startSoundGestureDetection();
      voiceTranscript.textContent = 'Gestes sonores actifs : tapez des mains ou claquez des doigts.';
      addLog('🎙️ Détection des gestes sonores activée', 'info');
    } catch (error) {
      event.target.checked = false;
      stopSoundGestureDetection();
      addLog(`🎙️ Détection des gestes sonores impossible: ${error.message}`, 'error');
      voiceTranscript.textContent = `Erreur micro: ${error.message}`;
    }
  });

  toggleVoiceAi?.addEventListener('change', updateAiVisualState);

  async function interpretVoiceCommandWithAI(transcript) {
    const ollamaUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434/api/chat';
    const ollamaModel = localStorage.getItem('ollama_model') || 'llama3.2';
    const availableLeds = state.leds.map(led => `${led.id}: ${getLedName(led.id)}`).join(', ');
    const promptLanguage = currentLanguage === 'en'
      ? 'Understand natural English and return feedback in English.'
      : 'Comprends le français naturel et réponds avec un retour en français.';
    const username = getPreferredUserName();
    const localHour = new Date().getHours();
    const systemPrompt = [
      'Tu es l’interpréteur de commandes de toute une application de contrôle de LEDs.',
      'Réponds uniquement avec un JSON valide au format {"actions":[...],"response":"..."} et jamais en Markdown.',
      'Le champ actions est toujours un tableau, éventuellement vide. Le champ response est une phrase naturelle à dire à l’utilisateur.',
      currentLanguage === 'en'
        ? 'Understand natural English, synonyms, polite phrases, hesitations, and indirect wording.'
        : 'Comprends le français naturel, les synonymes, les phrases polies, les hésitations et les formulations indirectes.',
      promptLanguage,
      `L’heure locale du navigateur est ${localHour} h. Pour saluer l’utilisateur, utilise « ${currentLanguage === 'en' ? (localHour >= 5 && localHour < 12 ? 'Good morning' : 'Good evening') : (localHour >= 5 && localHour < 18 ? 'Bonjour' : 'Bonsoir')} » selon cette heure. « Salut » reste possible si l’utilisateur emploie lui-même un registre familier.`,
      `L’utilisateur s’appelle ${JSON.stringify(username || (currentLanguage === 'en' ? 'user' : 'utilisateur'))}. Appelle-le par son prénom ou nom d’utilisateur quand c’est naturel, notamment dans les salutations, les propositions et les demandes de clarification.`,
      'Si l’utilisateur demande explicitement à être appelé autrement, respecte ce nouveau nom d’appel pour la suite du dialogue.',
      currentLanguage === 'en'
        ? 'Tu peux tenir un dialogue naturel : saluer, demander une précision si la LED ou l’action manque, proposer une action et poser une question. Pour une question sans action, renvoie actions:[] et réponds directement.'
        : 'Tu peux tenir un dialogue naturel : saluer, demander une précision si la LED ou l’action manque, proposer une action et poser une question. Pour une question sans action, renvoie actions:[] et réponds directement.',
      'Ignore le nom Irina ou Home Assistant quand ils servent uniquement à t’appeler.',
      'Déduis l’intention sans exiger les exemples exacts de l’interface, mais ne devine jamais une valeur absente.',
      'Chaque action a un type et des paramètres :',
      'set_power {targets:["1","2"] ou ["ALL"], on:true|false},',
      'set_brightness {targets:["1"] ou ["ALL"], value:0..100},',
      'set_mode {targets:["1"] ou ["ALL"], mode:"solid"|"pulse"|"blink"|"strobe"},',
      'set_led_count {value:1..100}, set_led_name {target:"1", name:string},',
      'set_theme {value:"light"|"dark"},',
      'set_http_method {value:"POST_JSON"|"GET_QUERY"|"POST_FORM"},',
      'set_secure_transport {value:true|false}, set_panel {panel:"log"|"history", open:true|false},',
      'set_brightness_scope {all:true|false}, set_speech_feedback {enabled:true|false},',
      'set_wake_word {enabled:true|false}, clear_panel {panel:"log"|"history"},',
      'open_firmware_generator {}, check_connection {},',
      'save_config {url:string} pour modifier l’URL du circuit.',
      'Les actions doivent être dans l’ordre demandé. Ne crée jamais de LED inexistante.',
      'LEDs disponibles : ' + availableLeds
    ].join(' ');

    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Réponse Ollama sans contenu exploitable');
      }

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.actions)) {
        throw new Error('Réponse Ollama sans tableau actions');
      }
      if (typeof parsed.response !== 'string' || !parsed.response.trim()) {
        throw new Error('Réponse Ollama sans texte conversationnel');
      }

      addLog(`🤖 ${parsed.actions.length} action(s) interprétée(s) par l’IA`, 'info');
      return { actions: parsed.actions, response: parsed.response.trim() };
    } catch (error) {
      addLog(`🤖 Mode IA indisponible, interpréteur standard utilisé: ${error.message}`, 'warning');
      return null;
    }
  }

  function getActionTargetIds(targets) {
    if (!Array.isArray(targets)) return [];
    if (targets.includes('ALL')) return state.leds.map(led => led.id);
    return [...new Set(targets.flatMap(target => {
      const value = String(target);
      if (getLedConfig(value)) return [value];
      return findVoiceLedIds(value);
    }))];
  }

  function applyAiActions(actions) {
    const feedback = [];
    let hardwareChanged = false;

    actions.forEach(action => {
      if (!action || typeof action.type !== 'string') return;
      const requestedTargets = Array.isArray(action.targets) ? action.targets.map(String) : [];

      switch (action.type) {
        case 'set_power': {
          const targetIds = getActionTargetIds(requestedTargets);
          if (targetIds.length === 0 || typeof action.on !== 'boolean') break;
          targetIds.forEach(id => { getLedConfig(id).isOn = action.on; });
          state.selectedLed = requestedTargets.includes('ALL') || targetIds.length > 1 ? 'ALL' : targetIds[0];
          feedback.push(action.on ? 'LED allumée(s)' : 'LED éteinte(s)');
          hardwareChanged = true;
          break;
        }
        case 'set_brightness': {
          const value = Number(action.value);
          const targetIds = getActionTargetIds(requestedTargets);
          if (!Number.isInteger(value) || value < 0 || value > 100 || targetIds.length === 0) break;
          state.brightness = value;
          brightnessRange.value = String(value);
          targetIds.forEach(id => { getLedConfig(id).brightness = value; });
          state.selectedLed = requestedTargets.includes('ALL') || targetIds.length > 1 ? 'ALL' : targetIds[0];
          feedback.push(`Luminosité réglée à ${value} pour cent`);
          hardwareChanged = true;
          break;
        }
        case 'set_mode': {
          const modes = ['solid', 'pulse', 'blink', 'strobe'];
          const targetIds = getActionTargetIds(requestedTargets);
          if (!modes.includes(action.mode) || targetIds.length === 0) break;
          targetIds.forEach(id => { getLedConfig(id).mode = action.mode; });
          state.mode = action.mode;
          state.selectedLed = requestedTargets.includes('ALL') || targetIds.length > 1 ? 'ALL' : targetIds[0];
          feedback.push(`Mode ${action.mode} appliqué`);
          hardwareChanged = true;
          break;
        }
        case 'set_led_count': {
          const value = Number(action.value);
          if (!Number.isInteger(value) || value < 1 || value > 100 || !totalLedsInput || !btnUpdateTotalLeds) break;
          totalLedsInput.value = String(value);
          btnUpdateTotalLeds.click();
          feedback.push(`Nombre de LEDs réglé à ${value}`);
          hardwareChanged = false;
          break;
        }
        case 'set_led_name': {
          const targetIds = getActionTargetIds([action.target]);
          if (targetIds.length !== 1 || typeof action.name !== 'string' || !action.name.trim()) break;
          getLedConfig(targetIds[0]).name = action.name.trim();
          localStorage.setItem('led_names', JSON.stringify(
            Object.fromEntries(state.leds.map(item => [item.id, item.name]))
          ));
          rebuildLedOrbs();
          rebuildLedControlButtons();
          feedback.push(`Nom de la LED ${targetIds[0]} modifié`);
          break;
        }
        case 'set_theme':
          if (action.value === 'light' || action.value === 'dark') {
            if (currentTheme !== action.value) btnThemeToggle.click();
            feedback.push(`Thème ${action.value === 'light' ? 'clair' : 'sombre'} activé`);
          }
          break;
        case 'set_http_method':
          if (['POST_JSON', 'GET_QUERY', 'POST_FORM'].includes(action.value)) {
            httpMethodSelect.value = action.value;
            state.httpMethod = action.value;
            localStorage.setItem('led_http_method', action.value);
            feedback.push('Méthode HTTP modifiée');
          }
          break;
        case 'set_secure_transport':
          if (typeof action.value === 'boolean') {
            secureTransport.checked = action.value;
            state.secureTransport = action.value;
            localStorage.setItem('led_secure_transport', String(action.value));
            feedback.push(action.value ? 'Connexion HTTPS activée' : 'Connexion HTTPS désactivée');
          }
          break;
        case 'set_brightness_scope':
          if (typeof action.all === 'boolean') {
            applyBrightnessToAll.checked = action.all;
            if (action.all) state.leds.forEach(led => { led.brightness = state.brightness; });
            feedback.push(action.all ? 'Luminosité appliquée à toutes les LEDs' : 'Luminosité appliquée à la LED sélectionnée');
          }
          break;
        case 'set_speech_feedback':
          if (typeof action.enabled === 'boolean') {
            toggleSpeechFeedback.checked = action.enabled;
            feedback.push(`Synthèse vocale ${action.enabled ? 'activée' : 'désactivée'}`);
          }
          break;
        case 'set_wake_word':
          if (typeof action.enabled === 'boolean' && toggleVoiceWakeWord) {
            toggleVoiceWakeWord.checked = action.enabled;
            toggleVoiceWakeWord.dispatchEvent(new Event('change'));
            feedback.push(`Mot d'activation ${action.enabled ? 'activé' : 'désactivé'}`);
          }
          break;
        case 'clear_panel':
          if (action.panel === 'log') btnClearLog.click();
          if (action.panel === 'history') btnClearLedHistory?.click();
          feedback.push('Panneau effacé');
          break;
        case 'open_firmware_generator':
          btnOpenCodeModal?.click();
          feedback.push('Générateur de firmware ouvert');
          break;
        case 'check_connection':
          btnCheckPing.click();
          feedback.push('Test de connexion lancé');
          break;
        case 'save_config':
          if (typeof action.url === 'string' && action.url.trim()) {
            deviceUrlInput.value = action.url.trim();
            btnSaveConfig.click();
            feedback.push('Configuration réseau enregistrée');
          }
          break;
        case 'set_panel': {
          const panel = action.panel === 'log' ? document.querySelector('.log-card') : action.panel === 'history' ? document.querySelector('.status-monitor-card') : null;
          if (panel && typeof action.open === 'boolean') {
            panel.open = action.open;
            feedback.push(`${action.panel === 'log' ? 'Console réseau' : 'Historique'} ${action.open ? 'ouvert' : 'fermé'}`);
          }
          break;
        }
        default:
          break;
      }
    });

    syncControlsFromSelection();
    rebuildLedAssignments();
    updateVisualLEDState();
    if (hardwareChanged) sendHardwareRequest();
    if (currentLanguage === 'en') {
      const feedbackTranslations = [
        ['LED allumée(s)', 'LED(s) turned on'], ['LED éteinte(s)', 'LED(s) turned off'],
        ['Luminosité réglée à', 'Brightness set to'], [' pour cent', ' percent'],
        ['Méthode HTTP modifiée', 'HTTP method changed'], ['Connexion HTTPS activée', 'HTTPS connection enabled'],
        ['Connexion HTTPS désactivée', 'HTTPS connection disabled'],
        ['Synthèse vocale activée', 'Speech feedback enabled'], ['Synthèse vocale désactivée', 'Speech feedback disabled'],
        ["Mot d'activation activé", 'Wake word enabled'], ["Mot d'activation désactivé", 'Wake word disabled'],
        ['Panneau effacé', 'Panel cleared'], ['Générateur de firmware ouvert', 'Firmware generator opened'],
        ['Test de connexion lancé', 'Connection test started'], ['Configuration réseau enregistrée', 'Network configuration saved']
      ];
      return feedback.length > 0 ? feedback.join('. ').replace(
        /LED allumée\(s\)|LED éteinte\(s\)|Luminosité réglée à| pour cent|Méthode HTTP modifiée|Connexion HTTPS activée|Connexion HTTPS désactivée|Synthèse vocale activée|Synthèse vocale désactivée|Mot d'activation activé|Mot d'activation désactivé|Panneau effacé|Générateur de firmware ouvert|Test de connexion lancé|Configuration réseau enregistrée/g,
        match => feedbackTranslations.find(([source]) => source === match)?.[1] || match
      ) : null;
    }
    return feedback.length > 0 ? feedback.join('. ') : null;
  }

  function parseVoiceCommand(cmd) {
    let spokenFeedback = '';
    const normalizedCommand = normalizeVoiceText(cmd);
    const turnOnRequested = /\b(?:allume|allumer|on|active|turn on|turning on|switch on)\b/.test(normalizedCommand);
    const turnOffRequested = /\b(?:eteins?|eteint|eteignez|eteindre|off|desactive(?:r|z)?|stop|turn off|turning off|switch off)\b/.test(normalizedCommand);
    const allLedsPhrase = normalizedCommand.includes('toutes les led')
      || normalizedCommand.includes('tous les led')
      || normalizedCommand.includes('toute la led')
      || /\bles leds?\b/.test(normalizedCommand)
      || /\ball leds?\b/.test(normalizedCommand)
      || normalizedCommand.includes('tout le ruban')
      || normalizedCommand.includes('ensemble des led');

    // 1. Sélection des cibles (une ou plusieurs LEDs par couleur ou numéro)
    const namedLedIds = findVoiceLedIds(cmd);
    const numericLedIds = [...normalizedCommand.matchAll(/(?:led\s*)?([0-9]+)/g)]
      .map(match => match[1])
      .filter(id => getLedConfig(id))
      .map(id => String(id));
    const targetLedIds = [...new Set([...namedLedIds, ...numericLedIds])];
    const allLedsRequested = allLedsPhrase && targetLedIds.length === 0;
    let spokenTarget = '';
    if (allLedsRequested) {
      state.selectedLed = 'ALL';
      if (ledSelect) ledSelect.value = 'ALL';
      spokenTarget = allLedsLabel();
    } else if (targetLedIds.length > 0) {
      state.selectedLed = targetLedIds.length === 1 ? targetLedIds[0] : 'ALL';
      if (ledSelect) ledSelect.value = state.selectedLed;
      spokenTarget = targetLedIds.length === 1
        ? `${currentLanguage === 'en' ? 'LED' : 'la LED'} ${currentLanguage === 'en' ? colorLabel(getLedName(targetLedIds[0])) : getVoiceLedName(targetLedIds[0])}`
        : targetLedIds.map(id => `${currentLanguage === 'en' ? 'LED' : 'la LED'} ${currentLanguage === 'en' ? colorLabel(getLedName(id)) : getVoiceLedName(id)}`).join(currentLanguage === 'en' ? ' and ' : ' et ');
    } else if (state.selectedLed !== 'ALL') {
      spokenTarget = `${currentLanguage === 'en' ? 'LED' : 'la LED'} ${state.selectedLed}`;
    } else {
      spokenTarget = allLedsLabel();
    }

    const commandTargetIds = allLedsRequested
      ? state.leds.map(led => led.id)
      : targetLedIds.length > 0
        ? targetLedIds
        : getTargetLedIds();

    if (targetLedIds.length === 1) {
      state.selectedLed = targetLedIds[0];
      if (ledSelect) ledSelect.value = state.selectedLed;
    }

    // 2. Interrupteur ON / OFF
    if (turnOnRequested || turnOffRequested) {
      state.isOn = turnOnRequested;
      const stateLabel = currentLanguage === 'en'
        ? (state.isOn ? 'on' : 'off')
        : (state.isOn ? 'allumée' : 'éteinte');
      const targetLabel = spokenTarget.replace(/^la\s+/i, '');
      spokenFeedback = allLedsRequested
        ? (currentLanguage === 'en'
          ? `All LEDs are ${state.isOn ? 'on' : 'off'}`
          : `Toutes les LEDs sont ${state.isOn ? 'allumées' : 'éteintes'}`)
        : targetLedIds.length > 1
          ? `${targetLabel.charAt(0).toUpperCase()}${targetLabel.slice(1)} ${currentLanguage === 'en' ? 'are' : 'sont'} ${state.isOn ? (currentLanguage === 'en' ? 'on' : 'allumées') : (currentLanguage === 'en' ? 'off' : 'éteintes')}`
          : `${targetLabel.charAt(0).toUpperCase()}${targetLabel.slice(1)} ${stateLabel}`;
    }

    // 3. Luminosité
    const brightMatch = normalizedCommand.match(/(?:luminosite|intensite|niveau|brightness|intensity)\s*(?:à|a|de|to)?\s*([0-9]{1,3})\s*(?:%|pour\s*cent|percent)?/) || normalizedCommand.match(/([0-9]{1,3})\s*(?:%|pour\s*cent|percent)/);
    if (brightMatch) {
      const val = parseInt(brightMatch[1], 10);
      if (val >= 0 && val <= 100) {
        state.brightness = val;
        brightnessRange.value = val;
        spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? `Brightness set to ${val} percent` : `Luminosité réglée à ${val} pour cent`}`;
      }
    } else if (normalizedCommand.includes('maximum') || normalizedCommand.includes('max')) {
      state.brightness = 100;
      brightnessRange.value = 100;
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Brightness set to 100 percent' : 'Luminosité réglée à 100 pour cent'}`;
    } else if (normalizedCommand.includes('minimum') || normalizedCommand.includes('min')) {
      state.brightness = 10;
      brightnessRange.value = 10;
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Brightness set to 10 percent' : 'Luminosité réglée à 10 pour cent'}`;
    }

    // 4. Mode / Effets
    if (normalizedCommand.includes('clignotant') || normalizedCommand.includes('clignotement') || normalizedCommand.includes('clignote') || normalizedCommand.includes('flash') || normalizedCommand.includes('blink')) {
      state.mode = 'blink';
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Blink mode enabled' : 'Mode clignotant activé'}`;
    } else if (normalizedCommand.includes('respiration') || normalizedCommand.includes('respire') || normalizedCommand.includes('pulse') || normalizedCommand.includes('breathe')) {
      state.mode = 'pulse';
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Pulse mode enabled' : 'Mode respiration activé'}`;
    } else if (normalizedCommand.includes('fixe') || normalizedCommand.includes('solide') || normalizedCommand.includes('normal') || normalizedCommand.includes('solid') || normalizedCommand.includes('steady')) {
      state.mode = 'solid';
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Solid mode enabled' : 'Mode fixe activé'}`;
    } else if (normalizedCommand.includes('stroboscope') || normalizedCommand.includes('stroboscopique') || normalizedCommand.includes('strobe')) {
      state.mode = 'strobe';
      spokenFeedback += `${spokenFeedback ? '. ' : ''}${currentLanguage === 'en' ? 'Strobe mode enabled' : 'Mode stroboscope activé'}`;
    }

    if (!spokenFeedback) {
      const username = getPreferredUserName();
      const nameSuffix = username ? ` ${username}` : '';
      const conversation = getLocalConversationResponse(normalizedCommand, nameSuffix);
      if (conversation) {
        speakResponse(conversation);
        return;
      }
    }

    commandTargetIds.forEach(id => {
      const led = getLedConfig(id);
      led.isOn = state.isOn;
      led.brightness = state.brightness;
      led.mode = state.mode;
    });
    syncControlsFromSelection();
    rebuildLedAssignments();
    updateVisualLEDState();

    if (!spokenFeedback) {
      const username = getPreferredUserName();
      const nameSuffix = username ? ` ${username}` : '';
      const conversation = getLocalConversationResponse(normalizedCommand, nameSuffix);
      spokenFeedback = conversation || (currentLanguage === 'en'
        ? `I did not understand${nameSuffix}, please repeat`
        : `Je n'ai pas saisi${nameSuffix}, répétez s'il vous plaît`);
    }

    speakResponse(personalizeVoiceResponse(spokenFeedback));
    sendHardwareRequest();
  }

  function getLocalConversationResponse(normalizedCommand, nameSuffix = '') {
    const isGreeting = /^(?:bonjour|salut|hello|hi|hey|bonsoir|bonne\s+nuit)\b/.test(normalizedCommand);
    const asksHelp = /\b(?:aide|help|que peux tu faire|que puis je faire|what can you do|what can i do)\b/.test(normalizedCommand);
    const asksSuggestion = /\b(?:que veux tu|que souhaitez vous|que puis je|what would you like|what do you want)\b/.test(normalizedCommand);
    if (isGreeting) {
      const familiarGreeting = /^(?:salut|hi|hey)\b/.test(normalizedCommand);
      const greeting = familiarGreeting
        ? (currentLanguage === 'en' ? 'Hi' : 'Salut')
        : getTimeGreeting();
      return currentLanguage === 'en'
        ? `${greeting}${nameSuffix}! What can I do for you?`
        : `${greeting}${nameSuffix} ! Que puis-je faire pour vous ?`;
    }
    if (asksHelp || asksSuggestion) {
      return currentLanguage === 'en'
        ? `I can control your LEDs, change brightness and effects, or check the connection${nameSuffix ? `, ${nameSuffix.trim()}` : ''}. Would you like me to turn on an LED?`
        : `Je peux contrôler vos LEDs, régler la luminosité et les effets, ou tester la connexion${nameSuffix ? `, ${nameSuffix.trim()}` : ''}. Voulez-vous que j'allume une LED ?`;
    }
    return null;
  }

  // --- Gestionnaires d'Événements UI ---

  ledControlButtonsContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('.led-control-button');
    if (!button) return;
      const led = getLedConfig(button.dataset.led);
      if (!led) return;

      led.isOn = !led.isOn;
      state.selectedLed = led.id;
      syncControlsFromSelection();
      rebuildLedAssignments();
      sendHardwareRequest();
  });

  brightnessRange.addEventListener('input', (e) => {
    state.brightness = parseInt(e.target.value, 10);
    getBrightnessTargetIds().forEach(id => {
      getLedConfig(id).brightness = state.brightness;
    });
    brightnessValue.textContent = `${state.brightness}%`;
    updateVisualLEDState();
  });

  brightnessRange.addEventListener('change', () => {
    sendHardwareRequest();
  });

  applyBrightnessToAll.addEventListener('change', () => {
    if (applyBrightnessToAll.checked) {
      state.leds.forEach(led => {
        led.brightness = state.brightness;
      });
      updateVisualLEDState();
      sendHardwareRequest();
    }
  });

  // Sélection de LED via menu déroulant (Allume la LED sélectionnée)
  if (ledSelect) {
    ledSelect.addEventListener('change', (e) => {
      state.selectedLed = e.target.value;
      syncControlsFromSelection();
      updateVisualLEDState();
      rebuildLedAssignments();
      sendHardwareRequest();
    });
  }

  // Sélection de LED via puces rapides (Allume la LED sélectionnée)
  ledChips.forEach(chip => {
    chip.addEventListener('click', () => {
      state.selectedLed = chip.dataset.led;
      if (ledSelect) ledSelect.value = state.selectedLed;
      syncControlsFromSelection();
      updateVisualLEDState();
      sendHardwareRequest();
    });
  });

  // Presets
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const action = chip.dataset.action;
      switch (action) {
        case 'off':
          state.selectedLed = 'ALL';
          state.leds.forEach(led => { led.isOn = false; });
          break;
        case 'all':
          state.selectedLed = 'ALL';
          state.leds.forEach(led => { led.isOn = true; });
          break;
      }
      if (ledSelect) ledSelect.value = state.selectedLed;
      syncControlsFromSelection();
      rebuildLedAssignments();
      sendHardwareRequest();
    });
  });

  if (btnUpdateTotalLeds) {
    btnUpdateTotalLeds.addEventListener('click', () => {
      const val = parseInt(totalLedsInput.value, 10);
      if (val && val >= 1 && val <= 100) {
        state.totalLeds = val;
        localStorage.setItem('led_total_count', val);
        rebuildLedSelectDropdown();
        rebuildLedOrbs();
        state.leds = Array.from({ length: state.totalLeds }, (_, index) => ({
          id: String(index + 1),
          name: getDefaultLedName(index + 1),
          isOn: false,
          brightness: state.brightness,
          mode: 'solid'
        }));
        rebuildLedControlButtons();
        rebuildLedAssignments();
        syncControlsFromSelection();
        updateVisualLEDState();
        addLog(`💡 ${uiText('Nombre total de LEDs du circuit configuré à', 'Total circuit LEDs set to')} ${val}`, 'info');
        sendHardwareRequest();
      }
    });
  }

  btnSaveConfig.addEventListener('click', () => {
    const enteredUrl = deviceUrlInput.value.trim();
    let parsedUrl;

    try {
      parsedUrl = new URL(enteredUrl, window.location.href);
    } catch {
      addLog(uiText('URL de la cible invalide. Utilisez une adresse HTTP ou HTTPS valide.', 'Invalid target URL. Use a valid HTTP or HTTPS address.'), 'error');
      return;
    }

    state.secureTransport = secureTransport.checked;
    if (state.secureTransport && parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }
    if (state.secureTransport && parsedUrl.protocol !== 'https:') {
      addLog(uiText('La connexion sécurisée exige une URL HTTPS.', 'Secure connection requires an HTTPS URL.'), 'error');
      return;
    }

    state.deviceUrl = parsedUrl.origin === window.location.origin && !/^https?:\/\//i.test(enteredUrl)
      ? `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
      : parsedUrl.href;
    deviceUrlInput.value = state.deviceUrl;
    state.httpMethod = httpMethodSelect.value;
    localStorage.setItem('led_device_url', state.deviceUrl);
    localStorage.setItem('led_http_method', state.httpMethod);
    localStorage.setItem('led_secure_transport', String(state.secureTransport));

    addLog(`⚙️ Configuration enregistrée: URL=${state.deviceUrl} (${state.httpMethod})`, 'info');
    sendHardwareRequest();
  });

  btnCheckPing.addEventListener('click', () => {
    addLog(`🔍 Test de joignabilité de ${state.deviceUrl}...`, 'info');
    sendHardwareRequest();
  });

  btnClearLog.addEventListener('click', () => {
    logConsole.innerHTML = '';
    addLog(uiText('Console nettoyée.', 'Console cleared.'), 'info');
  });
  btnClearLog.addEventListener('click', (event) => event.stopPropagation());

  if (btnClearLedHistory) {
    btnClearLedHistory.addEventListener('click', () => {
      ledActivationHistory.innerHTML = '';
      addLog(uiText('Historique d\'activation des LEDs effacé.', 'LED activation history cleared.'), 'info');
    });
    btnClearLedHistory.addEventListener('click', (event) => event.stopPropagation());
  }

  btnOpenCodeModal.addEventListener('click', () => codeModal.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => codeModal.classList.add('hidden'));
  codeModal.addEventListener('click', (e) => {
    if (e.target === codeModal) codeModal.classList.add('hidden');
  });

  function generateFirmwareCode() {
    const count = Math.max(1, Math.min(5, parseInt(firmwareLedCount.value, 10) || 1));
    const pins = ['D1', 'D2', 'D5', 'D6', 'D7'].slice(0, count);
    firmwareLedCount.value = count;
    const boardName = firmwareBoard.value === 'd1mini' ? 'Wemos D1 mini ESP8266' : 'NodeMCU ESP8266';

    espCodeSnippet.textContent = `// Firmware ${boardName} - ${count} LED(s)
// ESP8266 Arduino core + ArduinoJson 6/7 compatible
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <math.h>

const char* WIFI_SSID = "VOTRE_WIFI_SSID";
const char* WIFI_PASSWORD = "VOTRE_WIFI_PASSWORD";
ESP8266WebServer server(80);
const uint8_t LED_PINS[${count}] = {${pins.join(', ')}};
const uint8_t LED_COUNT = ${count};

struct LedState {
  bool on = false;
  uint8_t brightness = 80;
  String mode = "solid";
};
LedState leds[LED_COUNT];

void cors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

uint16_t pwm(uint8_t value) {
  return map(constrain(value, 0, 100), 0, 100, 0, 1023);
}

uint16_t outputFor(const LedState& led, unsigned long now) {
  if (!led.on) return 0;
  if (led.mode == "blink") return (now / 500UL) % 2 ? 0 : pwm(led.brightness);
  if (led.mode == "strobe") return (now / 75UL) % 2 ? 0 : pwm(led.brightness);
  if (led.mode == "pulse") {
    float phase = (now % 2400UL) / 2400.0f;
    float wave = (sin(phase * 2.0f * PI) + 1.0f) * 0.5f;
    return pwm((uint8_t)(led.brightness * (0.2f + 0.8f * wave)));
  }
  return pwm(led.brightness);
}

void updateLeds() {
  unsigned long now = millis();
  for (uint8_t i = 0; i < LED_COUNT; i++) {
    analogWrite(LED_PINS[i], outputFor(leds[i], now));
  }
}

void handleOptions() {
  cors();
  server.send(204, "text/plain", "");
}

void handleLedCommand() {
  cors();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\\"error\\":\\"Missing JSON body\\"}");
    return;
  }

  StaticJsonDocument<4096> doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\\"error\\":\\"Invalid JSON\\"}");
    return;
  }

  JsonArray inputLeds = doc["leds"].as<JsonArray>();
  if (inputLeds.isNull()) {
    server.send(400, "application/json", "{\\"error\\":\\"Missing leds array\\"}");
    return;
  }

  for (JsonObject item : inputLeds) {
    int id = item["id"] | 0;
    if (id < 1 || id > LED_COUNT) continue;
    LedState& led = leds[id - 1];
    String state = item["state"] | "OFF";
    led.on = state == "ON";
    led.brightness = constrain((int)(item["brightness"] | 0), 0, 100);
    led.mode = item["mode"] | "solid";
  }
  updateLeds();
  String response = "{\\"status\\":\\"ok\\",\\"ledCount\\":" + String(LED_COUNT) + "}";
  server.send(200, "application/json", response);
}

void setup() {
  Serial.begin(115200);
  for (uint8_t i = 0; i < LED_COUNT; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    analogWrite(LED_PINS[i], 0);
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 30000UL) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\\nWiFi connection failed");
    return;
  }
  Serial.println(WiFi.localIP());
  server.on("/api/led", HTTP_OPTIONS, handleOptions);
  server.on("/api/led", HTTP_POST, handleLedCommand);
  server.begin();
}

void loop() {
  server.handleClient();
  updateLeds();
}`;
  }

  btnGenerateFirmware?.addEventListener('click', generateFirmwareCode);
  firmwareLedCount?.addEventListener('change', generateFirmwareCode);
  firmwareBoard?.addEventListener('change', generateFirmwareCode);
  generateFirmwareCode();

  btnCopyCode.addEventListener('click', () => {
    const codeText = document.getElementById('espCodeSnippet').innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      btnCopyCode.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-check"></use></svg> ${uiText('Code copié dans le presse-papier !', 'Code copied to clipboard!')}`;
      setTimeout(() => {
        btnCopyCode.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-clipboard"></use></svg> ${uiText('Copier le code dans le presse-papier', 'Copy code to clipboard')}`;
      }, 3000);
    });
  });

  // --- Initialisation au chargement ---
  updateVisualLEDState();
  updateAiVisualState();
  applyLanguage();
  addLog(`🌐 Application prête. IP Cible : <code>${state.deviceUrl}</code>`, 'info');

  sendHardwareRequest();
});
