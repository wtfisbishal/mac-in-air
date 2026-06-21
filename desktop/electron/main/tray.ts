import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';
 
let tray: Tray | null = null;

export function createTray() {
  const iconPath = path.join(app.getAppPath(), 'assets/icons/logo.png');
 
  try {
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 19, height: 19 });
    tray = new Tray(icon); 
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'MAC in AIR', 
        enabled: false,
        icon: icon
      },
      { type: 'separator' },
      // { 
      //   label: `${ conntected ?'Conntected to server':'Disconntected '}`, 
      //   type: 'normal', 
      //   enabled: false,
      //  },
      // { type: 'separator' },
      { 
        label: 'Open Mac in Air', 
        click: () => { 
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
       }, 
      { type: 'separator' },
      {
        label: 'Open at Login',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked });
        }
      },
      {
        label: 'Show in Dock',
        type: 'checkbox',
        checked: app.dock ? app.dock.isVisible() : false,
        click: (item) => {
          if (app.dock) {
            item.checked ? app.dock.show() : app.dock.hide();
          }
        }
      },
      { type: 'separator' },
      { 
        label: 'Restart app', 
        click: () => { app.relaunch(); app.exit(0); },
       },
      { 
        label: 'Quit', 
        accelerator: 'CmdOrCtrl+Q',
        click: () => { app.quit(); },
       }
    ]);

    tray.setToolTip('MAC in AIR');
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Failed to create tray icon', error);
  }
}
