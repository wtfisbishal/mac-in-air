'use client';

import { useEffect, useRef } from 'react';

export default function WebRTCManager() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    // Listen for WebRTC start command from the Main process
    window.electronAPI.onStartWebRTC(async ({ sourceId, sessionId }) => {
      console.log('[WebRTCManager] Starting WebRTC for source', sourceId);

      try {
        // Stop any existing session
        stopWebRTC();

        // Get the screen media stream natively via Chromium
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minFrameRate: 15,
              maxFrameRate: 30,
            }
          } as any
        });

        localStreamRef.current = stream;

        // Create PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ]
        });

        peerConnectionRef.current = pc;

        // Add tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            // Use toJSON() to serialize to a plain object so that sdpMid and
            // sdpMLineIndex survive Electron IPC structured-clone + Socket.IO JSON.
            window.electronAPI.sendWebRTCSignaling({
              type: 'ice-candidate',
              candidate: event.candidate.toJSON(),
            });
          }
        };

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to backend via Main Process
        window.electronAPI.sendWebRTCSignaling({
          type: 'offer',
          sdp: offer,
        });

      } catch (err) {
        console.error('[WebRTCManager] Failed to start WebRTC', err);
      }
    });

    // Listen for stop command
    window.electronAPI.onStopWebRTC(() => {
      console.log('[WebRTCManager] Stopping WebRTC');
      stopWebRTC();
    });

    // Listen for signaling (answers, ice candidates) from frontend
    window.electronAPI.onWebRTCSignaling(async (data: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } else if (data.type === 'ice-candidate') {
          // Guard: skip end-of-candidates signal (null/undefined candidate fields)
          if (data.candidate && (data.candidate.sdpMid != null || data.candidate.sdpMLineIndex != null)) {
            await pc.addIceCandidate(data.candidate);
          }
        }
      } catch (err) {
        console.error('[WebRTCManager] Error handling signaling', err);
      }
    });

    return () => {
      stopWebRTC();
    };
  }, []);

  const stopWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  return null;
}
