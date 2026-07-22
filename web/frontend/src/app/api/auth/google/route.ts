import { redirect } from 'next/navigation';

// GET /api/auth/google — redirects browser to Google OAuth consent screen
export function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_FRONTEND_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({ error: 'OAuth not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ].join(' ');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=select_account`;

  return redirect(authUrl);
}
