import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// Exchange auth code for Google tokens (server-side — client_secret never leaves server)
function exchangeCodeForIdToken(code: string, redirectUri: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const postData = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }).toString();

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
              reject(new Error(`No id_token in response: ${data}`));
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

// GET /api/auth/callback?code=...&scope=...
// This is the OAuth redirect URI. Exchanges code for id_token, then POSTs to our backend.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const redirectUri = process.env.NEXT_PUBLIC_FRONTEND_CALLBACK_URL || '';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  if (error) {
    return NextResponse.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${frontendOrigin}/login?error=no_code`);
  }

  try {
    // Exchange code for id_token server-side (client_secret stays safe)
    const idToken = await exchangeCodeForIdToken(code, redirectUri);

    // Send id_token to our backend for verification and JWT issuance
    const backendRes = await fetch(`${backendUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!backendRes.ok) {
      const body = await backendRes.json().catch(() => ({ message: 'Backend auth failed' }));
      throw new Error(body.message || 'Backend auth failed');
    }

    const data = await backendRes.json() as {
      token: string;
      user: { id: string; email: string; name?: string | null; picture?: string | null };
    };

    // Redirect to frontend with token data embedded as URL params
    // The login page will pick these up and store in localStorage
    const redirectUrl = new URL(`${frontendOrigin}/auth-complete`);
    redirectUrl.searchParams.set('token', data.token);
    redirectUrl.searchParams.set('user', JSON.stringify(data.user));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error('[Auth Callback] Error:', err.message);
    return NextResponse.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
  }
}
