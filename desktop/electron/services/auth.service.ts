/*
 * Flow:
 *  1. Open the Google OAuth URL in the user's default browser
 *     redirect_uri = https://macinair.bishal.online/desktop-callback
 *  2. Browser authenticates the user
 *  3. Google redirects to the frontend bridge page
 *  4. Bridge page redirects to macinair://callback?code=...
 *  5. OS opens the Desktop app, main.ts catches the URL
 *  6. authService.handleCallbackUrl exchanges code for tokens
 *  7. POST /auth/google { idToken } → backend verifies → backend JWT
 *  8. Persist in electron-store (encrypted via OS keychain / safeStorage)
 */

import { shell, safeStorage } from 'electron';
import * as https from 'https';
import * as url from 'url';
import { BACKEND_URL } from '../utils';
import { logInfo, logError } from '../utils/logger';
import { configDotenv } from 'dotenv';

configDotenv();

// electron-store (ESM)
// Uses Electron's safeStorage (OS keychain) for encryption instead of a hardcoded key.
// safeStorage encrypts via the OS credential store (Keychain on macOS, DPAPI on Windows).
let _store: any = null;

async function getStore() {
  if (_store) return _store;
  const { default: Store } = await import('electron-store');
  const { app } = await import('electron');
  const fs = await import('fs');
  const path = await import('path');

  const storeOptions: Record<string, unknown> = { name: 'auth' };

  // Use safeStorage for encryption if available (requires app to be ready)
  if (safeStorage.isEncryptionAvailable()) {
    // Generate a per-machine encryption key via the OS keychain
    const keyMaterial = safeStorage.encryptString('wia-auth-store-key');
    storeOptions.encryptionKey = keyMaterial.toString('base64');
  } else {
    logError('AuthService', 'safeStorage encryption is not available — auth store will not be encrypted. This is insecure.');
  }

  try {
    _store = new Store(storeOptions);
  } catch (err: any) {
    // Migration: the old store was encrypted with a hardcoded key ('wia-auth-v1').
    // The new safeStorage key can't decrypt it. Delete the corrupt file and retry.
    logError('AuthService', 'Failed to open auth store (likely encrypted with old key). Deleting old store file.', err.message);

    // electron-store saves to {userData}/{name}.json
    const storeFilePath = path.join(app.getPath('userData'), 'auth.json');
    try {
      if (fs.existsSync(storeFilePath)) {
        fs.unlinkSync(storeFilePath);
        logInfo('AuthService', 'Deleted old auth store file', { path: storeFilePath });
      }
    } catch (deleteErr: any) {
      logError('AuthService', 'Failed to delete old store file', deleteErr.message);
    }

    // Retry with a clean slate
    _store = new Store(storeOptions);
  }

  return _store;
}

// Config
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const BACKEND_AUTH_URL = `${BACKEND_URL}/auth/google`;

// Redirect URI points to the frontend bridge page
const REDIRECT_URI = process.env.NEXT_PUBLIC_DESKTOP_CALLBACK_URL;
 

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
].join(' ');

// Types
export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  picture: string | null;
  backendToken: string | null;
}

// Service
class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    email: null,
    name: null,
    picture: null,
    backendToken: null,
  };

  // Restore persisted session from electron-store on app start.
  async initialize(): Promise<void> {
    try {
      const store = await getStore();
      const savedToken = store.get('backendToken') as string | undefined;
      const savedEmail = store.get('email') as string | undefined;
      const savedName = store.get('name') as string | undefined;
      const savedPicture = store.get('picture') as string | undefined;

      if (savedToken && savedEmail) {
        this.authState = {
          isAuthenticated: true,
          email: savedEmail,
          name: savedName ?? null,
          picture: savedPicture ?? null,
          backendToken: savedToken,
        };
        logInfo('AuthService', 'Restored auth state', { email: savedEmail });
      }
    } catch (err) {
      logError('AuthService', 'Failed to initialize auth state', err);
    }
  }

  getState(): AuthState {
    return this.authState;
  }

  getBackendToken(): string | null {
    return this.authState.backendToken;
  }

  getEmail(): string | null {
    return this.authState.email;
  }

  private pendingAuthResolve: ((state: AuthState) => void) | null = null;
  private pendingAuthReject: ((error: Error) => void) | null = null;
  private authTimeout: NodeJS.Timeout | null = null;


