
import { ipcMain } from 'electron';
import { commandService, CommandPayload } from '../services/command.service';
import { socketService } from '../services/socket.service';
import { authService } from '../services/auth.service';
import { checkScreenRecordingPermission } from '../permissions/screen-recording';
import { checkAccessibilityPermission } from '../permissions/accessibility';
import { checkAutomationPermission } from '../permissions/automation';

export function setupIpc() {

  // Permissions
  ipcMain.handle('get-media-access-status', () => {
    return checkScreenRecordingPermission();
  });

  ipcMain.handle('request-media-access', async () => {
    const { shell } = require('electron');
    return await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  });

  ipcMain.handle('check-accessibility', () => {
    return checkAccessibilityPermission(false);
  });

  ipcMain.handle('request-accessibility', () => {
    return checkAccessibilityPermission(true);
  });

  ipcMain.handle('check-automation', () => {
    return checkAutomationPermission();
  });

  ipcMain.handle('get-all-permissions', () => {
    return {
      screenRecording: checkScreenRecordingPermission(),
      accessibility: checkAccessibilityPermission(false),
      automation: checkAutomationPermission(),
    };
  });

  // Commands
  ipcMain.handle('execute-command', async (_event, command: CommandPayload) => {
    return await commandService.handleCommand(command);
  });

  // Socket / Connection
  ipcMain.handle('get-connection-status', () => {
    return socketService.isConnected;
  });

  ipcMain.handle('get-device-info', () => {
    const os = require('os');
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      user: os.userInfo().username,
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
    };
  });

  // Auth — Google Sign-In
  ipcMain.handle('auth-get-state', () => {
    return authService.getState();
  });

  ipcMain.handle('auth-sign-in', async () => {
    try {
      const authState = await authService.signInWithGoogle();
      // Connect socket with new credentials
      socketService.reconnectWithAuth();
      return { success: true, authState };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth-sign-out', async () => {
    try {
      socketService.disconnect();
      await authService.signOut();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Master Key
  ipcMain.handle('master-key-has', async () => {
    const { masterKeyService } = require('../services/master-key.service');
    return await masterKeyService.hasMasterKey();
  });

  ipcMain.handle('master-key-setup', async (_event, password: string) => {
    try {
      const { masterKeyService } = require('../services/master-key.service');
      const result = await masterKeyService.setupMasterKey(password);
      
      // Reconnect socket so the new masterSalt is sent to the backend
      socketService.reconnectWithAuth();
      
      return { success: true, salt: result.salt };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('master-key-clear', async () => {
    try {
      const { masterKeyService } = require('../services/master-key.service');
      await masterKeyService.clearMasterKey();
      
      // Reconnect socket to update backend
      socketService.reconnectWithAuth();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Connected web clients
  ipcMain.handle('get-connected-clients', () => {
    return socketService.getConnectedClients();
  });

  // WebRTC Signaling (Renderer -> Main -> Backend)
  ipcMain.on('webrtc-signaling', (event, data) => {
    const socket = socketService.getSocket();
    if (!socket?.connected) return;

    if (data.type === 'offer') {
      socket.emit('webrtc-offer', data);
    } else if (data.type === 'answer') {
      socket.emit('webrtc-answer', data);
    } else if (data.type === 'ice-candidate') {
      socket.emit('webrtc-ice-candidate', data);
    }
  });
}