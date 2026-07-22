import type { Device, CommandResult } from '@/types';

export const URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rmac_token');
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${URL}${url}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// Exchange a Google idToken for a backend JWT
export async function apiGoogleAuth(idToken: string) {
  return req<{ token: string; user: { id: string; email: string; name?: string | null; picture?: string | null } }>(
    '/auth/google',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
}

export async function fetchDevices(): Promise<Device[]> {
  return req<Device[]>('/devices', { headers: authHeaders() });
}

export async function fetchDevice(id: string): Promise<Device> {
  return req<Device>(`/devices/${id}`, { headers: authHeaders() });
}

export async function sendCommand(
  deviceId: string,
  type: string,
  payload?: Record<string, unknown>
): Promise<CommandResult> {
  return req<CommandResult>(`/devices/${deviceId}/commands`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ type, payload }),
  });
}

// Join a device using pairingChallenge (for Master Key)
export async function apiPairDevice(deviceId: string, pairingChallenge: string): Promise<{ success: boolean; pairToken: string; message?: string }> {
  return req<{ success: boolean; pairToken: string; message?: string }>('/pair', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ deviceId, pairingChallenge }),
  });
}
