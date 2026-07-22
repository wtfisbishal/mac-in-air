import { app, BrowserWindow, protocol, net, session, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { setupIpc } from './ipc';
import { createTray } from './tray';
import { socketService } from '../services/socket.service';
import { authService } from '../services/auth.service';
import { powerSaveBlocker } from 'electron';
import { setupUpdater } from '../services/updater.service';
import { logInfo, logError } from '../utils/logger';

// Register the custom protocol and the OAuth deep link scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true } },
]);

// Register macinair:// as a deep-link handler for Google OAuth callback
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('macinair', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('macinair');
}

const isDev = !app.isPackaged;
let blockerId: number;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    transparent: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: {
      x: 20,
      y: 20,
    },
    vibrancy: 'sidebar',
    visualEffectState: 'active',

    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('app://-/');
  }
}

// Handle deep links on macOS (open-url event)
app.on('open-url', async (event, urlStr) => {
  event.preventDefault();
  logInfo('Main', 'Deep link received', { url: urlStr });
  try {
    await authService.handleCallbackUrl(urlStr);
    // After successful auth, connect to backend and notify renderer
    socketService.reconnectWithAuth();
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      const authState = authService.getState();
      mainWindow.webContents.send('auth-state-changed', authState);
    }
  } catch (err) {
    logError('Main', 'Failed to handle deep link callback', err);
  }
});

// Handle deep links on Windows (second-instance event)
app.on('second-instance', async (_event, commandLine) => {
  const deepLink = commandLine.find(arg => arg.startsWith('macinair://'));
  if (deepLink) {
    logInfo('Main', 'Second instance deep link', { url: deepLink });
    try {
      await authService.handleCallbackUrl(deepLink);
      socketService.reconnectWithAuth();
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.focus();
        const authState = authService.getState();
        mainWindow.webContents.send('auth-state-changed', authState);
      }
    } catch (err) {
      logError('Main', 'Failed to handle second-instance deep link', err);
    }
  }
  // Bring main window to foreground
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  protocol.handle('app', (request) => {
    const urlObj = new URL(request.url);
    let pathname = decodeURIComponent(urlObj.pathname);

    if (pathname === '/') {
      pathname = '/index.html';
    }

    let filePath = path.join(__dirname, '../../renderer', pathname);

    if (!fs.existsSync(filePath) && !path.extname(pathname)) {
      filePath = filePath + '.html';
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

  blockerId = powerSaveBlocker.start('prevent-app-suspension');
  console.log('PowerSaveBlocker started:', powerSaveBlocker.isStarted(blockerId));

  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        callback({ video: sources[0], audio: 'loopback' });
      } catch (err) {
        console.error('[Main] setDisplayMediaRequestHandler error:', err);
        callback({});
      }
    },
    { useSystemPicker: false }
  );

  setupIpc();
  createTray();

  // Initialize auth from persisted store before connecting socket
  await authService.initialize();

  // Only connect socket if already authenticated
  if (authService.getState().isAuthenticated) {
    logInfo('Main', 'Restored auth session, connecting to backend');
    socketService.connect();
  } else {
    logInfo('Main', 'No stored auth — waiting for user to sign in with Google');
  }

  createWindow();

  // Auto-updater
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    setupUpdater(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (powerSaveBlocker.isStarted(blockerId)) {
    powerSaveBlocker.stop(blockerId);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
