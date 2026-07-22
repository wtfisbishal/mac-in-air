import { Router, Request, Response } from 'express';
import https from 'https';
import { signToken } from '../middleware/auth';
import { GoogleTokenInfo } from '../types';
import { configDotenv } from 'dotenv';

configDotenv();

const router = Router();

// Verify Google idToken using Google's tokeninfo endpoint (no client_secret needed).
function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: `/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error_description || json.error) {
              reject(new Error(`Google token verification failed: ${json.error_description || json.error}`));
              return;
            }
            if (!json.email || !json.sub) {
              reject(new Error('Invalid token: missing email or sub'));
              return;
            }
            // Verify the token is issued for our app
            const validClientIds = [
              process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              process.env.NEXT_PUBLIC_DESKTOP_CLIENT_ID
            ].filter(Boolean);

            if (validClientIds.length > 0 && !validClientIds.includes(json.aud)) {
              reject(new Error('Token audience does not match expected client ID'));
              return;
            }
            resolve(json as GoogleTokenInfo);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// POST /auth/google
// Body: { idToken: string }
// Returns: { token: string, user: { email, name, picture } }
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ message: 'idToken is required' });
    return;
  }

  try {
    const googleUser = await verifyGoogleIdToken(idToken);

    if (googleUser.email_verified !== 'true') {
      res.status(401).json({ message: 'Google account email is not verified' });
      return;
    }

    // Issue our backend JWT — userId = email for simplicity
    const token = signToken({
      userId: googleUser.email,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    console.log(`[Auth] Google sign-in success: ${googleUser.email}`);

    res.json({
      token,
      user: {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name ?? null,
        picture: googleUser.picture ?? null,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Google token verification error:', err.message);
    res.status(401).json({ message: err.message || 'Google authentication failed' });
  }
});

export default router;
