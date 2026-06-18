import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  
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

  // WebRTC
  onWebRTCSignaling: (callback: (data: any) => void) => {
    ipcRenderer.on('webrtc-signaling', (_event, data) => callback(data));
  },
  sendWebRTCSignaling: (data: any) => ipcRenderer.send('webrtc-signaling', data),
  onStartWebRTC: (callback: (data: any) => void) => {
    ipcRenderer.on('start-webrtc', (_event, data) => callback(data));
  },
  onStopWebRTC: (callback: () => void) => {
    ipcRenderer.on('stop-webrtc', () => callback());
  },

  // Auto-updater
  onUpdateChecking: (cb: () => void) =>
    ipcRenderer.on('update-checking', () => cb()),
  onUpdateAvailable: (cb: (info: { version: string; releaseNotes?: any }) => void) =>
    ipcRenderer.on('update-available', (_e, info) => cb(info)),
  onUpdateNotAvailable: (cb: () => void) =>
    ipcRenderer.on('update-not-available', () => cb()),
  onUpdateProgress: (cb: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) =>
    ipcRenderer.on('update-progress', (_e, p) => cb(p)),
  onUpdateDownloaded: (cb: (info: { version: string }) => void) =>
    ipcRenderer.on('update-downloaded', (_e, info) => cb(info)),
  onUpdateError: (cb: (err: { message: string }) => void) =>
    ipcRenderer.on('update-error', (_e, err) => cb(err)),
  installUpdate: () => ipcRenderer.invoke('install-update'),
});
