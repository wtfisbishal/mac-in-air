export interface Device {
  id: string;
  name: string;
  platform: string;
  arch: string;
  isOnline: boolean;
  connectedAt: number;
  user:string
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ScreenFrame {
  sessionId: string;
  frame: ArrayBuffer | string;
  width: number;
  height: number;
}
 

export interface Action {
  label: string;
  icon: React.ElementType;
  type: string;
  payload?: Record<string, unknown>;
  variant?: 'default' | 'danger';
}

export type ToastKind = 'success' | 'error' | 'info';
