import { execSync } from 'child_process';
 
// Checks if the application has automation permissions on macOS.
// This is typically required to control other applications via AppleScript.
// 
// Note: There is no direct Electron API for this, so we attempt a benign
// AppleScript execution to see if it throws a permission error.
// 
// @returns boolean indicating if permission appears to be granted.
 
export function checkAutomationPermission(): boolean {
  if (process.platform !== 'darwin') {
    return true; // Not applicable on non-macOS
  }
  
  try {
    // Attempt a harmless AppleScript command to check if Apple Events are allowed.
    // Ex :- getting the state of System Events.
    execSync('osascript -e \'tell application "System Events" to return name\'', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}
