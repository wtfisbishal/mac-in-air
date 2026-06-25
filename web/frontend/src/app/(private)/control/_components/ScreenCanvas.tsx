'use client';
import { getSocket } from "@/lib/socket";
import { MonitorOff, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ScreenCanvas({
  deviceId,
  pairToken,
  onMouseEvent,
  mouseCapture = false,
  onScreenSize,
  displaySize,
  onDataChannel,
}: {
  deviceId: string;
  pairToken: string;
  onMouseEvent: (type: string, data: Record<string, unknown>) => void;
  mouseCapture?: boolean;
  /** Called whenever the real Mac screen dimensions become known */
  onScreenSize?: (w: number, h: number) => void;
  displaySize: {
    width: number,
    height: number,
    scaleFactor: number
  };
  /**
   * Called with the RTCDataChannel for peer-to-peer control events
   * (mouse & keyboard) as soon as it opens, or null when it closes.
   * The parent should use this channel instead of Socket.IO for control input.
   */
  onDataChannel?: (dc: RTCDataChannel | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [hasFrame, setHasFrame] = useState(false);
  const [dimLabel, setDimLabel] = useState('');
  const [hasAudio, setHasAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const screenSize = useRef({ w: displaySize?.width ?? 1920, h: displaySize?.height ?? 1080 });  
 
  useEffect(() => {
    const socket = getSocket();

    const joinDevice = () => {
      socket.emit('join-device', { deviceId, pairToken },
        (res?: { success: boolean; message?: string }) => {
          if (res?.success === false) {
            sessionStorage.removeItem(`rmac_pair_${deviceId}`)
          }
          console.log('join-device response', res);
        }
      );
    };

    joinDevice();
    

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    // ── Receive the 'control' data channel opened by the desktop (offerer) ──
    // The desktop creates the data channel, so we receive it here as the answerer.
    pc.ondatachannel = (event) => {
      const dc = event.channel;
      console.log('[ScreenCanvas] Data channel received:', dc.label);

      if (dc.label !== 'control') return;

      dc.onopen = () => {
        console.log('[ScreenCanvas] Control data channel OPEN — switching to WebRTC control');
        onDataChannel?.(dc);
      };

      dc.onclose = () => {
        console.log('[ScreenCanvas] Control data channel CLOSED — falling back to socket');
        onDataChannel?.(null);
      };

      dc.onerror = (err) => {
        console.error('[ScreenCanvas] Control data channel ERROR', err);
        onDataChannel?.(null);
      };

      // The frontend only sends on this channel; messages from desktop are
      // unexpected but we log them for debugging.
      dc.onmessage = (e) => {
        console.debug('[ScreenCanvas] Unexpected message from desktop DC:', e.data);
      };
    };
    // ────────────────────────────────────────────────────────────────────────

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setHasFrame(true);

        const videoTrack = event.streams[0].getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height) {
            screenSize.current = { w: settings.width, h: settings.height };
            setDimLabel(`${settings.width} × ${settings.height}`);
            onScreenSize?.(settings.width, settings.height);
          }
        }

        // Detect if an audio track is present in the incoming stream
        const audioTracks = event.streams[0].getAudioTracks();
        if (audioTracks.length > 0) {
          console.log('[ScreenCanvas] Audio track received:', audioTracks[0].label);
          setHasAudio(true);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Use toJSON() so sdpMid / sdpMLineIndex survive JSON serialization over socket
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate.toJSON(),
          deviceId,
        });
      }
    };

    const handleOffer = async (data: { sdp: any; deviceId: string }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          sdp: answer,
          deviceId,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer', err);
      }
    };

    const handleIceCandidate = async (data: { candidate: any; deviceId: string }) => {
      try {
        const c = data.candidate;
        // Skip missing / end-of-candidates markers.
        // Guard against both null and undefined since they behave identically
        // when serialized through IPC + Socket.IO JSON.
        if (!c || (c.sdpMid == null && c.sdpMLineIndex == null)) return;
        // Pass the init dict directly — addIceCandidate() accepts RTCIceCandidateInit
        // without needing `new RTCIceCandidate()`, which has stricter constructor validation.
        await pc.addIceCandidate(c);
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate', err);
      }
    };
    
    socket.on('connect', joinDevice);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('connect', joinDevice);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      onDataChannel?.(null); // notify parent that channel is gone
      pc.close();
    };
  }, [deviceId, pairToken]);

 
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => setIsMuted(prev => !prev);

  // Scale mouse coordinates from canvas display size to actual screen size
  const toScreenCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    const scaleX = screenSize.current.w / rect.width;
    const scaleY = screenSize.current.h / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  return (
    <div
      ref={wrapRef}
      className={`relative w-full bg-black  flex items-center justify-center rounded-3xl overflow-hidden `}
      style={{ aspectRatio: displaySize?.width && displaySize?.height ? `${displaySize.width}/${displaySize.height}` : '16/9', cursor: 'none' }}
      onMouseMove={e => onMouseEvent('mouse-move', toScreenCoords(e))}
      onClick={e => onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'left' })}
      onContextMenu={e => { e.preventDefault(); onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'right' }); }}
      onDoubleClick={e => onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'left', doubleClick: true })}
      onWheel={e => onMouseEvent('mouse-scroll', { x: Math.round(e.deltaX), y: Math.round(e.deltaY) })}
    >
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* No-stream placeholder */}
      <div className="pointer-events-none h-full absolute inset-0 flex items-center justify-center">
        {!hasFrame && (
          <div className="text-center">
            <MonitorOff size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Start screen streaming</p>
          </div>
        )}
      </div>

       
      {hasFrame && hasAudio && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // don't fire mouse-click on the canvas
            toggleMute();
          }}
          style={{ cursor: 'pointer' }}
          className="pointer-events-auto absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel-card b  text-xs text-slate-300 hover:text-white  transition-all"
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? (
            <>
              <VolumeX size={13} className="text-slate-400" />
              <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Audio On</span>
            </>
          )}
        </button>
      )}

      {/* Resolution badge */}
      {hasFrame && dimLabel && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-[10px] text-slate-400 font-mono backdrop-blur">
          {dimLabel}
        </div>
      )}
    </div>
  );
}