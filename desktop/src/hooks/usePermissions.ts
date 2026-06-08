import { useState, useEffect } from 'react';

export interface PermissionsState {
  screenRecording: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsState>({
    screenRecording: 'unknown',
  });

  useEffect(() => {
    // Only run in Electron context
    if (typeof window !== 'undefined' && (window as any).electron) {
      const checkPermissions = async () => {
        try {
          const screenStatus = await (window as any).electron.getMediaAccessStatus();
          setPermissions({ screenRecording: screenStatus });
        } catch (error) {
          console.error('Failed to check permissions', error);
        }
      };

      checkPermissions();
      // Poll permissions every 5 seconds if not granted
      const interval = setInterval(checkPermissions, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return permissions;
}
