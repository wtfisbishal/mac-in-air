import crypto from 'crypto';

const TOKEN_TTL_MS = 60 * 1000; // 60 seconds — enough to navigate and connect

interface PairTokenEntry {
  token: string;
  deviceId: string;
  frontendSocketId: string;
  expiresAt: number;
}

class PairTokenManager {
  private tokens: Map<string, PairTokenEntry> = new Map();


   // Issue a one-time token for a successfully paired (deviceId, frontendSocketId).
   
  issueToken(deviceId: string, frontendSocketId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokens.set(token, {
      token,
      deviceId,
      frontendSocketId,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });
    console.log(`[PairTokenManager] Token issued for device ${deviceId} socket ${frontendSocketId}`);
    return token;
  }
 
   // Consume (single-use) a token. Returns the entry or null if invalid/expired.
   // The token is deleted after first use.
    
  consumeToken(token: string, claimingSocketId: string): PairTokenEntry | null {
    const entry = this.tokens.get(token);
    if (!entry) return null;

    // Always delete — prevent replay
    this.tokens.delete(token);

    if (Date.now() > entry.expiresAt) {
      console.warn(`[PairTokenManager] Token expired for device ${entry.deviceId}`);
      return null;
    }

    // The socket that is claiming the token must match the one that paired
    if (entry.frontendSocketId !== claimingSocketId) {
      console.warn(
        `[PairTokenManager] Socket mismatch: expected ${entry.frontendSocketId}, got ${claimingSocketId}`
      );
      return null;
    }

    return entry;
  }

  // Purge stale tokens (called periodically).  
  purge(): void {
    const now = Date.now();
    for (const [t, entry] of this.tokens) {
      if (now > entry.expiresAt) this.tokens.delete(t);
    }
  }
}

export const pairTokenManager = new PairTokenManager();

// Housekeeping every 15 minutes
setInterval(() => pairTokenManager.purge(), 15 * 60 * 1000);
