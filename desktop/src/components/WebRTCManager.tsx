'use client';

import { useEffect, useRef } from 'react';

export default function WebRTCManager() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Data channel for peer-to-peer mouse & keyboard control
  const controlChannelRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    // Listen for WebRTC start command from the Main process
    window.electronAPI.onStartWebRTC(async ({ sourceId, sessionId }) => {
      console.log('[WebRTCManager] Starting WebRTC for source', sourceId);

      try {
        // Stop any existing session
        stopWebRTC();

        //   Capture screen + system audio  
        // The main process registers a setDisplayMediaRequestHandler that:
        //   1. Picks the first screen source for video
        //   2. Provides 'loopback' system audio (macOS CoreAudio tap)
        //
        // getDisplayMedia() is intercepted by that handler so we don't need
        // to pass the chromeMediaSource / sourceId manually here.
        // We still try getUserMedia as a fallback in case getDisplayMedia fails.
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,   // system loopback audio — provided by the main-process handler
            video: {
              frameRate: { ideal: 30, max: 30 },
            } as any,
          });

          const audioTracks = stream.getAudioTracks();
          const videoTracks = stream.getVideoTracks();
          console.log(
            `[WebRTCManager] getDisplayMedia OK — video: ${videoTracks.length}, audio: ${audioTracks.length}`,
            audioTracks.map(t => t.label)
          );
        } catch (displayMediaErr) {
          // Fallback: video-only via getUserMedia with the desktop source id
          console.warn(
            '[WebRTCManager] getDisplayMedia failed, falling back to getUserMedia (video only):',
            displayMediaErr
          );
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
                minFrameRate: 15,
                maxFrameRate: 30,
              },
            } as any,
          });
        }

        localStreamRef.current = stream;

        // Create PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ]
        });

        peerConnectionRef.current = pc;

        //   Control Data Channel (mouse & keyboard)  
        // The desktop (offerer) creates the channel; the frontend (answerer)
        // receives it via pc.ondatachannel.
        const controlChannel = pc.createDataChannel('control', {
          ordered: false,       // unordered for lower latency on control events
          maxRetransmits: 0,    // fire-and-forget — stale mouse positions are useless
        });
        controlChannelRef.current = controlChannel;

        controlChannel.onopen = () => {
          console.log('[WebRTCManager] Control data channel OPEN');
        };

        controlChannel.onclose = () => {
          console.log('[WebRTCManager] Control data channel CLOSED');
          controlChannelRef.current = null;
        };

        controlChannel.onerror = (err) => {
          console.error('[WebRTCManager] Control data channel ERROR', err);
        };

        // Receive mouse/keyboard commands from the frontend browser and
        // execute them directly via the preload-exposed API.
        controlChannel.onmessage = async (event) => {
          try {
            const command = JSON.parse(event.data as string);
            // command shape: { type: string; payload?: Record<string, unknown> }
            // Matches the existing CommandPayload consumed by commandService
            await window.electronAPI.executeCommand(command);
          } catch (err) {
            console.error('[WebRTCManager] Failed to handle control message', err);
          }
        };
        
        // Add all mouse/keyboard tracks (video + audio if available)
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

        // { //ex..
        //   "type": "offer",
        //   "sdp": "v=0 ..."
        // }

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
    // Close control channel first
    if (controlChannelRef.current) {
      controlChannelRef.current.close();
      controlChannelRef.current = null;
    }
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
