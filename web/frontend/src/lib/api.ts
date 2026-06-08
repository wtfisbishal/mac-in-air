import type { Device, CommandResult } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rmac_token'); // must match TOKEN_KEY in useAuth.ts
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string) {
  return req<{ token: string; user: { id: string; email: string } }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(email: string, password: string) {
  return req<{ token: string; user: { id: string; email: string } }>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

// ── Devices ───────────────────────────────────────────────────────────────────
export async function fetchDevices(): Promise<Device[]> {
  return req<Device[]>('/devices', { headers: authHeaders() });
}

export async function fetchDevice(id: string): Promise<Device> {
  return req<Device>(`/devices/${id}`, { headers: authHeaders() });
}

// ── Commands ─────────────────────────────────────────────────────────────────
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

// ── Pairing ───────────────────────────────────────────────────────────────────
export async function pairDevice(code: string, frontendSocketId: string) {
  return req<{
    success: boolean;
    device: Device;
  }>('/pair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, frontendSocketId }),
  });
}
