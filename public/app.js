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
 const supportedLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ja', 'zh-CN'];
 if (supportedLanguages.includes(savedLanguage)) return savedLanguage;
 const browserLanguage = (navigator.language || '').toLowerCase();
 if (browserLanguage.startsWith('zh')) return 'zh-CN';
 if (browserLanguage.startsWith('ja')) return 'ja';
 if (browserLanguage.startsWith('es')) return 'es';
 if (browserLanguage.startsWith('de')) return 'de';
 if (browserLanguage.startsWith('it')) return 'it';
 if (browserLanguage.startsWith('pt')) return 'pt';
 if (browserLanguage.startsWith('nl')) return 'nl';
 if (browserLanguage.startsWith('en')) return 'en';
 return 'fr';
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
   loginSubmit: 'Me connecter',
   invalidCredentials: 'Nom d’utilisateur ou mot de passe invalide.',
   passwordMismatch: 'Les mots de passe ne correspondent pas.',
   wrongCredentials: 'Identifiants incorrects.',
   unexpectedError: 'Impossible de valider les identifiants.'
   ,createAccount: 'Pas de compte ? Créer ma connexion', backToLogin: 'Retour à la connexion'
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
   loginSubmit: 'Sign me in',
   invalidCredentials: 'Invalid username or password.',
   passwordMismatch: 'Passwords do not match.',
   wrongCredentials: 'Incorrect credentials.',
   unexpectedError: 'Unable to validate credentials.'
   ,createAccount: 'No account? Create one', backToLogin: 'Back to sign in'
 },
 es: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'Crear acceso', loginTitle: 'Iniciar sesión',
   createDescription: 'Crea una cuenta local para acceder al panel.', loginDescription: 'Introduce tus credenciales locales para abrir el panel.',
   username: 'Nombre de usuario', password: 'Contraseña', confirmPassword: 'Confirmar contraseña',
   createSubmit: 'Crear mi acceso', loginSubmit: 'Iniciar sesión', invalidCredentials: 'Nombre de usuario o contraseña no válidos.',
   passwordMismatch: 'Las contraseñas no coinciden.', wrongCredentials: 'Credenciales incorrectas.', unexpectedError: 'No se pudieron validar las credenciales.'
   ,createAccount: '¿No tienes cuenta? Créala', backToLogin: 'Volver a iniciar sesión'
 },
 de: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'Zugang erstellen', loginTitle: 'Anmelden',
   createDescription: 'Erstelle ein lokales Konto für dein Dashboard.', loginDescription: 'Gib deine lokalen Zugangsdaten ein, um das Dashboard zu öffnen.',
   username: 'Benutzername', password: 'Passwort', confirmPassword: 'Passwort bestätigen',
   createSubmit: 'Zugang erstellen', loginSubmit: 'Anmelden', invalidCredentials: 'Ungültiger Benutzername oder ungültiges Passwort.',
   passwordMismatch: 'Die Passwörter stimmen nicht überein.', wrongCredentials: 'Falsche Zugangsdaten.', unexpectedError: 'Zugangsdaten konnten nicht geprüft werden.'
   ,createAccount: 'Noch kein Konto? Konto erstellen', backToLogin: 'Zurück zur Anmeldung'
 },
 it: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'Crea accesso', loginTitle: 'Accedi',
   createDescription: 'Crea un account locale per accedere alla dashboard.', loginDescription: 'Inserisci le credenziali locali per aprire la dashboard.',
   username: 'Nome utente', password: 'Password', confirmPassword: 'Conferma password',
   createSubmit: 'Crea il mio accesso', loginSubmit: 'Accedi', invalidCredentials: 'Nome utente o password non validi.',
   passwordMismatch: 'Le password non coincidono.', wrongCredentials: 'Credenziali errate.', unexpectedError: 'Impossibile verificare le credenziali.'
   ,createAccount: 'Non hai un account? Crealo', backToLogin: 'Torna all’accesso'
 },
 pt: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'Criar acesso', loginTitle: 'Iniciar sessão',
   createDescription: 'Crie uma conta local para aceder ao painel.', loginDescription: 'Introduza as credenciais locais para abrir o painel.',
   username: 'Nome de utilizador', password: 'Palavra-passe', confirmPassword: 'Confirmar palavra-passe',
   createSubmit: 'Criar o meu acesso', loginSubmit: 'Iniciar sessão', invalidCredentials: 'Nome de utilizador ou palavra-passe inválidos.',
   passwordMismatch: 'As palavras-passe não coincidem.', wrongCredentials: 'Credenciais incorretas.', unexpectedError: 'Não foi possível validar as credenciais.'
   ,createAccount: 'Não tem conta? Crie uma', backToLogin: 'Voltar ao início de sessão'
 },
 nl: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'Toegang maken', loginTitle: 'Inloggen',
   createDescription: 'Maak een lokaal account voor je dashboard.', loginDescription: 'Voer je lokale gegevens in om het dashboard te openen.',
   username: 'Gebruikersnaam', password: 'Wachtwoord', confirmPassword: 'Wachtwoord bevestigen',
   createSubmit: 'Mijn toegang maken', loginSubmit: 'Inloggen', invalidCredentials: 'Ongeldige gebruikersnaam of ongeldig wachtwoord.',
   passwordMismatch: 'De wachtwoorden komen niet overeen.', wrongCredentials: 'Onjuiste gegevens.', unexpectedError: 'Gegevens konden niet worden gecontroleerd.'
   ,createAccount: 'Geen account? Maak er een', backToLogin: 'Terug naar inloggen'
 },
 ja: {
   eyebrow: 'HOME ASSISTANT', createTitle: 'アクセスを作成', loginTitle: 'ログイン',
   createDescription: 'ダッシュボードにアクセスするローカルアカウントを作成します。', loginDescription: 'ローカル認証情報を入力してダッシュボードを開きます。',
   username: 'ユーザー名', password: 'パスワード', confirmPassword: 'パスワードを確認',
   createSubmit: 'アクセスを作成', loginSubmit: 'ログインする', invalidCredentials: 'ユーザー名またはパスワードが無効です。',
   passwordMismatch: 'パスワードが一致しません。', wrongCredentials: '認証情報が正しくありません。', unexpectedError: '認証情報を確認できません。'
   ,createAccount: 'アカウントがない場合は作成', backToLogin: 'ログインに戻る'
 },
 'zh-CN': {
   eyebrow: 'HOME ASSISTANT', createTitle: '创建访问权限', loginTitle: '登录',
   createDescription: '创建本地账户以访问控制面板。', loginDescription: '输入本地凭据以打开控制面板。',
   username: '用户名', password: '密码', confirmPassword: '确认密码',
   createSubmit: '创建访问权限', loginSubmit: '登录', invalidCredentials: '用户名或密码无效。',
   passwordMismatch: '两次输入的密码不一致。', wrongCredentials: '凭据错误。', unexpectedError: '无法验证凭据。'
   ,createAccount: '没有账户？创建账户', backToLogin: '返回登录'
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
 const createAccount = document.getElementById('authCreateAccount');
 const backToLogin = document.getElementById('authBackToLogin');
 const message = document.getElementById('authMessage');
 if (!gate || !form || !title || !description || !eyebrow || !usernameLabel || !passwordLabel || !confirmLabel || !confirmInput || !submit || !createAccount || !backToLogin || !message) return;

 const account = JSON.parse(localStorage.getItem(AUTH_ACCOUNT_KEY) || 'null');
 if (account && localStorage.getItem(AUTH_SESSION_KEY) === 'active') {
   gate.remove();
   return;
 }

 const text = authLanguageText[getPreferredLanguage()] || authLanguageText.en;
 document.documentElement.lang = getPreferredLanguage();
 const loginRequested = new URLSearchParams(window.location.search).get('login') === '1';
 let creatingAccount = !account && !loginRequested;
 const renderAuthMode = () => {
   const loginMode = !creatingAccount && Boolean(account);
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
   createAccount.hidden = !loginMode;
   createAccount.textContent = text.createAccount;
   backToLogin.hidden = loginMode || !account;
   backToLogin.textContent = text.backToLogin;
   message.textContent = '';
 };
 renderAuthMode();

 createAccount.addEventListener('click', () => {
   creatingAccount = true;
   form.reset();
   renderAuthMode();
 });

 backToLogin.addEventListener('click', () => {
   creatingAccount = false;
   form.reset();
   renderAuthMode();
 });

 form.addEventListener('submit', async (event) => {
   event.preventDefault();
   message.textContent = '';
   submit.disabled = true;
   try {
     const username = form.elements.username.value.trim();
     const password = form.elements.password.value;
     if (!username || password.length < 8) throw new Error(text.invalidCredentials);
     if (creatingAccount && password !== confirmInput.value) throw new Error(text.passwordMismatch);

     if (!creatingAccount) {
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

function initializeAccountSwitcher() {
 const switchButton = document.getElementById('btnSwitchAccount');
 if (!switchButton || switchButton.dataset.accountSwitcherReady === 'true') return;
 switchButton.dataset.accountSwitcherReady = 'true';
 switchButton.addEventListener('click', logoutLocalAccount);
}

function logoutLocalAccount() {
 localStorage.removeItem(AUTH_SESSION_KEY);
 localStorage.removeItem(AUTH_DISPLAY_NAME_KEY);
 localStorage.removeItem(AUTH_NAME_CONFIRMATION_KEY);
 const loginUrl = new URL('index.html', window.location.href);
 loginUrl.searchParams.set('login', '1');
 window.location.assign(loginUrl.href);
}

document.addEventListener('DOMContentLoaded', async () => {
 await initializeLocalAuth();
 const appSplash = document.getElementById('appSplash');
  const skipSplash = new URLSearchParams(window.location.search).get('skipSplash') === '1';

  const hideSplash = () => {
    if (!appSplash) return;
    appSplash.classList.add('app-splash-hidden');
    appSplash.addEventListener('transitionend', () => appSplash.remove(), { once: true });
  };

  if (skipSplash) {
    appSplash?.remove();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    window.setTimeout(hideSplash, 1600);
  }

  // --- Éléments du DOM ---
  const languageSelector = document.getElementById('languageSelector');
  const themeModeSelector = document.getElementById('themeModeSelector');
  const themeColorPicker = document.getElementById('themeColorPicker');
  let currentLanguage = getPreferredLanguage();
  const languageText = {
    fr: {
      language: 'EN', subtitle: 'Pilotez votre circuit physique en temps réel',
      themeTitle: 'Changer le thème (Clair / Sombre)', themeLight: 'Clair', themeDark: 'Sombre',
      connected: 'En ligne', disconnected: 'Non connecté', pingTitle: 'Tester le signal / Ping',
      config: 'Configuration du Circuit Physique', save: 'Enregistrer', apply: 'Appliquer',
      quick: 'Raccourcis Rapides', allOn: 'Allumer tout', allOff: 'Éteindre tout',
      voice: 'Commande Vocale (Speech)', synthesis: 'Synthèse', wake: 'Écoute active « Irina »',
      ai: 'Mode IA', gestures: 'Gestes sonores', enableMic: 'Activer le micro',
      voiceWakeHint: 'Activez l’écoute active, puis dites « Irina » pour commencer une commande en temps réel.',
      chatTitle: 'Chatbot Irina', chatStatus: 'En ligne',
      chatWelcome: 'Bonjour ! Écrivez-moi une commande ou une question sur votre circuit.',
      chatPlaceholder: 'Écrivez un message à Irina...', chatSend: 'Envoyer',
      chatHint: 'Le chatbot peut piloter les LEDs, le réseau, le thème et les panneaux.',
      privacyLink: 'Confidentialité', termsLink: 'Conditions d’utilisation',
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
      voice: 'Voice Control (Speech)', synthesis: 'Speech', wake: 'Active listening “Irina”',
      ai: 'AI mode', gestures: 'Sound gestures', enableMic: 'Enable microphone',
      voiceWakeHint: 'Enable active listening, then say “Irina” to start a command in real time.',
      chatTitle: 'Irina chatbot', chatStatus: 'Online',
      chatWelcome: 'Hello! Write a command or ask a question about your circuit.',
      chatPlaceholder: 'Write a message to Irina...', chatSend: 'Send',
      chatHint: 'The chatbot can control LEDs, networking, the theme, and panels.',
      privacyLink: 'Privacy', termsLink: 'Terms of use',
      latest: 'Latest voice instruction:', supported: 'Supported commands:',
      clear: 'Clear', brightness: 'Brightness', brightnessAll: 'Apply to all LEDs',
      effects: 'Per-LED simultaneous effects', networkLog: 'Network console & HTTP requests',
      history: 'History of LEDs turned on over time', firmware: 'Generate firmware',
      code: 'Copy code to clipboard'
    },
    es: {
      language: 'ES', subtitle: 'Controla tu circuito físico en tiempo real', themeTitle: 'Cambiar tema (Claro / Oscuro)', themeLight: 'Claro', themeDark: 'Oscuro',
      connected: 'En línea', disconnected: 'No conectado', pingTitle: 'Probar señal / Ping', config: 'Configuración del circuito físico', save: 'Guardar', apply: 'Aplicar',
      quick: 'Accesos rápidos', allOn: 'Encender todo', allOff: 'Apagar todo', voice: 'Control por voz', synthesis: 'Síntesis', wake: 'Escucha activa «Irina»',
      ai: 'Modo IA', gestures: 'Gestos sonoros', enableMic: 'Activar micrófono', voiceWakeHint: 'Activa la escucha y di «Irina» para iniciar un comando.',
      chatTitle: 'Chatbot Irina', chatStatus: 'En línea', chatWelcome: '¡Hola! Escríbeme un comando o una pregunta sobre tu circuito.', chatPlaceholder: 'Escribe un mensaje a Irina...', chatSend: 'Enviar',
      chatHint: 'El chatbot puede controlar los LED, la red, el tema y los paneles.', privacyLink: 'Privacidad', termsLink: 'Condiciones de uso',
      latest: 'Última instrucción de voz:', supported: 'Comandos compatibles:', clear: 'Borrar', brightness: 'Brillo', brightnessAll: 'Aplicar a todos los LED',
      effects: 'Efectos simultáneos por LED', networkLog: 'Consola de red y envíos HTTP', history: 'Historial de LED encendidos', firmware: 'Generar firmware', code: 'Copiar código al portapapeles'
    },
    de: {
      language: 'DE', subtitle: 'Steuere deine physische Schaltung in Echtzeit', themeTitle: 'Design ändern (Hell / Dunkel)', themeLight: 'Hell', themeDark: 'Dunkel',
      connected: 'Online', disconnected: 'Nicht verbunden', pingTitle: 'Signal testen / Ping', config: 'Konfiguration der physischen Schaltung', save: 'Speichern', apply: 'Anwenden',
      quick: 'Schnellzugriffe', allOn: 'Alle einschalten', allOff: 'Alle ausschalten', voice: 'Sprachsteuerung', synthesis: 'Sprachausgabe', wake: 'Aktives Zuhören „Irina“',
      ai: 'KI-Modus', gestures: 'Soundgesten', enableMic: 'Mikrofon aktivieren', voiceWakeHint: 'Aktiviere das Zuhören und sage „Irina“, um einen Befehl zu starten.',
      chatTitle: 'Irina-Chatbot', chatStatus: 'Online', chatWelcome: 'Hallo! Schreibe mir einen Befehl oder eine Frage zu deiner Schaltung.', chatPlaceholder: 'Nachricht an Irina schreiben...', chatSend: 'Senden',
      chatHint: 'Der Chatbot kann LEDs, Netzwerk, Design und Bereiche steuern.', privacyLink: 'Datenschutz', termsLink: 'Nutzungsbedingungen',
      latest: 'Letzte Sprachanweisung:', supported: 'Unterstützte Befehle:', clear: 'Löschen', brightness: 'Helligkeit', brightnessAll: 'Auf alle LEDs anwenden',
      effects: 'Gleichzeitige Effekte pro LED', networkLog: 'Netzwerkkonsole und HTTP-Sendungen', history: 'Verlauf eingeschalteter LEDs', firmware: 'Firmware erzeugen', code: 'Code in Zwischenablage kopieren'
    },
    it: {
      language: 'IT', subtitle: 'Controlla il tuo circuito fisico in tempo reale', themeTitle: 'Cambia tema (Chiaro / Scuro)', themeLight: 'Chiaro', themeDark: 'Scuro',
      connected: 'Online', disconnected: 'Non connesso', pingTitle: 'Test segnale / Ping', config: 'Configurazione del circuito fisico', save: 'Salva', apply: 'Applica',
      quick: 'Scorciatoie rapide', allOn: 'Accendi tutto', allOff: 'Spegni tutto', voice: 'Controllo vocale', synthesis: 'Sintesi', wake: 'Ascolto attivo «Irina»',
      ai: 'Modalità IA', gestures: 'Gesti sonori', enableMic: 'Attiva microfono', voiceWakeHint: 'Attiva l’ascolto e dì «Irina» per iniziare un comando.',
      chatTitle: 'Chatbot Irina', chatStatus: 'Online', chatWelcome: 'Ciao! Scrivimi un comando o una domanda sul tuo circuito.', chatPlaceholder: 'Scrivi un messaggio a Irina...', chatSend: 'Invia',
      chatHint: 'Il chatbot può controllare LED, rete, tema e pannelli.', privacyLink: 'Riservatezza', termsLink: 'Termini di utilizzo',
      latest: 'Ultima istruzione vocale:', supported: 'Comandi supportati:', clear: 'Cancella', brightness: 'Luminosità', brightnessAll: 'Applica a tutti i LED',
      effects: 'Effetti simultanei per LED', networkLog: 'Console di rete e invii HTTP', history: 'Cronologia dei LED accesi', firmware: 'Genera firmware', code: 'Copia codice negli appunti'
    },
    pt: {
      language: 'PT', subtitle: 'Controle o seu circuito físico em tempo real', themeTitle: 'Alterar tema (Claro / Escuro)', themeLight: 'Claro', themeDark: 'Escuro',
      connected: 'Online', disconnected: 'Não conectado', pingTitle: 'Testar sinal / Ping', config: 'Configuração do circuito físico', save: 'Guardar', apply: 'Aplicar',
      quick: 'Atalhos rápidos', allOn: 'Ligar tudo', allOff: 'Desligar tudo', voice: 'Controlo por voz', synthesis: 'Síntese', wake: 'Escuta ativa «Irina»',
      ai: 'Modo IA', gestures: 'Gestos sonoros', enableMic: 'Ativar microfone', voiceWakeHint: 'Ative a escuta e diga «Irina» para iniciar um comando.',
      chatTitle: 'Chatbot Irina', chatStatus: 'Online', chatWelcome: 'Olá! Escreva um comando ou uma pergunta sobre o seu circuito.', chatPlaceholder: 'Escreva uma mensagem para a Irina...', chatSend: 'Enviar',
      chatHint: 'O chatbot pode controlar LEDs, rede, tema e painéis.', privacyLink: 'Privacidade', termsLink: 'Termos de utilização',
      latest: 'Última instrução de voz:', supported: 'Comandos suportados:', clear: 'Limpar', brightness: 'Brilho', brightnessAll: 'Aplicar a todos os LEDs',
      effects: 'Efeitos simultâneos por LED', networkLog: 'Consola de rede e envios HTTP', history: 'Histórico dos LEDs ligados', firmware: 'Gerar firmware', code: 'Copiar código para a área de transferência'
    },
    nl: {
      language: 'NL', subtitle: 'Bedien je fysieke circuit in realtime', themeTitle: 'Thema wijzigen (Licht / Donker)', themeLight: 'Licht', themeDark: 'Donker',
      connected: 'Online', disconnected: 'Niet verbonden', pingTitle: 'Signaal testen / Ping', config: 'Configuratie van fysiek circuit', save: 'Opslaan', apply: 'Toepassen',
      quick: 'Snelle acties', allOn: 'Alles aan', allOff: 'Alles uit', voice: 'Spraakbediening', synthesis: 'Spraaksynthese', wake: 'Actief luisteren “Irina”',
      ai: 'AI-modus', gestures: 'Geluidsgebaren', enableMic: 'Microfoon inschakelen', voiceWakeHint: 'Schakel luisteren in en zeg “Irina” om een opdracht te starten.',
      chatTitle: 'Irina-chatbot', chatStatus: 'Online', chatWelcome: 'Hallo! Schrijf een opdracht of vraag over je circuit.', chatPlaceholder: 'Schrijf een bericht aan Irina...', chatSend: 'Versturen',
      chatHint: 'De chatbot kan leds, netwerk, thema en panelen bedienen.', privacyLink: 'Privacy', termsLink: 'Gebruiksvoorwaarden',
      latest: 'Laatste spraakopdracht:', supported: 'Ondersteunde opdrachten:', clear: 'Wissen', brightness: 'Helderheid', brightnessAll: 'Op alle leds toepassen',
      effects: 'Gelijktijdige effecten per led', networkLog: 'Netwerkconsole en HTTP-verzendingen', history: 'Geschiedenis van ingeschakelde leds', firmware: 'Firmware genereren', code: 'Code naar klembord kopiëren'
    },
    ja: {
      language: 'JA', subtitle: '物理回路をリアルタイムで操作', themeTitle: 'テーマ変更（ライト / ダーク）', themeLight: 'ライト', themeDark: 'ダーク',
      connected: 'オンライン', disconnected: '未接続', pingTitle: '信号をテスト / Ping', config: '物理回路の設定', save: '保存', apply: '適用',
      quick: 'クイック操作', allOn: 'すべて点灯', allOff: 'すべて消灯', voice: '音声操作', synthesis: '音声合成', wake: 'アクティブリスニング「Irina」',
      ai: 'AIモード', gestures: 'サウンドジェスチャー', enableMic: 'マイクを有効化', voiceWakeHint: 'リスニングを有効にして「Irina」と言うとコマンドを開始します。',
      chatTitle: 'Irinaチャットボット', chatStatus: 'オンライン', chatWelcome: 'こんにちは！回路へのコマンドや質問を入力してください。', chatPlaceholder: 'Irinaへのメッセージを入力...', chatSend: '送信',
      chatHint: 'チャットボットでLED、ネットワーク、テーマ、パネルを操作できます。', privacyLink: 'プライバシー', termsLink: '利用規約',
      latest: '最新の音声指示:', supported: '対応コマンド:', clear: '消去', brightness: '明るさ', brightnessAll: 'すべてのLEDに適用',
      effects: 'LEDごとの同時エフェクト', networkLog: 'ネットワークコンソールとHTTP送信', history: '点灯したLEDの履歴', firmware: 'ファームウェア生成', code: 'コードをクリップボードにコピー'
    },
    'zh-CN': {
      language: '中', subtitle: '实时控制您的物理电路', themeTitle: '切换主题（浅色 / 深色）', themeLight: '浅色', themeDark: '深色',
      connected: '在线', disconnected: '未连接', pingTitle: '测试信号 / Ping', config: '物理电路配置', save: '保存', apply: '应用',
      quick: '快捷操作', allOn: '全部打开', allOff: '全部关闭', voice: '语音控制', synthesis: '语音合成', wake: '主动聆听“Irina”',
      ai: 'AI 模式', gestures: '声音手势', enableMic: '启用麦克风', voiceWakeHint: '启用聆听后，说出“Irina”即可开始实时指令。',
      chatTitle: 'Irina 聊天机器人', chatStatus: '在线', chatWelcome: '你好！请输入电路指令或问题。', chatPlaceholder: '给 Irina 输入消息...', chatSend: '发送',
      chatHint: '聊天机器人可以控制 LED、网络、主题和面板。', privacyLink: '隐私', termsLink: '使用条款',
      latest: '最新语音指令：', supported: '支持的指令：', clear: '清除', brightness: '亮度', brightnessAll: '应用到所有 LED',
      effects: '每个 LED 的同步效果', networkLog: '网络控制台和 HTTP 发送', history: 'LED 点亮历史', firmware: '生成固件', code: '复制代码'
    }
  };
  const accountSwitcherLabels = {
    fr: 'Changer de compte', en: 'Switch account', es: 'Cambiar de cuenta', de: 'Konto wechseln',
    it: 'Cambia account', pt: 'Mudar de conta', nl: 'Account wisselen', ja: 'アカウントを切り替える', 'zh-CN': '切换账户'
  };
  Object.entries(accountSwitcherLabels).forEach(([language, text]) => {
    languageText[language].switchAccount = text;
  });
  const helpText = {
    fr: {
      title: 'Besoin d’aide ?', intro: 'Quelques repères pour utiliser l’application :',
      voice: 'Parler avec Irina', commands: 'Contrôler les LEDs', panels: 'Ouvrir les panneaux', settings: 'Personnaliser l’application'
    },
    en: { title: 'Need help?', intro: 'A few tips for using the application:', voice: 'Talk to Irina', commands: 'Control the LEDs', panels: 'Open panels', settings: 'Customize the application' },
    es: { title: '¿Necesitas ayuda?', intro: 'Algunas indicaciones para usar la aplicación:', voice: 'Hablar con Irina', commands: 'Controlar los LED', panels: 'Abrir los paneles', settings: 'Personalizar la aplicación' },
    de: { title: 'Brauchst du Hilfe?', intro: 'Einige Hinweise zur Anwendung:', voice: 'Mit Irina sprechen', commands: 'LEDs steuern', panels: 'Bereiche öffnen', settings: 'Anwendung anpassen' },
    it: { title: 'Hai bisogno di aiuto?', intro: 'Alcuni suggerimenti per usare l’applicazione:', voice: 'Parlare con Irina', commands: 'Controllare i LED', panels: 'Aprire i pannelli', settings: 'Personalizzare l’applicazione' },
    pt: { title: 'Precisa de ajuda?', intro: 'Algumas indicações para utilizar a aplicação:', voice: 'Falar com a Irina', commands: 'Controlar os LEDs', panels: 'Abrir painéis', settings: 'Personalizar a aplicação' },
    nl: { title: 'Hulp nodig?', intro: 'Enkele tips voor het gebruik van de applicatie:', voice: 'Praten met Irina', commands: 'Leds bedienen', panels: 'Panelen openen', settings: 'Applicatie aanpassen' },
    ja: { title: 'ヘルプが必要ですか？', intro: 'アプリケーションの使い方：', voice: 'Irinaと話す', commands: 'LEDを操作する', panels: 'パネルを開く', settings: 'アプリをカスタマイズする' },
    'zh-CN': { title: '需要帮助吗？', intro: '应用使用提示：', voice: '与 Irina 对话', commands: '控制 LED', panels: '打开面板', settings: '自定义应用' }
  };
  const t = (key) => languageText[currentLanguage]?.[key] || languageText.en[key] || languageText.fr[key] || key;
  const deviceUrlHints = {
    fr: 'Ex : <code>/api/led</code> si l’application est hébergée par l’ESP8266, ou <code>http://192.168.1.45/api/led</code> depuis un autre serveur.',
    en: 'Example: <code>/api/led</code> if the application is hosted by the ESP8266, or <code>http://192.168.1.45/api/led</code> from another server.',
    es: 'Ejemplo: <code>/api/led</code> si la aplicación está alojada en el ESP8266, o <code>http://192.168.1.45/api/led</code> desde otro servidor.',
    de: 'Beispiel: <code>/api/led</code>, wenn die Anwendung auf dem ESP8266 gehostet wird, oder <code>http://192.168.1.45/api/led</code> von einem anderen Server.',
    it: 'Esempio: <code>/api/led</code> se l’applicazione è ospitata dall’ESP8266, oppure <code>http://192.168.1.45/api/led</code> da un altro server.',
    pt: 'Exemplo: <code>/api/led</code> se a aplicação estiver alojada no ESP8266, ou <code>http://192.168.1.45/api/led</code> a partir de outro servidor.',
    nl: 'Voorbeeld: <code>/api/led</code> als de applicatie op de ESP8266 wordt gehost, of <code>http://192.168.1.45/api/led</code> vanaf een andere server.',
    ja: '例：ESP8266でアプリケーションをホストする場合は <code>/api/led</code>、別のサーバーからは <code>http://192.168.1.45/api/led</code>。',
    'zh-CN': '示例：如果应用托管在 ESP8266 上，请使用 <code>/api/led</code>；从其他服务器访问时，请使用 <code>http://192.168.1.45/api/led</code>。'
  };
  const httpMethodLabels = {
    POST_JSON: { fr: 'POST avec Body JSON', en: 'POST with JSON body', es: 'POST con cuerpo JSON', de: 'POST mit JSON-Body', it: 'POST con corpo JSON', pt: 'POST com corpo JSON', nl: 'POST met JSON-body', ja: 'JSON本文でPOST', 'zh-CN': '使用 JSON 请求体 POST' },
    GET_QUERY: { fr: 'GET avec Query Params (?state=on...)', en: 'GET with query params (?state=on...)', es: 'GET con parámetros de consulta (?state=on...)', de: 'GET mit Query-Parametern (?state=on...)', it: 'GET con parametri di query (?state=on...)', pt: 'GET com parâmetros de consulta (?state=on...)', nl: 'GET met queryparameters (?state=on...)', ja: 'クエリパラメーター付きGET (?state=on...)', 'zh-CN': '使用查询参数 GET (?state=on...)' },
    POST_FORM: { fr: 'POST URL-Encoded', en: 'POST URL-encoded', es: 'POST codificado en URL', de: 'POST URL-kodiert', it: 'POST codificato URL', pt: 'POST codificado em URL', nl: 'POST URL-gecodeerd', ja: 'POST URLエンコード', 'zh-CN': 'POST URL 编码' }
  };
  const languageChangedMessages = {
    fr: 'Langue changée en français.', en: 'Language switched to English.', es: 'Idioma cambiado a español.', de: 'Sprache auf Deutsch geändert.',
    it: 'Lingua cambiata in italiano.', pt: 'Idioma alterado para português.', nl: 'Taal gewijzigd naar Nederlands.', ja: '言語を日本語に変更しました。', 'zh-CN': '语言已切换为简体中文。'
  };
  const firmwareText = {
    fr: {
      title: 'Code C++ prêt pour ESP8266WebServer', description: 'Configurez le nombre de LEDs et la carte utilisée pour générer automatiquement le firmware correspondant.',
      board: 'Carte', ledCount: 'Nombre de LEDs', hint: 'Pour des LEDs simples, utilisez une résistance de 220 à 330 ohms par LED. Les broches proposées sont D1, D2, D5, D6 et D7.',
      initial: 'Générez le firmware avec les options ci-dessus.', generate: 'Générer le firmware', copy: 'Copier le code dans le presse-papier', copied: 'Code copié dans le presse-papier !'
    },
    en: {
      title: 'C++ code ready for ESP8266WebServer', description: 'Configure the LED count and board to automatically generate the matching firmware.',
      board: 'Board', ledCount: 'Number of LEDs', hint: 'For individual LEDs, use a 220–330 ohm resistor per LED. Available pins are D1, D2, D5, D6, and D7.',
      initial: 'Generate the firmware with the options above.', generate: 'Generate firmware', copy: 'Copy code to clipboard', copied: 'Code copied to clipboard!'
    },
    es: {
      title: 'Código C++ listo para ESP8266WebServer', description: 'Configura el número de LED y la placa para generar automáticamente el firmware correspondiente.',
      board: 'Placa', ledCount: 'Número de LED', hint: 'Para LED individuales, utiliza una resistencia de 220 a 330 ohmios por LED. Pines disponibles: D1, D2, D5, D6 y D7.',
      initial: 'Genera el firmware con las opciones anteriores.', generate: 'Generar firmware', copy: 'Copiar código al portapapeles', copied: '¡Código copiado al portapapeles!'
    },
    de: {
      title: 'C++-Code für ESP8266WebServer bereit', description: 'Konfiguriere die LED-Anzahl und das Board, um automatisch die passende Firmware zu erzeugen.',
      board: 'Board', ledCount: 'Anzahl der LEDs', hint: 'Verwende für einzelne LEDs einen Widerstand von 220 bis 330 Ohm pro LED. Verfügbare Pins: D1, D2, D5, D6 und D7.',
      initial: 'Erzeuge die Firmware mit den obigen Optionen.', generate: 'Firmware erzeugen', copy: 'Code in die Zwischenablage kopieren', copied: 'Code in die Zwischenablage kopiert!'
    },
    it: {
      title: 'Codice C++ pronto per ESP8266WebServer', description: 'Configura il numero di LED e la scheda per generare automaticamente il firmware corrispondente.',
      board: 'Scheda', ledCount: 'Numero di LED', hint: 'Per LED singoli, usa una resistenza da 220 a 330 ohm per LED. Pin disponibili: D1, D2, D5, D6 e D7.',
      initial: 'Genera il firmware con le opzioni sopra.', generate: 'Genera firmware', copy: 'Copia codice negli appunti', copied: 'Codice copiato negli appunti!'
    },
    pt: {
      title: 'Código C++ pronto para ESP8266WebServer', description: 'Configure o número de LEDs e a placa para gerar automaticamente o firmware correspondente.',
      board: 'Placa', ledCount: 'Número de LEDs', hint: 'Para LEDs individuais, use uma resistência de 220 a 330 ohms por LED. Pinos disponíveis: D1, D2, D5, D6 e D7.',
      initial: 'Gere o firmware com as opções acima.', generate: 'Gerar firmware', copy: 'Copiar código para a área de transferência', copied: 'Código copiado para a área de transferência!'
    },
    nl: {
      title: 'C++-code klaar voor ESP8266WebServer', description: 'Stel het aantal leds en het board in om automatisch de juiste firmware te genereren.',
      board: 'Board', ledCount: 'Aantal leds', hint: 'Gebruik voor afzonderlijke leds een weerstand van 220 tot 330 ohm per led. Beschikbare pinnen: D1, D2, D5, D6 en D7.',
      initial: 'Genereer de firmware met de bovenstaande opties.', generate: 'Firmware genereren', copy: 'Code naar klembord kopiëren', copied: 'Code naar klembord gekopieerd!'
    },
    ja: {
      title: 'ESP8266WebServer用C++コードの準備完了', description: 'LED数とボードを設定して、対応するファームウェアを自動生成します。',
      board: 'ボード', ledCount: 'LED数', hint: '個別のLEDには、LEDごとに220～330Ωの抵抗を使用してください。使用可能なピンはD1、D2、D5、D6、D7です。',
      initial: '上のオプションでファームウェアを生成してください。', generate: 'ファームウェアを生成', copy: 'コードをクリップボードにコピー', copied: 'コードをクリップボードにコピーしました！'
    },
    'zh-CN': {
      title: 'ESP8266WebServer C++ 代码已准备就绪', description: '配置 LED 数量和开发板，自动生成匹配的固件。',
      board: '开发板', ledCount: 'LED 数量', hint: '对于单个 LED，请为每个 LED 使用 220 至 330 欧姆的电阻。可用引脚：D1、D2、D5、D6 和 D7。',
      initial: '请使用上面的选项生成固件。', generate: '生成固件', copy: '复制代码到剪贴板', copied: '代码已复制到剪贴板！'
    }
  };
  const getFirmwareText = (key) => firmwareText[currentLanguage]?.[key] || firmwareText.en[key];
  const uiText = (french, english) => currentLanguage === 'fr'
    ? french
    : (localizedStaticText[french]?.[currentLanguage] || localizedStaticText[english]?.[currentLanguage] || english);
  const formatClockTime = (date = new Date()) => date.toLocaleTimeString(
    currentLanguage === 'zh-CN' ? 'zh-CN' : currentLanguage,
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: currentLanguage === 'en' || currentLanguage === 'ja' }
  );
  const localizedValue = (values) => values[currentLanguage] || values.en || values.fr;
  const allLedsLabel = () => localizedValue({
    fr: 'Toutes les LEDs', en: 'All LEDs', es: 'Todos los LED', de: 'Alle LEDs', it: 'Tutti i LED',
    pt: 'Todos os LEDs', nl: 'Alle leds', ja: 'すべてのLED', 'zh-CN': '所有 LED'
  });
  const effectLabel = (mode) => ({
    fr: { solid: 'Fixe', pulse: 'Respiration', blink: 'Clignotement', strobe: 'Stroboscope' },
    en: { solid: 'Solid', pulse: 'Pulse', blink: 'Blink', strobe: 'Strobe' },
    es: { solid: 'Fijo', pulse: 'Pulso', blink: 'Parpadeo', strobe: 'Estroboscópico' },
    de: { solid: 'Dauerlicht', pulse: 'Pulsieren', blink: 'Blinken', strobe: 'Stroboskop' },
    it: { solid: 'Fisso', pulse: 'Impulso', blink: 'Lampeggio', strobe: 'Strobo' },
    pt: { solid: 'Fixo', pulse: 'Pulso', blink: 'Intermitente', strobe: 'Estroboscópio' },
    nl: { solid: 'Vast', pulse: 'Puls', blink: 'Knipperen', strobe: 'Stroboscoop' },
    ja: { solid: '固定', pulse: 'パルス', blink: '点滅', strobe: 'ストロボ' },
    'zh-CN': { solid: '常亮', pulse: '呼吸', blink: '闪烁', strobe: '频闪' }
  }[currentLanguage]?.[mode] || mode);
  const colorLabel = (color) => {
    const ledNumberMatch = String(color).match(/^led\s+(\d+)$/i);
    if (ledNumberMatch) return localizedLedNumber(ledNumberMatch[1]);
    return ({
    fr: { Rouge: 'Rouge', Jaune: 'Jaune', Vert: 'Vert', Bleu: 'Bleu', Violet: 'Violet', Orange: 'Orange', Blanc: 'Blanc' },
    en: { Rouge: 'Red', Jaune: 'Yellow', Vert: 'Green', Bleu: 'Blue', Violet: 'Purple', Orange: 'Orange', Blanc: 'White' },
    es: { Rouge: 'Rojo', Jaune: 'Amarillo', Vert: 'Verde', Bleu: 'Azul', Violet: 'Violeta', Orange: 'Naranja', Blanc: 'Blanco' },
    de: { Rouge: 'Rot', Jaune: 'Gelb', Vert: 'Grün', Bleu: 'Blau', Violet: 'Violett', Orange: 'Orange', Blanc: 'Weiß' },
    it: { Rouge: 'Rosso', Jaune: 'Giallo', Vert: 'Verde', Bleu: 'Blu', Violet: 'Viola', Orange: 'Arancione', Blanc: 'Bianco' },
    pt: { Rouge: 'Vermelho', Jaune: 'Amarelo', Vert: 'Verde', Bleu: 'Azul', Violet: 'Roxo', Orange: 'Laranja', Blanc: 'Branco' },
    nl: { Rouge: 'Rood', Jaune: 'Geel', Vert: 'Groen', Bleu: 'Blauw', Violet: 'Paars', Orange: 'Oranje', Blanc: 'Wit' },
    ja: { Rouge: '赤', Jaune: '黄', Vert: '緑', Bleu: '青', Violet: '紫', Orange: 'オレンジ', Blanc: '白' },
    'zh-CN': { Rouge: '红色', Jaune: '黄色', Vert: '绿色', Bleu: '蓝色', Violet: '紫色', Orange: '橙色', Blanc: '白色' }
    }[currentLanguage]?.[color] || color);
  };
  const localizedLabels = {
    fr: { sending: 'Envoi...', offline: 'Hors ligne', active: 'Actif', inactive: 'Inactif', on: 'ALLUMÉE', off: 'ÉTEINTE', listening: 'Écoute en cours...', speakNow: 'Parlez maintenant...', waitWake: 'En attente de « Irina »...', sayWake: 'Dites « Irina » pour commencer...', unsupported: 'Vocale non supportée', noSpeech: 'Web Speech API non disponible sur ce navigateur.' },
    en: { sending: 'Sending...', offline: 'Offline', active: 'Active', inactive: 'Inactive', on: 'ON', off: 'OFF', listening: 'Listening...', speakNow: 'Speak now...', waitWake: 'Waiting for “Irina”...', sayWake: 'Say “Irina” to start...', unsupported: 'Voice not supported', noSpeech: 'Web Speech API is not available in this browser.' },
    es: { sending: 'Enviando...', offline: 'Sin conexión', active: 'Activo', inactive: 'Inactivo', on: 'ENCENDIDO', off: 'APAGADO', listening: 'Escuchando...', speakNow: 'Habla ahora...', waitWake: 'Esperando a «Irina»...', sayWake: 'Di «Irina» para comenzar...', unsupported: 'Voz no compatible', noSpeech: 'La API Web Speech no está disponible en este navegador.' },
    de: { sending: 'Senden...', offline: 'Offline', active: 'Aktiv', inactive: 'Inaktiv', on: 'AN', off: 'AUS', listening: 'Höre zu...', speakNow: 'Sprich jetzt...', waitWake: 'Warte auf „Irina“...', sayWake: 'Sage „Irina“ zum Starten...', unsupported: 'Sprache nicht unterstützt', noSpeech: 'Die Web Speech API ist in diesem Browser nicht verfügbar.' },
    it: { sending: 'Invio...', offline: 'Non in linea', active: 'Attivo', inactive: 'Inattivo', on: 'ACCESO', off: 'SPENTO', listening: 'Ascolto...', speakNow: 'Parla ora...', waitWake: 'In attesa di «Irina»...', sayWake: 'Di «Irina» per iniziare...', unsupported: 'Voce non supportata', noSpeech: 'Le Web Speech API non sono disponibili in questo browser.' },
    pt: { sending: 'A enviar...', offline: 'Fora de linha', active: 'Ativo', inactive: 'Inativo', on: 'LIGADO', off: 'DESLIGADO', listening: 'A ouvir...', speakNow: 'Fale agora...', waitWake: 'À espera de «Irina»...', sayWake: 'Diga «Irina» para começar...', unsupported: 'Voz não suportada', noSpeech: 'A Web Speech API não está disponível neste navegador.' },
    nl: { sending: 'Verzenden...', offline: 'Offline', active: 'Actief', inactive: 'Inactief', on: 'AAN', off: 'UIT', listening: 'Luisteren...', speakNow: 'Spreek nu...', waitWake: 'Wachten op “Irina”...', sayWake: 'Zeg “Irina” om te beginnen...', unsupported: 'Spraak niet ondersteund', noSpeech: 'De Web Speech API is niet beschikbaar in deze browser.' },
    ja: { sending: '送信中...', offline: 'オフライン', active: '有効', inactive: '無効', on: 'オン', off: 'オフ', listening: '聴き取り中...', speakNow: '話してください...', waitWake: '「Irina」を待機中...', sayWake: '「Irina」と言って開始...', unsupported: '音声非対応', noSpeech: 'このブラウザーでは Web Speech API を利用できません。' },
    'zh-CN': { sending: '发送中...', offline: '离线', active: '已启用', inactive: '未启用', on: '开启', off: '关闭', listening: '正在聆听...', speakNow: '请讲话...', waitWake: '正在等待“Irina”...', sayWake: '说“Irina”开始...', unsupported: '不支持语音', noSpeech: '此浏览器不支持 Web Speech API。' }
  };
  const label = (key) => localizedLabels[currentLanguage]?.[key] || localizedLabels.en[key];
  const localizedLedNumber = (ledId) => ({
    fr: `LED ${ledId}`, en: `LED ${ledId}`, es: `LED ${ledId}`, de: `LED ${ledId}`,
    it: `LED ${ledId}`, pt: `LED ${ledId}`, nl: `LED ${ledId}`, ja: `LED ${ledId}`, 'zh-CN': `LED ${ledId}`
  }[currentLanguage] || `LED ${ledId}`);
  const interfaceLabel = (key) => ({
    ledColor: { fr: 'Couleur de la LED', en: 'LED color', es: 'Color del LED', de: 'LED-Farbe', it: 'Colore del LED', pt: 'Cor do LED', nl: 'Ledkleur', ja: 'LEDの色', 'zh-CN': 'LED 颜色' },
    ledEffect: { fr: 'Effet de la LED', en: 'LED effect', es: 'Efecto del LED', de: 'LED-Effekt', it: 'Effetto del LED', pt: 'Efeito do LED', nl: 'Ledeffect', ja: 'LEDの効果', 'zh-CN': 'LED 效果' },
    turnOn: { fr: 'Allumer', en: 'Turn on', es: 'Encender', de: 'Einschalten', it: 'Accendi', pt: 'Ligar', nl: 'Inschakelen', ja: 'オンにする', 'zh-CN': '开启' },
    turnOff: { fr: 'Éteindre', en: 'Turn off', es: 'Apagar', de: 'Ausschalten', it: 'Spegni', pt: 'Desligar', nl: 'Uitschakelen', ja: 'オフにする', 'zh-CN': '关闭' },
    on: { fr: 'Allumée', en: 'On', es: 'Encendido', de: 'An', it: 'Acceso', pt: 'Ligado', nl: 'Aan', ja: 'オン', 'zh-CN': '开启' },
    off: { fr: 'Éteinte', en: 'Off', es: 'Apagado', de: 'Aus', it: 'Spento', pt: 'Desligado', nl: 'Uit', ja: 'オフ', 'zh-CN': '关闭' }
  }[key]?.[currentLanguage] || key);
  const connectionLabel = (status) => ({
    connecting: label('sending'),
    online: t('connected'),
    offline: label('offline')
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
    'Écoute active « Irina »': 'Active listening “Irina”',
    'Dernière instruction vocale :': 'Latest voice instruction:',
    '"Cliquez sur le micro et parlez..."': '"Click the microphone and speak..."',
    'Après autorisation du microphone, dites « Home Assistant » pour commencer une commande.': 'Enable active listening, then say “Irina” to start a command in real time.',
    "Activez l'écoute active, puis dites « Irina » pour commencer une commande en temps réel.": 'Enable active listening, then say “Irina” to start a command in real time.',
    'Activez l’écoute active, puis dites « Irina » pour commencer une commande en temps réel.': 'Enable active listening, then say “Irina” to start a command in real time.',
    'Commandes supportées :': 'Supported commands:',
    'Action : "Allume" / "Éteins"': 'Action: “Turn on” / “Turn off”',
    'Cible : "toutes les LEDs"': 'Target: “all LEDs”',
    '"LED rouge" / "LED jaune" / "LED verte" / "LED bleue"': '“Red LED” / “Yellow LED” / “Green LED” / “Blue LED”',
    'Commandes multiples : "Allume la LED rouge et la LED jaune"': 'Multiple commands: “Turn on the red LED and the yellow LED”',
    'Mode IA : configurez les LEDs, le thème, le réseau et les panneaux par la voix': 'AI mode: configure LEDs, theme, network, and panels by voice',
    'Gestes : un geste allume toutes les LEDs, deux gestes les éteignent': 'Gestures: one clap or snap turns all LEDs on, two turn them off',
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
  const localizedStaticText = {
    'Not specified': { fr: 'Non précisée', en: 'Not specified', es: 'No especificado', de: 'Nicht angegeben', it: 'Non specificato', pt: 'Não especificado', nl: 'Niet opgegeven', ja: '未指定', 'zh-CN': '未指定' },
    'Activer les réponses vocales': { fr: 'Activer les réponses vocales', en: 'Enable voice responses', es: 'Activar respuestas de voz', de: 'Sprachantworten aktivieren', it: 'Attiva risposte vocali', pt: 'Ativar respostas de voz', nl: 'Spraakreacties inschakelen', ja: '音声応答を有効化', 'zh-CN': '启用语音回复' },
    'Activer l’écoute active d’Irina': { fr: 'Activer l’écoute active d’Irina', en: 'Enable active listening “Irina”', es: 'Activar la escucha activa de «Irina»', de: 'Aktives Zuhören von „Irina“ aktivieren', it: 'Attiva l’ascolto attivo di «Irina»', pt: 'Ativar a escuta ativa da «Irina»', nl: 'Actief luisteren naar “Irina” inschakelen', ja: '「Irina」のアクティブリスニングを有効化', 'zh-CN': '启用“Irina”主动聆听' },
    'Activer l\'écoute active d\'Irina': { fr: 'Activer l’écoute active d’Irina', en: 'Enable active listening “Irina”', es: 'Activar la escucha activa de «Irina»', de: 'Aktives Zuhören von „Irina“ aktivieren', it: 'Attiva l’ascolto attivo di «Irina»', pt: 'Ativar a escuta ativa da «Irina»', nl: 'Actief luisteren naar “Irina” inschakelen', ja: '「Irina」のアクティブリスニングを有効化', 'zh-CN': '启用“Irina”主动聆听' },
    'Active listening “Irina”': { fr: 'Écoute active « Irina »', en: 'Active listening “Irina”', es: 'Escucha activa «Irina»', de: 'Aktives Zuhören „Irina“', it: 'Ascolto attivo «Irina»', pt: 'Escuta ativa «Irina»', nl: 'Actief luisteren “Irina”', ja: '「Irina」のアクティブリスニング', 'zh-CN': '“Irina”主动聆听' },
    'Écoute active « Irina »': { fr: 'Écoute active « Irina »', en: 'Active listening “Irina”', es: 'Escucha activa «Irina»', de: 'Aktives Zuhören „Irina“', it: 'Ascolto attivo «Irina»', pt: 'Escuta ativa «Irina»', nl: 'Actief luisteren “Irina”', ja: '「Irina」のアクティブリスニング', 'zh-CN': '“Irina”主动聆听' },
    'Interpréter les commandes avec Ollama': { fr: 'Interpréter les commandes avec Ollama', en: 'Interpret commands with Ollama', es: 'Interpretar comandos con Ollama', de: 'Befehle mit Ollama interpretieren', it: 'Interpreta i comandi con Ollama', pt: 'Interpretar comandos com Ollama', nl: 'Opdrachten met Ollama interpreteren', ja: 'Ollamaでコマンドを解釈', 'zh-CN': '使用 Ollama 解释指令' },
    'Détecter un tapement de mains ou un claquement de doigts': { fr: 'Détecter un tapement de mains ou un claquement de doigts', en: 'Detect claps or finger snaps', es: 'Detectar palmadas o chasquidos', de: 'Klatschen oder Fingerschnippen erkennen', it: 'Rileva battiti di mani o schiocchi di dita', pt: 'Detetar palmas ou estalos de dedos', nl: 'Handgeklap of vingerknippen detecteren', ja: '拍手や指鳴らしを検出', 'zh-CN': '检测拍手或弹指' },
    'Detect claps or finger snaps': { fr: 'Détecter un tapement de mains ou un claquement de doigts', en: 'Detect claps or finger snaps', es: 'Detectar palmadas o chasquidos', de: 'Klatschen oder Fingerschnippen erkennen', it: 'Rileva battiti di mani o schiocchi di dita', pt: 'Detetar palmas ou estalos de dedos', nl: 'Handgeklap of vingerknippen detecteren', ja: '拍手や指鳴らしを検出', 'zh-CN': '检测拍手或弹指' },
    '"Cliquez sur le micro et parlez..."': { fr: '"Cliquez sur le micro et parlez..."', en: '"Click the microphone and speak..."', es: '«Haz clic en el micrófono y habla...»', de: '„Klicke auf das Mikrofon und sprich …“', it: '«Fai clic sul microfono e parla...»', pt: '«Clique no microfone e fale...»', nl: '‘Klik op de microfoon en spreek...’', ja: '「マイクをクリックして話してください…」', 'zh-CN': '“点击麦克风并讲话……”' },
    'Définit le nombre total de LEDs physiques du circuit.': { fr: 'Définit le nombre total de LEDs physiques du circuit.', en: 'Sets the total number of physical LEDs in the circuit.', es: 'Define el número total de LED físicos del circuito.', de: 'Legt die Gesamtzahl der physischen LEDs im Schaltkreis fest.', it: 'Definisce il numero totale di LED fisici del circuito.', pt: 'Define o número total de LEDs físicos do circuito.', nl: 'Stelt het totale aantal fysieke leds in het circuit in.', ja: '回路の物理LED総数を設定します。', 'zh-CN': '设置电路中的物理 LED 总数。' },
    'Sets the total number of physical LEDs in the circuit.': { fr: 'Définit le nombre total de LEDs physiques du circuit.', en: 'Sets the total number of physical LEDs in the circuit.', es: 'Define el número total de LED físicos del circuito.', de: 'Legt die Gesamtzahl der physischen LEDs im Schaltkreis fest.', it: 'Definisce il numero totale di LED fisici del circuito.', pt: 'Define o número total de LEDs físicos do circuito.', nl: 'Stelt het totale aantal fysieke leds in het circuit in.', ja: '回路の物理LED総数を設定します。', 'zh-CN': '设置电路中的物理 LED 总数。' },
    '"Click the microphone and speak..."': { fr: '"Cliquez sur le micro et parlez..."', en: '"Click the microphone and speak..."', es: '«Haz clic en el micrófono y habla...»', de: '„Klicke auf das Mikrofon und sprich …“', it: '«Fai clic sul microfono e parla...»', pt: '«Clique no microfone e fale...»', nl: '‘Klik op de microfoon en spreek...’', ja: '「マイクをクリックして話してください…」', 'zh-CN': '“点击麦克风并讲话……”' },
    'Nombre de LEDs dans le circuit': { fr: 'Nombre de LEDs dans le circuit', en: 'Number of LEDs in the circuit', es: 'Número de LED del circuito', de: 'Anzahl der LEDs im Schaltkreis', it: 'Numero di LED nel circuito', pt: 'Número de LEDs no circuito', nl: 'Aantal leds in het circuit', ja: '回路内のLED数', 'zh-CN': '电路中的 LED 数量' },
    'Méthode HTTP': { fr: 'Méthode HTTP', en: 'HTTP method', es: 'Método HTTP', de: 'HTTP-Methode', it: 'Metodo HTTP', pt: 'Método HTTP', nl: 'HTTP-methode', ja: 'HTTPメソッド', 'zh-CN': 'HTTP 方法' },
    'Adresse IP / URL de la LED (ESP8266 / ESP32 / Arduino / RPi)': { fr: 'Adresse IP / URL de la LED (ESP8266 / ESP32 / Arduino / RPi)', en: 'LED IP address / URL (ESP8266 / ESP32 / Arduino / RPi)', es: 'Dirección IP / URL del LED (ESP8266 / ESP32 / Arduino / RPi)', de: 'LED-IP-Adresse / URL (ESP8266 / ESP32 / Arduino / RPi)', it: 'Indirizzo IP / URL del LED (ESP8266 / ESP32 / Arduino / RPi)', pt: 'Endereço IP / URL do LED (ESP8266 / ESP32 / Arduino / RPi)', nl: 'LED IP-adres / URL (ESP8266 / ESP32 / Arduino / RPi)', ja: 'LEDのIPアドレス / URL (ESP8266 / ESP32 / Arduino / RPi)', 'zh-CN': 'LED IP 地址 / URL（ESP8266 / ESP32 / Arduino / RPi）' },
    'POST avec Body JSON': { fr: 'POST avec Body JSON', en: 'POST with JSON body', es: 'POST con cuerpo JSON', de: 'POST mit JSON-Body', it: 'POST con corpo JSON', pt: 'POST com corpo JSON', nl: 'POST met JSON-body', ja: 'JSON本文でPOST', 'zh-CN': '使用 JSON 请求体 POST' },
    'GET avec Query Params (?state=on...)': { fr: 'GET avec Query Params (?state=on...)', en: 'GET with query params (?state=on...)', es: 'GET con parámetros de consulta (?state=on...)', de: 'GET mit Query-Parametern (?state=on...)', it: 'GET con parametri di query (?state=on...)', pt: 'GET com parâmetros de consulta (?state=on...)', nl: 'GET met queryparameters (?state=on...)', ja: 'クエリパラメーター付きGET (?state=on...)', 'zh-CN': '使用查询参数 GET (?state=on...)' },
    'POST URL-Encoded': { fr: 'POST URL-Encoded', en: 'POST URL-encoded', es: 'POST codificado en URL', de: 'POST URL-kodiert', it: 'POST codificato URL', pt: 'POST codificado em URL', nl: 'POST URL-gecodeerd', ja: 'POST URLエンコード', 'zh-CN': 'POST URL 编码' },
    'Système initialisé. Prêt à communiquer avec le circuit.': { fr: 'Système initialisé. Prêt à communiquer avec le circuit.', en: 'System initialized. Ready to communicate with the circuit.', es: 'Sistema inicializado. Listo para comunicarse con el circuito.', de: 'System initialisiert. Bereit zur Kommunikation mit dem Schaltkreis.', it: 'Sistema inizializzato. Pronto a comunicare con il circuito.', pt: 'Sistema inicializado. Pronto para comunicar com o circuito.', nl: 'Systeem geïnitialiseerd. Klaar om met het circuit te communiceren.', ja: 'システムを初期化しました。回路との通信準備が完了しました。', 'zh-CN': '系统已初始化，可以与电路通信。' },
    'System initialized. Ready to communicate with the circuit.': { fr: 'Système initialisé. Prêt à communiquer avec le circuit.', en: 'System initialized. Ready to communicate with the circuit.', es: 'Sistema inicializado. Listo para comunicarse con el circuito.', de: 'System initialisiert. Bereit zur Kommunikation mit dem Schaltkreis.', it: 'Sistema inizializzato. Pronto a comunicare con il circuito.', pt: 'Sistema inicializado. Pronto para comunicar com o circuito.', nl: 'Systeem geïnitialiseerd. Klaar om met het circuit te communiceren.', ja: 'システムを初期化しました。回路との通信準備が完了しました。', 'zh-CN': '系统已初始化，可以与电路通信。' },
    'Application prête. IP Cible :': { fr: 'Application prête. IP Cible :', en: 'Application ready. Target IP:', es: 'Aplicación lista. IP de destino:', de: 'Anwendung bereit. Ziel-IP:', it: 'Applicazione pronta. IP di destinazione:', pt: 'Aplicação pronta. IP de destino:', nl: 'Applicatie klaar. Doel-IP:', ja: 'アプリケーションの準備完了。対象IP：', 'zh-CN': '应用已准备就绪。目标 IP：' },
    'Application ready. Target IP:': { fr: 'Application prête. IP Cible :', en: 'Application ready. Target IP:', es: 'Aplicación lista. IP de destino:', de: 'Anwendung bereit. Ziel-IP:', it: 'Applicazione pronta. IP di destinazione:', pt: 'Aplicação pronta. IP de destino:', nl: 'Applicatie klaar. Doel-IP:', ja: 'アプリケーションの準備完了。対象IP：', 'zh-CN': '应用已准备就绪。目标 IP：' },
    'Sending': { fr: 'Envoi', en: 'Sending', es: 'Enviando', de: 'Senden', it: 'Invio', pt: 'A enviar', nl: 'Verzenden', ja: '送信中', 'zh-CN': '发送' },
    'Target': { fr: 'Cible', en: 'Target', es: 'Destino', de: 'Ziel', it: 'Destinazione', pt: 'Destino', nl: 'Doel', ja: '対象', 'zh-CN': '目标' },
    'Connection failed to': { fr: 'Échec de la connexion vers', en: 'Connection failed to', es: 'Error de conexión con', de: 'Verbindung fehlgeschlagen zu', it: 'Connessione fallita a', pt: 'Falha na ligação a', nl: 'Verbinding mislukt met', ja: '接続に失敗しました：', 'zh-CN': '连接失败：' },
    'Échec de la connexion vers': { fr: 'Échec de la connexion vers', en: 'Connection failed to', es: 'Error de conexión con', de: 'Verbindung fehlgeschlagen zu', it: 'Connessione fallita a', pt: 'Falha na ligação a', nl: 'Verbinding mislukt met', ja: '接続に失敗しました：', 'zh-CN': '连接失败：' },
    'Details:': { fr: 'Détail :', en: 'Details:', es: 'Detalles:', de: 'Details:', it: 'Dettagli:', pt: 'Detalhes:', nl: 'Details:', ja: '詳細：', 'zh-CN': '详情：' },
    'Détail :': { fr: 'Détail :', en: 'Details:', es: 'Detalles:', de: 'Details:', it: 'Dettagli:', pt: 'Detalhes:', nl: 'Details:', ja: '詳細：', 'zh-CN': '详情：' },
    'Failed to fetch': { fr: 'Échec de la récupération', en: 'Failed to fetch', es: 'No se pudo realizar la solicitud', de: 'Abruf fehlgeschlagen', it: 'Recupero non riuscito', pt: 'Falha ao obter resposta', nl: 'Ophalen mislukt', ja: '取得に失敗しました', 'zh-CN': '获取失败' },
    'Mode Réseau': { fr: 'Mode Réseau', en: 'Network mode', es: 'Modo de red', de: 'Netzwerkmodus', it: 'Modalità di rete', pt: 'Modo de rede', nl: 'Netwerkmodus', ja: 'ネットワークモード', 'zh-CN': '网络模式' },
    'Connexion sécurisée HTTPS': { fr: 'Connexion sécurisée HTTPS', en: 'Secure HTTPS connection', es: 'Conexión HTTPS segura', de: 'Sichere HTTPS-Verbindung', it: 'Connessione HTTPS sicura', pt: 'Ligação HTTPS segura', nl: 'Veilige HTTPS-verbinding', ja: '安全なHTTPS接続', 'zh-CN': '安全 HTTPS 连接' },
    'Ex:': { fr: 'Ex :', en: 'Example:', es: 'Ejemplo:', de: 'Beispiel:', it: 'Esempio:', pt: 'Exemplo:', nl: 'Voorbeeld:', ja: '例：', 'zh-CN': '示例：' },
    'depuis un autre serveur.': { fr: 'depuis un autre serveur.', en: 'from another server.', es: 'desde otro servidor.', de: 'von einem anderen Server.', it: 'da un altro server.', pt: 'a partir de outro servidor.', nl: 'vanaf een andere server.', ja: '別のサーバーから。', 'zh-CN': '来自其他服务器。' },
    'HTTPS chiffre les échanges ; le circuit doit disposer d’un certificat TLS et autoriser le CORS.': { fr: 'HTTPS chiffre les échanges ; le circuit doit disposer d’un certificat TLS et autoriser le CORS.', en: 'HTTPS encrypts traffic; the circuit must have a TLS certificate and allow CORS.', es: 'HTTPS cifra el tráfico; el circuito debe tener un certificado TLS y permitir CORS.', de: 'HTTPS verschlüsselt den Datenverkehr; die Schaltung benötigt ein TLS-Zertifikat und muss CORS erlauben.', it: 'HTTPS cifra il traffico; il circuito deve avere un certificato TLS e consentire CORS.', pt: 'O HTTPS cifra o tráfego; o circuito precisa de um certificado TLS e de permitir CORS.', nl: 'HTTPS versleutelt verkeer; het circuit heeft een TLS-certificaat nodig en moet CORS toestaan.', ja: 'HTTPSは通信を暗号化します。回路にはTLS証明書が必要で、CORSを許可する必要があります。', 'zh-CN': 'HTTPS 会加密流量；电路必须拥有 TLS 证书并允许 CORS。' },
    'Obtenir le Code C++ pour mon ESP32 / Arduino': { fr: 'Obtenir le Code C++ pour mon ESP32 / Arduino', en: 'Get C++ code for my ESP32 / Arduino', es: 'Obtener el código C++ para mi ESP32 / Arduino', de: 'C++-Code für mein ESP32 / Arduino erhalten', it: 'Ottieni il codice C++ per ESP32 / Arduino', pt: 'Obter código C++ para o meu ESP32 / Arduino', nl: 'C++-code voor mijn ESP32 / Arduino ophalen', ja: 'ESP32 / Arduino用C++コードを取得', 'zh-CN': '获取 ESP32 / Arduino 的 C++ 代码' },
    'Dernière instruction vocale :': { fr: 'Dernière instruction vocale :', en: 'Latest voice instruction:', es: 'Última instrucción de voz:', de: 'Letzte Sprachanweisung:', it: 'Ultima istruzione vocale:', pt: 'Última instrução de voz:', nl: 'Laatste spraakopdracht:', ja: '最新の音声指示：', 'zh-CN': '最新语音指令：' },
    'Commandes supportées :': { fr: 'Commandes supportées :', en: 'Supported commands:', es: 'Comandos compatibles:', de: 'Unterstützte Befehle:', it: 'Comandi supportati:', pt: 'Comandos suportados:', nl: 'Ondersteunde opdrachten:', ja: '対応コマンド：', 'zh-CN': '支持的指令：' },
    'Vous': { fr: 'Vous', en: 'You', es: 'Tú', de: 'Du', it: 'Tu', pt: 'Você', nl: 'Jij', ja: 'あなた', 'zh-CN': '你' },
    'Message cannot be empty.': { fr: 'Le message ne peut pas être vide.', en: 'Message cannot be empty.', es: 'El mensaje no puede estar vacío.', de: 'Die Nachricht darf nicht leer sein.', it: 'Il messaggio non può essere vuoto.', pt: 'A mensagem não pode estar vazia.', nl: 'Het bericht mag niet leeg zijn.', ja: 'メッセージを入力してください。', 'zh-CN': '消息不能为空。' },
    'Sending...': { fr: 'Envoi...', en: 'Sending...', es: 'Enviando...', de: 'Senden...', it: 'Invio...', pt: 'A enviar...', nl: 'Verzenden...', ja: '送信中...', 'zh-CN': '发送中...' },
    'Get C++ code for my ESP32 / Arduino': { fr: 'Obtenir le Code C++ pour mon ESP32 / Arduino', en: 'Get C++ code for my ESP32 / Arduino', es: 'Obtener el código C++ para mi ESP32 / Arduino', de: 'C++-Code für mein ESP32 / Arduino erhalten', it: 'Ottieni il codice C++ per ESP32 / Arduino', pt: 'Obter código C++ para o meu ESP32 / Arduino', nl: 'C++-code voor mijn ESP32 / Arduino ophalen', ja: 'ESP32 / Arduino用C++コードを取得', 'zh-CN': '获取 ESP32 / Arduino 的 C++ 代码' }
  };
  const additionalLocalizedText = {
    'Configuration du Circuit Physique': { fr: 'Configuration du Circuit Physique', en: 'Physical Circuit Configuration', es: 'Configuración del circuito físico', de: 'Konfiguration der physischen Schaltung', it: 'Configurazione del circuito fisico', pt: 'Configuração do circuito físico', nl: 'Configuratie van het fysieke circuit', ja: '物理回路の設定', 'zh-CN': '物理电路配置' },
    'Adresse IP / URL de la LED (ESP8266 / ESP32 / Arduino / RPi)': { fr: 'Adresse IP / URL de la LED (ESP8266 / ESP32 / Arduino / RPi)', en: 'LED IP address / URL (ESP8266 / ESP32 / Arduino / RPi)', es: 'Dirección IP / URL del LED (ESP8266 / ESP32 / Arduino / RPi)', de: 'LED-IP-Adresse / URL (ESP8266 / ESP32 / Arduino / RPi)', it: 'Indirizzo IP / URL del LED (ESP8266 / ESP32 / Arduino / RPi)', pt: 'Endereço IP / URL do LED (ESP8266 / ESP32 / Arduino / RPi)', nl: 'LED IP-adres / URL (ESP8266 / ESP32 / Arduino / RPi)', ja: 'LEDのIPアドレス / URL (ESP8266 / ESP32 / Arduino / RPi)', 'zh-CN': 'LED IP 地址 / URL（ESP8266 / ESP32 / Arduino / RPi）' },
    'Nombre de LEDs dans le circuit': { fr: 'Nombre de LEDs dans le circuit', en: 'Number of LEDs in the circuit', es: 'Número de LED del circuito', de: 'Anzahl der LEDs im Schaltkreis', it: 'Numero di LED nel circuito', pt: 'Número de LEDs no circuito', nl: 'Aantal leds in het circuit', ja: '回路内のLED数', 'zh-CN': '电路中的 LED 数量' },
    'Méthode HTTP': { fr: 'Méthode HTTP', en: 'HTTP method', es: 'Método HTTP', de: 'HTTP-Methode', it: 'Metodo HTTP', pt: 'Método HTTP', nl: 'HTTP-methode', ja: 'HTTPメソッド', 'zh-CN': 'HTTP 方法' },
    'Mode Réseau': { fr: 'Mode Réseau', en: 'Network mode', es: 'Modo de red', de: 'Netzwerkmodus', it: 'Modalità di rete', pt: 'Modo de rede', nl: 'Netwerkmodus', ja: 'ネットワークモード', 'zh-CN': '网络模式' },
    'Connexion sécurisée HTTPS': { fr: 'Connexion sécurisée HTTPS', en: 'Secure HTTPS connection', es: 'Conexión HTTPS segura', de: 'Sichere HTTPS-Verbindung', it: 'Connessione HTTPS sicura', pt: 'Ligação HTTPS segura', nl: 'Beveiligde HTTPS-verbinding', ja: '安全なHTTPS接続', 'zh-CN': '安全 HTTPS 连接' },
    'Raccourcis Rapides': { fr: 'Raccourcis Rapides', en: 'Quick shortcuts', es: 'Accesos rápidos', de: 'Schnellzugriffe', it: 'Scorciatoie rapide', pt: 'Atalhos rápidos', nl: 'Snelkoppelingen', ja: 'クイックショートカット', 'zh-CN': '快捷操作' },
    'Commande Vocale (Speech)': { fr: 'Commande Vocale (Speech)', en: 'Voice Control (Speech)', es: 'Control por voz', de: 'Sprachsteuerung', it: 'Controllo vocale', pt: 'Controlo por voz', nl: 'Spraakbesturing', ja: '音声操作', 'zh-CN': '语音控制' },
    'Dernière instruction vocale :': { fr: 'Dernière instruction vocale :', en: 'Latest voice instruction:', es: 'Última instrucción de voz:', de: 'Letzte Sprachanweisung:', it: 'Ultima istruzione vocale:', pt: 'Última instrução de voz:', nl: 'Laatste spraakinstructie:', ja: '最新の音声指示：', 'zh-CN': '最后的语音指令：' },
    'Code C++ prêt pour ESP8266WebServer': { fr: 'Code C++ prêt pour ESP8266WebServer', en: 'C++ code ready for ESP8266WebServer', es: 'Código C++ listo para ESP8266WebServer', de: 'C++-Code für ESP8266WebServer bereit', it: 'Codice C++ pronto per ESP8266WebServer', pt: 'Código C++ pronto para ESP8266WebServer', nl: 'C++-code klaar voor ESP8266WebServer', ja: 'ESP8266WebServer用C++コードの準備完了', 'zh-CN': 'ESP8266WebServer C++ 代码已准备就绪' },
    'Carte': { fr: 'Carte', en: 'Board', es: 'Placa', de: 'Board', it: 'Scheda', pt: 'Placa', nl: 'Board', ja: 'ボード', 'zh-CN': '开发板' },
    'Nombre de LEDs': { fr: 'Nombre de LEDs', en: 'Number of LEDs', es: 'Número de LED', de: 'Anzahl der LEDs', it: 'Numero di LED', pt: 'Número de LEDs', nl: 'Aantal leds', ja: 'LED数', 'zh-CN': 'LED 数量' },
    'Générer le firmware': { fr: 'Générer le firmware', en: 'Generate firmware', es: 'Generar firmware', de: 'Firmware erzeugen', it: 'Genera firmware', pt: 'Gerar firmware', nl: 'Firmware genereren', ja: 'ファームウェアを生成', 'zh-CN': '生成固件' },
    'Copier le code dans le presse-papier': { fr: 'Copier le code dans le presse-papier', en: 'Copy code to clipboard', es: 'Copiar código al portapapeles', de: 'Code in die Zwischenablage kopieren', it: 'Copia codice negli appunti', pt: 'Copiar código para a área de transferência', nl: 'Code naar klembord kopiëren', ja: 'コードをクリップボードにコピー', 'zh-CN': '复制代码到剪贴板' },
    'Miroir visuel des LEDs du circuit': { fr: 'Miroir visuel des LEDs du circuit', en: 'Visual mirror of circuit LEDs', es: 'Espejo visual de los LED del circuito', de: 'Visuelle Anzeige der Schaltungs-LEDs', it: 'Specchio visivo dei LED del circuito', pt: 'Espelho visual dos LEDs do circuito', nl: 'Visuele weergave van circuit-leds', ja: '回路LEDのビジュアルミラー', 'zh-CN': '电路 LED 可视镜像' },
    'Contrôle des trois premières LEDs': { fr: 'Contrôle des trois premières LEDs', en: 'Control of the first three LEDs', es: 'Control de los tres primeros LED', de: 'Steuerung der ersten drei LEDs', it: 'Controllo dei primi tre LED', pt: 'Controlo dos três primeiros LEDs', nl: 'Bediening van de eerste drie leds', ja: '最初の3つのLEDを操作', 'zh-CN': '前三个 LED 控制' },
    'Configuration indépendante des LEDs': { fr: 'Configuration indépendante des LEDs', en: 'Independent LED configuration', es: 'Configuración independiente de los LED', de: 'Unabhängige LED-Konfiguration', it: 'Configurazione indipendente dei LED', pt: 'Configuração independente dos LEDs', nl: 'Onafhankelijke ledconfiguratie', ja: 'LEDごとの個別設定', 'zh-CN': '独立 LED 配置' },
    'Utiliser une connexion chiffrée vers le circuit': { fr: 'Utiliser une connexion chiffrée vers le circuit', en: 'Use an encrypted connection to the circuit', es: 'Usar una conexión cifrada con el circuito', de: 'Verschlüsselte Verbindung zur Schaltung verwenden', it: 'Usa una connessione crittografata al circuito', pt: 'Usar uma ligação encriptada ao circuito', nl: 'Een versleutelde verbinding met het circuit gebruiken', ja: '回路への暗号化接続を使用', 'zh-CN': '使用到电路的加密连接' },
    'Connexion sécurisée HTTPS': { fr: 'Connexion sécurisée HTTPS', en: 'Secure HTTPS connection', es: 'Conexión HTTPS segura', de: 'Sichere HTTPS-Verbindung', it: 'Connessione HTTPS sicura', pt: 'Ligação HTTPS segura', nl: 'Beveiligde HTTPS-verbinding', ja: '安全なHTTPS接続', 'zh-CN': '安全 HTTPS 连接' },
    '/api/led ou http://192.168.1.45/api/led': { fr: '/api/led ou http://192.168.1.45/api/led', en: '/api/led or http://192.168.1.45/api/led', es: '/api/led o http://192.168.1.45/api/led', de: '/api/led oder http://192.168.1.45/api/led', it: '/api/led o http://192.168.1.45/api/led', pt: '/api/led ou http://192.168.1.45/api/led', nl: '/api/led of http://192.168.1.45/api/led', ja: '/api/led または http://192.168.1.45/api/led', 'zh-CN': '/api/led 或 http://192.168.1.45/api/led' },
    'Indicateur du mode IA': { fr: 'Indicateur du mode IA', en: 'AI mode indicator', es: 'Indicador del modo IA', de: 'KI-Modus-Anzeige', it: 'Indicatore della modalità IA', pt: 'Indicador do modo IA', nl: 'Indicator voor AI-modus', ja: 'AIモードインジケーター', 'zh-CN': 'AI 模式指示器' }
  };
  const translateStatic = (value) => {
    if (localizedStaticText[value]) return localizedStaticText[value][currentLanguage] || localizedStaticText[value].en;
    if (currentLanguage !== 'fr') return staticTranslations[value] || value;
    const entry = Object.entries(staticTranslations).find(([, english]) => english === value);
    return entry ? entry[0] : value;
  };
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const languageAttributes = ['aria-label', 'placeholder', 'title'];
  const captureLanguageSources = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!originalTextNodes.has(node) && node.nodeValue.trim()) {
        originalTextNodes.set(node, node.nodeValue);
      }
    }
    document.querySelectorAll('*').forEach((element) => {
      const sources = {};
      languageAttributes.forEach((attribute) => {
        if (element.hasAttribute(attribute)) sources[attribute] = element.getAttribute(attribute);
      });
      if (Object.keys(sources).length) originalAttributes.set(element, sources);
    });
  };
  const translateFragment = (value) => {
    const entries = Object.entries({ ...localizedStaticText, ...additionalLocalizedText }).flatMap(([source, values]) => (
      Object.entries(values).map(([language, text]) => [text, values[currentLanguage] || values.en])
    )).concat(currentLanguage !== 'fr'
      ? Object.entries(staticTranslations)
      : Object.entries(staticTranslations).map(([french, english]) => [english, french]));
    return replaceLanguageFragments(value, entries);
  };
  const replaceLanguageFragments = (value, entries) => entries
    .filter(([source, target]) => source && source !== target)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((result, [source, target]) => {
      const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isWordExpression = /^[\p{L}\p{N}]+(?:[\s-]+[\p{L}\p{N}]+)*$/u.test(source);
      if (isWordExpression) {
        return result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu'), target);
      }
      return result.split(source).join(target);
    }, value);

  function applyLanguage() {
    captureLanguageSources();
    document.documentElement.lang = currentLanguage;
    localStorage.setItem('language_preference', currentLanguage);
    if (languageSelector) languageSelector.value = currentLanguage;
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
      'Fixe': currentLanguage === 'fr' ? 'Fixe' : 'Solid',
      'Respiration': currentLanguage === 'fr' ? 'Respiration' : 'Pulse',
      'Clignotement': currentLanguage === 'fr' ? 'Clignotement' : 'Blink',
      'Stroboscope': currentLanguage === 'fr' ? 'Stroboscope' : 'Strobe',
      'Non précisée': currentLanguage === 'fr' ? 'Non précisée' : 'Not specified',
    };
    const languageEntries = [
      ...Object.entries({ ...localizedStaticText, ...additionalLocalizedText }).flatMap(([source, values]) => (
        Object.entries(values).map(([language, text]) => [text, values[currentLanguage] || values.en])
      )),
      ...Object.entries(staticTranslations).map(([french, english]) => (
        currentLanguage === 'fr' ? [english, french] : [french, english]
      )),
      ...Object.entries(replacements)
    ]
      .filter(([source, target]) => source !== target)
      .sort((first, second) => second[0].length - first[0].length);
    const translateCurrentFragment = (value) => replaceLanguageFragments(value, languageEntries);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const source = originalTextNodes.get(node) || node.nodeValue;
      const value = source.trim();
      const translated = translateCurrentFragment(value);
      if (translated) node.nodeValue = source.replace(value, translated);
    });
    document.querySelectorAll('[aria-label]').forEach(element => {
      const source = originalAttributes.get(element)?.['aria-label'] || element.getAttribute('aria-label');
      element.setAttribute('aria-label', translateCurrentFragment(source));
    });
    document.querySelectorAll('[placeholder]').forEach(element => {
      const source = originalAttributes.get(element)?.placeholder || element.getAttribute('placeholder');
      element.setAttribute('placeholder', translateCurrentFragment(source));
    });
    document.querySelectorAll('[title]').forEach(element => {
      const source = originalAttributes.get(element)?.title || element.getAttribute('title');
      element.setAttribute('title', translateCurrentFragment(source));
    });
    document.querySelectorAll('[title]').forEach(element => {
      if (element.title === 'Changer le thème (Clair / Sombre)' || element.title === 'Change theme (Light / Dark)') {
        element.title = t('themeTitle');
      }
    });
    const voiceWakeHint = document.getElementById('voiceWakeHint');
    if (voiceWakeHint) voiceWakeHint.textContent = t('voiceWakeHint');
    const deviceUrlHint = document.getElementById('deviceUrlHint');
    if (deviceUrlHint) deviceUrlHint.innerHTML = deviceUrlHints[currentLanguage] || deviceUrlHints.en;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (key && languageText[currentLanguage][key]) element.textContent = languageText[currentLanguage][key];
    });
    const currentHelp = helpText[currentLanguage] || helpText.en;
    const helpElements = {
      helpTitle: currentHelp.title,
      helpIntro: currentHelp.intro,
      helpVoice: currentHelp.voice,
      helpCommands: currentHelp.commands,
      helpPanels: currentHelp.panels,
      helpSettings: currentHelp.settings
    };
    Object.entries(helpElements).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    });
    const helpSearch = document.getElementById('helpSearch');
    const helpTopics = document.querySelectorAll('.help-topic');
    const helpNoResults = document.getElementById('helpNoResults');
    if (helpSearch && helpSearch.dataset.searchReady !== 'true') {
      helpSearch.dataset.searchReady = 'true';
      helpSearch.addEventListener('input', () => {
        const query = normalizeVoiceText(helpSearch.value);
        let visibleTopics = 0;
        helpTopics.forEach(topic => {
          const matches = !query || normalizeVoiceText(`${topic.dataset.helpTopic} ${topic.textContent}`).includes(query);
          topic.hidden = !matches;
          if (matches) visibleTopics += 1;
        });
        if (helpNoResults) helpNoResults.hidden = visibleTopics > 0;
      });
    }
    const chatWelcome = document.querySelector('#chatMessages [data-i18n="chatWelcome"]');
    const preferredName = getPreferredUserName();
    if (chatWelcome && preferredName) {
      const welcomeByLanguage = {
        fr: `Bonjour ${preferredName} ! Écrivez-moi une commande ou une question sur votre circuit.`,
        en: `Hello ${preferredName}! Write me a command or ask a question about your circuit.`,
        es: `¡Hola ${preferredName}! Escríbeme un comando o una pregunta sobre tu circuito.`,
        de: `Hallo ${preferredName}! Schreibe mir einen Befehl oder eine Frage zu deiner Schaltung.`,
        it: `Ciao ${preferredName}! Scrivimi un comando o una domanda sul tuo circuito.`,
        pt: `Olá ${preferredName}! Escreva um comando ou uma pergunta sobre o seu circuito.`,
        nl: `Hallo ${preferredName}! Schrijf me een opdracht of vraag over je circuit.`,
        ja: `${preferredName}さん、こんにちは！回路へのコマンドや質問を入力してください。`,
        'zh-CN': `${preferredName}，您好！请输入电路指令或问题。`
      };
      chatWelcome.textContent = welcomeByLanguage[currentLanguage] || welcomeByLanguage.en;
    }
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (key && languageText[currentLanguage][key]) element.placeholder = languageText[currentLanguage][key];
    });
    const firmwareModalTitle = document.getElementById('firmwareModalTitle');
    const firmwareModalDescription = document.getElementById('firmwareModalDescription');
    const firmwareBoardLabel = document.getElementById('firmwareBoardLabel');
    const firmwareLedCountLabel = document.getElementById('firmwareLedCountLabel');
    const firmwareModalHint = document.getElementById('firmwareModalHint');
    if (firmwareModalTitle) firmwareModalTitle.textContent = getFirmwareText('title');
    if (firmwareModalDescription) firmwareModalDescription.textContent = getFirmwareText('description');
    if (firmwareBoardLabel) firmwareBoardLabel.textContent = getFirmwareText('board');
    if (firmwareLedCountLabel) firmwareLedCountLabel.textContent = getFirmwareText('ledCount');
    if (firmwareModalHint) firmwareModalHint.textContent = getFirmwareText('hint');
    if (espCodeSnippet && !espCodeSnippet.dataset.generated) espCodeSnippet.textContent = getFirmwareText('initial');
    if (btnGenerateFirmware) btnGenerateFirmware.textContent = getFirmwareText('generate');
    if (btnCopyCode && !btnCopyCode.dataset.copied) {
      btnCopyCode.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-clipboard"></use></svg> ${getFirmwareText('copy')}`;
    }
    if (httpMethodSelect) {
      [...httpMethodSelect.options].forEach((option) => {
        const labels = httpMethodLabels[option.value];
        if (labels) option.textContent = labels[currentLanguage] || labels.en;
      });
    }
    const voiceHeaderLabels = [
      ['toggleSpeechFeedback', 'synthesis', 'Activer les réponses vocales'],
      ['toggleVoiceWakeWord', 'wake', 'Écoute active « Irina »'],
      ['toggleVoiceAi', 'ai', 'Interpréter les commandes avec Ollama'],
      ['toggleSoundGestures', 'gestures', 'Détecter un tapement de mains ou un claquement de doigts']
    ];
    voiceHeaderLabels.forEach(([id, key, title]) => {
      const input = document.getElementById(id);
      const labelElement = input?.closest('label');
      const textElement = labelElement?.querySelector('span');
      if (textElement) {
        const icon = textElement.querySelector('svg');
        textElement.textContent = '';
        if (icon) textElement.appendChild(icon);
        textElement.append(document.createTextNode(` ${t(key)}`));
      }
      if (labelElement) labelElement.title = translateCurrentFragment(title);
    });
    const defaultTranscript = document.getElementById('voiceTranscript');
    if (defaultTranscript && [
      '"Cliquez sur le micro et parlez..."',
      '"Click the microphone and speak..."',
      '“点击麦克风并讲话……”'
    ].includes(defaultTranscript.textContent.trim())) {
      defaultTranscript.textContent = localizedStaticText['"Cliquez sur le micro et parlez..."'][currentLanguage];
    }
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
      if (entry.dataset.message) {
        entry.innerHTML = `<span class="log-time">[${formatClockTime(new Date(timestamp))}]</span> ${translateFragment(entry.dataset.message)}`;
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

  languageSelector?.addEventListener('change', (event) => {
    event.stopPropagation();
    currentLanguage = languageSelector.value;
    applyLanguage();
    addLog(languageChangedMessages[currentLanguage], 'info');
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
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatSubmit = document.getElementById('chatSubmit');
  const conversationHistoryKey = 'home_assistant_irina_conversation';
  const conversationHistoryLimit = 20;
  const conversationHistory = loadConversationHistory();
  const chatEditWindow = 5 * 60 * 1000;

  function loadConversationHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(conversationHistoryKey) || '[]');
      return Array.isArray(stored)
        ? stored.filter(entry => ['user', 'assistant'].includes(entry?.role) && typeof entry.content === 'string').slice(-conversationHistoryLimit)
        : [];
    } catch {
      return [];
    }
  }

  function rememberConversationTurn(role, content) {
    if (!content) return;
    conversationHistory.push({ role, content: String(content) });
    if (conversationHistory.length > conversationHistoryLimit) {
      conversationHistory.splice(0, conversationHistory.length - conversationHistoryLimit);
    }
    localStorage.setItem(conversationHistoryKey, JSON.stringify(conversationHistory));
  }
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
      this.scheduleNameAnimation();
    }

    disconnectedCallback() {
      window.clearTimeout(this.nameAnimationTimer);
      this.nameElement?.removeEventListener('pointerup', this.handleNamePointer);
      this.nameElement?.removeEventListener('click', this.handleNamePointer);
      this.setState('idle');
    }

    setAiActive(active) {
      this.classList.toggle('ai-enabled', Boolean(active));
      if (!active) this.setState('idle');
      this.scheduleNameAnimation();
    }

    scheduleNameAnimation() {
      window.clearTimeout(this.nameAnimationTimer);
      this.nameAnimationTimer = window.setTimeout(() => {
        this.startNameAnimation(false);
      }, 60000);
    }

    startNameAnimation(manual = false) {
      if (this.classList.contains('name-is-rolling')) return;
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

    startSpeaking() {
      this.classList.add('is-speaking');
      this.classList.add('name-is-rolling');
      this.pulseSpeech();
    }

    pulseSpeech() {
      this.classList.remove('speech-pulse');
      void this.offsetWidth;
      this.classList.add('speech-pulse');
      window.clearTimeout(this.speechPulseTimer);
      this.speechPulseTimer = window.setTimeout(() => {
        this.classList.remove('speech-pulse');
      }, 220);
    }

    stopSpeaking() {
      window.clearTimeout(this.speechPulseTimer);
      this.classList.remove('is-speaking', 'speech-pulse', 'name-is-rolling');
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
  const savedLedCount = Number.parseInt(localStorage.getItem('led_total_count'), 10);
  const initialLedCount = Number.isInteger(savedLedCount) && savedLedCount >= 1 && savedLedCount <= 100
    ? savedLedCount
    : 1;

  let state = {
    isOn: false,
    selectedLed: '1', // '1', '2', '3', ... 'ALL'
    totalLeds: initialLedCount,
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
    const normalized = String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/[’']/g, ' ')
      .trim();
    return replaceSpokenNumbers(normalized);
  }

  function replaceSpokenNumbers(text) {
    const cjkDigits = '零一二三四五六七八九';
    text = text.replace(/[零一二三四五六七八九]/g, (digit) => String(cjkDigits.indexOf(digit)));
    const numberWords = new Map();
    const frenchUnits = ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const englishUnits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const frenchTens = { 20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante' };
    const englishTens = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety' };

    frenchUnits.forEach((word, value) => numberWords.set(word, value));
    englishUnits.forEach((word, value) => numberWords.set(word, value));
    numberWords.set('dix', 10); numberWords.set('onze', 11); numberWords.set('douze', 12);
    numberWords.set('treize', 13); numberWords.set('quatorze', 14); numberWords.set('quinze', 15);
    numberWords.set('seize', 16); numberWords.set('dix sept', 17); numberWords.set('dix huit', 18);
    numberWords.set('dix neuf', 19); numberWords.set('cent', 100); numberWords.set('cents', 100);
    numberWords.set('ten', 10); numberWords.set('eleven', 11); numberWords.set('twelve', 12);
    numberWords.set('thirteen', 13); numberWords.set('fourteen', 14); numberWords.set('fifteen', 15);
    numberWords.set('sixteen', 16); numberWords.set('seventeen', 17); numberWords.set('eighteen', 18);
    numberWords.set('nineteen', 19); numberWords.set('hundred', 100);

    Object.entries(frenchTens).forEach(([value, word]) => {
      numberWords.set(word, Number(value));
      for (let unit = 1; unit < 10; unit += 1) {
        if (Number(value) === 60 && unit === 1) numberWords.set('soixante et onze', 71);
        numberWords.set(`${word} ${unit === 1 ? 'et ' : ''}${frenchUnits[unit]}`, Number(value) + unit);
      }
    });
    numberWords.set('soixante dix', 70);
    numberWords.set('soixante onze', 71);
    numberWords.set('soixante douze', 72);
    numberWords.set('soixante treize', 73);
    numberWords.set('soixante quatorze', 74);
    numberWords.set('soixante quinze', 75);
    numberWords.set('soixante seize', 76);
    numberWords.set('soixante dix sept', 77);
    numberWords.set('soixante dix huit', 78);
    numberWords.set('soixante dix neuf', 79);
    numberWords.set('quatre vingt', 80);
    for (let unit = 1; unit < 10; unit += 1) numberWords.set(`quatre vingt ${frenchUnits[unit]}`, 80 + unit);
    numberWords.set('quatre vingt dix', 90);
    for (let unit = 1; unit < 10; unit += 1) numberWords.set(`quatre vingt dix ${frenchUnits[unit]}`, 90 + unit);
    Object.entries(englishTens).forEach(([value, word]) => {
      numberWords.set(word, Number(value));
      for (let unit = 1; unit < 10; unit += 1) numberWords.set(`${word} ${englishUnits[unit]}`, Number(value) + unit);
    });

    const localizedNumbers = {
      es: {
        units: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'],
        teens: ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'],
        tens: ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
      },
      de: {
        units: ['null', 'eins', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht', 'neun'],
        teens: ['zehn', 'elf', 'zwoelf', 'dreizehn', 'vierzehn', 'fuenfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'],
        tens: ['zwanzig', 'dreissig', 'vierzig', 'fuenfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']
      },
      it: {
        units: ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'],
        teens: ['dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'],
        tens: ['venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta']
      },
      pt: {
        units: ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'],
        teens: ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'],
        tens: ['vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
      },
      nl: {
        units: ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen'],
        teens: ['tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'],
        tens: ['twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig']
      },
      ja: {
        units: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
        teens: ['十'],
        tens: []
      },
      'zh-CN': {
        units: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
        teens: ['十'],
        tens: []
      }
    };
    Object.values(localizedNumbers).forEach(({ units, teens, tens }) => {
      units.forEach((word, value) => numberWords.set(word, value));
      teens.forEach((word, index) => numberWords.set(word, index + 10));
      tens.forEach((word, index) => {
        const value = (index + 2) * 10;
        numberWords.set(word, value);
        for (let unit = 1; unit < 10; unit += 1) numberWords.set(`${word} ${units[unit]}`, value + unit);
      });
    });

    return [...numberWords.entries()]
      .sort(([first], [second]) => second.length - first.length)
      .reduce((result, [words, value]) => {
        const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return result.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'g'), `$1${value}`);
      }, text);
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
      button.setAttribute('aria-label', currentLanguage === 'fr'
        ? `Allumer ou éteindre ${colorLabel(led.name)}`
        : currentLanguage === 'en'
          ? `Turn ${colorLabel(led.name)} on or off`
          : `${colorLabel(led.name)}: ${label('on')} / ${label('off')}`);
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
        <span class="led-assignment-name">${localizedLedNumber(led.id)}</span>
        <select class="form-select led-name-select" data-led="${led.id}" aria-label="${interfaceLabel('ledColor')} ${led.id}">
          <option value="">${localizedStaticText['Not specified'][currentLanguage]}</option>
          ${ledColorOptions.map(color => `<option value="${color}">${colorLabel(color)}</option>`).join('')}
        </select>
        <select class="form-select led-effect-select" data-led="${led.id}" aria-label="${interfaceLabel('ledEffect')} ${led.id} (${colorLabel(led.name)})">
          <option value="solid">${effectLabel('solid')}</option>
          <option value="pulse">${effectLabel('pulse')}</option>
          <option value="blink">${effectLabel('blink')}</option>
          <option value="strobe">${effectLabel('strobe')}</option>
        </select>
        <button
          type="button"
          class="btn-text led-power-button${led.isOn ? ' is-on' : ''}"
          data-led="${led.id}"
          aria-label="${interfaceLabel(led.isOn ? 'turnOff' : 'turnOn')} ${colorLabel(led.name)}"
          aria-pressed="${led.isOn}"
        ><svg class="ui-icon led-power-symbol" aria-hidden="true"><use href="#icon-power"></use></svg><span class="led-power-label">${interfaceLabel(led.isOn ? 'on' : 'off')}</span></button>
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
      option.textContent = localizedLedNumber(i);
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

  // --- 🌗 Gestion du Thème Clair / Sombre / Couleur ---
  const THEME_BASE_KEY = 'theme_base_preference';
  let currentTheme = localStorage.getItem('theme_preference') || 'light';
  let currentBaseTheme = localStorage.getItem(THEME_BASE_KEY) || currentTheme;

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

  function applyTheme(themeSelection) {
    const normalizedTheme = themeSelection === 'dark' ? 'dark' : themeSelection === 'custom' ? 'custom' : 'light';
    const baseTheme = normalizedTheme === 'custom'
      ? (localStorage.getItem(THEME_BASE_KEY) || currentBaseTheme || 'dark')
      : normalizedTheme;

    localStorage.setItem(THEME_BASE_KEY, baseTheme);
    localStorage.setItem('theme_preference', normalizedTheme);

    const effectiveTheme = normalizedTheme === 'custom' ? baseTheme : normalizedTheme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    currentTheme = normalizedTheme;
    currentBaseTheme = baseTheme;

    const savedColor = window.getThemeColor?.() || '#5b6ef6';
    if (normalizedTheme === 'custom') {
      window.applyThemeColor?.(savedColor);
    } else {
      window.applyThemeColor?.(savedColor);
    }

    if (themeModeSelector) {
      themeModeSelector.value = normalizedTheme;
    }

    if (themeColorPicker) {
      themeColorPicker.disabled = false;
      themeColorPicker.setAttribute('aria-disabled', 'false');
    }

  }

  if (themeColorPicker) {
    themeColorPicker.value = window.getThemeColor?.() || '#00f0ff';
    themeColorPicker.addEventListener('input', (event) => {
      window.applyThemeColor?.(event.target.value);
    });
  }

  if (themeModeSelector) {
    themeModeSelector.addEventListener('change', (event) => {
      applyTheme(event.target.value);
      addLog(`[UI] Thème sélectionné : ${event.target.value === 'light' ? 'Clair' : event.target.value === 'dark' ? 'Sombre' : 'Couleur'}`, 'info');
    });
  }

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
      const fallbackNames = { '1': 'Rouge', '2': 'Jaune', '3': 'Vert' };
      const displayName = led?.name || fallbackNames[button.dataset.led] || `LED ${button.dataset.led}`;
      button.classList.toggle('is-on', Boolean(led && led.isOn));
      button.classList.toggle('is-unavailable', !led);
      button.disabled = !led;
      if (led || fallbackNames[button.dataset.led]) {
        const assignedColor = ledColorValues[displayName];
        button.classList.toggle('led-control-neutral', !assignedColor);
        button.classList.toggle('led-control-assigned', Boolean(assignedColor));
        if (assignedColor) {
          button.style.setProperty('--led-assigned-color', assignedColor);
        } else {
          button.style.setProperty('--led-assigned-color', led ? getLedColor(led.id) : '#9ca3af');
        }
        const localizedTurnOnOff = {
          fr: 'Allumer ou éteindre', en: 'Turn on or off', es: 'Encender o apagar',
          de: 'Ein- oder ausschalten', it: 'Accendi o spegni', pt: 'Ligar ou desligar',
          nl: 'In- of uitschakelen', ja: 'オンまたはオフ', 'zh-CN': '开启或关闭'
        }[currentLanguage] || 'Turn on or off';
        button.setAttribute('aria-label', `${localizedTurnOnOff} ${colorLabel(displayName)}`);
        const label = button.querySelector('.led-control-label');
        if (label) label.textContent = colorLabel(displayName);
      }
    });

    if (activeCount > 0) {
      ledStateText.textContent = currentLanguage === 'fr'
        ? `${activeCount} LED${activeCount > 1 ? 'S' : ''} ALLUMÉE${activeCount > 1 ? 'S' : ''}`
        : `${activeCount} LED${activeCount > 1 ? 's' : ''} ${label('on')}`;
      ledStateText.style.color = 'var(--primary)';
    } else {
      ledStateText.textContent = currentLanguage === 'fr' ? 'ÉTEINT' : label('off');
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
          statusLiveBadge.textContent = label('active');
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-on';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        const activeStateLabels = {
          fr: 'active', en: 'active', es: 'encendido', de: 'aktiv', it: 'acceso',
          pt: 'ligado', nl: 'actief', ja: '点灯', 'zh-CN': '已开启'
        };
        statusPrimaryText.textContent = `${activeCount} LED${activeCount > 1 ? 's' : ''} ${activeStateLabels[currentLanguage] || activeStateLabels.en}${currentLanguage === 'fr' && activeCount > 1 ? 's' : ''}`;
        if (statusSecondaryText) {
          const selectedText = {
            fr: 'LED sélectionnée', en: 'Selected LED', es: 'LED seleccionada', de: 'Ausgewählte LED',
            it: 'LED selezionato', pt: 'LED selecionado', nl: 'Geselecteerde LED', ja: '選択したLED', 'zh-CN': '选定的 LED'
          }[currentLanguage] || 'Selected LED';
          const effectText = {
            fr: 'Effet', en: 'Effect', es: 'Efecto', de: 'Effekt', it: 'Effetto',
            pt: 'Efeito', nl: 'Effect', ja: '効果', 'zh-CN': '效果'
          }[currentLanguage] || 'Effect';
          statusSecondaryText.textContent = `${selectedText}: ${selectedConfig ? selectedConfig.brightness : state.brightness}% • ${effectText}: ${effectLabel(selectedConfig ? selectedConfig.mode : state.mode)}`;
        }
      } else {
        if (statusLiveBadge) {
          statusLiveBadge.className = 'status-badge status-offline';
          statusLiveBadge.textContent = label('inactive');
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-off';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        statusPrimaryText.textContent = `${colorLabel(ledName)} ${label('off').toLowerCase()}`;
        if (statusSecondaryText) {
          const powerOffText = {
            fr: 'Circuit hors tension', en: 'Circuit powered off', es: 'Circuito apagado', de: 'Schaltung ausgeschaltet',
            it: 'Circuito spento', pt: 'Circuito desligado', nl: 'Circuit uitgeschakeld', ja: '回路は電源オフ', 'zh-CN': '电路已关闭'
          }[currentLanguage] || 'Circuit powered off';
          statusSecondaryText.textContent = `${powerOffText} (${formatClockTime()})`;
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
    entry.dataset.message = message;
    entry.dataset.logType = type;
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
      ? (currentLanguage === 'fr' ? 'ALLUMÉE' : label('on'))
      : (currentLanguage === 'fr' ? 'ÉTEINTE' : label('off'));
    action.textContent = currentLanguage === 'fr'
      ? `${ledTargetName} ${isOn ? 'allumée' : 'éteinte'}`
      : `${ledTargetName === 'All LEDs' ? ledTargetName : `${colorLabel(ledTargetName)} LED`} ${isOn ? label('on').toLowerCase() : label('off').toLowerCase()}`;
    details.textContent = `(${brightness}% • ${effectLabel(mode)})`;
  }

  function renderInitialHistoryEntry() {
    const entry = ledActivationHistory?.querySelector('li:not([data-history-entry="true"])');
    if (!entry) return;

    const badge = entry.querySelector('.history-badge');
    const text = entry.querySelector('.history-text');
    if (badge) {
      badge.className = 'history-badge badge-off';
      badge.textContent = currentLanguage === 'fr' ? 'ÉTEINT' : label('off');
    }
    if (text) {
      text.textContent = currentLanguage === 'fr'
        ? 'Toutes les LEDs éteintes (Initialisation)'
        : `${allLedsLabel()} ${label('off').toLowerCase()}`;
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
      addLog(`[NET] ${uiText('Envoi', 'Sending')} ${fetchOptions.method} to <code>${targetFetchUrl}</code> (${uiText('Cible', 'Target')}: LED ${state.selectedLed})...`, 'info');

      const response = await fetch(targetFetchUrl, fetchOptions);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        setConnectionStatus('online', connectionLabel('online'), latency);
        addLog(`[OK] HTTP ${uiText('Réponse', 'response')} ${response.status} (${latency} ms) - LED #${state.selectedLed} ${uiText('mise à jour sur le circuit', 'updated on the circuit')} !`, 'success');
      } else {
        const errText = await response.text();
        const errorLabel = {
          fr: 'Erreur', en: 'Error', es: 'Error', de: 'Fehler', it: 'Errore',
          pt: 'Erro', nl: 'Fout', ja: 'エラー', 'zh-CN': '错误'
        }[currentLanguage] || 'Error';
        setConnectionStatus('offline', `${errorLabel} ${response.status}`);
        addLog(`[WARN] ${uiText('Serveur physique a répondu HTTP', 'Physical server returned HTTP')} ${response.status}: ${errText}`, 'error');
      }
    } catch (err) {
      setConnectionStatus('offline', connectionLabel('offline'));
      addLog(`[ERR] Échec de la connexion vers ${targetFetchUrl}. Détail : ${err.message}`, 'error');
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
  let voiceResponseInProgress = false;
  let isSpeaking = false;
  let activeUtterance = null;
  let waitingForNameConfirmation = false;
  let waitingForAlternateName = false;

  function getSpeechLanguage() {
    return {
      fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', it: 'it-IT',
      pt: 'pt-PT', nl: 'nl-NL', ja: 'ja-JP', 'zh-CN': 'zh-CN'
    }[currentLanguage] || 'en-US';
  }

  function getTimeGreeting() {
    const hour = new Date().getHours();
    return localizedValue({
      fr: hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir',
      en: hour >= 5 && hour < 12 ? 'Good morning' : 'Good evening',
      es: hour >= 5 && hour < 12 ? 'Buenos días' : 'Buenas tardes',
      de: hour >= 5 && hour < 12 ? 'Guten Morgen' : 'Guten Abend',
      it: hour >= 5 && hour < 12 ? 'Buongiorno' : 'Buonasera',
      pt: hour >= 5 && hour < 12 ? 'Bom dia' : 'Boa tarde',
      nl: hour >= 5 && hour < 12 ? 'Goedemorgen' : 'Goedenavond',
      ja: hour >= 5 && hour < 12 ? 'おはようございます' : 'こんばんは',
      'zh-CN': hour >= 5 && hour < 12 ? '早上好' : '晚上好'
    });
  }

  function getIrinaIntroduction() {
    const username = getPreferredUserName();
    const name = username ? ` ${username}` : '';
    return localizedValue({
      fr: `${getTimeGreeting()}${name}, je suis Irina.`,
      en: `${getTimeGreeting()}${name}, I am Irina.`,
      es: `${getTimeGreeting()}${name}, soy Irina.`,
      de: `${getTimeGreeting()}${name}, ich bin Irina.`,
      it: `${getTimeGreeting()}${name}, sono Irina.`,
      pt: `${getTimeGreeting()}${name}, sou a Irina.`,
      nl: `${getTimeGreeting()}${name}, ik ben Irina.`,
      ja: `${getTimeGreeting()}${name}、Irinaです。`,
      'zh-CN': `${getTimeGreeting()}${name}，我是 Irina。`
    });
  }

  function updateVoiceLanguage() {
    if (recognition) recognition.lang = getSpeechLanguage();
  }

  function isVoiceSessionStopCommand(text) {
    const normalized = normalizeVoiceText(text).replace(/[-']/g, ' ');
    return /^(?:stop|arrete(?: toi)?|au revoir|bye bye|goodbye|good bye)(?:\s+irina)?[.!?\s]*$/.test(normalized);
  }

  function speakResponse(text) {
    if (!toggleSpeechFeedback.checked || !('speechSynthesis' in window)) {
      finishVoiceResponse();
      return;
    }
    if (isListening) recognition.stop();
    isSpeaking = false;
    activeUtterance = null;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;
    isSpeaking = true;
    voiceAiIndicator?.startSpeaking();
    utterance.lang = getSpeechLanguage();
    utterance.rate = 0.92;
    utterance.pitch = 1.12;
    utterance.volume = 0.9;
    const preferredVoice = getPreferredVoice(utterance.lang);
    if (preferredVoice) utterance.voice = preferredVoice;
    const finishSpeaking = () => {
      if (!isSpeaking || activeUtterance !== utterance) return;
      isSpeaking = false;
      activeUtterance = null;
      voiceAiIndicator?.stopSpeaking();
      finishVoiceResponse();
    };
    utterance.addEventListener('boundary', () => voiceAiIndicator?.pulseSpeech());
    utterance.addEventListener('end', finishSpeaking, { once: true });
    utterance.addEventListener('error', finishSpeaking, { once: true });
    window.speechSynthesis.speak(utterance);
  }

  function finishVoiceResponse() {
    if (!voiceResponseInProgress) return;
    voiceResponseInProgress = false;
    if (wakeWordEnabled && voiceSessionActive) {
      window.setTimeout(() => startRecognition('command'), 250);
    }
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

  const preferredVoiceCache = new Map();

  function getPreferredVoice(language) {
    const cacheKey = String(language || '').toLowerCase();
    const cachedVoice = preferredVoiceCache.get(cacheKey);
    if (cachedVoice && window.speechSynthesis?.getVoices?.().includes(cachedVoice)) return cachedVoice;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const languagePrefix = language.toLowerCase().split('-')[0];
    const matchingVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(languagePrefix));
    const preferredNames = {
      fr: /amelie|audrey|julie|marie|sylvie|hortense|claire|femme|female|google français|microsoft/i,
      en: /samantha|karen|victoria|zira|ava|allison|aria|female|woman|google us english|microsoft/i,
      es: /monica|paulina|helena|laura|female|mujer|google español|microsoft/i,
      de: /anna|katja|petra|female|frau|google deutsch|microsoft/i,
      it: /elsa|alice|federica|female|donna|google italiano|microsoft/i,
      pt: /joana|luciana|female|mulher|google português|microsoft/i,
      nl: /claire|ellen|female|vrouw|google nederlands|microsoft/i,
      ja: /kyoko|otoya|female|女性|google 日本語|microsoft/i,
      'zh-cn': /ting-ting|xiaoxiao|huihui|female|女|google 普通话|microsoft/i
    }[language.toLowerCase()] || /female|woman|femme|女性|女/i;
    const softHints = /natural|neural|premium|enhanced|online|google|microsoft|siri|samantha|karen|zira|xiaoxiao|kyoko/i;
    const maleHints = /male|homme|man|männ|uomo|hombre|david|marc|thomas|george|alex/i;
    const selectedVoice = matchingVoices
      .filter(voice => !maleHints.test(voice.name))
      .sort((first, second) => {
        const score = (voice) => (preferredNames.test(voice.name) ? 4 : 0)
          + (softHints.test(voice.name) ? 2 : 0)
          - (maleHints.test(voice.name) ? 10 : 0);
        return score(second) - score(first);
      })[0]
      || matchingVoices[0]
      || voices.find(voice => voice.lang.toLowerCase().startsWith('fr'))
      || voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
      || voices[0];
    if (selectedVoice) preferredVoiceCache.set(cacheKey, selectedVoice);
    return selectedVoice;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      preferredVoiceCache.clear();
      window.speechSynthesis.getVoices();
    });
  }

  let gestureAudioContext = null;
  let gestureAnalyser = null;
  let gestureStream = null;
  let gestureFrame = null;
  let lastGestureAt = 0;
  const gestureCounts = new Map();
  const gestureCountTimers = new Map();

  function applyGestureLedAction(gestureName, count) {
    const shouldTurnOn = count === 1;
    state.selectedLed = 'ALL';
    state.leds.forEach(led => { led.isOn = shouldTurnOn; });
    if (ledSelect) ledSelect.value = 'ALL';
    syncControlsFromSelection();
    rebuildLedAssignments();
    updateVisualLEDState();
    addLog(`[VOICE] ${gestureName} (${count}) : toutes les LEDs ${shouldTurnOn ? 'allumées' : 'éteintes'}`, 'info');
    sendHardwareRequest();
  }

  function registerSoundGesture(gestureName) {
    const count = (gestureCounts.get(gestureName) || 0) + 1;
    gestureCounts.set(gestureName, count);
    window.clearTimeout(gestureCountTimers.get(gestureName));
    gestureCountTimers.set(gestureName, window.setTimeout(() => {
      const finalCount = gestureCounts.get(gestureName) || 0;
      gestureCounts.delete(gestureName);
      gestureCountTimers.delete(gestureName);
      if (finalCount === 1 || finalCount === 2) applyGestureLedAction(gestureName, finalCount);
    }, 1400));
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

      if (now - lastGestureAt > 350 && peak > 0.16 && rms > 0.035) {
        const gestureName = highFrequencyRatio > 0.42 && rms < 0.12
          ? 'Claquement de doigts'
          : 'Tapement de mains';
        lastGestureAt = now;
        registerSoundGesture(gestureName);
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
        ? label('waitWake')
        : label('listening');
      voiceTranscript.textContent = recognitionMode === 'wake'
        ? label('sayWake')
        : label('speakNow');
    };

    recognition.onend = () => {
      isListening = false;
      if (!voiceAiIndicator?.classList.contains('is-thinking')) setVoiceVisualState(null);
      btnVoiceMic.classList.remove('listening');
      voiceCard?.classList.remove('is-listening');
      if (isSpeaking || voiceResponseInProgress) return;
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
        ? label('listening')
        : (wakeWordEnabled ? label('waitWake') : t('enableMic'));
      voiceTranscript.textContent = `Erreur micro: ${event.error}`;
      addLog(`[VOICE] Erreur reconnaissance vocale: ${event.error}`, 'error');
    };

    recognition.onresult = async (event) => {
      if (isSpeaking) return;
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      if (isVoiceSessionStopCommand(transcript)) {
        voiceSessionActive = false;
        voiceTranscript.textContent = `"${transcript}"`;
        addLog('[VOICE] Session vocale continue arrêtée', 'info');
        recognition.stop();
        window.setTimeout(() => speakResponse('Bye bye.'), 100);
        return;
      }
      if (recognitionMode === 'wake') {
        const normalizedTranscript = normalizeVoiceText(transcript);
        if (normalizedTranscript.includes('irina')) {
          const inlineCommand = transcript
            .replace(/.*?irina\b/i, '')
            .replace(/^[\s,;:.-]+/, '')
            .trim();
          voiceSessionActive = true;
          voiceResponseInProgress = true;
          voiceTranscript.textContent = currentLanguage === 'en'
            ? 'Yes, I am listening. Speak now...' : 'Oui, je vous écoute. Parlez maintenant...';
          addLog('[VOICE] Mot d’activation « Irina » détecté', 'info');
          recognition.stop();
          if (inlineCommand) {
            window.setTimeout(() => handleRecognizedCommand(inlineCommand), 100);
            return;
          }
          window.setTimeout(() => speakResponse(currentLanguage === 'en'
            ? 'Yes, I am listening.' : 'Oui, je vous écoute.'), 100);
        }
        return;
      }
      voiceResponseInProgress = true;
      recognition.stop();
      await handleRecognizedCommand(transcript);
      if (!isSpeaking) finishVoiceResponse();
    };
  } else {
    btnVoiceMic.disabled = true;
    if (toggleVoiceWakeWord) toggleVoiceWakeWord.disabled = true;
    micBtnText.textContent = label('unsupported');
    voiceTranscript.textContent = label('noSpeech');
  }

  function startRecognition(mode) {
    if (!recognition || isListening || isSpeaking || voiceResponseInProgress) return;
    recognitionMode = mode;
    try {
      recognition.start();
    } catch (error) {
      addLog(`[VOICE] Impossible d’activer le microphone: ${error.message}`, 'error');
    }
  }

  function activateTypedIrinaListening() {
    const username = getPreferredUserName();
    const name = username ? ` ${username}` : '';
    const response = currentLanguage === 'en'
      ? `Yes${name}, I am listening.`
      : `Oui${name}, je vous écoute.`;
    wakeWordEnabled = true;
    voiceSessionActive = true;
    if (toggleVoiceWakeWord) toggleVoiceWakeWord.checked = true;
    voiceTranscript.textContent = currentLanguage === 'en'
      ? 'Yes, I am listening. Speak now...'
      : 'Oui, je vous écoute. Parlez maintenant...';
    addLog('[CHAT] Mot d’activation « Irina » déclenché depuis le chatbot', 'info');
    voiceResponseInProgress = true;
    window.setTimeout(() => {
      speakResponse(response);
      if (!isSpeaking && !isListening) startRecognition('command');
    }, 100);
    return response;
  }

  async function handleRecognizedCommand(transcript) {
    voiceTranscript.textContent = `"${transcript}"`;
    addLog(`[VOICE] Commande vocale captée: "${transcript}"`, 'info');
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
    if (toggleVoiceAi?.checked) {
      setVoiceVisualState('processing');
      voiceTranscript.textContent = `"${transcript}" — analyse IA...`;
      if (isDeterministicControlCommand(transcript)) {
        parseVoiceCommand(transcript);
        voiceTranscript.textContent = `"${transcript}"`;
        setVoiceVisualState('confirmation');
        window.setTimeout(() => setVoiceVisualState(null), 900);
        return;
      } else {
        const aiActions = await interpretVoiceCommandWithAI(transcript);
        if (aiActions) {
          const actionFeedback = applyAiActions(aiActions.actions);
          const aiFeedback = (lastAiActionHadFailures ? actionFeedback : aiActions.response) || actionFeedback;
          if (aiFeedback || actionFeedback) {
            voiceTranscript.textContent = `"${transcript}"`;
            setVoiceVisualState('confirmation');
            window.setTimeout(() => setVoiceVisualState(null), 900);
            speakResponse(personalizeVoiceResponse(aiFeedback || actionFeedback));
            return;
          }
        }
      }
    }
    parseVoiceCommand(transcript);
    setVoiceVisualState('confirmation');
    window.setTimeout(() => setVoiceVisualState(null), 900);
  }

  function appendChatMessage(author, text) {
    if (!chatMessages) return;
    const message = document.createElement('div');
    message.className = `chat-message chat-message-${author === 'user' ? 'user' : 'irina'}`;
    message.dataset.chatText = text;
    message.dataset.createdAt = String(Date.now());
    const authorLabel = document.createElement('span');
    authorLabel.className = 'chat-message-author';
    authorLabel.textContent = author === 'user'
      ? 'Vous'
      : 'Irina';
    const content = document.createElement('p');
    content.textContent = text;
    const header = document.createElement('div');
    header.className = 'chat-message-header';
    header.append(authorLabel);
    if (author === 'user') {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'chat-message-edit';
      editButton.textContent = currentLanguage === 'en' ? 'Edit' : 'Modifier';
      editButton.title = currentLanguage === 'en' ? 'Edit this message for five minutes' : 'Modifier ce message pendant cinq minutes';
      editButton.setAttribute('aria-label', editButton.title);
      header.append(editButton);
    }
    message.append(header, content);
    chatMessages.append(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
  }

  function editChatMessage(messageElement) {
    const createdAt = Number(messageElement.dataset.createdAt);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > chatEditWindow) return;
    const originalText = messageElement.dataset.chatText || '';
    if (messageElement.querySelector('.chat-message-editor')) return;
    const content = messageElement.querySelector('p');
    const editor = document.createElement('div');
    editor.className = 'chat-message-editor';
    const input = document.createElement('textarea');
    input.rows = 2;
    input.value = originalText;
    const actions = document.createElement('div');
    actions.className = 'chat-message-editor-actions';
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'chat-message-editor-save';
    saveButton.textContent = currentLanguage === 'en' ? 'Save' : 'Enregistrer';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'chat-message-editor-cancel';
    cancelButton.textContent = currentLanguage === 'en' ? 'Cancel' : 'Annuler';
    actions.append(saveButton, cancelButton);
    editor.append(input, actions);
    content.replaceWith(editor);
    input.focus();
    input.select();
    cancelButton.addEventListener('click', () => editor.replaceWith(content));
    saveButton.addEventListener('click', async () => {
      const editedText = input.value.trim();
      if (!editedText || editedText === originalText) return;
      const nextMessage = messageElement.nextElementSibling;
      messageElement.remove();
      if (nextMessage?.classList.contains('chat-message-irina')) nextMessage.remove();
      const historyIndex = conversationHistory.map(entry => entry.content).lastIndexOf(originalText);
      if (historyIndex >= 0) {
        conversationHistory.splice(Math.max(0, historyIndex - 1), 2);
        localStorage.setItem(conversationHistoryKey, JSON.stringify(conversationHistory));
      }
      try {
        await sendChatMessage(editedText);
      } catch (error) {
        appendChatMessage('irina', error instanceof Error ? error.message : String(error));
      }
    });
  }

  async function sendChatMessage(message, { display = true } = {}) {
    const text = String(message || '').trim();
    if (!text) throw new Error(localizedStaticText['Message cannot be empty.'][currentLanguage]);
    if (display) appendChatMessage('user', text);

    let response = '';
    const typedWakeWord = /^\s*(?:dis\s+)?irina(?:[\s,;:!?.].*)?$/i.test(text);
    if (typedWakeWord) {
      response = activateTypedIrinaListening();
    } else {
      const username = getPreferredUserName();
      const nameSuffix = username ? ` ${username}` : '';
      const localConversation = getLocalConversationResponse(normalizeVoiceText(text), nameSuffix);
      if (localConversation) {
      response = localConversation;
      } else if (isDeterministicControlCommand(text)) {
      response = parseVoiceCommand(text, { speak: false });
      } else {
      const aiResult = await interpretVoiceCommandWithAI(text);
      if (aiResult) {
        const actionFeedback = applyAiActions(aiResult.actions);
        response = (lastAiActionHadFailures ? actionFeedback : aiResult.response) || actionFeedback || (
          currentLanguage === 'en' ? 'The request was processed.' : 'La demande a été traitée.'
        );
      } else {
        response = parseVoiceCommand(text, { speak: false }) || (
          currentLanguage === 'en'
            ? 'I could not process this request. Check the AI connection or rephrase it.'
            : 'Je ne peux pas traiter cette demande. Vérifiez la connexion IA ou reformulez-la.'
        );
      }
      }
    }
      rememberConversationTurn('user', text);
      rememberConversationTurn('assistant', response);

    if (display) appendChatMessage('irina', response);
    window.dispatchEvent(new CustomEvent('irina-chat-response', {
      detail: { message: text, response }
    }));
    return response;
  }

  window.irinaChatbot = Object.freeze({
    sendMessage: (message) => sendChatMessage(message)
  });

  chatForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!chatInput || !chatSubmit) return;
    const text = chatInput.value.trim();
    if (!text || chatSubmit.disabled) return;
    chatInput.value = '';
    chatSubmit.disabled = true;
    chatSubmit.textContent = localizedStaticText['Sending...'][currentLanguage];
    try {
      await sendChatMessage(text);
    } catch (error) {
      appendChatMessage('irina', error instanceof Error ? error.message : String(error));
    } finally {
      chatSubmit.disabled = false;
      chatSubmit.textContent = t('chatSend');
      chatInput.focus();
    }
  });

  chatMessages?.addEventListener('click', (event) => {
    const editButton = event.target.closest('.chat-message-edit');
    const message = editButton?.closest('.chat-message-user');
    if (message) editChatMessage(message);
  });

  chatInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm?.requestSubmit();
    }
  });

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
      voiceResponseInProgress = false;
      isSpeaking = false;
      activeUtterance = null;
      window.speechSynthesis?.cancel();
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
      voiceTranscript.textContent = 'Gestes sonores actifs : un geste allume toutes les LEDs, deux gestes les éteignent.';
      addLog('[VOICE] Gestes sonores : un geste allume toutes les LEDs, deux gestes les éteignent', 'info');
    } catch (error) {
      event.target.checked = false;
      stopSoundGestureDetection();
      addLog(`[VOICE] Détection des gestes sonores impossible: ${error.message}`, 'error');
      voiceTranscript.textContent = `Erreur micro: ${error.message}`;
    }
  });

  toggleVoiceAi?.addEventListener('change', updateAiVisualState);

  async function interpretVoiceCommandWithAI(transcript) {
    const ollamaUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434/api/chat';
    const ollamaModel = localStorage.getItem('ollama_model') || 'llama3.2';
    const availableLeds = state.leds.map(led => `${led.id}: ${getLedName(led.id)}`).join(', ');
    const promptLanguage = {
      fr: 'Comprends le français naturel et réponds entièrement en français.',
      en: 'Understand natural English and return all feedback in English.',
      es: 'Comprende el español natural y responde completamente en español.',
      de: 'Verstehe natürliches Deutsch und antworte vollständig auf Deutsch.',
      it: 'Comprendi l’italiano naturale e rispondi interamente in italiano.',
      pt: 'Compreende português natural e responde sempre em português.',
      nl: 'Begrijp natuurlijk Nederlands en antwoord volledig in het Nederlands.',
      ja: '自然な日本語を理解し、すべての返答を日本語で返してください。',
      'zh-CN': '理解自然中文，并始终使用简体中文回复。'
    }[currentLanguage] || 'Understand natural English and return all feedback in English.';
    const username = getPreferredUserName();
    const localHour = new Date().getHours();
    const systemPrompt = [
      'Tu es Irina, une assistante conversationnelle naturelle et chaleureuse, capable de discuter librement comme un assistant généraliste, tout en contrôlant une application de LEDs.',
      'Réponds uniquement avec un JSON valide au format {"actions":[...],"response":"..."} et jamais en Markdown.',
      'Le champ actions est toujours un tableau, éventuellement vide. Le champ response est une phrase naturelle à dire à l’utilisateur.',
      `${promptLanguage} Understand any natural wording, slang, politeness, spelling mistakes, voice transcription errors, code-switching and indirect requests in that language. Never require an exact command phrase.`,
      promptLanguage,
      `L’heure locale du navigateur est ${localHour} h. Pour saluer l’utilisateur, utilise « ${currentLanguage === 'en' ? (localHour >= 5 && localHour < 12 ? 'Good morning' : 'Good evening') : (localHour >= 5 && localHour < 18 ? 'Bonjour' : 'Bonsoir')} » selon cette heure. « Salut » reste possible si l’utilisateur emploie lui-même un registre familier.`,
      `L’utilisateur s’appelle ${JSON.stringify(username || (currentLanguage === 'en' ? 'user' : 'utilisateur'))}. Dans chaque salutation, commence obligatoirement par le nom de l’utilisateur : « Bonjour ${username || (currentLanguage === 'en' ? 'user' : 'utilisateur')} » ou l’équivalent naturel dans la langue choisie. Appelle-le aussi par son nom dans les propositions et les demandes de clarification.`,
      'Si l’utilisateur demande explicitement à être appelé autrement, respecte ce nouveau nom d’appel pour la suite du dialogue.',
      'Maintain a natural dialogue with memory: answer greetings, small talk, follow-up questions, confirmations, thanks, opinions and general questions naturally. Refer to earlier messages when relevant. Ask one concise clarification when necessary. For questions without an action, return actions:[] and answer directly in the selected language.',
      'Do not claim to have performed an action unless you return the corresponding action. Do not invent device state, capabilities, facts or missing values.',
      'Ignore le nom Irina quand il sert uniquement à t’appeler.',
      'Déduis l’intention sans exiger les exemples exacts de l’interface, mais ne devine jamais une valeur absente.',
      'Comprends les nombres écrits en toutes lettres, comme « deux », « vingt-quatre » ou “seventy two”, et convertis-les en valeurs numériques.',
      'Chaque action a un type et des paramètres :',
      'set_power {targets:["1","2"] ou ["ALL"], on:true|false},',
      'set_brightness {targets:["1"] ou ["ALL"], value:0..100},',
      'set_mode {targets:["1"] ou ["ALL"], mode:"solid"|"pulse"|"blink"|"strobe"},',
      'set_led_count {value:1..100}, add_led_count {value:1..100} pour une demande comme « ajoute deux LEDs », set_led_name {target:"1", name:string},',
      'set_led_color {target:"1", color:"red"|"yellow"|"green"|"blue"|"purple"|"orange"|"white"},',
      'set_theme_color {value:"#RRGGBB"} pour changer la couleur générale de toute l’application.',
      'logout {} pour « log out », « déconnecte-moi » ou « annule ma connexion ».',
      'open_page {page:"privacy"|"terms"} pour ouvrir la confidentialité ou les conditions d’utilisation.',
      'set_panel {panel:"log"|"history", open:true|false} pour dérouler ou replier la console réseau ou l’historique des LEDs.',
      'set_led_effect {target:"1" ou "ALL", mode:"solid"|"pulse"|"blink"|"strobe"}, set_selected_led {target:"1"|"ALL"},',
      'set_theme {value:"light"|"dark"},',
      'set_language {value:"fr"|"en"|"es"|"de"|"it"|"pt"|"nl"|"ja"|"zh-CN"},',
      'set_http_method {value:"POST_JSON"|"GET_QUERY"|"POST_FORM"},',
      'set_secure_transport {value:true|false}, set_panel {panel:"log"|"history", open:true|false},',
      'set_brightness_scope {all:true|false}, set_speech_feedback {enabled:true|false},',
      'set_wake_word {enabled:true|false}, set_voice_ai {enabled:true|false}, set_sound_gestures {enabled:true|false},',
      'set_firmware_board {value:"nodemcu"|"d1mini"}, set_firmware_led_count {value:1..100},',
      'clear_panel {panel:"log"|"history"}, open_firmware_generator {}, generate_firmware {}, check_connection {},',
      'save_config {url:string} pour modifier l’URL du circuit.',
      'Pour « ajoute N LEDs » ou « N LEDs de plus », utilise add_led_count et conserve le nombre actuel; pour « configure à N LEDs », utilise set_led_count.',
      'Les actions doivent être dans l’ordre demandé. Ne crée jamais de LED inexistante.',
      'LEDs disponibles : ' + availableLeds
    ].join(' ');
    const aiErrorText = {
      fr: ['Réponse Ollama sans contenu exploitable', 'Réponse Ollama sans tableau actions', 'Réponse Ollama sans texte conversationnel'],
      en: ['Ollama returned no usable content', 'Ollama returned no actions array', 'Ollama returned no conversational text'],
      es: ['Ollama no devolvió contenido utilizable', 'Ollama no devolvió una lista de acciones', 'Ollama no devolvió texto conversacional'],
      de: ['Ollama lieferte keinen nutzbaren Inhalt', 'Ollama lieferte kein Aktionsarray', 'Ollama lieferte keinen Gesprächstext'],
      it: ['Ollama non ha restituito contenuti utilizzabili', 'Ollama non ha restituito un elenco di azioni', 'Ollama non ha restituito testo conversazionale'],
      pt: ['Ollama não devolveu conteúdo utilizável', 'Ollama não devolveu uma lista de ações', 'Ollama não devolveu texto conversacional'],
      nl: ['Ollama gaf geen bruikbare inhoud terug', 'Ollama gaf geen actielijst terug', 'Ollama gaf geen gesprekstekst terug'],
      ja: ['Ollama が使用可能な内容を返しませんでした', 'Ollama がアクション配列を返しませんでした', 'Ollama が会話テキストを返しませんでした'],
      'zh-CN': ['Ollama 未返回可用内容', 'Ollama 未返回 actions 数组', 'Ollama 未返回对话文本']
    }[currentLanguage] || [];

    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: transcript }
          ]
        })
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content;
      if (typeof content !== 'string') {
        throw new Error(aiErrorText[0] || 'Ollama returned no usable content');
      }

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.actions)) {
        throw new Error(aiErrorText[1] || 'Ollama returned no actions array');
      }
      if (typeof parsed.response !== 'string' || !parsed.response.trim()) {
        throw new Error(aiErrorText[2] || 'Ollama returned no conversational text');
      }

      addLog(`[AI] ${parsed.actions.length} action(s) interprétée(s) par l’IA`, 'info');
      return { actions: parsed.actions, response: parsed.response.trim() };
    } catch (error) {
      window.clearTimeout(timeoutId);
      const message = error.name === 'AbortError' ? 'Délai de réponse IA dépassé' : error.message;
      addLog(`[AI] Mode IA indisponible, interpréteur standard utilisé: ${message}`, 'warning');
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

  let lastAiActionHadFailures = false;

  function applyAiActions(actions) {
    const feedback = [];
    let hardwareChanged = false;
    let rejectedActions = 0;

    actions.forEach(action => {
      if (!action || typeof action.type !== 'string') {
        rejectedActions += 1;
        return;
      }
      const feedbackBefore = feedback.length;
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
        case 'add_led_count': {
          const value = Number(action.value);
          if (!Number.isInteger(value) || value < 1 || !totalLedsInput || !btnUpdateTotalLeds) break;
          const total = Math.min(100, state.totalLeds + value);
          totalLedsInput.value = String(total);
          btnUpdateTotalLeds.click();
          feedback.push(`Nombre de LEDs augmenté à ${total}`);
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
        case 'set_led_color':
        case 'set_led_effect': {
          const targetIds = getActionTargetIds([action.target]);
          const mode = action.mode;
          const color = typeof action.color === 'string' ? action.color.toLowerCase() : '';
          const colorNames = {
            red: 'Rouge', yellow: 'Jaune', green: 'Vert', blue: 'Bleu',
            purple: 'Violet', orange: 'Orange', white: 'Blanc',
            rouge: 'Rouge', jaune: 'Jaune', vert: 'Vert', bleu: 'Bleu',
            violet: 'Violet', blanc: 'Blanc'
          };
          const normalizedColor = colorNames[color] || ledColorOptions.find(option => normalizeVoiceText(option) === color);
          const validColor = Boolean(normalizedColor);
          if (targetIds.length === 0 || (action.type === 'set_led_effect'
            ? !['solid', 'pulse', 'blink', 'strobe'].includes(mode)
            : !validColor)) break;
          targetIds.forEach(id => {
            const led = getLedConfig(id);
            if (action.type === 'set_led_effect') led.mode = mode;
            else led.name = normalizedColor;
          });
          localStorage.setItem('led_names', JSON.stringify(
            Object.fromEntries(state.leds.map(item => [item.id, item.name]))
          ));
          state.selectedLed = action.target === 'ALL' || targetIds.length > 1 ? 'ALL' : targetIds[0];
          rebuildLedOrbs();
          rebuildLedControlButtons();
          rebuildLedAssignments();
          feedback.push(action.type === 'set_led_effect' ? 'Effet LED modifié' : 'Couleur LED modifiée');
          hardwareChanged = true;
          break;
        }
        case 'set_selected_led': {
          const targetIds = action.target === 'ALL' ? state.leds.map(led => led.id) : getActionTargetIds([action.target]);
          if (targetIds.length === 0) break;
          state.selectedLed = action.target === 'ALL' ? 'ALL' : targetIds[0];
          if (ledSelect) ledSelect.value = state.selectedLed;
          feedback.push('LED sélectionnée');
          break;
        }
        case 'set_theme':
          if (action.value === 'light' || action.value === 'dark') {
            applyTheme(action.value);
            feedback.push(`Thème ${action.value === 'light' ? 'clair' : 'sombre'} activé`);
          }
          break;
        case 'set_theme_color':
          if (typeof action.value === 'string' && window.applyThemeColor) {
            const color = window.applyThemeColor(action.value);
            if (color) feedback.push(`Couleur du thème changée en ${color}`);
          }
          break;
        case 'logout':
          feedback.push(currentLanguage === 'en' ? 'Signing out' : 'Déconnexion en cours');
          window.setTimeout(logoutLocalAccount, 120);
          break;
        case 'open_page': {
          const pageUrl = action.page === 'privacy' ? 'privacy.html' : action.page === 'terms' ? 'terms.html' : null;
          if (!pageUrl) break;
          window.location.assign(new URL(pageUrl, window.location.href).href);
          feedback.push(action.page === 'privacy' ? 'Page de confidentialité ouverte' : 'Page des conditions ouverte');
          break;
        }
        case 'set_language':
          if (languageSelector && ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ja', 'zh-CN'].includes(action.value)) {
            languageSelector.value = action.value;
            languageSelector.dispatchEvent(new Event('change'));
            feedback.push('Langue modifiée');
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
        case 'set_voice_ai':
          if (typeof action.enabled === 'boolean' && toggleVoiceAi) {
            toggleVoiceAi.checked = action.enabled;
            toggleVoiceAi.dispatchEvent(new Event('change'));
            feedback.push(`Mode IA ${action.enabled ? 'activé' : 'désactivé'}`);
          }
          break;
        case 'set_sound_gestures':
          if (typeof action.enabled === 'boolean' && toggleSoundGestures) {
            toggleSoundGestures.checked = action.enabled;
            toggleSoundGestures.dispatchEvent(new Event('change'));
            feedback.push(`Gestes sonores ${action.enabled ? 'activés' : 'désactivés'}`);
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
        case 'set_firmware_board':
          if (firmwareBoard && ['nodemcu', 'd1mini'].includes(action.value)) {
            firmwareBoard.value = action.value;
            feedback.push('Carte firmware modifiée');
          }
          break;
        case 'set_firmware_led_count': {
          const value = Number(action.value);
          if (!firmwareLedCount || !Number.isInteger(value) || value < 1 || value > 100) break;
          firmwareLedCount.value = String(value);
          feedback.push(`Nombre de LEDs du firmware réglé à ${value}`);
          break;
        }
        case 'generate_firmware':
          if (btnGenerateFirmware) {
            btnGenerateFirmware.click();
            feedback.push('Firmware généré');
          }
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
            if (action.open) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            feedback.push(`${action.panel === 'log' ? 'Console réseau' : 'Historique'} ${action.open ? 'ouvert' : 'fermé'}`);
          }
          break;
        }
        default:
          break;
      }
      if (feedback.length === feedbackBefore) rejectedActions += 1;
    });

    syncControlsFromSelection();
    rebuildLedAssignments();
    updateVisualLEDState();
    if (hardwareChanged) sendHardwareRequest();
    lastAiActionHadFailures = rejectedActions > 0;
    if (currentLanguage === 'en') {
      const feedbackTranslations = [
        ['LED allumée(s)', 'LED(s) turned on'], ['LED éteinte(s)', 'LED(s) turned off'],
        ['Luminosité réglée à', 'Brightness set to'], [' pour cent', ' percent'],
        ['Méthode HTTP modifiée', 'HTTP method changed'], ['Connexion HTTPS activée', 'HTTPS connection enabled'],
        ['Connexion HTTPS désactivée', 'HTTPS connection disabled'],
        ['Synthèse vocale activée', 'Speech feedback enabled'], ['Synthèse vocale désactivée', 'Speech feedback disabled'],
        ["Mot d'activation activé", 'Wake word enabled'], ["Mot d'activation désactivé", 'Wake word disabled'],
        ['Luminosité appliquée à toutes les LEDs', 'Brightness applied to all LEDs'],
        ['Luminosité appliquée à la LED sélectionnée', 'Brightness applied to the selected LED'],
        ['Couleur LED modifiée', 'LED color changed'], ['Effet LED modifié', 'LED effect changed'],
        ['LED sélectionnée', 'LED selected'], ['Langue modifiée', 'Language changed'],
        ['Mode IA activé', 'AI mode enabled'], ['Mode IA désactivé', 'AI mode disabled'],
        ['Gestes sonores activés', 'Sound gestures enabled'], ['Gestes sonores désactivés', 'Sound gestures disabled'],
        ['Console réseau ouvert', 'Network console opened'], ['Console réseau fermé', 'Network console closed'],
        ['Historique ouvert', 'History opened'], ['Historique fermé', 'History closed'],
        ['Panneau effacé', 'Panel cleared'], ['Générateur de firmware ouvert', 'Firmware generator opened'],
        ['Carte firmware modifiée', 'Firmware board changed'],
        ['Firmware généré', 'Firmware generated'],
        ['Nombre de LEDs du firmware réglé à', 'Firmware LED count set to'],
        ['Test de connexion lancé', 'Connection test started'], ['Configuration réseau enregistrée', 'Network configuration saved']
      ];
      return feedback.length > 0 ? feedback.join('. ').replace(
        /LED allumée\(s\)|LED éteinte\(s\)|Luminosité réglée à| pour cent|Méthode HTTP modifiée|Connexion HTTPS activée|Connexion HTTPS désactivée|Synthèse vocale activée|Synthèse vocale désactivée|Mot d'activation activé|Mot d'activation désactivé|Luminosité appliquée à toutes les LEDs|Luminosité appliquée à la LED sélectionnée|Couleur LED modifiée|Effet LED modifié|LED sélectionnée|Langue modifiée|Mode IA activé|Mode IA désactivé|Gestes sonores activés|Gestes sonores désactivés|Console réseau ouvert|Console réseau fermé|Historique ouvert|Historique fermé|Panneau effacé|Générateur de firmware ouvert|Carte firmware modifiée|Firmware généré|Nombre de LEDs du firmware réglé à|Test de connexion lancé|Configuration réseau enregistrée/g,
        match => feedbackTranslations.find(([source]) => source === match)?.[1] || match
      ) : null;
    }
    if (rejectedActions > 0) {
      const rejectedText = {
        fr: `${rejectedActions} action${rejectedActions > 1 ? 's' : ''} n’a pas pu être exécutée${rejectedActions > 1 ? 's' : ''}.`,
        en: `${rejectedActions} action${rejectedActions > 1 ? 's' : ''} could not be completed.`,
        es: `${rejectedActions} acción${rejectedActions > 1 ? 'es' : ''} no pudo ejecutarse.`,
        de: `${rejectedActions} Aktion${rejectedActions > 1 ? 'en' : ''} konnte nicht ausgeführt werden.`,
        it: `${rejectedActions} azione non ha potuto essere eseguita.`,
        pt: `${rejectedActions} ação não pôde ser executada.`,
        nl: `${rejectedActions} actie kon niet worden uitgevoerd.`,
        ja: `${rejectedActions}件の操作を実行できませんでした。`,
        'zh-CN': `有 ${rejectedActions} 个操作无法执行。`
      }[currentLanguage] || `${rejectedActions} action(s) could not be completed.`;
      feedback.push(rejectedText);
    }
    return feedback.length > 0 ? feedback.join('. ') : null;
  }

  function parseLocalSettingsCommand(command) {
    const normalized = normalizeVoiceText(command);
    const actions = [];
    if (/\b(?:logout|log out|sign out|disconnect|deconnexion|deconnecte|deconnecter|annule\s+ma\s+connexion|quitte\s+mon\s+compte|cerrar sesion|terminar sesion|abmelden|disconnetti|sair|uitloggen)\b/.test(normalized)) {
      actions.push({ type: 'logout' });
    }
    if (/\b(?:ouvre|ouvrir|open|affiche|show)\b.*\b(?:confidentialite|privacy|privacidad|datenschutz|riservatezza|privacidade|privacybeleid|プライバシー|隐私)\b/.test(normalized)) {
      actions.push({ type: 'open_page', page: 'privacy' });
    } else if (/\b(?:ouvre|ouvrir|open|affiche|show)\b.*\b(?:conditions|terms|terminos|nutzungsbedingungen|termini|termos|gebruiksvoorwaarden|利用規約|使用条款)\b/.test(normalized)) {
      actions.push({ type: 'open_page', page: 'terms' });
    }
    if (/\b(?:ouvre|ouvrir|open|deroule|derouler|affiche|show)\b.*\b(?:console|journal|log|reseau|network)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'log', open: true });
    } else if (/\b(?:ferme|fermer|close|replie|replier|hide)\b.*\b(?:console|journal|log|reseau|network)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'log', open: false });
    }
    if (/\b(?:ouvre|ouvrir|open|deroule|derouler|affiche|show)\b.*\b(?:historique|history|leds? allumees?|leds? allumees? au fil du temps)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'history', open: true });
    } else if (/\b(?:ferme|fermer|close|replie|replier|hide)\b.*\b(?:historique|history)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'history', open: false });
    }
    const themeColorNames = {
      rouge: '#ef4444', red: '#ef4444', orange: '#f97316', jaune: '#facc15', yellow: '#facc15',
      vert: '#22c55e', verte: '#22c55e', green: '#22c55e', bleu: '#3b82f6', blue: '#3b82f6',
      violet: '#8b5cf6', violette: '#8b5cf6', purple: '#8b5cf6', rose: '#ec4899', pink: '#ec4899',
      blanc: '#f8fafc', blanche: '#f8fafc', white: '#f8fafc', cyan: '#00f0ff', turquoise: '#14b8a6'
    };
    const requestedThemeColor = Object.entries(themeColorNames).find(([name]) =>
      new RegExp(`\\b${name}\\b`).test(normalized)
    );
    if (requestedThemeColor && /\b(?:couleur|color|colour|tema|theme|th[eè]me)\b/.test(normalized)
      && /\b(?:application|app|interface|theme|th[eè]me|toute|tous|all|entire|gesamte|tutta|toda)\b/.test(normalized)) {
      actions.push({ type: 'set_theme_color', value: requestedThemeColor[1] });
    }
    const languageNames = {
      francais: 'fr', français: 'fr', french: 'fr', anglais: 'en', english: 'en',
      espagnol: 'es', spanish: 'es', allemand: 'de', german: 'de', italien: 'it',
      italian: 'it', portugais: 'pt', portuguese: 'pt', neerlandais: 'nl', dutch: 'nl',
      japonais: 'ja', japanese: 'ja', chinois: 'zh-CN', chinese: 'zh-CN'
    };
    const requestedLanguage = Object.entries(languageNames).find(([name]) =>
      new RegExp(`\\b(?:en|en|passe|switch|change|set|mets?|mettez?)\\b.*\\b${name}\\b`).test(normalized)
    );
    if (requestedLanguage) actions.push({ type: 'set_language', value: requestedLanguage[1] });

    if (/\b(?:https|connexion securisee|secure connection)\b/.test(normalized)
      && /\b(?:active|activer|enable|on|desactive|desactiver|disable|off)\b/.test(normalized)) {
      actions.push({ type: 'set_secure_transport', value: !/\b(?:desactive|desactiver|disable|off)\b/.test(normalized) });
    }
    const httpMethod = normalized.includes('get') ? 'GET_QUERY'
      : normalized.includes('form') || normalized.includes('url encoded') ? 'POST_FORM'
        : normalized.includes('post') ? 'POST_JSON' : null;
    if (httpMethod && /\b(?:http|methode|method|requete|request)\b/.test(normalized)) {
      actions.push({ type: 'set_http_method', value: httpMethod });
    }
    if (/\b(?:luminosite|brightness)\b/.test(normalized)
      && /\b(?:toutes|all|every|all the)\b/.test(normalized)) {
      actions.push({ type: 'set_brightness_scope', all: true });
    }
    const toggleActions = [
      ['set_speech_feedback', /(?:reponses vocales|synthese vocale|voice feedback|speech feedback)/, /(?:desactive|desactiver|disable|off)/],
      ['set_wake_word', /(?:ecoute active|mot d.activation|wake word|active listening)/, /(?:desactive|desactiver|disable|off)/],
      ['set_voice_ai', /(?:mode ia|intelligence artificielle|ollama|ai mode)/, /(?:desactive|desactiver|disable|off)/],
      ['set_sound_gestures', /(?:gestes sonores|sound gestures|clap|tapements?)/, /(?:desactive|desactiver|disable|off)/]
    ];
    toggleActions.forEach(([type, subject, negative]) => {
      if (subject.test(normalized)) actions.push({ type, enabled: !negative.test(normalized) });
    });

    if (/\b(?:ouvre|ouvrir|open|affiche|show)\b.*\b(?:console|journal|log)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'log', open: true });
    } else if (/\b(?:ferme|fermer|close|hide)\b.*\b(?:console|journal|log)\b/.test(normalized)) {
      actions.push({ type: 'set_panel', panel: 'log', open: false });
    }
    if (/\b(?:efface|effacer|clear|nettoie|nettoyer)\b.*\b(?:console|journal|log)\b/.test(normalized)) {
      actions.push({ type: 'clear_panel', panel: 'log' });
    } else if (/\b(?:efface|effacer|clear|nettoie|nettoyer)\b.*\b(?:historique|history)\b/.test(normalized)) {
      actions.push({ type: 'clear_panel', panel: 'history' });
    }
    if (/\b(?:teste|tester|check|verifie|verify)\b.*\b(?:connexion|connection|ping|signal)\b/.test(normalized)) {
      actions.push({ type: 'check_connection' });
    }
    if (/\b(?:ouvre|ouvrir|open)\b.*\b(?:firmware|code c\+\+|arduino|esp32|esp8266)\b/.test(normalized)) {
      actions.push({ type: 'open_firmware_generator' });
    }
    if (/\b(?:genere|generer|generate)\b.*\b(?:firmware|code)\b/.test(normalized)) {
      actions.push({ type: 'generate_firmware' });
    }
    if (/\b(?:d1\s*mini|wemos)\b/.test(normalized)) {
      actions.push({ type: 'set_firmware_board', value: 'd1mini' });
    } else if (/\b(?:nodemcu|node\s*mcu)\b/.test(normalized)) {
      actions.push({ type: 'set_firmware_board', value: 'nodemcu' });
    }
    const firmwareCount = normalized.match(/\b(?:firmware|code)\b.*?\b([0-9]{1,3})\s*(?:leds?|lights?)\b/);
    if (firmwareCount) actions.push({ type: 'set_firmware_led_count', value: Number(firmwareCount[1]) });

    const rename = normalized.match(/\b(?:renomme|renommer|name|appelle|appeler)\b.*?\bled\s*([0-9]{1,3})\b.*?\b(?:en|to|as)\b\s+(.+)$/);
    if (rename) actions.push({ type: 'set_led_name', target: rename[1], name: rename[2].trim() });

    if (!actions.length) return null;
    return applyAiActions(actions);
  }

  function parseVoiceCommand(cmd, { speak = true } = {}) {
    let spokenFeedback = '';
    const normalizedCommand = normalizeVoiceText(cmd);
    const globalThemeColors = {
      rouge: '#ef4444', red: '#ef4444', orange: '#f97316', jaune: '#facc15', yellow: '#facc15',
      vert: '#22c55e', verte: '#22c55e', green: '#22c55e', bleu: '#3b82f6', bleue: '#3b82f6', blue: '#3b82f6',
      violet: '#8b5cf6', violette: '#8b5cf6', purple: '#8b5cf6', rose: '#ec4899', pink: '#ec4899',
      blanc: '#f8fafc', blanche: '#f8fafc', white: '#f8fafc', cyan: '#00f0ff', turquoise: '#14b8a6'
    };
    const globalColor = Object.entries(globalThemeColors).find(([name]) =>
      new RegExp(`\\b${name}\\b`).test(normalizedCommand)
    );
    if (globalColor && /\b(?:couleur|color|colour|tema|theme|th[eè]me)\b/.test(normalizedCommand)
      && /\b(?:application|app|interface|toute|tous|all|entire|gesamte|tutta|toda)\b/.test(normalizedCommand)
      && window.applyThemeColor) {
      const color = window.applyThemeColor(globalColor[1]);
      spokenFeedback = currentLanguage === 'en'
        ? `The application theme is now ${color}`
        : `La couleur du thème de l’application est maintenant ${color}`;
      if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
      return spokenFeedback;
    }
    const localSettingsFeedback = parseLocalSettingsCommand(cmd);
    if (localSettingsFeedback) {
      if (speak) speakResponse(personalizeVoiceResponse(localSettingsFeedback));
      return localSettingsFeedback;
    }
    const additionalLedsMatch = normalizedCommand.match(
      /(?:\b(?:ajoute(?:r)?|ajout(?:e|er)?|rajoute(?:r)?|add|applique(?:r)?|apply|anade|agrega|agregue|fuge|addiere|aggiungi|adiciona|adicione|voeg)\b\s+([0-9]{1,3})\s+(?:leds?|lights?|lampes?|luces?|lichter|luci|luzes?)\s+(?:de\s+plus|en\s+plus|supplementaires?|mas|mehr|hinzu|in\s+piu|a\s+mais|toe|more|extra))|(?:([0-9]{1,3})\s*(?:個|个)\s*(?:LED|led)?\s*(?:追加|增加))/i
    );
    if (additionalLedsMatch && totalLedsInput && btnUpdateTotalLeds) {
      const increment = Number(additionalLedsMatch[1] || additionalLedsMatch[2]);
      const value = Math.min(100, state.totalLeds + increment);
      totalLedsInput.value = String(value);
      btnUpdateTotalLeds.click();
      spokenFeedback = currentLanguage === 'en'
        ? `The circuit now has ${value} LEDs`
        : `Le circuit compte maintenant ${value} LEDs`;
      if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
      return spokenFeedback;
    }
    const removeLedsMatch = normalizedCommand.match(
      /(?:\b(?:retire(?:r)?|enleve(?:r)?|supprime(?:r)?|remove|delete|moins|fewer|less|applique(?:r)?|mets?)\b\s+([0-9]{1,3})?\s*(?:leds?|lights?|lampes?)?.*\b(?:du\s+circuit|du\s+ruban|en\s+moins|from\s+the\s+circuit|fewer|less|weniger|meno|menos|minder)|(?:([0-9]{1,3})\s*(?:個|个)\s*(?:LED|led)?\s*(?:削除|减少)))/i
    );
    if (removeLedsMatch && totalLedsInput && btnUpdateTotalLeds) {
      const decrement = Number(removeLedsMatch[1] || removeLedsMatch[2] || 1);
      const value = Math.max(1, state.totalLeds - decrement);
      totalLedsInput.value = String(value);
      btnUpdateTotalLeds.click();
      spokenFeedback = currentLanguage === 'en'
        ? `The circuit now has ${value} LEDs`
        : `Le circuit compte maintenant ${value} LEDs`;
      if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
      return spokenFeedback;
    }
    const requestedLedCount = normalizedCommand.match(
      /(?:\b(?:applique(?:r)?|mets?|mettre|definis?|configure|set|apply|use|utilise(?:r)?|configura|configurar|establece|establecer|setze|stelle|imposta|configura|defina|configureer|stel)\b\s+([0-9]{1,3})\s*(?:leds?|lights?|lampes?|luces?|lichter|luci|luzes?))|(?:\b(?:设置|配置)\s*([0-9]{1,3})\s*(?:个)?(?:LED|led))/i
    );
    if (requestedLedCount) {
      const value = Number(requestedLedCount[1] || requestedLedCount[2]);
      if (Number.isInteger(value) && value >= 1 && value <= 100 && totalLedsInput && btnUpdateTotalLeds) {
        totalLedsInput.value = String(value);
        btnUpdateTotalLeds.click();
        spokenFeedback = currentLanguage === 'en'
          ? `The circuit is now configured with ${value} LEDs`
          : `Le circuit est maintenant configuré avec ${value} LEDs`;
        if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
        return spokenFeedback;
      }
    }
    const naturalColor = normalizedCommand.match(
      /\b(?:attribue(?:r)?|mets?|mettre|applique(?:r)?|assigne(?:r)?|set)\b.*?\b(?:couleur|color|colour)\s+(?:de\s+la\s+led\s+)?(rouge|jaune|vert|verte|bleu|bleue|violet|violette|orange|blanc|blanche|red|yellow|green|blue|purple|white)\s+(?:a|to|on|sur)\s+(?:la\s+)?led\s*([0-9]{1,3})\b/
    );
    const requestedColor = normalizedCommand.match(
      /\b(?:led\s*)?([0-9]{1,3})\s+(?:(?:en|in|to)\s+)?(rouge|jaune|vert|verte|bleu|bleue|violet|violette|orange|blanc|blanche|red|yellow|green|blue|purple|white)\b/
    );
    const colorRequest = naturalColor
      ? { ledId: naturalColor[2], colorName: naturalColor[1] }
      : requestedColor
        ? { ledId: requestedColor[1], colorName: requestedColor[2] }
        : null;
    if (colorRequest) {
      const colorNames = {
        rouge: 'Rouge', red: 'Rouge', jaune: 'Jaune', yellow: 'Jaune',
        vert: 'Vert', verte: 'Vert', green: 'Vert', bleu: 'Bleu',
        bleue: 'Bleu', blue: 'Bleu', violet: 'Violet', violette: 'Violet',
        purple: 'Violet', orange: 'Orange', blanc: 'Blanc', blanche: 'Blanc', white: 'Blanc'
      };
      const led = getLedConfig(colorRequest.ledId);
      const color = colorNames[colorRequest.colorName];
      if (led && color) {
        led.name = color;
        localStorage.setItem('led_names', JSON.stringify(
          Object.fromEntries(state.leds.map(item => [item.id, item.name]))
        ));
        rebuildLedOrbs();
        rebuildLedControlButtons();
        rebuildLedAssignments();
        state.selectedLed = led.id;
        syncControlsFromSelection();
        updateVisualLEDState();
        spokenFeedback = currentLanguage === 'en'
          ? `LED ${led.id} set to ${colorRequest.colorName}`
          : `LED ${led.id} réglée en ${colorRequest.colorName}`;
        if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
        return spokenFeedback;
      }
    }
    const requestedTheme = /\b(?:mode\s+(?:sombre|noir|dark)|th[eè]me\s+(?:sombre|noir|dark)|dark\s+mode|dark\s+theme)\b/.test(normalizedCommand)
      ? 'dark'
      : /\b(?:mode\s+(?:clair|light)|th[eè]me\s+(?:clair|light)|light\s+mode|light\s+theme)\b/.test(normalizedCommand)
        ? 'light'
        : null;
    if (requestedTheme) {
      applyTheme(requestedTheme);
      spokenFeedback = currentLanguage === 'en'
        ? `Dark mode ${requestedTheme === 'dark' ? 'enabled' : 'disabled'}`
        : requestedTheme === 'dark' ? 'Mode sombre activé' : 'Mode clair activé';
      addLog(`[VOICE] ${spokenFeedback}`, 'info');
      if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
      return spokenFeedback;
    }

    const turnOnRequested = /\b(?:allume|allumer|on|turn on|turning on|switch on)\b/.test(normalizedCommand)
      || (/\bactive\b/.test(normalizedCommand) && /\b(?:led|leds|lumi[eè]re|ruban|light|lights)\b/.test(normalizedCommand));
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
    const formatSpokenTarget = (id) => {
      const name = getVoiceLedName(id);
      return /^led\s+\d+$/i.test(name)
        ? name
        : `${currentLanguage === 'en' ? 'LED' : 'la LED'} ${name}`;
    };
    if (allLedsRequested) {
      state.selectedLed = 'ALL';
      if (ledSelect) ledSelect.value = 'ALL';
      spokenTarget = allLedsLabel();
    } else if (targetLedIds.length > 0) {
      state.selectedLed = targetLedIds.length === 1 ? targetLedIds[0] : 'ALL';
      if (ledSelect) ledSelect.value = state.selectedLed;
      spokenTarget = targetLedIds.length === 1
        ? formatSpokenTarget(targetLedIds[0])
        : targetLedIds.map(formatSpokenTarget).join(currentLanguage === 'en' ? ' and ' : ' et ');
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
        if (speak) speakResponse(conversation);
        return conversation;
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

    if (speak) speakResponse(personalizeVoiceResponse(spokenFeedback));
    sendHardwareRequest();
    return spokenFeedback;
  }

  function getLocalConversationResponse(normalizedCommand, nameSuffix = '') {
    const conversationText = {
      howAreYou: {
        fr: 'Je vais bien, merci. Et vous ?', en: "I'm doing well, thank you. How about you?", es: 'Estoy bien, gracias. ¿Y usted?',
        de: 'Mir geht es gut, danke. Und Ihnen?', it: 'Sto bene, grazie. E lei?', pt: 'Estou bem, obrigado. E você?',
        nl: 'Met mij gaat het goed, dank je. En met jou?', ja: '元気です、ありがとうございます。あなたはいかがですか？', 'zh-CN': '我很好，谢谢。您呢？'
      },
      great: { fr: 'Super, c’est génial !', en: 'That is great to hear!', es: '¡Qué bien!', de: 'Das freut mich zu hören!', it: 'Mi fa piacere sentirlo!', pt: 'Que ótimo saber disso!', nl: 'Dat is geweldig om te horen!', ja: 'それは素晴らしいですね！', 'zh-CN': '听起来很棒！' },
      welcome: { fr: 'Avec plaisir !', en: "You're welcome!", es: '¡De nada!', de: 'Gern geschehen!', it: 'Di niente!', pt: 'De nada!', nl: 'Graag gedaan!', ja: 'どういたしまして！', 'zh-CN': '不客气！' },
      goodbye: { fr: 'Au revoir, à bientôt !', en: 'Goodbye, see you soon!', es: '¡Adiós, hasta pronto!', de: 'Auf Wiedersehen, bis bald!', it: 'Arrivederci, a presto!', pt: 'Adeus, até breve!', nl: 'Tot ziens, tot snel!', ja: 'さようなら。またお会いしましょう！', 'zh-CN': '再见，下次见！' }
    };
    const conversationReply = (key) => conversationText[key][currentLanguage] || conversationText[key].fr;
    const isGreeting = /^(?:bonjour|salut|hello|hi|hey|bonsoir|bonne\s+nuit|hola|buenas|hallo|guten\s+tag|ciao|buongiorno|ola|bom\s+dia|hoi|goedendag|こんにちは|你好)\b/.test(normalizedCommand);
    const asksHowAreYou = /\b(?:comment\s+(?:vas tu|tu vas|allez vous|vous allez|va tu)|ca va|tu vas bien|vous allez bien|how are you|how do you feel|como estas|wie geht es|come stai|como esta|hoe gaat het|元気|好吗)\b/.test(normalizedCommand);
    const saysWell = /^(?:(?:i\s+am|im|i'm)\s+)?(?:bien|tres bien|ca va|je vais bien|super|genial|good|fine|great|very good|doing well|bien gracias|muy bien|gut|sehr gut|bene|molto bene|bem|muito bem|goed|heel goed|元気|很好)\b/.test(normalizedCommand);
    const saysThanks = /\b(?:merci|thanks|thank you|gracias|danke|obrigado|obrigada|grazie|bedankt|ありがとう|谢谢)\b/.test(normalizedCommand);
    const saysGoodbye = /^(?:au revoir|a bientot|bonne nuit|bye|goodbye|see you|adieu|adios|hasta luego|auf wiedersehen|bis bald|arrivederci|ate logo|tot ziens|またね|再见)\b/.test(normalizedCommand);
    const asksHelp = /\b(?:aide|help|que peux tu faire|que puis je faire|what can you do|what can i do)\b/.test(normalizedCommand);
    const asksSuggestion = /\b(?:que veux tu|que souhaitez vous|que puis je|what would you like|what do you want)\b/.test(normalizedCommand);
    const asksCapabilities = /\b(?:fonctionnalites?|possibilites?|commandes?|features?|capabilities?|möglichkeiten|funzioni|funcoes|functies|機能|功能)\b/.test(normalizedCommand);
    const asksLedHelp = /\b(?:comment|how|como|wie|come|hoe|方法|怎么)\b.*\b(?:led|lumiere|brightness|luminosite|allumer|eteindre|couleur|color|effet|effect)\b/.test(normalizedCommand);
    const asksPanelHelp = /\b(?:console|journal|log|historique|history|confidentialite|privacy|conditions|terms)\b.*\b(?:ouvrir|ouvrir|open|afficher|show|acceder|access|faire|how|comment)\b/.test(normalizedCommand);
    const asksIdentity = /\b(?:qui es tu|qui êtes vous|tu es qui|what are you|who are you|wie heisst du|chi sei|quem e voce|誰ですか|你是谁)\b/.test(normalizedCommand);
    const expressesAgreement = /^(?:d accord|ok|okay|entendu|compris|je comprends|all right|got it|sure|vale|de acuerdo|verstanden|va bene|certo|알겠습니다|好的)\b/.test(normalizedCommand);
    if (isGreeting) {
      const familiarGreeting = /^(?:salut|hi|hey|hola|ciao|hoi)\b/.test(normalizedCommand);
      const greeting = familiarGreeting
        ? (currentLanguage === 'en' ? 'Hi' : 'Salut')
        : getTimeGreeting();
      if (asksHowAreYou) {
        return `${greeting}${nameSuffix} ! ${conversationReply('howAreYou')}`;
      }
      return currentLanguage === 'en'
        ? `${greeting}${nameSuffix}! What can I do for you?`
        : `${greeting}${nameSuffix} ! Que puis-je faire pour vous ?`;
    }
    if (asksHowAreYou) {
      return conversationReply('howAreYou');
    }
    if (saysWell) {
      return conversationReply('great');
    }
    if (saysThanks) {
      return conversationReply('welcome');
    }
    if (saysGoodbye) {
      return conversationReply('goodbye');
    }
    if (asksIdentity) {
      const identity = {
        fr: 'Je suis Irina, votre assistante pour discuter et piloter votre circuit de LEDs.',
        en: 'I am Irina, your assistant for conversation and LED circuit control.',
        es: 'Soy Irina, tu asistente para conversar y controlar tu circuito de LEDs.',
        de: 'Ich bin Irina, deine Assistentin für Gespräche und die Steuerung deiner LED-Schaltung.',
        it: 'Sono Irina, la tua assistente per conversare e controllare il circuito LED.',
        pt: 'Sou a Irina, a sua assistente para conversar e controlar o circuito de LEDs.',
        nl: 'Ik ben Irina, je assistent voor gesprekken en het bedienen van je ledcircuit.',
        ja: '私はIrinaです。会話をしたり、LED回路を操作したりできます。',
        'zh-CN': '我是 Irina，可以和您聊天，也可以控制 LED 电路。'
      };
      return identity[currentLanguage] || identity.en;
    }
    if (expressesAgreement) {
      const agreement = {
        fr: 'Parfait.', en: 'Perfect.', es: 'Perfecto.', de: 'Perfekt.', it: 'Perfetto.',
        pt: 'Perfeito.', nl: 'Perfect.', ja: 'わかりました。', 'zh-CN': '好的。'
      };
      return agreement[currentLanguage] || agreement.en;
    }
    if (asksCapabilities || asksLedHelp || asksPanelHelp) {
      const capabilities = {
        fr: 'Je peux piloter les LEDs, régler leur luminosité, leurs couleurs et leurs effets, changer le thème et la langue, tester la connexion, ouvrir la confidentialité ou les conditions, et dérouler la console réseau ou l’historique. Que souhaitez-vous faire ?',
        en: 'I can control LEDs, set brightness, colors and effects, change the theme and language, test the connection, open privacy or terms, and expand the network console or LED history. What would you like to do?',
        es: 'Puedo controlar los LED, ajustar brillo, colores y efectos, cambiar el tema y el idioma, probar la conexión, abrir privacidad o condiciones y mostrar la consola o el historial. ¿Qué quieres hacer?',
        de: 'Ich kann LEDs, Helligkeit, Farben und Effekte steuern, Thema und Sprache ändern, die Verbindung prüfen, Datenschutz oder Bedingungen öffnen sowie Konsole und Verlauf anzeigen. Was möchtest du tun?',
        it: 'Posso controllare LED, luminosità, colori ed effetti, cambiare tema e lingua, verificare la connessione, aprire privacy o termini e mostrare console e cronologia. Cosa vuoi fare?',
        pt: 'Posso controlar LEDs, brilho, cores e efeitos, alterar tema e idioma, testar a ligação, abrir privacidade ou termos e mostrar a consola ou o histórico. O que pretende fazer?',
        nl: 'Ik kan leds, helderheid, kleuren en effecten bedienen, thema en taal wijzigen, de verbinding testen, privacy of voorwaarden openen en de console of geschiedenis tonen. Wat wil je doen?',
        ja: 'LED、明るさ、色、効果、テーマ、言語、接続を操作できます。プライバシーや利用規約を開いたり、ネットワークコンソールや履歴を表示したりもできます。何をしますか？',
        'zh-CN': '我可以控制 LED、亮度、颜色和效果，切换主题和语言，测试连接，打开隐私政策或使用条款，还可以展开网络控制台和 LED 历史。您想做什么？'
      };
      return capabilities[currentLanguage] || capabilities.en;
    }
    if (asksHelp || asksSuggestion) {
      return currentLanguage === 'en'
        ? `I can control LEDs, brightness, colors and effects, change the theme and language, test the connection, open privacy or terms, and expand the network console or LED history${nameSuffix ? `, ${nameSuffix.trim()}` : ''}. What would you like to do?`
        : `Je peux contrôler les LEDs, leur luminosité, leurs couleurs et leurs effets, changer le thème et la langue, tester la connexion, ouvrir la confidentialité ou les conditions, et dérouler la console réseau ou l’historique${nameSuffix ? `, ${nameSuffix.trim()}` : ''}. Que souhaitez-vous faire ?`;
    }
    return null;
  }

  function isDeterministicControlCommand(text) {
    const normalized = normalizeVoiceText(text);
    return /(?:\b(?:applique(?:r)?|mets?|mettre|definis?|configure|set|apply|use|utilise(?:r)?|configura|configurar|establece|establecer|setze|stelle|imposta|defina|configureer|stel)\b\s+[0-9]{1,3}\s*(?:leds?|lights?|lampes?|luces?|lichter|luci|luzes?)|\b(?:设置|配置)\s*[0-9]{1,3}\s*(?:个)?(?:LED|led))/i.test(normalized)
      || /\b(?:led\s*)?[0-9]{1,3}\s+(?:(?:en|in|to)\s+)?(?:rouge|jaune|vert|verte|bleu|bleue|violet|violette|orange|blanc|blanche|red|yellow|green|blue|purple|white)\b/.test(normalized)
      || /\b(?:mode|th[eè]me)\s+(?:sombre|noir|clair|dark|light)\b/.test(normalized)
      || /\b(?:langue|language|francais|french|anglais|english|espagnol|spanish|allemand|german|italien|italian|portugais|portuguese|neerlandais|dutch|japonais|japanese|chinois|chinese)\b/.test(normalized)
      || /\b(?:https|connexion securisee|secure connection|methode http|http method|post json|get query|post form|ollama|mode ia|ai mode|ecoute active|wake word|gestes sonores|sound gestures|reponses vocales|voice feedback)\b/.test(normalized)
      || /\b(?:console|journal|log|historique|history|firmware|code c\+\+|connexion|connection|ping|signal)\b/.test(normalized)
      || /\b(?:renomme|renommer|name|appelle|appeler)\b.*\bled\s*[0-9]{1,3}\b/.test(normalized)
      || /\b(?:dark|light)\s+(?:mode|theme)\b/.test(normalized)
      || /\b(?:allume|allumer|eteins?|eteindre|active|desactive|turn\s+on|turn\s+off|switch\s+on|switch\s+off)\b/.test(normalized)
      || /\b(?:ajoute|ajouter|rajoute|rajouter|add)\b.*\b(?:leds?|lights?|lampes?)\b/.test(normalized)
      || /\b(?:retire|retirer|enleve|enlever|supprime|supprimer|remove|delete|applique|appliquer|mets?|moins|fewer|less)\b.*\b(?:leds?|lights?|lampes?)\b.*\b(?:circuit|ruban|moins|fewer|less|weniger|meno|menos|minder)\b/.test(normalized)
      || /\b(?:attribue(?:r)?|mets?|mettre|applique(?:r)?|assigne(?:r)?|set)\b.*\b(?:couleur|color|colour)\b.*\bled\s*[0-9]{1,3}\b/.test(normalized)
      || /\b(?:logout|log out|sign out|disconnect|deconnexion|deconnecte|deconnecter|annule ma connexion|cerrar sesion|abmelden|disconnetti|sair|uitloggen)\b/.test(normalized)
      || /\b(?:couleur|color|colour|tema|theme|th[eè]me)\b.*\b(?:application|app|interface|toute|all|entire)\b/.test(normalized)
      || /\b(?:luminosite|intensite|brightness|intensity)\b.*\d{1,3}/.test(normalized)
      || /\b(?:clignotant|clignotement|blink|respiration|pulse|breathe|stroboscope|strobe|fixe|solid|steady)\b/.test(normalized);
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
        addLog(`[CFG] ${uiText('Nombre total de LEDs du circuit configuré à', 'Total circuit LEDs set to')} ${val}`, 'info');
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

    addLog(`[CFG] Configuration enregistrée: URL=${state.deviceUrl} (${state.httpMethod})`, 'info');
    sendHardwareRequest();
  });

  btnCheckPing.addEventListener('click', () => {
    addLog(`[PING] Test de joignabilité de ${state.deviceUrl}...`, 'info');
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
    const count = Math.max(1, Math.min(100, parseInt(firmwareLedCount.value, 10) || 1));
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
    espCodeSnippet.dataset.generated = 'true';
  }

  btnGenerateFirmware?.addEventListener('click', generateFirmwareCode);
  firmwareLedCount?.addEventListener('change', generateFirmwareCode);
  firmwareBoard?.addEventListener('change', generateFirmwareCode);
  generateFirmwareCode();

  btnCopyCode.addEventListener('click', () => {
    const codeText = document.getElementById('espCodeSnippet').innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      btnCopyCode.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-check"></use></svg> ${getFirmwareText('copied')}`;
      btnCopyCode.dataset.copied = 'true';
      setTimeout(() => {
        btnCopyCode.innerHTML = `<svg class="ui-icon" aria-hidden="true"><use href="#icon-clipboard"></use></svg> ${getFirmwareText('copy')}`;
        delete btnCopyCode.dataset.copied;
      }, 3000);
    });
  });

  // --- Initialisation au chargement ---
  updateVisualLEDState();
  updateAiVisualState();
  applyLanguage();
  initializeAccountSwitcher();
  addLog(`[READY] Application prête. IP Cible : <code>${state.deviceUrl}</code>`, 'info');

  sendHardwareRequest();
});
