import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;
 
export function createTray() {
  // If  don't have an icon yet, electron will fallback or you can use a nativeImage
  const iconPath = path.join(__dirname, '../../public/icon.png');

  try {
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Status: Online', type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
      { label: 'Quit', click: () => { app.quit(); } }
    ]);
 
    tray.setToolTip('MAC in AIR');
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Failed to create tray icon', error);
  }
}
