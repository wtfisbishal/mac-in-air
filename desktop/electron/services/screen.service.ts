
import { desktopCapturer, screen } from 'electron';
import { socketService } from './socket.service';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface ScreenShareSession {
  sessionId: string;
  isActive: boolean;
  frameRate: number;
  quality: number;
}

export class ScreenService {
  private activeSession: ScreenShareSession | null = null;
  private frameInterval: NodeJS.Timeout | null = null;

  public async getScreenSources() {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }));
    } catch (error) {
      console.error('Failed to get screen sources', error);
      return [];
    }
  }


   //Start screen sharing session
  public async startScreenShare(
    sessionId: string,
    options?: { frameRate?: number; quality?: number }
  ) {
    if (this.activeSession) {
      logWarn('ScreenService', 'Screen share already active');
      return false;
    }

    const frameRate = options?.frameRate ?? 15;
    const quality   = options?.quality   ?? 0.92; // default: high quality

    this.activeSession = { sessionId, isActive: true, frameRate, quality };
    logInfo('ScreenService', 'Starting screen share', { sessionId, frameRate, quality });

    this.captureFrames();
    return true;
  }

   
   // Stop screen sharing session
    
  public stopScreenShare() {
    if (!this.activeSession) {
      logWarn('ScreenService', 'No active screen share session');
      return;
    }

    this.activeSession.isActive = false;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    logInfo('ScreenService', 'Stopped screen share', { sessionId: this.activeSession.sessionId });
    this.activeSession = null;
  }

 
   //  Capture and stream frames at the configured frame rate.
   
  private captureFrames() {
    if (!this.activeSession) return;

    const intervalMs = Math.max(Math.round(1000 / this.activeSession.frameRate), 16);

    this.frameInterval = setInterval(async () => {
      if (!this.activeSession?.isActive) {
        if (this.frameInterval) {
          clearInterval(this.frameInterval);
          this.frameInterval = null;
        }
        return;
      }

      try {
        const frame = await this.captureScreenFrame(this.activeSession.quality);

        if (frame) {
          const socket = socketService.getSocket();
          if (socket?.connected) {
            socket.emit('screen-frame', {
              sessionId: this.activeSession.sessionId,
              frame: frame.buffer,
              width: frame.width,
              height: frame.height,
              mimeType: 'image/jpeg',
            });
          }
        }
      } catch (error) {
        logError('ScreenService', 'Frame capture error', error);
      }
    }, intervalMs);
  }

  /**
   * Capture a single screen frame at native resolution using JPEG encoding.
   *
   * Quality improvements over the old implementation:
   *  1. thumbnailSize is set to the actual physical pixel resolution of the
   *     primary display (accounting for Retina scaleFactor). Without this,
   *     Electron returns a tiny thumbnail (~150px wide by default).
   *  2. JPEG encoding instead of PNG: ~5-10× smaller per frame, dramatically
   *     reducing latency and socket bandwidth while keeping high visual quality.
   */
  private async captureScreenFrame(
    quality: number = 0.92
  ): Promise<{ buffer: Buffer; width: number; height: number } | null> {
    try {
      // Determine the primary display's native physical resolution
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor; // 2.0 on Retina / HiDPI

      const captureWidth  = Math.round(width  * scaleFactor);
      const captureHeight = Math.round(height * scaleFactor);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: captureWidth, height: captureHeight },
      });

      if (sources.length === 0) return null;

      const nativeImage = sources[0].thumbnail;

      // toJPEG expects quality 0–100
      const jpegQuality = Math.round(quality * 100);
      const buffer = nativeImage.toJPEG(jpegQuality);

      const size = nativeImage.getSize();
      return { buffer, width: size.width, height: size.height };
    } catch (error) {
      logError('ScreenService', 'Failed to capture frame', error);
      return null;
    }
  }

  getSessionInfo(): ScreenShareSession | null {
    return this.activeSession;
  }

  isActive(): boolean {
    return this.activeSession?.isActive ?? false;
  }
}

export const screenService = new ScreenService();