// Launch Google sign-in in the user's default browser. Uses a deep link (wininwind://) via a frontend bridge page.

  async signInWithGoogle(): Promise<AuthState> {
    if (!REDIRECT_URI) {
      throw new Error('NEXT_PUBLIC_DESKTOP_CALLBACK_URL is not configured. Cannot start OAuth flow.');
    }

    logInfo('AuthService', `Starting deep-link OAuth flow. Redirect URI: ${REDIRECT_URI}`);

    // Build the Google auth URL
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    return new Promise((resolve, reject) => {
      // Clear any pending auth attempts
      if (this.pendingAuthReject) {
        this.pendingAuthReject(new Error('Sign-in cancelled by a new request.'));
      }

      this.pendingAuthResolve = resolve;
      this.pendingAuthReject = reject;

      // Timeout: cancel if user never completes sign-in
      this.authTimeout = setTimeout(() => {
        this.clearPendingAuth(new Error('Sign-in timed out (5 minutes). Please try again.'));
      }, 5 * 60 * 1000);

      // Open the system browser
      shell.openExternal(authUrl).catch((err) => {
        this.clearPendingAuth(err);
      });
    });
  }

  private clearPendingAuth(error?: Error, state?: AuthState) {
    if (this.authTimeout) clearTimeout(this.authTimeout);
    if (error && this.pendingAuthReject) this.pendingAuthReject(error);
    if (state && this.pendingAuthResolve) this.pendingAuthResolve(state);
    
    this.pendingAuthResolve = null;
    this.pendingAuthReject = null;
    this.authTimeout = null;
  }

  // Called by main.ts when the app catches a wininwind://callback deep link.

  async handleCallbackUrl(callbackUrl: string) {
    logInfo('AuthService', 'Caught deep link callback', { url: callbackUrl });
    
    if (!this.pendingAuthResolve || !this.pendingAuthReject) {
      logError('AuthService', 'Received deep link but no auth is pending.');
      return;
    }

    if (!REDIRECT_URI) {
      this.clearPendingAuth(new Error('REDIRECT_URI not configured'));
      return;
    }

    try {
      const parsedUrl = new url.URL(callbackUrl);
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');

      if (error) {
        throw new Error(`Google OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No auth code received in deep link');
      }

      logInfo('AuthService', 'Code received via deep link, exchanging for tokens...');
      const idToken = await exchangeCodeForIdToken(code, REDIRECT_URI);

      // Decode locally ONLY for UI display (name, picture).
      // The backend will cryptographically verify the idToken — we never trust it client-side.
      const profile = decodeIdToken(idToken);
      
      logInfo('AuthService', 'Profile decoded for display', { email: profile.email });

      // Send the raw idToken to the backend for server-side verification
      const backendToken = await exchangeWithBackend(idToken);

      const newState: AuthState = {
        isAuthenticated: true,
        email: profile.email,
        name: profile.name ?? null,
        picture: profile.picture ?? null,
        backendToken,
      };

      this.authState = newState;

      const store = await getStore();
      store.set('backendToken', backendToken);
      store.set('email', profile.email);
      store.set('name', profile.name ?? '');
      store.set('picture', profile.picture ?? '');

      logInfo('AuthService', 'Sign in complete via deep link', { email: profile.email });

      // Resolve the pending promise inside signInWithGoogle
      this.clearPendingAuth(undefined, newState);

    } catch (err: any) {
      logError('AuthService', 'Deep link callback handling error', err);
      this.clearPendingAuth(err);
    }
  }

  async signOut(): Promise<void> {
    this.authState = {
      isAuthenticated: false,
      email: null,
      name: null,
      picture: null,
      backendToken: null,
    };

    try {
      const store = await getStore();
      store.clear();
      logInfo('AuthService', 'Signed out and cleared store');
    } catch (err) {
      logError('AuthService', 'Sign out error', err);
    }
  }
}

//Helpers
// Exchange an auth code for a Google id_token. Called in the main process — client_secret NEVER touches the renderer.

function exchangeCodeForIdToken(code: string, redirectUri: string): Promise<string> {
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

  const postParams: Record<string, string> = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  if (GOOGLE_CLIENT_SECRET) {
    postParams.client_secret = GOOGLE_CLIENT_SECRET;
  }

  const postData = new url.URLSearchParams(postParams).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.id_token) {
              resolve(json.id_token);
            } else {
              reject(new Error(`No id_token in token response: ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Decode Google JWT id_token payload for local UI display only.
// NOTE: The backend performs cryptographic verification — this is just for extracting
// the user's name/picture to show in the desktop UI immediately.

function decodeIdToken(idToken: string): {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
} {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid id_token format');
  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64url').toString('utf-8')
  );
  if (!payload.email || !payload.sub) {
    throw new Error('Missing email or sub in id_token payload');
  }
  return {
    email: payload.email,
    sub: payload.sub,
    name: payload.name,
    picture: payload.picture,
  };
}

// Exchange Google idToken with our backend for a backend JWT.
// The backend verifies the idToken cryptographically before issuing a JWT.
function exchangeWithBackend(idToken: string): Promise<string> {
  const postData = JSON.stringify({ idToken });

  return new Promise((resolve, reject) => {
    const backendUrlParsed = new url.URL(BACKEND_AUTH_URL);
    const isHttps = backendUrlParsed.protocol === 'https:';
    const mod: typeof https = isHttps ? https : (require('http') as typeof https);

    const req = mod.request(
      {
        hostname: backendUrlParsed.hostname,
        port: backendUrlParsed.port || (isHttps ? 443 : 80),
        path: backendUrlParsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.token) {
              resolve(json.token);
            } else {
              reject(new Error(`Backend auth failed: ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

export const authService = new AuthService();