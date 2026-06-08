import { systemPreferences } from 'electron';

 
// Checks if the application has accessibility permissions on macOS.
// This is required for simulating mouse and keyboard events.
// 
//   promptIfMissing If true, prompts the user to grant permission.
//   boolean indicating if permission is granted.
 
export function checkAccessibilityPermission(promptIfMissing = false): boolean {
  if (process.platform === 'darwin') {
    return systemPreferences.isTrustedAccessibilityClient(promptIfMissing);
  }
  return true; // Assume granted on win/linux platforms
}
