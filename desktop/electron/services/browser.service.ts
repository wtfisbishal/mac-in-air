/**
 * BrowserService — Native Safari automation via AppleScript for Mac.
 * 
 * IMPORTANT: To use this service, the user MUST enable:
 * "Allow JavaScript from Apple Events" in Safari > Develop Menu.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logInfo, logError } from '../utils/logger';

const execAsync = promisify(exec);
const TAG = 'MacBrowserService';

export class BrowserService {

  // ── Helper ────────────────────────────────────────────────────────────────
  
  /** Run an AppleScript command using osascript */
  private async runAppleScript(script: string): Promise<string> {
    try {
      // Escape single quotes in the script since we wrap the script in single quotes for bash
      const escapedScript = script.replace(/'/g, "'\\''");
      const { stdout } = await execAsync(`osascript -e '${escapedScript}'`);
      return stdout.trim();
    } catch (error: any) {
      if (error.message.includes('Allow JavaScript from Apple Events')) {
        throw new Error("You must enable 'Allow JavaScript from Apple Events' in Safari's Develop menu.");
      }
      throw error;
    }
  }

  /** Run JavaScript inside the active Safari tab */
  private async runSafariJS(js: string): Promise<string> {
    // Escape double quotes and backslashes for AppleScript string literal
    const escapedJS = js.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    const script = `
      tell application "Safari"
        if (count of windows) = 0 then
          return "No Safari window open."
        end if
        do JavaScript "${escapedJS}" in document 1
      end tell
    `;
    return await this.runAppleScript(script);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Navigate to a URL in Safari. */
  async openUrl(url: string): Promise<{ success: boolean; message: string }> {
    try {
      logInfo(TAG, `Navigating to ${url}`);
      const script = `
        tell application "Safari"
          activate
          if (count of windows) = 0 then
            make new document
          end if
          set URL of document 1 to "${url}"
        end tell
      `;
      await this.runAppleScript(script);
      return { success: true, message: `Navigated to ${url}` };
    } catch (err: any) {
      logError(TAG, 'openUrl failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Click a CSS selector using JavaScript injection. */
  async click(selector?: string, x?: number, y?: number): Promise<{ success: boolean; message: string }> {
    try {
      if (selector) {
        logInfo(TAG, `Clicking selector: ${selector}`);
        const js = `
          (function() {
            var el = document.querySelector('${selector}');
            if (el) {
              el.click();
              return 'clicked';
            }
            return 'not found';
          })();
        `;
        
        let res;
        for (let i = 0; i < 15; i++) {
          res = await this.runSafariJS(js);
          if (res === 'clicked') break;
          await new Promise(r => setTimeout(r, 1000)); // poll every 1s
        }
        
        if (res !== 'clicked') throw new Error(`Selector not found: ${selector}`);
      } else if (x != null && y != null) {
        return { success: false, message: 'Coordinate click not supported natively in browser service.' };
      } else {
        return { success: false, message: 'CLICK requires a selector.' };
      }
      return { success: true, message: 'Clicked' };
    } catch (err: any) {
      logError(TAG, 'click failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Type text into a selector using JavaScript injection. */
  async typeText(selector: string, text: string): Promise<{ success: boolean; message: string }> {
    try {
      logInfo(TAG, `Typing "${text}" into ${selector}`);
      // Escape text input to avoid JS syntax errors
      const escapedText = text.replace(/'/g, "\\'").replace(/"/g, '\\"');
      
      const js = `
        (function() {
          var el = document.querySelector('${selector}');
          if (el) {
            el.focus();
            el.value = '${escapedText}';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return 'typed';
          }
          return 'not found';
        })();
      `;
      
      let res;
      for (let i = 0; i < 15; i++) {
        res = await this.runSafariJS(js);
        if (res === 'typed') break;
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (res !== 'typed') throw new Error(`Selector not found: ${selector}`);
      
      return { success: true, message: `Typed "${text}"` };
    } catch (err: any) {
      logError(TAG, 'typeText failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Press a key. Since AppleScript JS can't natively simulate real keypresses well, 
      we map common ones (like Enter) to form submissions or native AppleScript keystrokes. */
  async keyPress(key: string): Promise<{ success: boolean; message: string }> {
    try {
      logInfo(TAG, `Pressing key: ${key}`);
      
      if (key.toLowerCase() === 'enter') {
        const script = `
          tell application "System Events"
            tell application process "Safari"
              set frontmost to true
              keystroke return
            end tell
          end tell
        `;
        await this.runAppleScript(script);
      } else {
        const script = `
          tell application "System Events"
            tell application process "Safari"
              set frontmost to true
              keystroke "${key}"
            end tell
          end tell
        `;
        await this.runAppleScript(script);
      }
      return { success: true, message: `Key pressed: ${key}` };
    } catch (err: any) {
      logError(TAG, 'keyPress failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Scroll the page using JavaScript. */
  async scroll(deltaX: number, deltaY: number): Promise<{ success: boolean; message: string }> {
    try {
      const js = `window.scrollBy(${deltaX}, ${deltaY});`;
      await this.runSafariJS(js);
      return { success: true, message: 'Scrolled' };
    } catch (err: any) {
      logError(TAG, 'scroll failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Wait for a given number of milliseconds. */
  /** Wait for a CSS selector to appear within timeout. */
  async waitForSelector(selector: string, timeout: number = 10000): Promise<{ success: boolean; message: string }> {
    const start = Date.now();
    const jsCheck = `document.querySelector('${selector}') !== null`;
    while (Date.now() - start < timeout) {
      const result = await this.runSafariJS(jsCheck);
      if (result === 'true') {
        return { success: true, message: `Selector '${selector}' found` };
      }
      await new Promise(r => setTimeout(r, 500)); // poll every 500ms
    }
    return { success: false, message: `Selector '${selector}' not found within ${timeout}ms` };
  }

  /** Take a screenshot. */
  async screenshot(): Promise<{ success: boolean; message: string; data?: string }> {
    // Rely on the screenService for full desktop screenshots instead.
    return { success: false, message: 'Not implemented in native browser service.' };
  }

  /** Evaluate arbitrary JS on the page. */
  async evaluate(script: string): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const result = await this.runSafariJS(script);
      return { success: true, message: 'Script evaluated', data: result };
    } catch (err: any) {
      logError(TAG, 'evaluate failed', err);
      return { success: false, message: err.message };
    }
  }

  /** Close Safari. */
  async close(): Promise<void> {
    try {
      const script = `tell application "Safari" to quit`;
      await this.runAppleScript(script);
    } catch { /* ignore */ }
    logInfo(TAG, 'Safari closed');
  }
}

export const browserService = new BrowserService();
