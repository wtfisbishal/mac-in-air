 
import { PairingEntry } from '../types';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

class PairingManager {
  // code → PairingEntry  
  private codes: Map<string, PairingEntry> = new Map();

  // deviceId → code (reverse lookup to avoid duplicate codes per device) */
  private deviceToCode: Map<string, string> = new Map();

  // Generate a unique 6-digit numeric code.
  private generateCode(): string {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.codes.has(code));
    return code;
  }

 // Create (or refresh) a pairing code for a device. Returns the code string.
  createCode(deviceId: string, socketId: string): string {
    // Revoke old code for this device if one exists
    const oldCode = this.deviceToCode.get(deviceId);
    if (oldCode) {
      this.codes.delete(oldCode);
    }

    const code = this.generateCode();
    const now = Date.now();

    const entry: PairingEntry = {
      code,
      deviceId,
      socketId,
      createdAt: now,
      expiresAt: now + CODE_TTL_MS,
    };

    this.codes.set(code, entry);
    this.deviceToCode.set(deviceId, code);

    console.log(`[PairingManager] Code created: ${code} → device ${deviceId}`);
    return code;
  }


   // Look up a code. Returns null if not found or expired.
   
  lookupCode(code: string): PairingEntry | null {
    const entry = this.codes.get(code);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      // Expired — clean up
      this.codes.delete(code);
      this.deviceToCode.delete(entry.deviceId);
      console.log(`[PairingManager] Code expired: ${code}`);
      return null;
    }

    return entry;
  }


  // Consume (delete) a code after successful pairing.

  consumeCode(code: string): PairingEntry | null {
    const entry = this.lookupCode(code);
    if (!entry) return null;

    this.codes.delete(code);
    this.deviceToCode.delete(entry.deviceId);
    console.log(`[PairingManager] Code consumed: ${code} → device ${entry.deviceId}`);
    return entry;
  }

  
  // Get the current code for a device (if still valid).
  
  getCodeForDevice(deviceId: string): string | null {
    const code = this.deviceToCode.get(deviceId);
    if (!code) return null;

    const entry = this.lookupCode(code); // also checks expiry
    return entry ? code : null;
  }


  //Remove all codes for a device (called on disconnect).

  revokeDevice(deviceId: string): void {
    const code = this.deviceToCode.get(deviceId);
    if (code) {
      this.codes.delete(code);
      this.deviceToCode.delete(deviceId);
      console.log(`[PairingManager] Codes revoked for device: ${deviceId}`);
    }
  }


  //Purge all expired codes  

  purgeExpired(): void {
    const now = Date.now();
    for (const [code, entry] of this.codes) {
      if (now > entry.expiresAt) {
        this.codes.delete(code);
        this.deviceToCode.delete(entry.deviceId);
      }
    }
  }
}

export const pairingManager = new PairingManager();

// Purge expired codes every 15 minutes
setInterval(() => pairingManager.purgeExpired(), 15 * 60 * 1000);
