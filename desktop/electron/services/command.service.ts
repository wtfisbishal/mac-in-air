
//@ts-nocheck
import { mouseService } from './mouse.service';
import { keyboardService } from './keyboard.service';
import { appService } from './app.service';
import { screenService } from './screen.service';
import { fileService } from './file.service';
import { browserService } from './browser.service';
import { logInfo, logError } from '../utils/logger';

export interface CommandPayload {
  type: string;
  payload?: any;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class CommandService {
  public async handleCommand(command: CommandPayload): Promise<CommandResult> {
    logInfo('CommandService', `Executing command: ${command.type}`, command.payload);

    try {
      switch (command.type) {
        // App commands
        case 'LIST_APPS': {
          const result = await appService.listApps();
          return { success: result.success, message: result.message ?? 'Apps listed', data: result.apps };
        }

        case 'OPEN_APP':
          return await appService.openApp(command.payload?.app);

        case 'SHUTDOWN':
          return await appService.shutdown();

        case 'RESTART':
          return await appService.restart();

        case 'LOCK_SCREEN':
          return await appService.lockScreen();

        case 'SLEEP':
          return await appService.sleep();

        case 'MISSION_CONTROL':
          return await appService.missionControl();

        //  Mouse commands 
        case 'MOUSE_MOVE':
          if (command.payload?.x != null && command.payload?.y != null) {
            await mouseService.moveMouse(command.payload.x, command.payload.y);
            return { success: true, message: 'Mouse moved' };
          }
          return { success: false, message: 'Missing x/y coordinates' };

        case 'MOUSE_CLICK':
          await mouseService.clickMouse(command.payload?.button, command.payload?.doubleClick);
          return { success: true, message: 'Mouse clicked' };

        case 'MOUSE_SCROLL':
          if (command.payload?.x != null && command.payload?.y != null) {
            await mouseService.scrollMouse(command.payload.x, command.payload.y);
            return { success: true, message: 'Mouse scrolled' };
          }
          return { success: false, message: 'Missing scroll values' };

        case 'MOUSE_DOWN':
          await mouseService.toggleMouse('down', command.payload?.button);
          return { success: true, message: 'Mouse down' };

        case 'MOUSE_UP':
          await mouseService.toggleMouse('up', command.payload?.button);
          return { success: true, message: 'Mouse up' };

        case 'MOUSE_DRAG':
          if (command.payload?.x != null && command.payload?.y != null) {
            await mouseService.dragMouse(command.payload.x, command.payload.y);
            return { success: true, message: 'Mouse dragged' };
          }
          return { success: false, message: 'Missing coordinates' };

        //  Keyboard commands 
        case 'KEYBOARD_TYPE':
          if (command.payload?.text) {
            await keyboardService.typeString(command.payload.text);
            return { success: true, message: 'Text typed' };
          }
          return { success: false, message: 'Missing text' };

        case 'KEYBOARD_SHORTCUT':
          if (command.payload?.key) {
            await keyboardService.keyTap(command.payload.key, command.payload.modifier);
            return { success: true, message: 'Key tapped' };
          }
          return { success: false, message: 'Missing key' };

        //  Screen commands  
        // case 'SCREENSHOT':
        //   const sources = await screenService.getScreenSources();
        //   return { success: true, message: 'Screenshot captured', data: sources };

        // ── Browser automation (Playwright) ──────────────────────────────
        case 'OPEN_URL':
        case 'NAVIGATE': {
          const url = command.payload?.url as string | undefined;
          if (!url) return { success: false, message: 'Missing url' };
          return await browserService.openUrl(url);
        }

        case 'CLICK': {
          const sel = command.payload?.selector as string | undefined;
          const cx  = command.payload?.x as number | undefined;
          const cy  = command.payload?.y as number | undefined;
          return await browserService.click(sel, cx, cy);
        }

        case 'TYPE_TEXT': {
          const sel  = command.payload?.selector as string | undefined;
          const text = command.payload?.text as string | undefined;
          if (!sel || !text) return { success: false, message: 'Missing selector or text' };
          return await browserService.typeText(sel, text);
        }

        case 'KEY_PRESS_BROWSER': {
          const key = command.payload?.key as string | undefined;
          if (!key) return { success: false, message: 'Missing key' };
          return await browserService.keyPress(key);
        }

        case 'SCROLL': {
          const dx = (command.payload?.x as number) ?? 0;
          const dy = (command.payload?.y as number) ?? 300;
          return await browserService.scroll(dx, dy);
        }

        case 'WAIT': {
          const ms = (command.payload?.ms as number) ?? 1000;
          return await browserService.wait(ms);
        }

        case 'BROWSER_SCREENSHOT':
          return await browserService.screenshot();

        case 'FETCH_DATA': {
          // Expected payload: { selector }
          const sel = command.payload?.selector as string | undefined;
          if (!sel) return { success: false, message: 'Missing selector for fetch_data' };
          return await browserService.fetchData(sel);
        }

        case 'BROWSER_EVAL': {
          const script = command.payload?.script as string | undefined;
          if (!script) return { success: false, message: 'Missing script' };
          return await browserService.evaluate(script);
        }

        case 'BROWSER_CLOSE':
          await browserService.close();
          return { success: true, message: 'Browser closed' };

        case 'FILE_READ':
          if (command.payload?.path) {
            const content = await fileService.readFile(command.payload.path);
            return { success: true, message: 'File read', data: content };
          }
          return { success: false, message: 'Missing file path' };

        case 'FILE_WRITE':
          if (command.payload?.path && command.payload?.content) {
            await fileService.writeFile(command.payload.path, command.payload.content);
            return { success: true, message: 'File written' };
          }
          return { success: false, message: 'Missing file path or content' };

        case 'FILE_DELETE':
          if (command.payload?.path) {
            await fileService.deleteFile(command.payload.path);
            return { success: true, message: 'File deleted' };
          }
          return { success: false, message: 'Missing file path' };

        default:
          logError('CommandService', `Unknown command type: ${command.type}`);
          return { success: false, message: `Unknown command: ${command.type}` };
      }
    } catch (error: any) {
      logError('CommandService', `Failed to execute ${command.type}`, error);
      return { success: false, message: error.message || 'Command execution failed' };
    }
  }
}

export const commandService = new CommandService();
