const { app, BrowserWindow, dialog, session, shell } = require('electron');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const publicDirectory = path.resolve(__dirname, '..', 'public');
const appTitle = 'Home Assistant';

function isLocalAppUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'file:') return false;

    const filePath = path.resolve(fileURLToPath(url));
    return filePath === publicDirectory
      || filePath.startsWith(`${publicDirectory}${path.sep}`);
  } catch {
    return false;
  }
}

function openExternalUrl(rawUrl) {
  if (!/^https?:\/\//i.test(rawUrl)) return;

  shell.openExternal(rawUrl).catch((error) => {
    dialog.showErrorBox(appTitle, `Impossible d’ouvrir le lien : ${error.message}`);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 700,
    title: appTitle,
    icon: path.join(__dirname, 'app.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.on('page-title-updated', (event) => {
    event.preventDefault();
    window.setTitle(appTitle);
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (isLocalAppUrl(url)) return;

    event.preventDefault();
    openExternalUrl(url);
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  window.loadFile(path.join(publicDirectory, 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const appPage = webContents.getURL().startsWith('file://')
        && details.requestingOrigin?.startsWith('file://');
      const microphoneOnly = details.mediaTypes?.includes('audio')
        && !details.mediaTypes.includes('video');

      callback(permission === 'media' && appPage && microphoneOnly);
    }
  );

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
