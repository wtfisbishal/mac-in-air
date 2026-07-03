/**
 * API Agent — handles task nodes that make direct HTTP requests
 * from the server.
 *
 * Unlike browser / computer agents, these don't relay through
 * the desktop Electron app — they run server-side using `fetch`.
 */

import type { TaskNode } from "@/types/task";
import type { DesktopCommandResponse } from "@/server/socket/desktop-socket";

/**
 * Execute an API-type task node.
 *
 * Supported actions:
 * - `http_request` — make an arbitrary HTTP request
 * - `fetch_data`   — shorthand GET request
 *
 * Unrecognised actions are treated as GET requests to `params.url`.
 */
export async function apiAgent(
  node: TaskNode
): Promise<DesktopCommandResponse> {
  const params = node.params ?? {};

  switch (node.action) {
    case "http_request": {
      const url = params.url as string | undefined;
      if (!url) {
        throw new Error(`API agent: "http_request" requires a "url" param.`);
      }

      const method = ((params.method as string) ?? "GET").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((params.headers as Record<string, string>) ?? {}),
      };

      const init: RequestInit = { method, headers };
      if (params.body && method !== "GET" && method !== "HEAD") {
        init.body =
          typeof params.body === "string"
            ? params.body
            : JSON.stringify(params.body);
      }

      const res = await fetch(url, init);
      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}: ${typeof data === "string" ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200)}`,
        };
      }

      return { success: true, data };
    }

    case "fetch_data": {
      const url = params.url as string | undefined;
      if (!url) {
        throw new Error(`API agent: "fetch_data" requires a "url" param.`);
      }

      const res = await fetch(url);
      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}`,
          data,
        };
      }

      return { success: true, data };
    }

    default: {
      // Treat as a GET request if url is provided
      const url = params.url as string | undefined;
      if (!url) {
        throw new Error(
          `API agent: unrecognised action "${node.action}" and no "url" param provided.`
        );
      }
      const res = await fetch(url);
      const data = await res.text();
      return { success: res.ok, data };
    }
  }
}
