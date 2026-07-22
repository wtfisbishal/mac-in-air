import { io, Socket } from 'socket.io-client';
import { commandService, CommandPayload } from './command.service';
import { screenService } from './screen.service';
import { logInfo, logError, logWarn } from '../utils/logger';
import { machineIdSync } from 'node-machine-id';
import { BACKEND_URL } from '../utils';
import { screen } from 'electron';
import { authService } from './auth.service';
import { masterKeyService } from './master-key.service';
import os from 'os';

export interface WebClient {
  socketId: string;
  connectedAt: number;
}

const KEEP_ALIVE_INTERVAL_MS = 30000;

export class SocketService {
  private socket: Socket | null = null;
  private backendUrl: string = BACKEND_URL;
  private _isConnected: boolean = false;
  private deviceId: string = machineIdSync();
  private connectedClients: WebClient[] = [];
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectWatchdog: ReturnType<typeof setInterval> | null = null;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public connect(url?: string) {
    if (url) this.backendUrl = url;

    const backendToken = authService.getBackendToken();
    const ownerEmail = authService.getEmail();

    if (!backendToken || !ownerEmail) {
      logWarn('SocketService', 'Not connecting — no auth token. Desktop must sign in with Google first.');
      return;
    }

    this.socket = io(this.backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      autoConnect: true,
      timeout: 20000,
      query: { role: 'desktop' },
      // Authenticate with the backend JWT
      auth: { token: backendToken },
    });

    this.startReconnectWatchdog();

    const display = screen.getPrimaryDisplay();

    const announceDevice = async () => {
      const currentOwnerEmail = authService.getEmail();
      if (!currentOwnerEmail) {
        logWarn('SocketService', 'Cannot announce device — no owner email');
        return;
      }

      const payload: any = {
        deviceId: this.deviceId,
        name: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        user: os.userInfo().username,
        ownerEmail: currentOwnerEmail,
        display: {
          width: display.size.width,
          height: display.size.height,
          scaleFactor: display.scaleFactor,
        },
      };

      const hasMaster = await masterKeyService.hasMasterKey();
      if (hasMaster) {
        const challengeData = await masterKeyService.getPairingChallenge(this.deviceId);
        if (challengeData) {
          payload.masterSalt = challengeData.salt;
          payload.pairingChallenge = challengeData.challenge;
        }
      }

      this.socket?.emit('device-online', payload, () => {
        logInfo('SocketService', 'Registered with backend successfully');
      });
    };

    const startKeepAlive = () => {
      this.stopKeepAlive();
      this.keepAliveTimer = setInterval(() => {
        if (this.socket?.connected) {
          this.socket.emit('keep-alive');
        }
      }, KEEP_ALIVE_INTERVAL_MS);
    };

    this.socket.on('connect', () => {
      this._isConnected = true;
      logInfo('SocketService', 'Connected to backend', { id: this.socket?.id });
      announceDevice();
      startKeepAlive();
      console.log('transport:', this.socket?.io.engine.transport.name);
    });

    this.socket.io.engine.on('upgrade', () => {
      console.log('upgraded:', this.socket?.io.engine.transport.name);
    });

    // Handle auth errors from backend
    this.socket.on('auth-error', (data: { message: string }) => {
      logError('SocketService', 'Auth error from backend', data.message);
      this._isConnected = false;
    });

    this.socket.on('disconnect', (reason) => {
      this._isConnected = false;
      logWarn('SocketService', 'Disconnected from backend', { reason });

      if (reason === 'transport close') {
        setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }

      logInfo('SocketService', 'Screen share stopped by disconnecting');
      screenService.stopScreenShare();
    });

    this.socket.on('connect_error', (error) => {
      logError('SocketService', 'Connection error', error.message);
    });

    this.socket.on('reconnect', (attempt: number) => {
      logInfo('SocketService', 'Reconnected to backend', { attempt });
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      logInfo('SocketService', 'Reconnect attempt', { attempt });
    });

    this.socket.on('reconnect_failed', () => {
      logError('SocketService', 'All reconnection attempts failed');
    });

    // Listen for commands from backend
    this.socket.on('command', async (payload: CommandPayload, callback?: (result: any) => void) => {
      logInfo('SocketService', 'Received command', payload);
      const result = await commandService.handleCommand(payload);
      if (callback) {
        callback(result);
      } else {
        this.socket?.emit('command-result', result);
      }
    });

    // Track web client sessions
    this.socket.on('web-client-connected', (data: { socketId: string; connectedAt: number }) => {
      this.connectedClients = this.connectedClients.filter(c => c.socketId !== data.socketId);
      this.connectedClients.push(data);
      logInfo('SocketService', 'Web client connected', data);
    });

    this.socket.on('web-client-disconnected', (data: { socketId: string }) => {
      this.connectedClients = this.connectedClients.filter(c => c.socketId !== data.socketId);
      logInfo('SocketService', 'Web client disconnected', data);
    });

    // Listen for screen share requests
    this.socket.on('screen-share-request', async (data) => {
      logInfo('SocketService', 'Screen share requested', { sessionId: data.sessionId });
      try {
        await screenService.startScreenShare(data.sessionId);
        this.socket?.emit('screen-share-started', { sessionId: data.sessionId, success: true });
      } catch (error) {
        logError('SocketService', 'Failed to start screen share', error);
        this.socket?.emit('screen-share-started', { sessionId: data.sessionId, success: false });
      }
    });

    // Listen for execute actions (during screen share)
    this.socket.on('execute-action', (data) => {
      logInfo('SocketService', 'Action received', data.action.type);
      commandService.handleCommand(data.action);
    });

    // Listen for screen share stop
    this.socket.on('screen-share-stop', (data) => {
      logInfo('SocketService', 'Screen share stopped', { sessionId: data.sessionId });
      screenService.stopScreenShare();

      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows()[0]?.webContents.send('stop-webrtc');
    });

    // WebRTC Signaling from Backend -> Renderer
    this.socket.on('webrtc-offer', (data) => {
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows()[0]?.webContents.send('webrtc-signaling', { type: 'offer', ...data });
    });

    this.socket.on('webrtc-answer', (data) => {
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows()[0]?.webContents.send('webrtc-signaling', { type: 'answer', ...data });
    });

    this.socket.on('webrtc-ice-candidate', (data) => {
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows()[0]?.webContents.send('webrtc-signaling', { type: 'ice-candidate', ...data });
    });
  }

  private startReconnectWatchdog() {
    if (this.reconnectWatchdog) return;

    this.reconnectWatchdog = setInterval(() => {
      if (this.socket && !this.socket.connected) {
        console.log('[SocketService] forcing reconnect');
        this.socket.connect();
      }
    }, 30000);
  }

  public getConnectedClients(): WebClient[] {
    return this.connectedClients;
  }

  public getSocket() {
    return this.socket;
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.stopKeepAlive();
      this.socket.disconnect();
      this._isConnected = false;

      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows()[0]?.webContents.send('stop-webrtc');
    }
  }

  // Reconnect with a fresh token after sign-in
  public reconnectWithAuth() {
    if (this.socket) {
      this.disconnect();
      this.socket = null;
    }
    this.connect();
  }
}

export const socketService = new SocketService();
