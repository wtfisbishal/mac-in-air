import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { setupIpc } from './ipc';
import { createTray } from './tray';
import { socketService } from '../services/socket.service';
import { powerSaveBlocker } from 'electron';

const isDev = !app.isPackaged;
let blockerId: number;

function createWindow() {
   
  const mainWindow = new BrowserWindow({
  width: 1000,
  height: 600,
  frame: false, // Removes native title bar and borders
  transparent: true, 
  titleBarStyle: 'hidden',
  trafficLightPosition: {
    x: 18,
    y: 18,
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
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }
}

app.whenReady().then(() => {

  blockerId = powerSaveBlocker.start('prevent-app-suspension');

  console.log(
    'PowerSaveBlocker started:',
    powerSaveBlocker.isStarted(blockerId)
  );

  setupIpc();
  createTray();
  socketService.connect();

  createWindow();

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
