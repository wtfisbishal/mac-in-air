import { app, BrowserWindow, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { setupIpc } from './ipc';
import { createTray } from './tray';
import { socketService } from '../services/socket.service';
import { powerSaveBlocker } from 'electron';
import { setupUpdater } from '../services/updater.service';

// Register the custom protocol before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true } }
]);

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

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const urlObj = new URL(request.url);
    let pathname = decodeURIComponent(urlObj.pathname);
    
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    let filePath = path.join(__dirname, '../../renderer', pathname);
    
    // If it doesn't exist and has no extension, try appending .html for Next.js App Router exports
    if (!fs.existsSync(filePath) && !path.extname(pathname)) {
      filePath = filePath + '.html';
    }
    
    return net.fetch(pathToFileURL(filePath).toString());
  });

  blockerId = powerSaveBlocker.start('prevent-app-suspension');

  console.log(
    'PowerSaveBlocker started:',
    powerSaveBlocker.isStarted(blockerId)
  );

  setupIpc();
  createTray();
  socketService.connect();

  createWindow();

  // Auto-updater — pass the main window for IPC event forwarding
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
