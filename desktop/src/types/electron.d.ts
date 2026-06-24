export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
}

export interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface PermissionsStatus {
  screenRecording: string;
  accessibility: boolean;
  automation: boolean;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ElectronAPI {
  ping: () => string;
  // getDesktopSources: () => Promise<DesktopSource[]>;
  getMediaAccessStatus: () => Promise<string>;
  checkAccessibility: () => Promise<boolean>;
  requestAccessibility: () => Promise<boolean>;
  checkAutomation: () => Promise<boolean>;
  getAllPermissions: () => Promise<PermissionsStatus>;
  executeCommand: (command: { type: string; payload?: any }) => Promise<CommandResult>;
  getConnectionStatus: () => Promise<boolean>;
  getDeviceInfo: () => Promise<DeviceInfo>;
  getPairingCode: () => Promise<string | null>;
  refreshPairingCode: () => Promise<string | null>;
  getConnectedClients: () => Promise<any[]>;
  onWebRTCSignaling: (callback: (data: any) => void) => void;
  sendWebRTCSignaling: (data: any) => void;
  onStartWebRTC: (callback: (data: any) => void) => void;
  onStopWebRTC: (callback: () => void) => void;

  onUpdateAvailable:? (callback: (info: { version: string; releaseNotes: string }) => void) => void;
  onUpdateProgress:? (callback: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => void;
  onUpdateDownloaded:? (callback: (info: { version: string }) => void) => void;
  onUpdateError:? (callback: (err: { message: string }) => void) => void;
  installUpdate:? () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
