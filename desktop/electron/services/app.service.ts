import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

export interface AppInfo {
  name: string;
  path: string;
  icon?: string | null;  
}

// Concurrency limiter  Runs at most `limit` async tasks simultaneously.
function pLimit(limit: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active < limit && queue.length > 0) {
      active++;
      queue.shift()!();
    }
  };
  return function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
        finally { active--; next(); }
      });
      next();
    });
  };
}

export class AppService {

  public async openApp(appName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`open -a "${appName}"`);
      return { success: true, message: `${appName} opened successfully` };
    } catch (error: any) {
      return { success: false, message: `Failed to open ${appName}: ${error.message}` };
    }
  } 
  public async listApps(): Promise<{ success: boolean; apps?: AppInfo[]; message?: string }> {
    try {
      const searchDirs = [
        '/Applications',
        '~/Applications',
        '/System/Applications', 
      ].join(' -onlyin ');

      const mdfindCmd = `mdfind "kMDItemContentType == 'com.apple.application-bundle'" -onlyin ${searchDirs} 2>/dev/null`;

      const lsCmd = [
        '/Applications',
        '/System/Applications', 
      ]
        .map(d => `ls -d "${d}"/*.app 2>/dev/null`)
        .join('; ');

      const { stdout } = await execAsync(`${mdfindCmd} || (${lsCmd})`);

      const paths = stdout
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.endsWith('.app') && p.length > 0);

      // Deduplicate by name; prefer user /Applications over system copy
      const byName = new Map<string, string>(); // name → path
      for (const p of paths) {
        const name = p.split('/').pop()!.replace(/\.app$/, '');
        if (!name) continue;
        if (!byName.has(name) || p.startsWith('/Applications')) {
          byName.set(name, p);
        }
      }

      const entries = [...byName.entries()].sort(([a], [b]) => a.localeCompare(b));

      // Extract icons with concurrency limit of 12
      const limit = pLimit(12);
      const apps: AppInfo[] = await Promise.all(
        entries.map(([name, appPath]) =>
          limit(async () => ({
            name,
            path: appPath,
            // icon: await this.extractIcon(appPath),
          }))
        )
      );

      return { success: true, apps };
    } catch (error: any) {
      return { success: false, message: `Failed to list apps: ${error.message}` };
    }
  } 
  public async lockScreen(): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(
        'osascript -e \'tell application "System Events" to keystroke "q" using {command down, control down}\''
      );
      return { success: true, message: 'Screen locked' };
    } catch (error: any) {
      return { success: false, message: `Failed to lock screen: ${error.message}` };
    }
  }
 
  public async shutdown(): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(
        'osascript -e \'tell application "System Events" to shut down\''
      );
      return { success: true, message: 'Shutting down' };
    } catch (error: any) {
      return { success: false, message: `Failed to shutdown: ${error.message}` };
    }
  } 
  public async restart(): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(
        'osascript -e \'tell application "System Events" to restart\''
      );
      return { success: true, message: 'Restarting' };
    } catch (error: any) {
      return { success: false, message: `Failed to restart: ${error.message}` };
    }
  }
 
  public async sleep(): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync('pmset sleepnow');
      return { success: true, message: 'Going to sleep' };
    } catch (error: any) {
      return { success: false, message: `Failed to sleep: ${error.message}` };
    }
  }

  public async missionControl(): Promise<{ success: boolean; message: string }> {
    try {
      // osascript is the most reliable way to trigger Mission Control on macOS.
      // robot.keyTap('up', ['control']) does NOT work because macOS requires a
      // low-level CGEvent media key, not a normal key press.
      await execAsync(`osascript -e 'tell application "Mission Control" to launch'`);
      return { success: true, message: 'Mission Control opened' };
    } catch (error: any) {
      return { success: false, message: `Failed to open Mission Control: ${error.message}` };
    }
  }
}

export const appService = new AppService();
 