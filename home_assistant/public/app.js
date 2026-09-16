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
  const corsModeSelect = document.getElementById('corsMode');

  const connectionBadge = document.getElementById('connectionBadge');
  const statusText = document.getElementById('statusText');
  const btnCheckPing = document.getElementById('btnCheckPing');
  const pingValue = document.getElementById('pingValue');

  const masterSwitch = document.getElementById('masterSwitch');
  const switchBtnLabel = document.getElementById('switchBtnLabel');
  const ledOrbGrid = document.getElementById('ledOrbGrid');
  const ledStateText = document.getElementById('ledStateText');
  const ledDetailsText = document.getElementById('ledDetailsText');
  const statusPrimaryText = document.getElementById('statusPrimaryText');
  const statusSecondaryText = document.getElementById('statusSecondaryText');
  const statusLiveBadge = document.getElementById('statusLiveBadge');
  const statusIconPill = document.getElementById('statusIconPill');

  const brightnessRange = document.getElementById('brightnessRange');
  const brightnessValue = document.getElementById('brightnessValue');

  const ledSelect = document.getElementById('ledSelect');
  const selectedLedBadge = document.getElementById('selectedLedBadge');
  const ledChips = document.querySelectorAll('.led-chip');

  const presetChips = document.querySelectorAll('.preset-chip');
  const ledAssignments = document.getElementById('ledAssignments');

  const logConsole = document.getElementById('logConsole');
  const btnClearLog = document.getElementById('btnClearLog');

  const btnOpenCodeModal = document.getElementById('btnOpenCodeModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const codeModal = document.getElementById('codeModal');
  const btnCopyCode = document.getElementById('btnCopyCode');

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

  // --- État Local de la LED & Matériel ---
  const isLocalNodeHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const defaultDeviceUrl = isLocalNodeHost ? 'http://192.168.1.45/api/led' : '/api/led';
  const defaultCorsMode = isLocalNodeHost ? 'PROXY' : 'DIRECT';

  let state = {
    isOn: false,
    selectedLed: '1', // '1', '2', '3', ... 'ALL'
    totalLeds: parseInt(localStorage.getItem('led_total_count'), 10) || 8,
    brightness: parseInt(brightnessRange.value, 10) || 80,
    mode: 'solid',
    deviceUrl: localStorage.getItem('led_device_url') || defaultDeviceUrl,
    httpMethod: localStorage.getItem('led_http_method') || 'POST_JSON',
    corsMode: localStorage.getItem('led_cors_mode') || defaultCorsMode,
    leds: []
  };

  state.leds = Array.from({ length: state.totalLeds }, (_, index) => ({
    id: String(index + 1),
    isOn: false,
    brightness: state.brightness,
    mode: 'solid'
  }));

  // Initialisation des champs
  deviceUrlInput.value = state.deviceUrl;
  httpMethodSelect.value = state.httpMethod;
  corsModeSelect.value = state.corsMode;
  if (totalLedsInput) totalLedsInput.value = state.totalLeds;

  // --- Regénération dynamique de la liste déroulante de sélection des LEDs ---

  function getLedConfig(ledId) {
    return state.leds.find(led => led.id === String(ledId));
  }

  function getTargetLedIds() {
    if (state.selectedLed === 'ALL') {
      return state.leds.map(led => led.id);
    }
    return [state.selectedLed];
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

  function rebuildLedAssignments() {
    if (!ledAssignments) return;

    ledAssignments.innerHTML = '';
    state.leds.forEach((led) => {
      const row = document.createElement('div');
      row.className = 'led-assignment-row';
      row.innerHTML = `
        <span class="led-assignment-name">LED ${led.id}</span>
        <select class="form-select led-effect-select" data-led="${led.id}" aria-label="Effet de la LED ${led.id}">
          <option value="solid">Fixe</option>
          <option value="pulse">Respiration</option>
          <option value="blink">Clignotement</option>
          <option value="strobe">Stroboscope</option>
        </select>
        <button
          type="button"
          class="btn-text led-power-button"
          data-led="${led.id}"
          aria-label="${led.isOn ? `Éteindre la LED ${led.id}` : `Allumer la LED ${led.id}`}"
        ><span aria-hidden="true">${led.isOn ? '⏼' : '⏻'}</span></button>
      `;
      row.querySelector('.led-effect-select').value = led.mode;
      ledAssignments.appendChild(row);
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
        ledSelect.value = led.id;
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
      orb.setAttribute('aria-label', `LED ${i}`);
      orb.innerHTML = `<div class="led-inner-glow"></div><span class="led-orb-index">${i}</span>`;
      ledOrbGrid.appendChild(orb);
    }
  }

  // --- 🌗 Gestion du Thème Clair / Sombre ---
  let currentTheme = localStorage.getItem('theme_preference') || 'dark';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme_preference', theme);

    if (theme === 'light') {
      btnThemeToggle.innerHTML = '☀️ <span id="themeToggleText">Clair</span>';
    } else {
      btnThemeToggle.innerHTML = '🌙 <span id="themeToggleText">Sombre</span>';
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
  rebuildLedAssignments();
  syncControlsFromSelection();

  // --- Fonctions d'Affichage & Mise à jour UI ---

  function updateVisualLEDState() {
    // 1. Bouton d'interrupteur & texte
    const ledName = state.selectedLed === 'ALL' ? 'Toutes les LEDs' : `LED ${state.selectedLed}`;
    const selectedConfig = getLedConfig(state.selectedLed);
    const activeCount = state.leds.filter(led => led.isOn).length;

    if (activeCount > 0) {
      masterSwitch.classList.remove('switch-off');
      masterSwitch.classList.add('switch-on');
      switchBtnLabel.textContent = 'ÉTEINDRE';
      ledStateText.textContent = `${activeCount} LED${activeCount > 1 ? 's' : ''} ALLUMÉE${activeCount > 1 ? 'S' : ''}`;
      ledStateText.style.color = 'var(--primary)';
    } else {
      masterSwitch.classList.remove('switch-on');
      masterSwitch.classList.add('switch-off');
      switchBtnLabel.textContent = 'ALLUMER';
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
        orb.style.setProperty('--current-color', 'var(--primary)');
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
    selectedLedBadge.textContent = state.selectedLed === 'ALL' ? 'TOUTES' : `LED #${state.selectedLed}`;

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
          statusIconPill.textContent = '💡';
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
          statusIconPill.textContent = '⚫';
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
    const ledTargetName = selectedLed === 'ALL' ? 'Toutes les LEDs' : `LED ${selectedLed}`;
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
      leds: state.leds.map(led => ({
        id: led.id,
        state: led.isOn ? 'ON' : 'OFF',
        brightness: led.brightness,
        mode: led.mode
      }))
    };

    let targetFetchUrl = state.deviceUrl;
    let fetchOptions = {
      headers: {}
    };

    const startTime = performance.now();

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

    let finalUrl = targetFetchUrl;
    if (state.corsMode === 'PROXY') {
      finalUrl = `/api/proxy?url=${encodeURIComponent(targetFetchUrl)}`;
    }

    setConnectionStatus('connecting', 'Envoi...');

    try {
      addLog(`⚡ Envoi ${fetchOptions.method} vers <code>${targetFetchUrl}</code> (Cible: LED ${state.selectedLed})...`, 'info');

      const response = await fetch(finalUrl, fetchOptions);
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
      micBtnText.textContent = 'Écoute en cours...';
      voiceTranscript.textContent = 'Parlez maintenant...';
    };

    recognition.onend = () => {
      isListening = false;
      btnVoiceMic.classList.remove('listening');
      micBtnText.textContent = 'Activer le micro';
    };

    recognition.onerror = (event) => {
      isListening = false;
      btnVoiceMic.classList.remove('listening');
      micBtnText.textContent = 'Activer le micro';
      voiceTranscript.textContent = `Erreur micro: ${event.error}`;
      addLog(`🎙️ Erreur reconnaissance vocale: ${event.error}`, 'error');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      voiceTranscript.textContent = `"${transcript}"`;
      addLog(`🎙️ Commande vocale captée: "${transcript}"`, 'info');
      parseVoiceCommand(transcript);
    };
  } else {
    btnVoiceMic.disabled = true;
    micBtnText.textContent = 'Vocale non supportée';
    voiceTranscript.textContent = 'Web Speech API non disponible sur ce navigateur.';
  }

  btnVoiceMic.addEventListener('click', () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  function parseVoiceCommand(cmd) {
    let spokenFeedback = '';

    // 1. Interrupteur ON / OFF
    if (cmd.includes('allume') || cmd.includes('allumer') || cmd.includes('on') || cmd.includes('active')) {
      state.isOn = true;
      spokenFeedback = 'LED allumée';
    } else if (cmd.includes('éteins') || cmd.includes('éteindre') || cmd.includes('off') || cmd.includes('désactive') || cmd.includes('stop')) {
      state.isOn = false;
      spokenFeedback = 'LED éteinte';
    }

    // 2. Sélection de LED (LED 1 à n ou Toutes)
    const ledMatch = cmd.match(/led\s*([0-9]+)/) || cmd.match(/numéro\s*([0-9]+)/);
    if (ledMatch) {
      state.isOn = true;
      state.selectedLed = ledMatch[1];
      if (ledSelect) ledSelect.value = state.selectedLed;
      spokenFeedback += spokenFeedback ? ` numéro ${state.selectedLed}` : `Sélection de la LED ${state.selectedLed}`;
    } else if (cmd.includes('toute') || cmd.includes('toutes') || cmd.includes('ensemble') || cmd.includes('ruban')) {
      state.isOn = true;
      state.selectedLed = 'ALL';
      if (ledSelect) ledSelect.value = 'ALL';
      spokenFeedback += ' sur toutes les LEDs';
    }

    // 3. Luminosité
    const brightMatch = cmd.match(/luminosité\s*([0-9]+)/) || cmd.match(/([0-9]+)\s*%/);
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
    if (cmd.includes('clignotant') || cmd.includes('clignote') || cmd.includes('flash')) {
      state.mode = 'blink';
      spokenFeedback += ' mode clignotant';
    } else if (cmd.includes('respiration') || cmd.includes('pulse')) {
      state.mode = 'pulse';
      spokenFeedback += ' mode respiration';
    } else if (cmd.includes('fixe') || cmd.includes('solide') || cmd.includes('normal')) {
      state.mode = 'solid';
      spokenFeedback += ' mode fixe';
    } else if (cmd.includes('stroboscope') || cmd.includes('strobe')) {
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
      spokenFeedback = 'Commande non reconnue. Dites allume, éteins, LED 1, LED 2 ou toutes les LEDs.';
    }

    speakResponse(spokenFeedback);
    sendHardwareRequest();
  }

  // --- Gestionnaires d'Événements UI ---

  masterSwitch.addEventListener('click', () => {
    const targetIds = getTargetLedIds();
    const shouldTurnOn = targetIds.some(id => !getLedConfig(id).isOn);
    targetIds.forEach(id => {
      getLedConfig(id).isOn = shouldTurnOn;
    });
    syncControlsFromSelection();
    rebuildLedAssignments();
    sendHardwareRequest();
  });

  brightnessRange.addEventListener('input', (e) => {
    state.brightness = parseInt(e.target.value, 10);
    getTargetLedIds().forEach(id => {
      getLedConfig(id).brightness = state.brightness;
    });
    brightnessValue.textContent = `${state.brightness}%`;
    updateVisualLEDState();
  });

  brightnessRange.addEventListener('change', () => {
    sendHardwareRequest();
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
          isOn: false,
          brightness: state.brightness,
          mode: 'solid'
        }));
        rebuildLedAssignments();
        syncControlsFromSelection();
        updateVisualLEDState();
        addLog(`💡 Nombre total de LEDs du circuit configuré à ${val} LEDs`, 'info');
        sendHardwareRequest();
      }
    });
  }

  btnSaveConfig.addEventListener('click', () => {
    state.deviceUrl = deviceUrlInput.value.trim();
    state.httpMethod = httpMethodSelect.value;
    state.corsMode = corsModeSelect.value;

    localStorage.setItem('led_device_url', state.deviceUrl);
    localStorage.setItem('led_http_method', state.httpMethod);
    localStorage.setItem('led_cors_mode', state.corsMode);

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

  if (btnClearLedHistory) {
    btnClearLedHistory.addEventListener('click', () => {
      ledActivationHistory.innerHTML = '';
      addLog('Historique d\'activation des LEDs effacé.', 'info');
    });
  }

  btnOpenCodeModal.addEventListener('click', () => codeModal.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => codeModal.classList.add('hidden'));
  codeModal.addEventListener('click', (e) => {
    if (e.target === codeModal) codeModal.classList.add('hidden');
  });

  btnCopyCode.addEventListener('click', () => {
    const codeText = document.getElementById('espCodeSnippet').innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      btnCopyCode.textContent = '✅ Code Copié dans le presse-papier !';
      setTimeout(() => btnCopyCode.textContent = '📋 Copier le code dans le presse-papier', 3000);
    });
  });

  // --- Initialisation au chargement ---
  updateVisualLEDState();
  addLog(`🌐 Application prête. IP Cible : <code>${state.deviceUrl}</code>`, 'info');

  sendHardwareRequest();
});
