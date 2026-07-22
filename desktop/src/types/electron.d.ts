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

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  picture: string | null;
  backendToken: string | null;
}

export interface ElectronAPI {
  // Permissions
  getMediaAccessStatus: () => Promise<string>;
  checkAccessibility: () => Promise<boolean>;
  requestAccessibility: () => Promise<boolean>;
  requestRecoading: () => Promise<boolean>;
  checkAutomation: () => Promise<boolean>;
  getAllPermissions: () => Promise<PermissionsStatus>;

  // Commands
  executeCommand: (command: { type: string; payload?: any }) => Promise<CommandResult>;

  // Connection / Device
  getConnectionStatus: () => Promise<boolean>;
  getDeviceInfo: () => Promise<DeviceInfo>;

  // Google Auth
  getAuthState: () => Promise<AuthState>;
  signInWithGoogle: () => Promise<{ success: boolean; authState?: AuthState; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  onAuthStateChanged?: (callback: (state: AuthState) => void) => void;

  hasMasterKey: () => Promise<boolean>;
  setupMasterKey: (password: string) => Promise<{ success: boolean; salt?: string; error?: string }>;
  clearMasterKey: () => Promise<{ success: boolean; error?: string }>;

  // Connected clients
  getConnectedClients: () => Promise<any[]>;

  // WebRTC
  onWebRTCSignaling: (callback: (data: any) => void) => void;
  sendWebRTCSignaling: (data: any) => void;
  onStartWebRTC: (callback: (data: any) => void) => void;
  onStopWebRTC: (callback: () => void) => void;

  // Auto-updater
  onUpdateChecking?: (cb: () => void) => void;
  onUpdateAvailable?: (callback: (info: { version: string; releaseNotes: string }) => void) => void;
  onUpdateNotAvailable?: (cb: () => void) => void;
  onUpdateProgress?: (callback: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => void;
  onUpdateDownloaded?: (callback: (info: { version: string }) => void) => void;
  onUpdateError?: (callback: (err: { message: string }) => void) => void;
  installUpdate?: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
