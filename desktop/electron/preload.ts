import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Basic
  ping: () => 'pong',

  // Screen
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),

  // Permissions
  getMediaAccessStatus: () => ipcRenderer.invoke('get-media-access-status'),
  checkAccessibility: () => ipcRenderer.invoke('check-accessibility'),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),
  checkAutomation: () => ipcRenderer.invoke('check-automation'),
  getAllPermissions: () => ipcRenderer.invoke('get-all-permissions'),

  // Commands
  executeCommand: (command: { type: string; payload?: any }) =>
    ipcRenderer.invoke('execute-command', command),

  // Connection / Device
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),

  // Pairing
  getPairingCode: () => ipcRenderer.invoke('get-pairing-code'),
  refreshPairingCode: () => ipcRenderer.invoke('refresh-pairing-code'),

  // Active web sessions
  getConnectedClients: () => ipcRenderer.invoke('get-connected-clients'),
});
