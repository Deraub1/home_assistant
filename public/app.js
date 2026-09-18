/**
 * Application Web de Contrôle de Circuit LED Physique (Sélection LED 1 à LED n)
 * Communication REST / HTTP avec ESP32, ESP8266, Arduino ou Raspberry Pi
 * Support complet du Thème Clair/Sombre, de la Sélection de LED et des Commandes Vocales
 */

document.addEventListener('DOMContentLoaded', () => {
  const appSplash = document.getElementById('appSplash');

  window.setTimeout(() => {
    if (!appSplash) return;
    appSplash.classList.add('app-splash-hidden');
    appSplash.addEventListener('transitionend', () => appSplash.remove(), { once: true });
  }, 1600);
  
  // --- Éléments du DOM ---
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  
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
      blanc: 'blanche'
    };
    const feminineAlias = feminineAliases[normalizeVoiceText(led.name)];
    if (feminineAlias) aliases.push(feminineAlias);
    return [...new Set(aliases)].filter(alias => alias && !alias.startsWith('led '));
  }

  function findVoiceLedId(command) {
    const normalizedCommand = normalizeVoiceText(command);
    const matches = state.leds
      .flatMap(led => getVoiceLedAliases(led).map(alias => ({ led, alias })))
      .sort((first, second) => second.alias.length - first.alias.length);
    const match = matches.find(({ alias }) => {
      const pattern = new RegExp(`\\bled\\s+${alias}\\b`);
      return pattern.test(normalizedCommand);
    });
    return match ? match.led.id : null;
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
      button.setAttribute('aria-label', `Allumer ou éteindre ${led.name}`);
      button.innerHTML = `
        <span class="led-control-light" aria-hidden="true"></span>
        <span class="led-control-label">${led.name}</span>
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
        <select class="form-select led-name-select" data-led="${led.id}" aria-label="Couleur de la LED ${led.id}">
          <option value="">Non précisée</option>
          ${ledColorOptions.map(color => `<option value="${color}">${color}</option>`).join('')}
        </select>
        <select class="form-select led-effect-select" data-led="${led.id}" aria-label="Effet de la LED ${led.id} (${led.name})">
          <option value="solid">Fixe</option>
          <option value="pulse">Respiration</option>
          <option value="blink">Clignotement</option>
          <option value="strobe">Stroboscope</option>
        </select>
        <button
          type="button"
          class="btn-text led-power-button"
          data-led="${led.id}"
          aria-label="${led.isOn ? `Éteindre ${led.name}` : `Allumer ${led.name}`}"
        ><span aria-hidden="true">${led.isOn ? 'OFF' : 'ON'}</span></button>
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
    allOption.textContent = `Toutes les LEDs (1 à ${state.totalLeds})`;
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

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme_preference', theme);

    if (theme === 'light') {
      btnThemeToggle.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-sun"></use></svg><span id="themeToggleText">Clair</span>';
    } else {
      btnThemeToggle.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-moon"></use></svg><span id="themeToggleText">Sombre</span>';
    }
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
    const ledName = state.selectedLed === 'ALL' ? 'Toutes les LEDs' : getLedName(state.selectedLed);
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
        button.setAttribute('aria-label', `Allumer ou éteindre ${led.name}`);
        const label = button.querySelector('.led-control-label');
        if (label) label.textContent = led.name;
      }
    });

    if (activeCount > 0) {
      ledStateText.textContent = `${activeCount} LED${activeCount > 1 ? 's' : ''} ALLUMÉE${activeCount > 1 ? 'S' : ''}`;
      ledStateText.style.color = 'var(--primary)';
    } else {
      ledStateText.textContent = 'ÉTEINT';
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
      ? `${selectedConfig.isOn ? selectedConfig.brightness : 0}% • ${ledName} • ${selectedConfig.mode}`
      : `${activeCount > 0 ? state.brightness : 0}% • ${ledName}`;
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
          statusLiveBadge.textContent = 'Actif';
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-on';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        statusPrimaryText.textContent = `${activeCount} LED${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}`;
        if (statusSecondaryText) {
          statusSecondaryText.textContent = `LED sélectionnée : ${selectedConfig ? selectedConfig.brightness : state.brightness}% • Effet : ${selectedConfig ? selectedConfig.mode : state.mode}`;
        }
      } else {
        if (statusLiveBadge) {
          statusLiveBadge.className = 'status-badge status-offline';
          statusLiveBadge.textContent = 'Inactif';
        }
        if (statusIconPill) {
          statusIconPill.className = 'status-icon-pill state-off';
          statusIconPill.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-lightbulb"></use></svg>';
        }
        statusPrimaryText.textContent = `${ledName} éteinte`;
        if (statusSecondaryText) {
          statusSecondaryText.textContent = `Circuit hors tension (Dernier statut à ${new Date().toLocaleTimeString()})`;
        }
      }
    }
  }

  // --- Ajout de Log dans la Console ---

  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const timeStr = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
    
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  // --- Ajout d'une entrée dans l'historique ordonné des LEDs ---

  function addLedHistoryEntry(isOn, selectedLed, brightness, mode) {
    if (!ledActivationHistory) return;

    const li = document.createElement('li');
    li.className = `history-item ${isOn ? 'item-on' : 'item-off'} font-mono`;

    const timeStr = new Date().toLocaleTimeString();
    const ledTargetName = selectedLed === 'ALL' ? 'Toutes les LEDs' : getLedName(selectedLed);
    const badgeClass = isOn ? 'badge-on' : 'badge-off';
    const badgeLabel = isOn ? 'ALLUMÉE' : 'ÉTEINTE';
    const actionText = isOn ? `${ledTargetName} allumée` : `${ledTargetName} éteinte`;

    li.innerHTML = `
      <span class="history-time">[${timeStr}]</span>
      <span class="history-badge ${badgeClass}">${badgeLabel}</span>
      <span class="history-text"><strong>${actionText}</strong> <small style="opacity: 0.7;">(${brightness}% • ${mode === 'solid' ? 'Fixe' : mode})</small></span>
    `;

    ledActivationHistory.appendChild(li);
    ledActivationHistory.scrollTop = ledActivationHistory.scrollHeight;
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

    setConnectionStatus('connecting', 'Envoi...');

    try {
      addLog(`⚡ Envoi ${fetchOptions.method} vers <code>${targetFetchUrl}</code> (Cible: LED ${state.selectedLed})...`, 'info');

      const response = await fetch(targetFetchUrl, fetchOptions);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        setConnectionStatus('online', 'En ligne', latency);
        addLog(`✅ Réponse HTTP ${response.status} (${latency} ms) - LED #${state.selectedLed} mise à jour sur le circuit !`, 'success');
      } else {
        const errText = await response.text();
        setConnectionStatus('offline', `Erreur ${response.status}`);
        addLog(`⚠️ Serveur physique à répondu HTTP ${response.status}: ${errText}`, 'error');
      }
    } catch (err) {
      setConnectionStatus('offline', 'Hors ligne');
      addLog(`❌ Échec de la connexion vers ${targetFetchUrl}. Détail : ${err.message}`, 'error');
    }
  }

  function setConnectionStatus(status, text, pingMs = null) {
    connectionBadge.className = `status-badge status-${status}`;
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
  let commandAfterWakeWord = false;

  function speakResponse(text) {
    if (!toggleSpeechFeedback.checked || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      btnVoiceMic.classList.add('listening');
      micBtnText.textContent = recognitionMode === 'wake' ? 'En attente de « Home Assistant »...' : 'Écoute en cours...';
      voiceTranscript.textContent = recognitionMode === 'wake' ? 'Dites « Home Assistant »...' : 'Parlez maintenant...';
    };

    recognition.onend = () => {
      isListening = false;
      btnVoiceMic.classList.remove('listening');
      if (commandAfterWakeWord) {
        commandAfterWakeWord = false;
        recognitionMode = 'command';
        window.setTimeout(() => startRecognition('command'), 250);
      } else if (wakeWordEnabled) {
        window.setTimeout(() => startRecognition('wake'), 250);
      } else {
        micBtnText.textContent = 'Activer le micro';
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      btnVoiceMic.classList.remove('listening');
      micBtnText.textContent = wakeWordEnabled ? 'En attente de « Home Assistant »...' : 'Activer le micro';
      voiceTranscript.textContent = `Erreur micro: ${event.error}`;
      addLog(`🎙️ Erreur reconnaissance vocale: ${event.error}`, 'error');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      if (recognitionMode === 'wake') {
        if (normalizeVoiceText(transcript).includes('home assistant')) {
          commandAfterWakeWord = true;
          voiceTranscript.textContent = 'Mot d’activation détecté. Parlez maintenant...';
          addLog('🎙️ Mot d’activation « Home Assistant » détecté', 'info');
          recognition.stop();
        }
        return;
      }
      voiceTranscript.textContent = `"${transcript}"`;
      addLog(`🎙️ Commande vocale captée: "${transcript}"`, 'info');
      parseVoiceCommand(transcript);
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

  btnVoiceMic.addEventListener('click', () => {
    if (!recognition) return;
    wakeWordEnabled = false;
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
      startRecognition('wake');
    } else if (isListening && recognitionMode === 'wake') {
      recognition.stop();
      micBtnText.textContent = 'Activer le micro';
    }
  });

  function parseVoiceCommand(cmd) {
    let spokenFeedback = '';
    const turnOnRequested = /\b(?:allume|allumer|on|active)\b/.test(cmd);
    const turnOffRequested = /\b(?:éteins|éteindre|off|désactive|stop)\b/.test(cmd);
    const allLedsRequested = cmd.includes('toutes les led')
      || cmd.includes('tous les led')
      || cmd.includes('toute la led')
      || cmd.includes('tout le ruban')
      || cmd.includes('ensemble des led');

    // 1. Interrupteur ON / OFF
    if (turnOnRequested) {
      state.isOn = true;
      spokenFeedback = 'LED allumée';
    } else if (turnOffRequested) {
      state.isOn = false;
      spokenFeedback = 'LED éteinte';
    }

    // 2. Sélection de la cible (LED par couleur ou toutes les LEDs)
    const namedLedId = findVoiceLedId(cmd);
    const numericLedMatch = cmd.match(/led\s*([0-9]+)/) || cmd.match(/numéro\s*([0-9]+)/);
    if (allLedsRequested) {
      state.selectedLed = 'ALL';
      if (ledSelect) ledSelect.value = 'ALL';
      spokenFeedback += ' sur toutes les LEDs';
    } else if (namedLedId) {
      state.selectedLed = namedLedId;
      if (ledSelect) ledSelect.value = state.selectedLed;
      spokenFeedback += ` ${getLedName(namedLedId)}`;
    } else if (numericLedMatch) {
      state.selectedLed = numericLedMatch[1];
      if (ledSelect) ledSelect.value = state.selectedLed;
      spokenFeedback += spokenFeedback ? ` numéro ${state.selectedLed}` : `Sélection de la LED ${state.selectedLed}`;
    }

    // 3. Luminosité
    const brightMatch = cmd.match(/(?:luminosité|intensité|niveau)\s*(?:à|a|de)?\s*([0-9]{1,3})\s*(?:%|pour\s*cent)?/) || cmd.match(/([0-9]{1,3})\s*(?:%|pour\s*cent)/);
    if (brightMatch) {
      const val = parseInt(brightMatch[1], 10);
      if (val >= 0 && val <= 100) {
        state.brightness = val;
        brightnessRange.value = val;
        spokenFeedback += ` à ${val} pour cent`;
      }
    } else if (cmd.includes('maximum') || cmd.includes('max')) {
      state.brightness = 100;
      brightnessRange.value = 100;
      spokenFeedback += ' à 100%';
    } else if (cmd.includes('minimum') || cmd.includes('min')) {
      state.brightness = 10;
      brightnessRange.value = 10;
      spokenFeedback += ' à 10%';
    }

    // 4. Mode / Effets
    if (cmd.includes('clignotant') || cmd.includes('clignotement') || cmd.includes('clignote') || cmd.includes('flash')) {
      state.mode = 'blink';
      spokenFeedback += ' mode clignotant';
    } else if (cmd.includes('respiration') || cmd.includes('respire') || cmd.includes('pulse')) {
      state.mode = 'pulse';
      spokenFeedback += ' mode respiration';
    } else if (cmd.includes('fixe') || cmd.includes('solide') || cmd.includes('normal')) {
      state.mode = 'solid';
      spokenFeedback += ' mode fixe';
    } else if (cmd.includes('stroboscope') || cmd.includes('stroboscopique') || cmd.includes('strobe')) {
      state.mode = 'strobe';
      spokenFeedback += ' mode stroboscope';
    }

    getTargetLedIds().forEach(id => {
      const led = getLedConfig(id);
      led.isOn = state.isOn;
      led.brightness = state.brightness;
      led.mode = state.mode;
    });
    syncControlsFromSelection();
    rebuildLedAssignments();
    updateVisualLEDState();

    if (!spokenFeedback) {
      spokenFeedback = 'Commande non reconnue. Indiquez une action et une cible, par exemple : allume toutes les LEDs.';
    }

    speakResponse(spokenFeedback);
    sendHardwareRequest();
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
        addLog(`💡 Nombre total de LEDs du circuit configuré à ${val} LEDs`, 'info');
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
      addLog('URL de la cible invalide. Utilisez une adresse HTTP ou HTTPS valide.', 'error');
      return;
    }

    state.secureTransport = secureTransport.checked;
    if (state.secureTransport && parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }
    if (state.secureTransport && parsedUrl.protocol !== 'https:') {
      addLog('La connexion sécurisée exige une URL HTTPS.', 'error');
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
    addLog('Console nettoyée.', 'info');
  });
  btnClearLog.addEventListener('click', (event) => event.stopPropagation());

  if (btnClearLedHistory) {
    btnClearLedHistory.addEventListener('click', () => {
      ledActivationHistory.innerHTML = '';
      addLog('Historique d\'activation des LEDs effacé.', 'info');
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
  server.send(204);
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
  server.send(200, "application/json", "{\\"status\\":\\"ok\\",\\"ledCount\\":" + String(LED_COUNT) + "}");
}

void setup() {
  Serial.begin(115200);
  for (uint8_t i = 0; i < LED_COUNT; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    analogWrite(LED_PINS[i], 0);
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
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
      btnCopyCode.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-check"></use></svg> Code copié dans le presse-papier !';
      setTimeout(() => {
        btnCopyCode.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-clipboard"></use></svg> Copier le code dans le presse-papier';
      }, 3000);
    });
  });

  // --- Initialisation au chargement ---
  updateVisualLEDState();
  addLog(`🌐 Application prête. IP Cible : <code>${state.deviceUrl}</code>`, 'info');

  sendHardwareRequest();
});
