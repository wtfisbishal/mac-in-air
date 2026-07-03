//@ts-nocheck
/**
 * Browser Agent — handles browser-related task nodes by sending
 * commands to the desktop Electron agent via Socket.IO.
 *
 * The actual Playwright / browser automation runs on the desktop side;
 * this module simply relays the intent.
 */

import type { TaskNode } from "@/types/task";
import {
  sendDesktopCommand,
  type DesktopCommandResponse,
} from "@/server/socket/desktop-socket";

/**
 * Execute a browser-type task node.
 *
 * Supported actions:
 * - `open_url`   — navigate to a URL
 * - `click`      — click an element by selector
 * - `type_text`  — type text into an element
 * - `navigate`   — go back / forward / reload
 * - `screenshot` — capture the current page
 * - `scroll`     — scroll the page
 * - `wait`       — wait for an element or timeout
 *
 * Any unrecognised action is forwarded as-is so the desktop agent
 * can handle it via its own extensible command set.
 */
export async function browserAgent(
  node: TaskNode,
  deviceId: string
): Promise<DesktopCommandResponse> {
  const params = node.params ?? {};

  switch (node.action) {
    case "open_url":
      return sendDesktopCommand(deviceId, "browser:open_url", {
        url: params.url,
      });

    case "click":
      return sendDesktopCommand(deviceId, "browser:click", {
        selector: params.selector,
        text: params.text, // alternative: click by visible text
      });

    case "type_text":
      return sendDesktopCommand(deviceId, "browser:type", {
        selector: params.selector,
        text: params.text,
      });

    case "fetch_data":
      return sendDesktopCommand(deviceId, "browser:fetch_data", {
        selector: params.selector,
      });

    case "navigate":
      return sendDesktopCommand(deviceId, "browser:navigate", {
        direction: params.direction ?? "back", // "back" | "forward" | "reload"
      });

    case "screenshot":
      return sendDesktopCommand(deviceId, "browser:screenshot", {
        path: params.path,
      });

    case "scroll":
      return sendDesktopCommand(deviceId, "browser:scroll", {
        x: params.x ?? 0,
        y: params.y ?? 300,
      });

    case "wait":
      return sendDesktopCommand(
        deviceId,
        "browser:wait",
        {
          selector: params.selector,
          timeout: params.timeout ?? 5000,
        },
        (params.timeout as number) ?? 10_000
      );

    default:
      // Forward unknown actions — the desktop agent may support them
      return sendDesktopCommand(deviceId, `browser:${node.action}`, params);
  }
}
