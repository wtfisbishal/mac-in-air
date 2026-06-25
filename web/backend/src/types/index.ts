
export interface Device {
  id: string;
  name: string;
  platform: string;
  arch: string;
  isOnline: boolean;
  user: string,
  socketId: string;
  connectedAt: number;
  pairedRooms: Set<string>;
  display: {
    width: number,
    height: number,
    scaleFactor: number
  }
}

export interface PairingEntry {
  code: string;
  deviceId: string;
  socketId: string;
  createdAt: number;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface CommandPayload {
  type: string;
  payload?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}
