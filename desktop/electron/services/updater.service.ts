import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { logInfo } from '../utils/logger';

// Load GH_TOKEN from the packaged .env if running in production
function loadGhToken() {
  try {
    const envPath = path.join(process.resourcesPath, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/GH_TOKEN\s*=\s*["']?([^\s"']+)["']?/);
      if (match?.[1]) {
        process.env.GH_TOKEN = match[1];
        logInfo('Updater', 'GH_TOKEN loaded from packaged .env');
      }
    }
  } catch {
    // silently ignore — token may already be in env
  }
}

export function setupUpdater(mainWindow: BrowserWindow) {
  loadGhToken();

  // Disable auto-download so we control when to start it
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Point to the private GitHub repo
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'bisxxal',
    repo: 'mac-in-air',
    private: true,
    token: process.env.GH_TOKEN,
  });

  //   Event forwarding to renderer  
  autoUpdater.on('checking-for-update', () => {
    logInfo('Updater', 'Checking for update…');
    mainWindow.webContents.send('update-checking');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    logInfo('Updater', `Update available: v${info.version}`);
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
    // Start downloading automatically once notified
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    logInfo('Updater', 'App is up to date.');
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    mainWindow.webContents.send('update-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    logInfo('Updater', `Update downloaded: v${info.version}`);
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err: Error) => {
    logInfo('Updater', `Error: ${err.message}`);
    mainWindow.webContents.send('update-error', {
      message: err.message,
    });
  });

  //   IPC: renderer asks to install  
  ipcMain.handle('install-update', () => {
    logInfo('Updater', 'Installing update and restarting…');
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
  });

  //   Check for updates after window is ready (only in production) 
  const isDev = !app.isPackaged;
  if (!isDev) {
    // Initial check 5s after launch so the window is fully rendered
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err: Error) =>
        logInfo('Updater', `Check failed: ${err.message}`)
      );
    }, 5000);

    // Then re-check every hour
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err: Error) =>
        logInfo('Updater', `Periodic check failed: ${err.message}`)
      );
    }, 60 * 60 * 1000);
  }
}
