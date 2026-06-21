'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MonitorOff, Keyboard, MousePointer2, Power,
  Moon, Lock, Terminal, Globe, ArrowLeft,
  Maximize2, Minimize2, Link as Link2, ShieldAlert,
  NotepadText,
  X,
  Loader2,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import MacKeyboards from '@/components/MacKeyBoards';
import Image from 'next/image';
import AppsIcons from '../../apps/_components/AppsIcons';
import { useFullscreen } from '@/hooks/useFullscreen';
import MyComponent from '@/components/NewKeyboard';

interface PageProps {
  params: Promise<{ deviceId: string }>;
}

interface Action {
  label: string;
  icon: React.ElementType;
  type: string;
  payload?: Record<string, unknown>;
  variant?: 'default' | 'danger';
}

const ACTIONS: Action[] = [
  { label: 'Terminal', icon: Terminal, type: 'OPEN_APP', payload: { app: 'Terminal' } },
  { label: 'Browser', icon: Globe, type: 'OPEN_APP', payload: { app: 'Safari' } },
  { label: 'Notes', icon: NotepadText, type: 'OPEN_APP', payload: { app: 'Notes' } },
  // { label: 'Lock', icon: Lock, type: 'LOCK_SCREEN' },
];
export function normalizeKey(key: string) {
  switch (key.toLowerCase()) {
    case "meta":
    case "cmd":
    case "⌘":
      return "command";
    case "control":
    case "ctrl":
      return "control";

    case "option":
      return "alt";

    case " ":
      return "space";

    default:
      return key.toLowerCase();
  }
}

