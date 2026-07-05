import { desktopCapturer, screen } from 'electron';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface ScreenShareSession {
  sessionId: string;
  isActive: boolean;
  frameRate: number;
  quality: number;
}

export class ScreenService {
  private activeSession: ScreenShareSession | null = null;
 
  //Start screen sharing session
  public async startScreenShare(sessionId: string, options?: { frameRate?: number; quality?: number }) {
    if (this.activeSession) {
      logWarn('ScreenService', 'Screen share already active'); 
      return false;
    }

    const frameRate = options?.frameRate ?? 30;
    const quality = options?.quality ?? 1.0;

    this.activeSession = { sessionId, isActive: true, frameRate, quality };
    // logInfo('ScreenService', 'Starting WebRTC screen share', { sessionId, frameRate, quality });

    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      if (sources.length === 0) throw new Error('No screen sources found');

      const sourceId = sources[0].id;

      const { BrowserWindow } = require('electron');
      // Forward the sourceId to the renderer process (where Chromium getUserMedia lives)
      BrowserWindow.getAllWindows()[0]?.webContents.send('start-webrtc', { sourceId, sessionId });

      return true;
    } catch (error) {
      logError('ScreenService', 'Failed to start WebRTC screen share', error);
      this.activeSession = null;
      return false;
    }
  }

  // Stop screen sharing session
  public stopScreenShare() {
    if (!this.activeSession) {
      logWarn('ScreenService', 'No active screen share session');
      return;
    }

    this.activeSession.isActive = false;

    logInfo('ScreenService', 'Stopped WebRTC screen share', { sessionId: this.activeSession.sessionId });
    this.activeSession = null;

    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows()[0]?.webContents.send('stop-webrtc');
  }

  getSessionInfo(): ScreenShareSession | null {
    return this.activeSession;
  }

  isActive(): boolean {
    return this.activeSession?.isActive ?? false;
  } 
}

export const screenService = new ScreenService();
