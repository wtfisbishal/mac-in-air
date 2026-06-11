
import { io, Socket } from 'socket.io-client';
import { commandService, CommandPayload } from './command.service';
import { screenService } from './screen.service';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface WebClient {
  socketId: string;
  connectedAt: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';
// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://mac-in-wind.onrender.com';

// How often (ms) to send a lightweight ping to prevent Render's 30-s idle timeout
const KEEP_ALIVE_INTERVAL_MS = 30000;

export class SocketService {
  private socket: Socket | null = null;
  private backendUrl: string = BACKEND_URL;
  private _isConnected: boolean = false;
  private pairingCode: string | null = null;
  private deviceId: string = 'mac-01';
  private connectedClients: WebClient[] = [];
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;


  private reconnectWatchdog: ReturnType<typeof setInterval> | null = null;


  public get isConnected(): boolean {
    return this._isConnected;
  }

  public connect(url?: string) {
    if (url) this.backendUrl = url;

    this.socket = io(this.backendUrl, {
      // Start with polling (works everywhere incl. Render), then upgrade to WS
      transports: ['websocket','polling'],
      // Reconnection — retry forever so the desktop auto-recovers from Render sleep
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      autoConnect: true,
      timeout: 20000,
      query: { role: 'desktop' }, // tells backend to route to setupDesktopHandlers
    });

    this.startReconnectWatchdog();

    // ── helpers ──────────────────────────────────────────────────────────────
    const announceDevice = () => {
      this.socket?.emit(
        'device-online',
        {
          deviceId: this.deviceId,
          name: require('os').hostname(),
          platform: process.platform,
          arch: process.arch,
          user: require('os').userInfo().username,
        },
        () => {
          // device-online acknowledged — safe to request pairing code
          // this.requestPairingCode();
        }
      );
    };

    const startKeepAlive = () => {
      this.stopKeepAlive();
      this.keepAliveTimer = setInterval(() => {
        if (this.socket?.connected) {
          // Lightweight ping — the server will just ignore unknown events,
          // but it's enough traffic to reset Render's 30-s idle timer.
          this.socket.emit('keep-alive');
        }
      }, KEEP_ALIVE_INTERVAL_MS);
    };

    // ── connect ──────────────────────────────────────────────────────────────
    this.socket.on('connect', () => {
      this._isConnected = true;
      this.pairingCode = null; // reset so reconnects always fetch a fresh code
      logInfo('SocketService', 'Connected to backend', { id: this.socket?.id });
      announceDevice();
      startKeepAlive();

      console.log('transport:', this.socket?.io.engine.transport.name);
    });

    this.socket.io.engine.on('upgrade', () => {
      console.log(
        'upgraded:',
        this.socket?.io.engine.transport.name
      );
    });

   
    this.socket.on('disconnect', (reason) => {
      this._isConnected = false;

      logWarn('SocketService', 'Disconnected from backend', { reason });

      if (reason === 'transport close') {
        setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }

       logInfo('SocketService', 'Screen share stopped by disconnecting ',  );
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

    //  Listen for commands from backend  
    this.socket.on('command', async (payload: CommandPayload, callback?: (result: any) => void) => {
      logInfo('SocketService', 'Received command', payload);
      const result = await commandService.handleCommand(payload);
      logInfo('SocketService', 'Command result', result);

      // Send result back to backend
      if (callback) {
        callback(result);
      } else {
        this.socket?.emit('command-result', result);
      }
    });

    // Listen for pairing completion 
    this.socket.on('pairing-complete', (data) => {
      logInfo('SocketService', 'Device pairing complete', data);
      this.pairingCode = null;
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

    //  Listen for screen share requests 
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

    //  Listen for execute actions (during screen share) 
    this.socket.on('execute-action', (data) => {
      logInfo('SocketService', 'Action received', data.action.type);
      // Actions will be executed based on type (mouse, keyboard, etc)
      commandService.handleCommand(data.action);
    });

    //  Listen for screen share stop 
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
//After Offer/Answer exchange, peers still need to discover network paths.
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
 
  public async getPairingCode(): Promise<string | null> {
    // If we already have a code cached, return it immediately
    if (this.pairingCode) {
      return this.pairingCode;
    }

    if (!this.socket) {
      return null;
    }

    // Wait up to 3s  if not  connected
    if (!this.socket.connected) {
      await new Promise<void>((resolve) => {
        this.socket?.once('connect', resolve);
        setTimeout(resolve, 3000);
      });
    }

    if (!this.socket.connected) {
      return null;
    }

    // Request directly from backend
    return new Promise<string | null>((resolve) => {
      this.socket!.timeout(5000).emit(
        'request-pairing-code',
        { deviceId: this.deviceId },
        (err: Error | null, response: any) => {
          if (err) {
            logError('SocketService', 'getPairingCode timed out', err.message);
            resolve(null);
            return;
          }
          if (response?.success) {
            this.pairingCode = response.code;
            logInfo('SocketService', 'Got pairing code on demand', { code: response.code });
            resolve(response.code);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  public async refreshPairingCode(): Promise<string | null> {

    console.log("calling refresh ")
    if (!this.socket) return null;

    if (!this.socket.connected) {
      await new Promise<void>((resolve) => {
        this.socket?.once('connect', resolve);
        setTimeout(resolve, 3000);
      });
    }

    if (!this.socket.connected) {
      logWarn('SocketService', 'Not connected to backend');
      return null;
    }

    return new Promise<string | null>((resolve) => {
      this.socket?.emit('request-pairing-code', { deviceId: this.deviceId, forceRefresh: true }, (response: any) => {
        if (response?.success) {
          this.pairingCode = response.code;
          logInfo('SocketService', 'Refreshed pairing code');
          resolve(response.code);
        } else {
          logError('SocketService', 'Failed to refresh pairing code', response?.error);
          resolve(null);
        }
      });
    });
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
}

export const socketService = new SocketService();
