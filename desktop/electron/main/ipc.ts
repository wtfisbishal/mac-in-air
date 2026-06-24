
import { ipcMain } from 'electron';
import { screenService } from '../services/screen.service';
import { commandService, CommandPayload } from '../services/command.service';
import { socketService } from '../services/socket.service';
import { checkScreenRecordingPermission } from '../permissions/screen-recording';
import { checkAccessibilityPermission } from '../permissions/accessibility';
import { checkAutomationPermission } from '../permissions/automation';
import { logInfo } from '../utils/logger';

export function setupIpc() {
  logInfo('IPC', 'Setting up IPC handlers');

  //   Screen 
  // ipcMain.handle('get-desktop-sources', async () => {
  //   return await screenService.getScreenSources();
  // });

  //  Permissions 
  ipcMain.handle('get-media-access-status', () => {
    return checkScreenRecordingPermission();
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

  //  Commands 
  ipcMain.handle('execute-command', async (_event, command: CommandPayload) => {
    return await commandService.handleCommand(command);
  });

  //  Socket / Connection 
  ipcMain.handle('get-connection-status', () => {
    return socketService.isConnected;
  });

  ipcMain.handle('get-device-info', () => {
    const os = require('os');
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      user:os.userInfo().username,
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
    };
  });

  //  Pairing 
  ipcMain.handle('get-pairing-code', async () => {
    return await socketService.getPairingCode();
  });

  ipcMain.handle('refresh-pairing-code', async () => {
    return await socketService.refreshPairingCode();
  });

  //  Connected web clients 
  ipcMain.handle('get-connected-clients', () => {
    return socketService.getConnectedClients();
  });

  //  WebRTC Signaling (Renderer -> Main -> Backend)
  ipcMain.on('webrtc-signaling', (event, data) => {
    const socket = socketService.getSocket();
    if (!socket?.connected) return;

    if (data.type === 'offer') {
      socket.emit('webrtc-offer', data);
    } else if (data.type === 'answer') {
      socket.emit('webrtc-answer', data);
    } else if (data.type === 'ice-candidate') {
        //  if (!event?.candidate) return;   // important
      socket.emit('webrtc-ice-candidate', data);
    }
  });
}