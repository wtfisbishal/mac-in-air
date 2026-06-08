
import { io, Socket } from 'socket.io-client';
import { commandService, CommandPayload } from './command.service';
import { screenService } from './screen.service';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface WebClient {
  socketId: string;
  connectedAt: number;
}

export class SocketService {
  private socket: Socket | null = null;
  private backendUrl: string = 'http://localhost:4000';
  private _isConnected: boolean = false;
  private pairingCode: string | null = null;
  private deviceId: string = 'mac-01';
  private connectedClients: WebClient[] = [];

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public connect(url?: string) {
    if (url) this.backendUrl = url;

    this.socket = io(this.backendUrl, {
      reconnectionDelayMax: 10000,
      autoConnect: true,
      query: { role: 'desktop' }, // tells backend to route to setupDesktopHandlers
    });

    this.socket.on('connect', () => {
      this._isConnected = true;
      this.pairingCode = null; // reset so reconnects always fetch a fresh code
      logInfo('SocketService', 'Connected to backend', { id: this.socket?.id });

      // Announce device, then request pairing code in ack callback
      this.socket?.emit(
        'device-online',
        {
          deviceId: this.deviceId,
          name: require('os').hostname(),
          platform: process.platform,
          arch: process.arch,
          user:require('os').userInfo().username
        },
        () => {
          // device-online acknowledged — now safe to request pairing code
          this.requestPairingCode();
        }
      );
    });

    this.socket.on('disconnect', () => {
      this._isConnected = false;
      logWarn('SocketService', 'Disconnected from backend');
    });

    this.socket.on('connect_error', (error) => {
      logError('SocketService', 'Connection error', error.message);
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
    });
  }

  private requestPairingCode(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('request-pairing-code', { deviceId: this.deviceId }, (response: any) => {
      if (response?.success) {
        this.pairingCode = response.code;
        logInfo('SocketService', 'Received pairing code', { code: response.code });
      } else {
        logError('SocketService', 'Failed to get pairing code', response?.error);
      }
    });
  }

  public async getPairingCode(): Promise<string | null> {
    // If we already have a code cached, return it immediately
    if (this.pairingCode) {
      return this.pairingCode;
    }

    if (!this.socket) {
      return null;
    }

    // Wait up to 3s for connection if not yet connected
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
      this.socket?.emit('request-pairing-code', { deviceId: this.deviceId }, (response: any) => {
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

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this._isConnected = false;
    }
  }
}

export const socketService = new SocketService();
