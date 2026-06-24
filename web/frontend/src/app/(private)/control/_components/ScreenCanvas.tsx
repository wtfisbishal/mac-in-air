'use client';
import { getSocket } from "@/lib/socket";
import { MonitorOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ScreenCanvas({
  deviceId,
  pairToken,
  onMouseEvent,
}: {
  deviceId: string;
  pairToken: string;
  onMouseEvent: (type: string, data: Record<string, unknown>) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [hasFrame, setHasFrame] = useState(false);
  const [dimLabel, setDimLabel] = useState('');
  const screenSize = useRef({ w: 1920, h: 1080 }); // actual Mac screen size from frames

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
    socket.on('connect', joinDevice);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {

      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setHasFrame(true);

        const track = event.streams[0].getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings();
          if (settings.width && settings.height) {
            screenSize.current = { w: settings.width, h: settings.height };
            setDimLabel(`${settings.width} × ${settings.height}`);
          }
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

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('connect', joinDevice);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      pc.close();
    };
  }, [deviceId, pairToken]);

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
      className="relative w-full bg-black min-h-[600px]   flex items-center justify-center   pb-5 rounded-3xl overflow-hidden"
      style={{ aspectRatio: '16/9', cursor: 'none' }}
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
        className="w-full h-full object-contain   pointer-events-none"
      />


      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {!hasFrame && (
          <div className="text-center">
            <MonitorOff size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Start screen streamming</p>
          </div>
        )}
      </div>

      {/* Resolution badge */}
      {hasFrame && dimLabel && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-[10px] text-slate-400 font-mono backdrop-blur">
          {dimLabel}
        </div>
      )}
    </div>
  );
}