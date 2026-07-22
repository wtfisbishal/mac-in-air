
export interface Device {
  id: string;
  name: string;
  platform: string;
  arch: string;
  isOnline: boolean;
  user: string;
  ownerEmail: string; // The email of the Google account that registered the device
  masterSalt?: string; // Optional salt for deriving the master key for E2E challenge
  pairingChallenge?: string;
  socketId: string;
  connectedAt: number;
  pairedRooms: Set<string>;
  display: {
    width: number;
    height: number;
    scaleFactor: number;
  };
}

export interface JwtPayload {
  userId: string;  // same as email
  email: string;
  name?: string;
  picture?: string;
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

// Google token verification response shape
export interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  picture?: string;
  aud: string;
}
