import { systemPreferences } from 'electron';
 
// Checks if the application has screen recording permissions on macOS.
// This is required for capturing the desktop stream.
// 
// @returns string indicating permission status ('granted', 'denied', 'restricted', 'unknown', 'not-determined')
 
export function checkScreenRecordingPermission(): string {
  if (process.platform === 'darwin') {
    return systemPreferences.getMediaAccessStatus('screen');
  }
  return 'granted';  
}
