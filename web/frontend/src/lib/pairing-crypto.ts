const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN    = 32; // 256-bit key


// Derive a CryptoKey from the user's master password and a hex-encoded salt.
// Uses the same parameters as the desktop (crypto.pbkdf2Sync).

async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const encoder   = new TextEncoder();
  const saltBytes = hexToBytes(saltHex);

  // Import the raw password bytes as a PBKDF2 key
  const keyMaterial = await crypto.subtle.importKey( 'raw', encoder.encode(password),
    { name: 'PBKDF2' },
    false, // not extractable
    ['deriveKey'],
  );

  // Derive a 256-bit HMAC key via PBKDF2
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       saltBytes.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash:       'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: PBKDF2_KEY_LEN * 8 },
    false, // not extractable — key never leaves the browser
    ['sign'],
  );
}


// Compute HMAC-SHA256(derivedKey, deviceId) as a hex string.
// This is the pairing challenge that gets sent to the backend.
async function computeHmac(derivedKey: CryptoKey, deviceId: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'HMAC',
    derivedKey,
    encoder.encode(deviceId),
  );
  return bytesToHex(new Uint8Array(signature));
}


// Full pipeline: password + salt + deviceId → hex HMAC challenge.
// @param saltHex  - Hex-encoded salt from the device's API response
 // @returns hex string to send as `pairingChallenge` in POST /pair

export async function computePairingChallenge(
  password: string,
  saltHex: string,
  deviceId: string,
): Promise<string> {
  if (!password) throw new Error('Master password is required');
  if (!saltHex)  throw new Error('Device salt is missing — device may not have a master key set up');
  if (!deviceId) throw new Error('Device ID is required');

  const key = await deriveKey(password, saltHex);
  const challenge = await computeHmac(key, deviceId);

  console.log(challenge)
  return challenge;
}

//Helpers  

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string (odd length)');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

//
//  Browser-native PBKDF2 + HMAC-SHA256 for zero-trust pairing.
//
//Security model:
//  - The master password is typed in the browser and NEVER sent anywhere.
//  - Key derivation (PBKDF2) happens entirely in-browser via the Web Crypto API.
//  - Only the resulting HMAC-SHA256 hash (hex) is sent to the backend for comparison.
//  - Parameters match the desktop exactly: PBKDF2 / sha-256 / 100_000 iterations / 32 bytes.
//
//Usage:
//  const challenge = await computePairingChallenge(password, saltHex, deviceId);
//  // Send `challenge` to POST /pair  as `pairingChallenge`
//