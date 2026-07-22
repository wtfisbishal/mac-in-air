import crypto from 'crypto';

interface PairTokenEntry {
  token: string;
  deviceId: string;
  issuedAt: number;
}

class PairTokenManager {
  private tokens: Map<string, PairTokenEntry> = new Map();

  // Issue a token for a successfully paired device.
  issueToken(deviceId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.tokens.set(token, {
      token,
      deviceId,
      issuedAt: now,
    });
    console.log(`[PairTokenManager] Token issued for device ${deviceId}`);
    return token;
  }

  validateToken(token: string): PairTokenEntry | null {
    const entry = this.tokens.get(token);
    if (!entry) return null;
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
}

export const pairTokenManager = new PairTokenManager();

