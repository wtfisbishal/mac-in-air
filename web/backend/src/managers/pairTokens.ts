import crypto from 'crypto';

 
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PairTokenEntry {
  token: string;
  deviceId: string;
  issuedAt: number;
  expiresAt: number;
}

class PairTokenManager {
  private tokens: Map<string, PairTokenEntry> = new Map();

  //  Issue a token for a successfully paired device.
  issueToken(deviceId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.tokens.set(token, {
      token,
      deviceId,
      issuedAt: now,
      expiresAt: now + TOKEN_TTL_MS,
    });
    console.log(`[PairTokenManager] Token issued for device ${deviceId} (expires in 30 min)`);
    return token;
  }

  validateToken(token: string): PairTokenEntry | null {
    const entry = this.tokens.get(token);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.tokens.delete(token);
      console.warn(`[PairTokenManager] Token expired for device ${entry.deviceId}`);
      return null;
    }

    return entry;
  }

 
  revokeDevice(deviceId: string): void {
    let count = 0;
    for (const [t, entry] of this.tokens) {
      if (entry.deviceId === deviceId) {
        this.tokens.delete(t);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[PairTokenManager] Revoked ${count} token(s) for device ${deviceId}`);
    }
  }
 
  purge(): void {
    const now = Date.now();
    for (const [t, entry] of this.tokens) {
      if (now > entry.expiresAt) this.tokens.delete(t);
    }
  }
}

export const pairTokenManager = new PairTokenManager();

// Housekeeping every 30 minutes
setInterval(() => pairTokenManager.purge(), 30 * 60 * 1000);
