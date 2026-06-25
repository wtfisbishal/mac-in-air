'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MonitorOff, Keyboard, MousePointer2, Power,
  Moon, Lock, ArrowLeft, Maximize2, Minimize2,
  Link as Link2, ShieldAlert, X, Loader,
  LayoutGrid
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import Image from 'next/image';
import AppsIcons from '../../apps/_components/AppsIcons';
import { useFullscreen } from '@/hooks/useFullscreen';
import NormalKeyboard from '../_components/NormalKeyboard';
import { Action } from '@/types';
import { ACTIONS } from '@/lib/utils';
import ScreenCanvas from '../_components/ScreenCanvas';
import VirtualJoystick from '../_components/VirtualJoystick';

interface PageProps {
  params: Promise<{ deviceId: string }>;
}

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

  const [humburgerOpen, setHamburgerOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [kbCapture, setKbCapture] = useState(false);
  const [mouseCapture, setMouseCapture] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const { fullscreen, setFullscreen } = useFullscreen();
  // joystick needs to know the actual Mac screen size for cursor clamping
  const [screenSize, setScreenSize] = useState({ w: device?.display?.width ?? 1920, h: device?.display?.height ?? 1080 });

  // ── WebRTC data channel for peer-to-peer mouse & keyboard control ──────────
  // Populated by ScreenCanvas once the desktop opens the 'control' data channel.
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const handleDataChannel = useCallback((dc: RTCDataChannel | null) => {
    dataChannelRef.current = dc;
    setDataChannel(dc);
    if (dc) {
      console.log('[ControlPage] Control data channel is OPEN — using WebRTC for mouse/keyboard');
    } else {
      console.log('[ControlPage] Control data channel CLOSED');
    }
  }, []);
 
  // for stop streaming on unmount -- --- - 
  const streamingRef = useRef(streaming);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    streamingRef.current = streaming;
    sessionIdRef.current = sessionId;
  }, [streaming, sessionId]);

  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        const socket = getSocket();
        socket.emit('screen-share-stop', { sessionId: sessionIdRef.current });
      }
    };
  }, []); // - --  -- 

  // Focus trap ref for keyboard capture
  const controlAreaRef = useRef<HTMLDivElement>(null);

  //  Send system/app commands to desktop agent via socket (unchanged)  
  const emit = useCallback((type: string, payload?: Record<string, unknown>) => {
    const socket = getSocket();
    socket.emit('command', { type, payload }, (result: { success: boolean; message: string }) => {
      if (!result?.success) toast(result?.message || 'Command failed', 'error');
    });
  }, [toast]);

  //   Mouse events — send over WebRTC data channel (peer-to-peer)  
  // Falls back gracefully to a no-op if the data channel is not yet open.
  const handleMouseEvent = useCallback((type: string, data: Record<string, unknown>) => {
    if (!mouseCapture) return;
    const dc = dataChannelRef.current;

    //   WebRTC data channel path  
    if (dc && dc.readyState === 'open') {
      const commandType =
        type === 'mouse-move' ? 'MOUSE_MOVE' :
          type === 'mouse-click' ? 'MOUSE_CLICK' :
            type === 'mouse-scroll' ? 'MOUSE_SCROLL' : null;

      if (commandType) {
        dc.send(JSON.stringify({ type: commandType, payload: data }));
        return;
      }
    }
 
  }, [mouseCapture]);


  //   Screen share start/stop (still uses socket for signalling)  
  const toggleStream = () => {
    const socket = getSocket();
    if (!streaming) {
      const sid = `session-${Date.now()}`;
      setSessionId(sid);
      socket.emit('screen-share-start', { sessionId: sid, frameRate: 30, quality: 1 });
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
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        setVisiblePanel(prev => !prev);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  if (isLoading || !authChecked) return (
    <AppLayout>
      <div className="min-h-screen  w-full flex items-center justify-center">
        <Loader className="animate-spin" size={20} />
      </div>
    </AppLayout>
  );

  if (!pairToken) return (
    <AppLayout>
      <div className="w-full flex items-center-safe justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
          <p className="text-slate-400 text-sm max-md:w-[90%] mx-auto mb-6">
            You must pair this device before you can control it.
            Pairing tokens expire after 30 min  or when you close the tab.
          </p>
          <Link href={`/pair/?d=${device?.name}&&u=${device?.user}`} className="btn !rounded-full glass-button-primary">
            <Link2 size={20} />
            Pair Device
          </Link>
        </div>
      </div>
    </AppLayout>
  );

  if (!device) return (
     <AppLayout>
      <div className="w-full flex items-center-safe justify-center">
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
      <div className={` flex w-full flex-col min-h-screen relative ${fullscreen ? 'p-0' : ' -mt-14 max-md:-mt-0 p-5'}`}>

        {visiblePanel && <div className='fixed w-full h-full top-0 z-[100] left-0 flex items-center justify-center bg-[#0000005f]  backdrop-blur-[4px] '>

          <div onClick={() => setVisiblePanel(false)} className="flex items-center gap-2 absolute right-7 top-7 max-md:top-6 max-md:right-4 rounded-full py-2 cursor-pointer px-5 glass-panel-dark">
            <X />
          </div>
          <div className='animate-spotlight !transition-all !duration-700  max-md:py-5  max-md:p-0  max-md:mt-10 mt-0  w-[80%] max-md:w-[95%] glass-panel-card p-4   rounded-4xl   h-[90%] max-md:h-[80%] overflow-y-scroll  '>
            <AppsIcons />
          </div>
        </div>}

        {/* Top bar */}
        {!fullscreen && (
          <div className="flex items-center   max-md:-mt-1 justify-between mb-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/home')} className="btn  !rounded-3xl  glass-panel-dark  p-2">
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

            <button onClick={() => { setFullscreen(true) }} className="btn glass-panel-dark !rounded-3xl  p-2">
              <Maximize2 size={15} />
            </button>
          </div>
        )}

        {/*   Main area */}
        <div className={`flex max-md:flex-col gap-4 flex-1 ${kbCapture ? ' pb-[380px] max-md:pb-[280px] ' : ' mb '} min-h-0 ${fullscreen ? 'h-full' : ''}`}>
          {/* Screen */}
          <div
            ref={controlAreaRef}
            className={`flex-1 flex flex-col min-h-screen/ items-center gap-3 min-w-0 ${fullscreen ? 'p-3' : ''}`}
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

              {/* Mouse toggle */}
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
                <button onClick={() => { setFullscreen(false); }} className="ctrl-btn ">
                  <Minimize2 size={12} /> Exit
                </button>
              )}

                {  (
                <button onClick={() => { setHamburgerOpen(!humburgerOpen); }} className={`${ !humburgerOpen ? 'bg-[#ffffff0d] text-[#94a3b8] ' : ' bg-[#6366f126] text-[#a5b4fc] '} bg-[#ffffff0d] px-3 py-2 rounded-full  hidden max-md:flex `}>
                  <LayoutGrid size={20} />
                </button>
              )}

              
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full max-md:h-fit rounded-2xl overflow-hidden relative animate-fade-up delay-2">
              <ScreenCanvas
                deviceId={deviceId}
                pairToken={pairToken}
                onMouseEvent={handleMouseEvent}
                mouseCapture={mouseCapture}
                displaySize={device.display}
                onScreenSize={(w, h) => setScreenSize({ w, h })}
                onDataChannel={handleDataChannel}
              />
            </div>
          </div>

          {/*  Side panel */}
          {!fullscreen && (
            <div className={` w-[220px] flex-shrink-0 flex backdrop-blur-3xl bg-[#ffffff05] max-md:${humburgerOpen ?' absolute ' : 'hidden '} max-md:w-[300px] right-5 top-40  max-md:pb-4 max-md:rounded-3xl max-md:p-4 pb-20 flex-col gap-3 animate-fade-up delay-2 `}>

              {/* Apps launcher */}
              <Link
                href={`/apps/${deviceId}`}

                className="glass-panel-dark rounded-full p-2 px-4 flex w-full items-center gap-2.5 hover:border-indigo-500/20 transition-colors group"
              >
                <Image src={'/apps.webp'} loading='lazy' height={35} width={35} alt='apps' />
                <div>
                  <p className=" font-semibold text-slate-200 group-hover:text-white">App Launcher  </p>
                  <p className=' text-sm'>(⌥ + space)</p>
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
                    { label: 'Spotlight', key: 'space', mod: 'command' },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => {
                        const dc = dataChannelRef.current;
                        // ── WebRTC data channel path (preferred) ──
                        if (dc && dc.readyState === 'open') {
                          dc.send(JSON.stringify({
                            type: 'KEYBOARD_SHORTCUT',
                            payload: { key: s.key, modifier: s.mod },
                          }));
                        }
                        toast(`Sent: ${s.label}`, 'info');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2  !rounded-full 4xl cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      <span className="text-xs text-slate-400   group-hover:text-slate-200">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Virtual Joystick */}
              <div className="glass-panel-dark max-md:hidden  rounded-3xl p-4 flex flex-col items-center">
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold mb-4 self-start">Joystick</p>
                <VirtualJoystick
                  screenW={screenSize.w}
                  screenH={screenSize.h}
                  enabled={mouseCapture}
                  dataChannel={dataChannel}
                />
                {!mouseCapture && (
                  <p className="text-[10px] text-slate-600 mt-3 text-center">
                    Enable Mouse to use joystick
                  </p>
                )}
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
          <div className=" items-start center absolute max-md:bg-gradient-to-t  from-[#1C0B53] to-[#503993]  bottom-10 rounded-2xl animate-fade-up  flex overflow-x-auto   min-h-[350px] left-2 max-md:left-0 w-full  max-md: pb-4 p-4  justify-start   ">
            <NormalKeyboard dataChannel={dataChannel} />
          </div>
        )}
        {mouseCapture && (
          <div className="animate-fade-up hidden max-md:flex justify-center mt-4 pb-4">
            <VirtualJoystick
              screenW={screenSize.w}
              screenH={screenSize.h}
              enabled={mouseCapture}
              dataChannel={dataChannel}
            />
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
 