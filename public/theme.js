(() => {
  const COLOR_KEY = 'theme_color_preference';
  const THEME_KEY = 'theme_preference';  const THEME_BASE_KEY = 'theme_base_preference';  const ACTIVITY_KEY = 'app_last_activity';
  const INACTIVITY_LIMIT = 60 * 60 * 1000;
  const defaultColor = '#5b6ef6';
  let activityTimer;

  function normalizeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value || '') ? value : defaultColor;
  }

  function parseRgb(value) {
    const match = String(value).match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/i);
    if (match) return match.slice(1, 4).map(Number);
    const normalized = normalizeColor(value).slice(1);
    return [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16));
  }

  function getContrastColor(value) {
    const channels = parseRgb(value).map(channel => channel / 255);
    const linearChannels = channels.map(channel => {
      const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return linear;
    });
    const luminance = 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];
    return luminance > 0.48 ? '#0f172a' : '#f8fafc';
  }

  function mixHexColors(colorA, colorB, weight) {
    const clamp = value => Math.min(255, Math.max(0, value));
    const parse = hex => {
      const value = normalizeColor(hex).slice(1);
      return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    };
    const first = parse(colorA);
    const second = parse(colorB);
    const mixed = first.map((channel, index) => Math.round(channel * (1 - weight) + second[index] * weight));
    return `rgb(${mixed.map(channel => clamp(channel)).join(', ')})`;
  }

  function resolveThemeState() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    const baseTheme = localStorage.getItem(THEME_BASE_KEY) || (savedTheme === 'custom' ? 'dark' : savedTheme);
    const effectiveTheme = savedTheme === 'custom' ? baseTheme : savedTheme;
    return {
      savedTheme,
      baseTheme,
      effectiveTheme
    };
  }

  function hexToRgba(hex, alpha) {
    const value = normalizeColor(hex).slice(1);
    const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    return `rgba(${channels.join(', ')}, ${alpha})`;
  }

  function svgDataUrl(svg) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
  }

  function getThemeIcon(theme, color) {
    if (theme === 'dark') {
      return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z"/></svg>`);
    }
    if (theme === 'custom') {
      return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1.8"><circle cx="12" cy="12" r="7"/></svg>`);
    }
    return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>`);
  }

  function updateMetaThemeColor(color) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }

  function applyThemeColor(color = localStorage.getItem(COLOR_KEY)) {
    const normalized = normalizeColor(color);
    const root = document.documentElement;
    const { savedTheme, effectiveTheme } = resolveThemeState();
    const isCustomTheme = savedTheme === 'custom';
    const isDarkTheme = effectiveTheme === 'dark';
    const baseTextColor = isDarkTheme ? '#f0f4f8' : '#0f172a';
    const arrowColor = baseTextColor;
    const customProperties = [
      '--theme-color', '--primary', '--primary-glow', '--glass-glow', '--accent', '--accent-soft',
      '--warning', '--success', '--cyan', '--blue', '--pink', '--yellow', '--theme-color-shadow', '--theme-color-contrast',
      '--bg-color', '--panel-bg', '--panel-border', '--text-main', '--text-muted', '--text-dark', '--shadow-card',
      '--bg', '--panel', '--panel-soft', '--text', '--muted', '--border', '--shadow', '--theme-select-arrow', '--theme-select-icon'
    ];

    root.setAttribute('data-theme', effectiveTheme);
    root.toggleAttribute('data-custom-theme', isCustomTheme);

    if (isCustomTheme) {
      root.style.setProperty('--theme-color', normalized);
      root.style.setProperty('--primary', normalized);
      root.style.setProperty('--primary-glow', hexToRgba(normalized, 0.5));
      root.style.setProperty('--accent', normalized);
      root.style.setProperty('--accent-soft', hexToRgba(normalized, 0.12));
      root.style.setProperty('--theme-color-shadow', hexToRgba(normalized, 0.2));
      root.style.setProperty('--primary', normalized);
      root.style.setProperty('--primary-glow', hexToRgba(normalized, 0.5));
      root.style.setProperty('--glass-glow', hexToRgba(normalized, isDarkTheme ? 0.18 : 0.12));
      root.style.setProperty('--accent', normalized);
      root.style.setProperty('--accent-soft', hexToRgba(normalized, 0.12));
      root.style.setProperty('--warning', normalized);
      root.style.setProperty('--success', normalized);
      root.style.setProperty('--cyan', normalized);
      root.style.setProperty('--blue', normalized);
      root.style.setProperty('--pink', normalized);
      root.style.setProperty('--yellow', normalized);
      root.style.setProperty('--theme-color-shadow', hexToRgba(normalized, 0.2));
      const backgroundColor = isDarkTheme ? mixHexColors(normalized, '#070b13', 0.72) : mixHexColors(normalized, '#f8fafc', 0.18);
      const panelColor = isDarkTheme ? mixHexColors(normalized, '#101827', 0.66) : mixHexColors(normalized, '#e2e8f0', 0.32);
      const borderColor = hexToRgba(normalized, isDarkTheme ? 0.22 : 0.18);
      const textColor = getContrastColor(panelColor);
      const mutedColor = textColor === '#f8fafc' ? '#d8e1ed' : '#475569';
      const darkTextColor = getContrastColor(normalized);
      root.style.setProperty('--bg-color', backgroundColor);
      root.style.setProperty('--panel-bg', panelColor);
      root.style.setProperty('--panel-border', borderColor);
      root.style.setProperty('--text-main', textColor);
      root.style.setProperty('--text-muted', mutedColor);
      root.style.setProperty('--text-dark', darkTextColor);
      root.style.setProperty('--theme-color-contrast', darkTextColor);
      root.style.setProperty('--bg', backgroundColor);
      root.style.setProperty('--panel', panelColor);
      root.style.setProperty('--panel-soft', hexToRgba(normalized, isDarkTheme ? 0.1 : 0.08));
      root.style.setProperty('--text', textColor);
      root.style.setProperty('--muted', mutedColor);
      root.style.setProperty('--border', borderColor);
      root.style.setProperty('--shadow-card', isDarkTheme
        ? '0 20px 40px rgba(2, 6, 23, 0.28)'
        : '0 14px 28px rgba(15, 23, 42, 0.1)');
      root.style.setProperty('--shadow', isDarkTheme
        ? '0 18px 36px rgba(2, 6, 23, 0.4)'
        : '0 14px 28px rgba(15, 23, 42, 0.12)');
    } else {
      customProperties.forEach(property => root.style.removeProperty(property));
      root.style.setProperty('--theme-color', normalized);
      root.style.setProperty('--primary', normalized);
      root.style.setProperty('--primary-glow', hexToRgba(normalized, 0.5));
      root.style.setProperty('--accent', normalized);
      root.style.setProperty('--accent-soft', hexToRgba(normalized, 0.12));
      root.style.setProperty('--theme-color-shadow', hexToRgba(normalized, 0.2));
    }

    root.style.setProperty('--theme-select-arrow', `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23${arrowColor.slice(1)}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`);
    root.style.setProperty('--theme-select-icon', getThemeIcon(savedTheme, isCustomTheme ? normalized : baseTextColor));

    updateMetaThemeColor(isCustomTheme ? normalized : isDarkTheme ? '#0b0f19' : '#f8fafc');
    localStorage.setItem(COLOR_KEY, normalized);
    window.dispatchEvent(new CustomEvent('theme-color-changed', { detail: { color: normalized } }));
    return normalized;
  }

  function getFaviconLinks() {
    return [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')];
  }

  function setFaviconGrayscale(grayscale) {
    getFaviconLinks().forEach(link => {
      const source = link.dataset.originalHref || link.href;
      link.dataset.originalHref = source;
      if (!grayscale) {
        link.href = source;
        return;
      }

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || 64;
        canvas.height = image.naturalHeight || 64;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.filter = 'grayscale(1)';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        link.href = canvas.toDataURL('image/png');
      };
      image.src = source;
    });
  }

  function refreshInactivityState() {
    const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY) || Date.now());
    const inactive = Date.now() - lastActivity >= INACTIVITY_LIMIT;
    setFaviconGrayscale(inactive);

    window.clearTimeout(activityTimer);
    activityTimer = window.setTimeout(refreshInactivityState, INACTIVITY_LIMIT);
  }

  function registerActivity() {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    setFaviconGrayscale(false);
    window.clearTimeout(activityTimer);
    activityTimer = window.setTimeout(refreshInactivityState, INACTIVITY_LIMIT);
  }

  window.applyThemeColor = applyThemeColor;
  window.getThemeColor = () => normalizeColor(localStorage.getItem(COLOR_KEY));
  window.applyStoredTheme = () => {
    const { effectiveTheme } = resolveThemeState();
    const theme = effectiveTheme;
    document.documentElement.setAttribute('data-theme', theme);
    applyThemeColor();
  };

  applyThemeColor();

  ['pointerdown', 'keydown', 'touchstart', 'mousemove', 'click', 'scroll', 'focus'].forEach(eventName => {
    window.addEventListener(eventName, registerActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) registerActivity();
  });

  window.addEventListener('storage', event => {
    if (event.key === COLOR_KEY) applyThemeColor(event.newValue);
    if (event.key === THEME_KEY || event.key === THEME_BASE_KEY) window.applyStoredTheme();
    if (event.key === ACTIVITY_KEY) refreshInactivityState();
  });

  refreshInactivityState();
})();
