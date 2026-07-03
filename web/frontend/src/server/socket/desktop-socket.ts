/**
 * Desktop Socket — sends commands to the Electron desktop agent
 * via the backend's REST API.
 *
 * The backend at NEXT_PUBLIC_API_URL already handles routing
 * commands to the correct desktop agent via its own Socket.IO
 * connection. We simply POST to `/devices/:deviceId/commands`.
 *
 * This replaces the earlier direct-socket approach which couldn't
 * work because the server-side socket wasn't joined to any device room.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesktopCommandResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Backend URL
// ---------------------------------------------------------------------------

function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a command to the desktop Electron agent for the given device.
 *
 * Routes through the backend REST API:
 *   POST {BACKEND}/devices/{deviceId}/commands
 *   Body: { type, payload }
 *
 * @param deviceId  The target device identifier.
 * @param action    The command type / action name (e.g. "OPEN_APP", "computer:open_app").
 * @param params    Arbitrary parameters for the action.
 * @param timeoutMs How long to wait before aborting (default 30 s).
 */
export async function sendDesktopCommand(
  deviceId: string,
  action: string,
  params?: Record<string, unknown>,
  timeoutMs = 30_000
): Promise<DesktopCommandResponse> {
  const url = `${getBackendUrl()}/devices/${deviceId}/commands`;

  // Map agent-prefixed actions to the backend's command types
  // e.g. "computer:open_app" → type "OPEN_APP", payload { app: "Safari" }
  const { type, payload } = mapActionToCommand(action, params);

  console.log(`[DesktopSocket] POST ${url} → type=${type}`, payload);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: (data as { message?: string }).message ?? `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      data,
      message: (data as { message?: string }).message,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        `Desktop command timed out after ${timeoutMs}ms: ${action} → device ${deviceId}`
      );
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Action → Command mapping
// ---------------------------------------------------------------------------

/**
 * Convert agent-prefixed action names into the backend's command format.
 *
 * The control page sends commands like:
 *   emit('command', { type: 'OPEN_APP', payload: { app: 'Terminal' } })
 *
 * Our agents produce:
 *   sendDesktopCommand(deviceId, 'computer:open_app', { app: 'Terminal' })
 *
 * This function bridges the two conventions.
 */
function mapActionToCommand(
  action: string,
  params?: Record<string, unknown>
): { type: string; payload: Record<string, unknown> } {
  const payload = params ?? {};

  // Strip agent prefix if present (e.g. "computer:open_app" → "open_app")
  const stripped = action.includes(":") ? action.split(":")[1] : action;

  // Convert snake_case to UPPER_SNAKE_CASE to match the backend convention
  const type = stripped.toUpperCase();

  return { type, payload };
}
