(() => {
  const COLOR_KEY = 'theme_color_preference';
  const THEME_KEY = 'theme_preference';
  const ACTIVITY_KEY = 'app_last_activity';
  const INACTIVITY_LIMIT = 60 * 60 * 1000;
  const defaultColor = '#00f0ff';
  let activityTimer;

  function normalizeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value || '') ? value : defaultColor;
  }

  function hexToRgba(hex, alpha) {
    const value = normalizeColor(hex).slice(1);
    const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    return `rgba(${channels.join(', ')}, ${alpha})`;
  }

  function applyThemeColor(color = localStorage.getItem(COLOR_KEY)) {
    const normalized = normalizeColor(color);
    const root = document.documentElement;
    root.setAttribute('data-theme', localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
    root.style.setProperty('--theme-color', normalized);
    root.style.setProperty('--primary', normalized);
    root.style.setProperty('--primary-glow', hexToRgba(normalized, 0.5));
    root.style.setProperty('--glass-glow', hexToRgba(normalized, 0.15));
    root.style.setProperty('--accent', normalized);
    root.style.setProperty('--accent-soft', hexToRgba(normalized, 0.12));
    root.style.setProperty('--warning', normalized);
    root.style.setProperty('--cyan', normalized);
    root.style.setProperty('--blue', normalized);
    root.style.setProperty('--pink', normalized);
    root.style.setProperty('--yellow', normalized);
    root.style.setProperty('--theme-color-shadow', hexToRgba(normalized, 0.2));
    root.style.setProperty('--theme-color-contrast', '#ffffff');
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
    setFaviconGrayscale(Date.now() - lastActivity >= INACTIVITY_LIMIT);
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
    document.documentElement.setAttribute(
      'data-theme',
      localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    );
    applyThemeColor();
  };
  applyThemeColor();
  ['pointerdown', 'keydown', 'touchstart', 'mousemove'].forEach(eventName => {
    window.addEventListener(eventName, registerActivity, { passive: true });
  });
  window.addEventListener('storage', event => {
    if (event.key === COLOR_KEY) applyThemeColor(event.newValue);
    if (event.key === THEME_KEY) window.applyStoredTheme();
    if (event.key === ACTIVITY_KEY) refreshInactivityState();
  });
  refreshInactivityState();
})();
