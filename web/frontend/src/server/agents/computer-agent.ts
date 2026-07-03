/**
 * Computer Agent — handles OS-level task nodes by sending desktop
 * control commands to the Electron agent via Socket.IO.
 *
 * This covers mouse, keyboard, app launching, file operations,
 * and arbitrary shell commands on the remote Mac.
 */

import type { TaskNode } from "@/types/task";
import {
  sendDesktopCommand,
  type DesktopCommandResponse,
} from "@/server/socket/desktop-socket";

/**
 * Execute a computer-type task node.
 *
 * Supported actions:
 * - `mouse_click`   — click at coordinates
 * - `mouse_move`    — move the cursor
 * - `key_press`     — press a key / key combo
 * - `type_text`     — type a string via keyboard
 * - `open_app`      — launch a macOS application
 * - `save_file`     — save / move a file
 * - `run_command`   — execute a shell command
 * - `screenshot`    — capture the screen
 *
 * Unrecognised actions are forwarded as-is.
 */
export async function computerAgent(
  node: TaskNode,
  deviceId: string
): Promise<DesktopCommandResponse> {
  const params = node.params ?? {};

  switch (node.action) {
    case "mouse_click":
      return sendDesktopCommand(deviceId, "computer:mouse_click", {
        x: params.x,
        y: params.y,
        button: params.button ?? "left",
        doubleClick: params.doubleClick ?? false,
      });

    case "mouse_move":
      return sendDesktopCommand(deviceId, "computer:mouse_move", {
        x: params.x,
        y: params.y,
      });

    case "key_press":
      return sendDesktopCommand(deviceId, "computer:key_press", {
        key: params.key,
        modifiers: params.modifiers ?? [],
      });

    case "type_text":
      return sendDesktopCommand(deviceId, "computer:type_text", {
        text: params.text,
      });

    case "open_app":
      return sendDesktopCommand(deviceId, "computer:open_app", {
        app: params.app,
      });

    case "save_file":
      return sendDesktopCommand(deviceId, "computer:save_file", {
        sourcePath: params.sourcePath,
        destinationPath: params.destinationPath ?? params.path,
      });

    case "run_command":
      return sendDesktopCommand(
        deviceId,
        "computer:run_command",
        {
          command: params.command,
          args: params.args ?? [],
        },
        60_000 // shell commands may take longer
      );

    case "screenshot":
      return sendDesktopCommand(deviceId, "computer:screenshot", {
        path: params.path,
      });

    default:
      return sendDesktopCommand(
        deviceId,
        `computer:${node.action}`,
        params
      );
  }
}