//   Screen canvas component 
function ScreenCanvas({
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
      socket.emit(
        'join-device',
        { deviceId, pairToken },
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
      console.log('[WebRTC] Track received', event.streams[0]);
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
      console.log('[WebRTC] Received offer');
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

//   Main Control Room  
export default function ControlPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { data: device, isLoading } = useDevice(deviceId);
  const { toasts, toast, dismiss } = useToast();

  //   Authorization: require a pairToken stored during the pairing flow  
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(`rmac_pair_${deviceId}`);
    setPairToken(token);
    setAuthChecked(true);

  }, [deviceId]);

  const [streaming, setStreaming] = useState(false);
  const [kbCapture, setKbCapture] = useState(false);
  const [mouseCapture, setMouseCapture] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const { fullscreen, setFullscreen } = useFullscreen();


  const KEY_MAP: Record<string, string> = {
    meta: "command",
    cmd: "command",
    command: "command",

    control: "control",
    ctrl: "control",

    option: "alt",
    alt: "alt",

    return: "enter",
    escape: "escape",
    delete: "backspace",

    " ": "space",
    space: "space",
    tab: "tab",
  };



  // Focus trap ref for keyboard capture
  const controlAreaRef = useRef<HTMLDivElement>(null);

  // ── Send any event to desktop agent via socket  
  const emit = useCallback((type: string, payload?: Record<string, unknown>) => {
    const socket = getSocket();
    socket.emit('command', { type, payload }, (result: { success: boolean; message: string }) => {
      if (!result?.success) toast(result?.message || 'Command failed', 'error');
    });
  }, [toast]);

  //   Mouse events  
  const handleMouseEvent = useCallback((type: string, data: Record<string, unknown>) => {
    if (!mouseCapture) return;
    const socket = getSocket();
    socket.emit(type, data); // fire-and-forget for low latency
  }, [mouseCapture]);



  const handleVirtualShortcut = useCallback(
    (keyName: string, modifiers: string[]) => {
      if (!kbCapture) return;

      const socket = getSocket();
      const mapped = KEY_MAP[keyName.toLowerCase()] ?? keyName.toLowerCase();

      if (modifiers.length === 0 && mapped.length === 1) {
        socket.emit("keyboard-type", { text: mapped });
      } else {
        socket.emit("keyboard-shortcut", {
          key: mapped,
          modifier: modifiers,
        });
      }
    },
    [kbCapture]
  );

  // const handlePhysicalKeyDown = useCallback(
  //   (e: KeyboardEvent) => {
  //     if (!kbCapture) return;
  //     e.preventDefault();

  //     const modifiers: string[] = [];
  //     if (e.metaKey) modifiers.push('command');
  //     if (e.ctrlKey) modifiers.push('control');
  //     if (e.altKey) modifiers.push('alt');
  //     if (e.shiftKey) modifiers.push('shift');

  //     const socket = getSocket();

  //     if (e.key.length === 1 && modifiers.length === 0) {
  //       socket.emit('keyboard-type', { text: e.key });
  //     } else {
  //       const mappedKey = KEY_MAP[e.key.toLowerCase()] ?? e.key;
  //       socket.emit('keyboard-shortcut', { key: mappedKey, modifier: modifiers });
  //     }
  //   },
  //   [kbCapture]
  // );

  const handlePhysicalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!kbCapture) return;

      e.preventDefault();

      const modifiers: string[] = [];

      if (e.metaKey) modifiers.push("command");
      if (e.ctrlKey) modifiers.push("control");
      if (e.altKey) modifiers.push("alt");
      if (e.shiftKey) modifiers.push("shift");

      const mappedKey =
        KEY_MAP[e.key.toLowerCase()] ?? e.key;

      sendKeyToMac(mappedKey, modifiers);
    },
    [kbCapture]
  );
  const sendKeyToMac = (
    key: string,
    modifiers: string[] = []
  ) => {
    const socket = getSocket();

    if (key.length === 1 && modifiers.length === 0) {
      socket.emit("keyboard-type", {
        text: key
      });
    } else {
      socket.emit("keyboard-shortcut", {
        key,
        modifier: modifiers
      });
    }
  };

  //   Screen share start/stop  
  const toggleStream = () => {
    const socket = getSocket();
    if (!streaming) {
      const sid = `session-${Date.now()}`;
      setSessionId(sid);
      socket.emit('screen-share-start', { sessionId: sid, frameRate: 20, quality: 0.92 });
      setStreaming(true);
      toast('Screen streaming started', 'success');
    } else {
      socket.emit('screen-share-stop', { sessionId });
      setStreaming(false);
      toast('Screen streaming stopped', 'info');
    }
  };

  //   Quick actions  
  const runAction = (action: Action) => {
    emit(action.type, action.payload);
    toast(`Sent: ${action.label}`, 'info');
  };

  const [visiblePanel, setVisiblePanel] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setVisiblePanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (isLoading || !authChecked) return (
    <AppLayout>
      <div className="min-h-screen  w-full flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    </AppLayout>
  );

  if (!pairToken) return (
    <AppLayout>
      <div className="w-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
          <p className="text-slate-400 text-sm mb-6">
            You must pair this device before you can control it.
            Pairing tokens expire after 30 min  or when you close the tab.
          </p>
          <Link href="/pair" className="btn !rounded-full glass-button-primary">
            <Link2 size={20} />
            Pair Device
          </Link>
        </div>
      </div>
    </AppLayout>
  );

  if (!device) return (
    <AppLayout>
      <div className="min-h-screen  w-full flex items-center justify-center">
        <div className="text-center">
          <MonitorOff size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Device not found</p>
          <button onClick={() => router.push('/home')} className="btn glass-button !rounded-full mt-4 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className={` flex w-full flex-col min-h-screen relative ${fullscreen ? 'p-0' : 'p-5'}`}>

        {visiblePanel && <div className='fixed w-full h-full top-0 z-[100] left-0 flex items-center justify-center bg-[#0000005f]  backdrop-blur-[4px] '>
          <div className='animate-spotlight !transition-all !duration-700  max-md:py-5  max-md:p-0  max-md:mt-10 mt-0  w-[80%] max-md:w-[95%] glass-panel-card p-4   rounded-4xl   h-[90%] max-md:h-[80%] overflow-y-scroll  '>

            <div onClick={() => setVisiblePanel(false)} className="flex items-center gap-2 absolute right-7 top-7 max-md:top-6 max-md:right-4 rounded-full py-2 cursor-pointer px-5 glass-panel-dark">
              <X />
            </div>

            <AppsIcons />
          </div>
        </div>}

        {/* Top bar */}
        {!fullscreen && (
          <div className="flex items-center   max-md:-mt-1 justify-between mb-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/home')} className="btn  !rounded-3xl  glass-panel-dark btn-ghost p-2">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-lg max-md:text-sm font-bold text-white leading-tight capitalize"> {device?.user}'s {device.name}</h1>
                <p className="text-xs text-slate-500">{device.platform} · {device.arch}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${device.isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
              >
                <span className={device.isOnline ? 'dot-online' : 'dot-offline'} />
                {device.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <button onClick={() => { setFullscreen(true) }} className="btn glass-panel-dark !rounded-3xl btn-ghost p-2">
              <Maximize2 size={15} />
            </button>
          </div>
        )}

        {/*   Main area */}
        <div className={`flex max-md:flex-col gap-4 flex-1 min-h-0 ${fullscreen ? 'h-full' : ''}`}>
          {/* Screen */}
          <div
            ref={controlAreaRef}
            className={`flex-1 flex flex-col min-h-screen items-center gap-3 min-w-0 ${fullscreen ? 'p-3' : ''}`}
            tabIndex={-1}
            style={{ outline: 'none' }}
          >
            {/* Toolbar */}
            <div className="animate-spotlight glass-panel-dark max-md:rounded-3xl rounded-full max-md:justify-start justify-center w-fit px-3 py-2 flex items-center gap-2 max-md:gap-x-1 flex-wrap animate-fade-up delay-1">
              {/* Stream toggle */}
              <button
                onClick={toggleStream}
                className={`ctrl-btn !rounded-full ${streaming ? 'active' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${streaming ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {streaming ? 'Streaming' : 'Start Stream'}
              </button>

              <div className="w-px h-4 bg-white/[0.06]" />

              {/* Mouse   toggle */}
              <button
                onClick={() => setMouseCapture(p => !p)}
                className={` !rounded-full  ctrl-btn ${mouseCapture ? 'active' : ''}`}

              >
                <MousePointer2 size={12} />
                Mouse {mouseCapture ? 'ON' : 'OFF'}
              </button>

              {/* Keyboard toggle */}
              <button
                onClick={() => setKbCapture(p => !p)}
                className={`ctrl-btn ${kbCapture ? 'active' : ''}`}
                title="Toggle keyboard capture — captures all keystrokes"
              >
                <Keyboard size={12} />
                Keyboard {kbCapture ? 'ON' : 'OFF'}
              </button>

              <div className="w-px h-4   bg-white/[0.06]" />

              {ACTIONS.map(a => (
                <button
                  key={a.type + (a.payload?.app ?? '')}
                  onClick={() => runAction(a)}
                  className={`ctrl-btn  ${a.variant === 'danger' ? 'danger' : ''}`}
                >
                  <a.icon size={12} />
                  {a.label}
                </button>
              ))}

              {/* Fullscreen exit */}
              {fullscreen && (
                <button onClick={() => { setFullscreen(false); }} className="ctrl-btn ml-auto">
                  <Minimize2 size={12} /> Exit
                </button>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full min-h-[450px] rounded-3xl overflow-hidden relative animate-fade-up delay-2">
              <ScreenCanvas deviceId={deviceId} pairToken={pairToken} onMouseEvent={handleMouseEvent} />
            </div>

           {/* {kbCapture && (
              <div className="animate-fade-up delay-4 min-h-[400px] w-full overflow-x-auto max-md:justify-start pb-4 flex justify-center">
                 <MacKeyboards onVirtualShortcut={handleVirtualShortcut} onPhysicalKeyDown={handlePhysicalKeyDown} /> 

                <MyComponent  />
              </div>
            )}*/}
          </div>

          {/*  Side panel */}
          {!fullscreen && (
            <div className="w-[220px] flex-shrink-0 pb-20 max-md:w-full flex flex-col gap-3 animate-fade-up delay-2">

              {/* Apps launcher */}
              <Link
                href={`/apps/${deviceId}`}

                className="glass-panel-dark rounded-full p-2 px-4 flex w-full items-center gap-2.5 hover:border-indigo-500/20 transition-colors group"
              >
                <Image src={'/apps.png'} height={35} width={35} alt='apps' />
                <div>
                  <p className=" font-semibold text-slate-200 group-hover:text-white">App Launcher (⌘J) </p>
                </div>
              </Link>



              {/*  shortcuts   */}
              <div className="glass-panel-dark rounded-3xl p-4">
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold mb-3">Shortcuts</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Copy', key: 'c', mod: 'command' },
                    { label: 'Paste', key: 'v', mod: 'command' },
                    { label: 'Select All', key: 'a', mod: 'command' },
                    { label: 'Undo', key: 'z', mod: 'command' },
                    { label: 'Find', key: 'f', mod: 'command' },
                    { label: 'Spotlight', key: 'space', mod: 'command' },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => {
                        const socket = getSocket();
                        socket.emit('keyboard-shortcut', { key: s.key, modifier: s.mod });
                        toast(`Sent: ${s.label}`, 'info');
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5  !rounded-full 4xl cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      <span className="text-xs text-slate-400 group-hover:text-slate-200">{s.label}</span>
                      <kbd className="text-[9.5px] glass-panel-dark px-2 flex items-center justify-center gap-1 rounded-xl font-bold text-slate-100 mr-1"> <span className=' text-base'>⌘</span> {s.key.toUpperCase().slice(0, 1)}</kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* System actions */}
              <div className="glass-panel-dark rounded-3xl p-4">
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold mb-3">System</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Lock Screen', type: 'LOCK_SCREEN', icon: Lock },
                    { label: 'Sleep', type: 'SLEEP', icon: Moon },
                    { label: 'Restart', type: 'RESTART', icon: Power },
                    { label: 'Shutdown', type: 'SHUTDOWN', icon: Power },
                  ].map(a => (
                    <button
                      key={a.type}
                      onClick={() => { setWarning(a.type) }}
                      className={`w-full  flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer text-xs font-medium transition-colors
                        ${['RESTART', 'SHUTDOWN'].includes(a.type)
                          ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                    >
                      <a.icon size={13} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          )}
        </div>


        {
          warning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
              <div className="w-[450px] max-md:w-[90%] rounded-3xl p-6 glass-panel-card shadow-2xl">


                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <h2 className="text-xl font-semibold text-yellow-400">
                    System Action Confirmation
                  </h2>
                </div>


                <div className="mt-5">
                  <p className="text-gray-300">
                    You are about to perform the following system action
                  </p>

                  <div className="mt-3   p-4">
                    <p className="text-center text-2xl font-bold capitalize text-red-500">
                      {warning.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>

                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setWarning(null)}
                    className="rounded-full px-6 py-2 cursor-pointer glass-button"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      emit(warning);
                      toast(`${warning} command sent`, "info");
                      setWarning(null);
                    }}
                    className="rounded-full px-6 py-2 bg-red-500 cursor-pointer hover:bg-red-600 text-white font-medium transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )
        }

         {kbCapture && (
              <div className="animate-fade-up delay-4 min-h-[300px]   max-md:w-full max-md:px-5 max-md:overflow-x-auto mx-auto w-[80%] overflow-x-auto max-md:justify-start pb-4 flex justify-center">
                
                <MyComponent  />
              </div>
            )}
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
