'use client';
import { getSocket } from "@/lib/socket";
import { MonitorOff, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ScreenCanvas({
  deviceId,
  pairToken,
  onMouseEvent,
  mouseCapture,
  onScreenSize,
  displaySize,
  onDataChannel,
}: {
  deviceId: string;
  pairToken: string;
  onMouseEvent: (type: string, data: Record<string, unknown>) => void;
  mouseCapture?: boolean;
  onScreenSize?: (w: number, h: number) => void;
  displaySize: {
    width: number,
    height: number,
    scaleFactor: number
  };
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
  const [touchMode, setTouchMode] = useState<'move' | 'scroll' | 'drag'>('move');
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
 
  useEffect(() => {
    const socket = getSocket();

    const joinDevice = () => {
      socket.emit('join-device', { deviceId, pairToken },
        (res?: { success: boolean; message?: string }) => {
          if (res?.success === false) {
            sessionStorage.removeItem(`pairToken_${deviceId}`)
            window.location.reload(); // Force reload to show lock screen again
          }
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

       
    };

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

         const audioTracks = event.streams[0].getAudioTracks();
        if (audioTracks.length > 0) {
          // console.log('[ScreenCanvas] Audio track received:', audioTracks[0].label);
          setHasAudio(true);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
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
    
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      onDataChannel?.(null); // notify parent that channel is gone
      pc.close();
    };
  }, [deviceId]);

 
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => setIsMuted(prev => !prev);

  // ── Compute the actual rendered video bounds, accounting for object-contain letterboxing ──
  const getVideoBounds = () => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return null;

    const wrapRect = wrap.getBoundingClientRect();
    const videoAspect = screenSize.current.w / screenSize.current.h;
    const wrapAspect = wrapRect.width / wrapRect.height;

    let renderWidth: number, renderHeight: number, offsetX = 0, offsetY = 0;

    if (videoAspect > wrapAspect) {
      // black bars top & bottom
      renderWidth = wrapRect.width;
      renderHeight = wrapRect.width / videoAspect;
      offsetY = (wrapRect.height - renderHeight) / 2;
    } else {
      // black bars left & right
      renderHeight = wrapRect.height;
      renderWidth = wrapRect.height * videoAspect;
      offsetX = (wrapRect.width - renderWidth) / 2;
    }

    return {
      left: wrapRect.left + offsetX,
      top: wrapRect.top + offsetY,
      width: renderWidth,
      height: renderHeight,
    };
  };

  // Scale touch coordinates — uses real video bounds, not wrapper bounds
  const toTouchScreenCoords = (touch: React.Touch) => {
    const bounds = getVideoBounds();
    if (!bounds) return { x: 0, y: 0 };

    const x = touch.clientX - bounds.left;
    const y = touch.clientY - bounds.top;
    const scaleX = screenSize.current.w / bounds.width;
    const scaleY = screenSize.current.h / bounds.height;

    return {
      x: Math.round(Math.max(0, Math.min(x, bounds.width)) * scaleX),
      y: Math.round(Math.max(0, Math.min(y, bounds.height)) * scaleY),
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
      // 'move' mode: don't warp the mouse on touch start — just record position
      if (touchMode === 'drag') {
        onMouseEvent('mouse-down', { ...toTouchScreenCoords(e.touches[0]), button: 'left' });
      }
    } else if (e.touches.length === 2) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      if (touchMode === 'scroll') {
        if (lastTouchRef.current) {
          const dx = lastTouchRef.current.x - e.touches[0].clientX;
          const dy = lastTouchRef.current.y - e.touches[0].clientY;
          onMouseEvent('mouse-scroll', { x: Math.round(dx), y: Math.round(dy) });
          lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
        }
      } else if (touchMode === 'drag') {
        onMouseEvent('mouse-drag', toTouchScreenCoords(e.touches[0]));
      } else {
        // 'move' mode — trackpad-style relative delta, NOT absolute coords
        if (lastTouchRef.current) {
          const dx = e.touches[0].clientX - lastTouchRef.current.x;
          const dy = e.touches[0].clientY - lastTouchRef.current.y;
          onMouseEvent('mouse-move-relative', {
            dx: Math.round(dx * 2),
            dy: Math.round(dy * 2),
          });
          lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
        }
      }
    } else if (e.touches.length === 2) {
      if (lastTouchRef.current) {
        const dx = lastTouchRef.current.x - e.touches[0].clientX;
        const dy = lastTouchRef.current.y - e.touches[0].clientY;
        onMouseEvent('mouse-scroll', { x: Math.round(dx), y: Math.round(dy) });
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.changedTouches.length === 1 && lastTouchRef.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - lastTouchRef.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - lastTouchRef.current.y);
      const dt = Date.now() - lastTouchRef.current.time;

      // tap -> click
      if (touchMode !== 'drag' && dx < 10 && dy < 10 && dt < 300) {
        onMouseEvent('mouse-click', { ...toTouchScreenCoords(e.changedTouches[0]), button: 'left' });
      } else if (touchMode === 'drag') {
        onMouseEvent('mouse-up', { ...toTouchScreenCoords(e.changedTouches[0]), button: 'left' });
      }
    }
    if (e.touches.length === 0) {
      lastTouchRef.current = null;
    }
  };

  // Scale mouse coordinates — uses real video bounds + Retina scaleFactor
  const toScreenCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = getVideoBounds();
    if (!bounds) return { x: 0, y: 0 };

    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const scaleX = screenSize.current.w / bounds.width;
    const scaleY = screenSize.current.h / bounds.height;

    return {
      x: Math.round(Math.max(0, Math.min(x, bounds.width)) * scaleX),
      y: Math.round(Math.max(0, Math.min(y, bounds.height)) * scaleY),
    };
  };

  return (
    <div
      ref={wrapRef}
      className={`relative w-full bg-black flex items-center justify-center rounded max-md:rounded-none overflow-hidden touch-none `}
      style={{ aspectRatio: displaySize?.width && displaySize?.height ? `${displaySize.width}/${displaySize.height}` : '16/9', cursor: 'none' }}
      onMouseMove={e => {
        if (isMouseDown) {
          onMouseEvent('mouse-drag', toScreenCoords(e));
        } else {
          onMouseEvent('mouse-move', toScreenCoords(e));
        }
      }}
      onMouseDown={e => {
        setIsMouseDown(true);
        const btn = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
        onMouseEvent('mouse-down', { ...toScreenCoords(e), button: btn });
      }}
      onMouseUp={e => {
        setIsMouseDown(false);
        const btn = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
        onMouseEvent('mouse-up', { ...toScreenCoords(e), button: btn });
      }}
      onMouseLeave={e => {
        if (isMouseDown) {
          setIsMouseDown(false);
          onMouseEvent('mouse-up', { ...toScreenCoords(e), button: 'left' });
        }
      }}
      onContextMenu={e => e.preventDefault()}
      onDoubleClick={e => onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'left', doubleClick: true })}
      onWheel={e => onMouseEvent('mouse-scroll', { x: Math.round(e.deltaX), y: Math.round(e.deltaY) })}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

      {/* Mobile Touch Controls */}
     {hasFrame && mouseCapture &&   (
        <div className="pointer-events-auto text-xs absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center  px-1 py-1 rounded-full glass-panel-card  z-50">
          <button
            onClick={(e) => { e.stopPropagation(); setTouchMode('move'); }}
            className={`p-2 rounded-full transition-colors ${touchMode === 'move' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Mouse Move Mode"
          >
            Click
          </button>
          <div className=" h-5 bg-slate-700/50"></div>
          <button
            onClick={(e) => { e.stopPropagation(); setTouchMode('scroll'); }}
            className={`p-2 rounded-full transition-colors ${touchMode === 'scroll' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Scroll Mode"
          >
            Scroll
          </button>
          <div className=" h-5 bg-slate-700/50 "></div>
          <button
            onClick={(e) => { e.stopPropagation(); setTouchMode('drag'); }}
            className={`p-2 rounded-full transition-colors ${touchMode === 'drag' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Drag Mode"
          >
            Drag
          </button>
        </div>
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