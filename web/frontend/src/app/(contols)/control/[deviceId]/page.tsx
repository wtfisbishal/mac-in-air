'use client';

import { use, useEffect, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { redirect, useRouter } from 'next/navigation';
import {
  MonitorOff, Keyboard, Power,
  Moon, Lock, ArrowLeft, Maximize2, Minimize2,
  X, Loader,
  PanelRightClose, Mouse,
  EyeOff,
  Eye
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import { apiPairDevice } from '@/lib/api';
import { computePairingChallenge } from '@/lib/pairing-crypto';
import Image from 'next/image';
import AppsIcons from '../_components/AppsIcons';
import { useFullscreen } from '@/hooks/useFullscreen';
import MacKeybar from '../_components/MacKeybar';
import { Action } from '@/types';
import { ACTIONS } from '@/lib/utils';
import ScreenCanvas from '../_components/ScreenCanvas';
import VirtualJoystick from '../_components/VirtualJoystick';
import { useMutation } from '@tanstack/react-query';
interface PageProps {
  params: Promise<{ deviceId: string }>;
}

interface controlsProps {
  toggleStream: () => void;
  streaming: boolean;
  setMouseCapture: Dispatch<SetStateAction<boolean>>;
  mouseCapture: boolean;
  setKbCapture: Dispatch<SetStateAction<boolean>>;
  kbCapture: boolean
}
export default function ControlPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { data: device, isLoading } = useDevice(deviceId);
  const { toasts, toast, dismiss } = useToast();

  const [authChecked, setAuthChecked] = useState(false);
  const [pairToken, setPairToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`pairToken_${deviceId}`);
    setPairToken(token);
    setAuthChecked(true);
  }, [deviceId]);



  const [humburgerOpen, setHamburgerOpen] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [kbCapture, setKbCapture] = useState(true);
  const [mouseCapture, setMouseCapture] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const { fullscreen, setFullscreen } = useFullscreen();
  // joystick needs to know the actual Mac screen size for cursor clamping
  const [screenSize, setScreenSize] = useState({ w: device?.display?.width ?? 1920, h: device?.display?.height ?? 1080 });

  // WebRTC data channel for peer-to-peer mouse & keyboard control 
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

  // for stop streaming on unmount ------ 
  const streamingRef = useRef(streaming);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    streamingRef.current = streaming;
    sessionIdRef.current = sessionId;
  }, [streaming, sessionId]);

    // Auto-start stream on load
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (pairToken && device && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const socket = getSocket();
      const sid = `session-${Date.now()}`;
      setSessionId(sid);
      socket.emit('screen-share-start', { sessionId: sid, frameRate: 30, quality: 1 });
    }
  }, [pairToken, device, streaming]);


  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        const socket = getSocket();
        socket.emit('screen-share-stop', { sessionId: sessionIdRef.current });
      }
    };
  }, []); // ----- 

  useEffect(() => {
    const socket = getSocket();
    const handler = (updatedDevice: any) => {
      console.log("updated device is ", updatedDevice);
      if (updatedDevice.deviceId === deviceId && !updatedDevice.isOnline) {
        toast(`${device?.name || 'Device'} went offline`, 'error');
        redirect('/home');
      }
    };
    socket.on('device-status-changed', handler);
    return () => { socket.off('device-status-changed', handler); };
  }, [deviceId, device?.name, toast]);

  // Focus trap ref for keyboard capture
  const controlAreaRef = useRef<HTMLDivElement>(null);

  //  Send system/app commands to desktop agent via socket (unchanged)  
  const emit = useCallback((type: string, payload?: Record<string, unknown>) => {
    const socket = getSocket();
    socket.emit('command', { type, payload }, (result: { success: boolean; message: string }) => {
      if (!result?.success) toast(result?.message || 'Command failed', 'error');
    });
  }, [toast]);

  //   Mouse events — send over WebRTC data channel (p2p)  
  // Falls back gracefully to a no-op if the data channel is not yet open.
  const handleMouseEvent = useCallback((type: string, data: Record<string, unknown>) => {
    if (!mouseCapture) return;
    const dc = dataChannelRef.current;

    //   WebRTC data channel path  
    if (dc && dc.readyState === 'open') {
      const commandType =
        type === 'mouse-move' ? 'MOUSE_MOVE' :
          type === 'mouse-move-relative' ? 'MOUSE_MOVE_RELATIVE' :
            type === 'mouse-click' ? 'MOUSE_CLICK' :
              type === 'mouse-scroll' ? 'MOUSE_SCROLL' :
                type === 'mouse-down' ? 'MOUSE_DOWN' :
                  type === 'mouse-up' ? 'MOUSE_UP' :
                    type === 'mouse-drag' ? 'MOUSE_DRAG' : null;

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

  const fullScreenRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    if (!fullScreenRef.current) return;

    try {
      // Check if there is already an active element in full screen
      if (!document.fullscreenElement) {
        // Request fullscreen on your container element
        await fullScreenRef.current.requestFullscreen();
      } else {
        // Exit full screen mode
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen request failed:", error);
    }
  };
 
  if (isLoading || !authChecked) return (
    <AppLayout>
      <div className="min-h-screen  w-full flex items-center justify-center">
        <Loader className="animate-spin" size={20} />
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

  if (!pairToken && device.masterSalt) return (
    <AppLayout>
      <LockScreen
        deviceId={deviceId}
        deviceName={device?.name ?? deviceId}
        saltHex={device.masterSalt}
        onUnlock={(token) => {
          sessionStorage.setItem(`pairToken_${deviceId}`, token);
          setPairToken(token);
        }}
      />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );

 
  return (
    <AppLayout>
      <div className={` flex w-full flex-col min-h-screen relative ${fullscreen ? 'p-0' : '   p-5'}`}>

        {visiblePanel && <div className='fixed w-full h-full top-0 z-[100] left-0 flex items-center justify-center bg-[#0000005f]  backdrop-blur-[4px] '>

          <div onClick={() => setVisiblePanel(false)} className="flex items-center gap-2 absolute right-7 top-7 max-md:top-6 max-md:right-4 rounded-full py-2 cursor-pointer px-5 glass-panel-dark">
            <X />
          </div>
          <div className='animate-spotlight transition-all! duration-700!  max-md:py-5  max-md:p-1  max-md:mt-10 mt-0  w-[80%] max-md:w-[95%] glass-panel-card p-4   rounded-4xl   h-[90%] max-md:h-[80%] overflow-y-scroll  '>
            <AppsIcons setVisiblePanel={setVisiblePanel} deviceId={deviceId} />
          </div>
        </div>}

        {/* Top bar */}
        {!fullscreen && (
          <div className="flex items-center max-md:flex-col max-md:gap-5 max-md:items-start max-md:-mt-1 justify- mb-4 animate-fade-up">
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

            {/* Tool bars */}
            <div className="animate-spotlight ml-32 max-md:ml-0 glass-panel-dark max-md:rounded-3xl rounded-full max-md:justify-start justify-center w-fit px-3 py-2 flex items-center gap-2 max-md:gap-x-1 flex-wrap ">
              {/* Stream toggle */}

              <Controls toggleStream={toggleStream} streaming={streaming} setMouseCapture={setMouseCapture} mouseCapture={mouseCapture} setKbCapture={setKbCapture} kbCapture={kbCapture} />
              <div className="w-px h-4   bg-white/[0.06]" />

              {ACTIONS.map(a => (
                <button
                  key={a.type + (a.payload?.app ?? '')}
                  onClick={() => runAction(a)}
                  className={`ctrl-btn  ${a.variant === 'danger' ? 'danger' : ''}`}
                >
                  <a.icon size={20} />
                </button>
              ))}

              {(
                <button onClick={() => { setHamburgerOpen(!humburgerOpen); }} className={`${!humburgerOpen ? 'bg-[#ffffff0d] text-[#94a3b8] ' : ' bg-[#6366f126] text-[#a5b4fc] '} bg-[#ffffff0d] px-3 py-2 rounded-full  hidden max-md:flex `}>
                  <PanelRightClose size={20} />
                </button>
              )}
              <button onClick={() => { setFullscreen(true); toggleFullscreen() }} className="btn glass-panel-dark !rounded-3xl ">
                <Maximize2 size={15} />
              </button>
            </div>


          </div>
        )}

        {/*   Main area */}
        <div
          ref={fullScreenRef}
          className={`flex max-md:flex-col overflow-hidden gap-4 flex-1 ${kbCapture ? ' pb-[230px] max-md:pb-[0px] ' : ' mb '} min-h-0 ${fullscreen ? ' h-full ' : ''}`}>
          {/* Screen */}
          <div
            ref={controlAreaRef}
            className={` flex-1   flex-col min-h-screen max-md:h-[50vh] max-md:overflow-hidden relative items-start   ${fullscreen ? ' max-md:pt-[10%]' : 'justify-start'}  gap-3 min-w-0   `}
            tabIndex={-1}
          >
            {/* Canvas */}
            <div className=" w-full items-center flex flex-col max-md:gap-3 rounded-2xl overflow-hidden relative animate-fade-up delay-2">
              {fullscreen && (
                <div className="flex gap-2">

                  <Controls toggleStream={toggleStream} streaming={streaming} setMouseCapture={setMouseCapture} mouseCapture={mouseCapture} setKbCapture={setKbCapture} kbCapture={kbCapture} />
                  <button onClick={() => { setFullscreen(false); toggleFullscreen() }} className="ctrl-btn glass-panel-dark">
                    <Minimize2 size={12} /> Exit
                  </button>


                </div>

              )}
              <ScreenCanvas
                deviceId={deviceId}
                pairToken={pairToken!}
                onMouseEvent={handleMouseEvent}
                mouseCapture={mouseCapture}
                displaySize={device.display}
                onScreenSize={(w, h) => setScreenSize({ w, h })}
                onDataChannel={handleDataChannel}
              />
            </div>

            {kbCapture && (
              <div className=" mt-5 w-full animate-fade-up flex flex-col gap-3 ">
                <MacKeybar dataChannel={dataChannel} onCommand={(type) => emit(type)} />
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

          {/*  Side panel */}
          {!fullscreen && (
            <div className={` w-[220px] flex-shrink-0 flex max-md:backdrop-blur-3xl max-md:bg-[#ffffff05] max-md:${humburgerOpen ? ' absolute ' : 'hidden '} max-md:w-[250px]  right-5 top-40  max-md:pb-4 max-md:rounded-3xl max-md:p-4 pb-20 flex-col gap-3 animate-fade-up delay-2 `}>

              {/* Apps launcher */}
              <div
                onClick={() => setVisiblePanel(true)}
                className="glass-panel-dark rounded-full cursor-pointer p-2 px-4 flex w-full items-center gap-2.5 hover:border-indigo-500/20 transition-colors group"
              >
                <Image src={'/apps.webp'} loading='lazy' height={35} width={35} alt='apps' />
                <div>
                  <p className=" font-semibold text-slate-200 group-hover:text-white">App Launcher  </p>
                  <p className=' text-sm'>(⌥ + space)</p>
                </div>
              </div>
              {/*  shortcuts   */}
              <div className="glass-panel-dark rounded-3xl p-4 max-md:p-2 max-md:px-3">
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold mb-3">Shortcuts</p>
                <div className="space-y-1.5 max-md:flex gap-1 flex-wrap">
                  {[
                    { label: 'Copy', key: 'c', mod: 'command' },
                    { label: 'Paste', key: 'v', mod: 'command' },
                    { label: 'Select All', key: 'a', mod: 'command' },
                    { label: 'Undo', key: 'z', mod: 'command' },
                    { label: 'Spotlight', key: 'space', mod: 'command' },
                    { label: 'Mission Control', command: 'MISSION_CONTROL' },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => {
                        if ('command' in s && s.command) {
                          // System-level actions go through socket (robotjs can't do these)
                          emit(s.command);
                        } else {
                          const dc = dataChannelRef.current;
                          if (dc && dc.readyState === 'open') {
                            dc.send(JSON.stringify({
                              type: 'KEYBOARD_SHORTCUT',
                              payload: { key: s.key, modifier: s.mod },
                            }));
                          }
                        }
                        toast(`Sent: ${s.label}`, 'info');
                      }}
                      className="w-full max-md:w-fit max-md:border max-md:bg-linear-to-t to-[#f8f7f741] from-[#58585803] border-[#969393] flex items-center justify-between px-3 py-2  !rounded-full 4xl cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      <span className="text-xs text-slate-400 max-md:text-slate-100  group-hover:text-slate-200">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Virtual Joystick */}
              <div className="glass-panel-dark max-md:hidden  rounded-3xl p-4 flex flex-col items-center">
                <VirtualJoystick
                  screenW={screenSize.w}
                  screenH={screenSize.h}
                  enabled={mouseCapture}
                  dataChannel={dataChannel}
                />

              </div>

              {/* System actions */}
              <div className="glass-panel-dark rounded-3xl p-4 max-md:p-2 max-md:px-3">
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold mb-3">System</p>
                <div className="space-y-1.5 max-md:flex flex-wrap gap-2">
                  {[
                    { label: 'Lock', type: 'LOCK_SCREEN', icon: Lock },
                    { label: 'Sleep', type: 'SLEEP', icon: Moon },
                    { label: 'Restart', type: 'RESTART', icon: Power },
                    { label: 'Shutdown', type: 'SHUTDOWN', icon: Power },
                  ].map(a => (
                    <button
                      key={a.type}
                      onClick={() => { setWarning(a.type) }}
                      className={`w-full max-md:w-fit max-md:border max-md:bg-linear-to-t to-[#f8f7f741] from-[#58585803] border-[#969393]  max-md:rounded-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer text-xs font-medium transition-colors
                        ${['RESTART', 'SHUTDOWN'].includes(a.type)
                          ? 'text-red-400/70 max-md:text-red-500 hover:text-red-400 hover:bg-red-500/[0.06]'
                          : 'text-slate-400 hover:text-slate-200 max-md:text-slate-100 hover:bg-white/[0.04]'
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
 
        {/* {mouseCapture && (
          <div className="animate-fade-up hidden max-md:flex justify-center mt-4 pb-4">
            <VirtualJoystick
              screenW={screenSize.w}
              screenH={screenSize.h}
              enabled={mouseCapture}
              dataChannel={dataChannel}
            />
          </div>
        )} */}

      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}


const Controls = ({ toggleStream, streaming, setMouseCapture, mouseCapture, setKbCapture, kbCapture }: controlsProps) => {
  return (
    <>
      <button
        onClick={toggleStream}
        className={`ctrl-btn !rounded-full ${streaming ? 'active' : ''}`}
      >
        <span className={`w-2 h-2 max-md:text-xs rounded-full ${streaming ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        {streaming ? 'Streaming' : 'Start Stream'}
      </button>

      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Mouse */}
      <button
        onClick={() => setMouseCapture(p => !p)}
        className={` !rounded-full  ctrl-btn ${mouseCapture ? 'active' : ''}`}
      >
        <Mouse size={20} />
      </button>

      {/* Keyboard */}
      <button
        onClick={() => setKbCapture(p => !p)} className={`ctrl-btn ${kbCapture ? 'active' : ''}`}
      >
        <Keyboard size={20} />
      </button>

    </>
  )
}

function LockScreen({ deviceId, saltHex, onUnlock, deviceName }: { deviceId: string; saltHex: string; onUnlock: (token: string) => void; deviceName: string }) {
  const [masterPassword, setMasterPassword] = useState('');
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (saltHex && !masterPassword) throw new Error('Enter your master password');

      let pairingChallenge: string | undefined;
      if (saltHex && masterPassword) {
        pairingChallenge = await computePairingChallenge(masterPassword, saltHex, deviceId);
      }

      const result = await apiPairDevice(deviceId, pairingChallenge!);
      return result;
    },
    onSuccess: (data) => {
      if (data?.pairToken) {
        toast('Device paired! Loading control…', 'success');
        onUnlock(data.pairToken);
      }
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="w-full  h-screen flex items-center justify-center max-md:p-3 p-6">
      <div className="w-full -mt-40  flex flex-col items-center gap-6 animate-fade-up">
        <Lock size={52} />
        <h2 className="text-xl font-bold text-white mb-2">Device is Locked</h2>
        <p className="text-slate-400 max-md:text-center max-md:text-xs text-sm mx-auto ">
          This device is protected by a Master Key. Please enter it to connect.
        </p>

        <form onSubmit={submit} className="w-full  -mt-5 flex flex-col gap-4">
          <div className="w-full rounded-3xl p-6 flex flex-col gap-4">
            {/* Password field */}
            <div className="flex flex-col gap-2">

              <div className="max-md:w-full w-100 mx-auto relative">
                <input
                  id="inline-pair-password"
                  type={showPw ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={e => setMasterPassword(e.target.value)}
                  placeholder="Your master password"
                  className="w-100 max-md:w-full border-b border-white/15 font-bold px-4 py-3 pr-11 text-4xl text-white placeholder-slate-600 focus:outline-none focus:border-white placeholder:text-xl transition-colors"
                  autoComplete="current-password"
                  autoFocus
                  disabled={mutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

            </div>

            <button
              id="inline-pair-submit"
              type="submit"
              disabled={mutation.isPending || (!masterPassword && !!saltHex)}
              className="flex max-md:w-full w-100 mx-auto items-center justify-center gap-2 glass-button-primary rounded-full px-5 py-2.5 text-sm font-semibold cursor-pointer  disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {mutation.isPending
                ? <><Loader size={16} className="animate-spin" /> Connecting…</>
                : <><Power size={16} /> Connect to {deviceName}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}