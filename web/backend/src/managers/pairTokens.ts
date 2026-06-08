import crypto from 'crypto';

// Token is valid for 15 minutes from the time of pairing.
// It is NOT single-use — the same token can be used to rejoin after a
// page refresh or window close/reopen, as long as it hasn't expired
// and the desktop agent is still online.
// The token is revoked immediately when the desktop agent goes offline.
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface PairTokenEntry {
  token: string;
  deviceId: string;
  issuedAt: number;
  expiresAt: number;
}

class PairTokenManager {
  private tokens: Map<string, PairTokenEntry> = new Map();

  /** Issue a token for a successfully paired device. */
  issueToken(deviceId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.tokens.set(token, {
      token,
      deviceId,
      issuedAt: now,
      expiresAt: now + TOKEN_TTL_MS,
    });
    console.log(`[PairTokenManager] Token issued for device ${deviceId} (expires in 15 min)`);
    return token;
  }

  /**
   * Validate a token. Returns the entry if valid, null if expired or not found.
   * NOT single-use — the token stays valid for repeated joins (page refresh, reconnect).
   */
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

  /**
   * Revoke ALL tokens for a device.
   * Called when the desktop agent goes offline — forces re-pairing.
   */
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

  /** Purge expired tokens (housekeeping). */
  purge(): void {
    const now = Date.now();
    for (const [t, entry] of this.tokens) {
      if (now > entry.expiresAt) this.tokens.delete(t);
    }
  }
}

export const pairTokenManager = new PairTokenManager();

// Housekeeping every 5 minutes
setInterval(() => pairTokenManager.purge(), 5 * 60 * 1000);
