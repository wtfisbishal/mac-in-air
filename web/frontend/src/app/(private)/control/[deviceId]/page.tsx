'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MonitorOff, Keyboard, MousePointer2, Camera,
  Power, Moon, Lock, Terminal, Globe, ArrowLeft,
  Loader2, Maximize2, Minimize2, Volume2, LayoutGrid, ShieldAlert,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';

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
  { label: 'Screenshot', icon: Camera, type: 'SCREENSHOT' },
  { label: 'Terminal', icon: Terminal, type: 'OPEN_APP', payload: { app: 'Terminal' } },
  { label: 'Browser', icon: Globe, type: 'OPEN_APP', payload: { app: 'Safari' } },
  { label: 'Sleep', icon: Moon, type: 'SLEEP' },
  { label: 'Lock', icon: Lock, type: 'LOCK_SCREEN' },
  { label: 'Restart', icon: Power, type: 'RESTART', variant: 'danger' },
  { label: 'Shutdown', icon: Power, type: 'SHUTDOWN', variant: 'danger' },
];

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hasFrame, setHasFrame] = useState(false);
  const [dimLabel, setDimLabel] = useState('');
  const screenSize = useRef({ w: 1920, h: 1080 }); // actual Mac screen size from frames

  // Receive screen frames from socket
  useEffect(() => {
    const socket = getSocket();

    // Join the device room; present pairToken for server-side auth
    socket.emit('join-device', { deviceId, pairToken }, (res?: { success: boolean; message?: string }) => {
      if (res && !res.success) {
        console.warn('[ScreenCanvas] join-device rejected:', res.message);
      }
    });

    const handleFrame = (data: {
      frame: ArrayBuffer | string;
      width: number;
      height: number;
      mimeType?: string;
    }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      screenSize.current = { w: data.width, h: data.height };
      if (canvas.width !== data.width) canvas.width = data.width;
      if (canvas.height !== data.height) canvas.height = data.height;
      setDimLabel(`${data.width} × ${data.height}`);

      const mimeType = data.mimeType ?? 'image/jpeg';

      const drawBlob = (blob: Blob) => {
        // createImageBitmap decodes off the main thread — faster and smoother
        createImageBitmap(blob).then((bitmap) => {
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close(); // free GPU memory
        }).catch(() => {
          // Fallback to Image element if createImageBitmap not supported
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); };
          img.src = url;
        });
      };

      if (typeof data.frame === 'string') {
        // Base64-encoded frame
        fetch(`data:${mimeType};base64,${data.frame}`)
          .then(r => r.blob())
          .then(drawBlob);
      } else {
        // Binary ArrayBuffer frame
        drawBlob(new Blob([data.frame], { type: mimeType }));
      }

      if (!hasFrame) setHasFrame(true);
    };

    socket.on('screen-frame', handleFrame);
    return () => { socket.off('screen-frame', handleFrame); };
  }, [deviceId, hasFrame]);


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
      className="relative w-full bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9', cursor: 'none' }}
      onMouseMove={e => onMouseEvent('mouse-move', toScreenCoords(e))}
      onClick={e => onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'left' })}
      onContextMenu={e => { e.preventDefault(); onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'right' }); }}
      onDoubleClick={e => onMouseEvent('mouse-click', { ...toScreenCoords(e), button: 'left', doubleClick: true })}
      onWheel={e => onMouseEvent('mouse-scroll', { x: Math.round(e.deltaX), y: Math.round(e.deltaY) })}
    >
      <canvas ref={canvasRef} className="w-full h-full object-contain" />

      {/* Custom cursor dot */}
      {/* Shown in overlay approach — canvas itself has cursor:none */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {!hasFrame && (
          <div className="text-center">
            <MonitorOff size={48} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Waiting for screen stream…</p>
            <p className="text-slate-600 text-xs mt-1">Make sure screen sharing is started on the desktop agent</p>
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

// ── Main Control Room ─────────────────────────────────────────────────────────
export default function ControlPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { data: device, isLoading } = useDevice(deviceId);
  const { toasts, toast, dismiss } = useToast();

  // ── Authorization: require a pairToken stored during the pairing flow ────────
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
  const [fullscreen, setFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Focus trap ref for keyboard capture
  const controlAreaRef = useRef<HTMLDivElement>(null);

  // ── Send any event to desktop agent via socket ──────────────────────────────
  const emit = useCallback((type: string, payload?: Record<string, unknown>) => {
    const socket = getSocket();
    socket.emit('command', { type, payload }, (result: { success: boolean; message: string }) => {
      if (!result?.success) toast(result?.message || 'Command failed', 'error');
    });
  }, [toast]);

  // ── Mouse events ────────────────────────────────────────────────────────────
  const handleMouseEvent = useCallback((type: string, data: Record<string, unknown>) => {
    if (!mouseCapture) return;
    const socket = getSocket();
    socket.emit(type, data); // fire-and-forget for low latency
  }, [mouseCapture]);

  // ── Keyboard capture ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!kbCapture) return;
    const handler = (e: KeyboardEvent) => {
      // Prevent browser shortcuts when capturing
      e.preventDefault();
      const modifiers: string[] = [];
      if (e.ctrlKey || e.metaKey) modifiers.push('command');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');

      // Printable single chars → typeString
      if (e.key.length === 1 && modifiers.length === 0) {
        const socket = getSocket();
        socket.emit('keyboard-type', { text: e.key });
      } else {
        // Special keys / shortcuts
        const socket = getSocket();
        socket.emit('keyboard-shortcut', { key: e.key.toLowerCase(), modifier: modifiers });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [kbCapture]);

  // ── Screen share start/stop ──────────────────────────────────────────────────
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

  // ── Quick actions ────────────────────────────────────────────────────────────
  const runAction = (action: Action) => {
    emit(action.type, action.payload);
    toast(`Sent: ${action.label}`, 'info');
  };

  if (isLoading || !authChecked) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    </AppLayout>
  );

  // ── Not authorized: no pairToken in sessionStorage ──────────────────────────
  // if (!pairToken) return (
  //   <AppLayout>
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center max-w-sm">
  //         <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
  //           <ShieldAlert size={32} className="text-red-400" />
  //         </div>
  //         <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
  //         <p className="text-slate-400 text-sm mb-6">
  //           You must pair this device before you can control it.
  //           Pairing tokens expire after 15 min  or when you close the tab.
  //         </p>
  //         <Link href="/pair" className="btn btn-primary">
  //           Pair Device
  //         </Link>
  //       </div>
  //     </div>
  //   </AppLayout>
  // );

  if (!device) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MonitorOff size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Device not found</p>
          <button onClick={() => router.push('/home')} className="btn btn-ghost mt-4 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className={`flex w-full  flex-col h-screen ${fullscreen ? 'p-0' : 'p-5'}`}>
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        {!fullscreen && (
          <div className="flex items-center justify-between mb-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/home')} className="btn btn-ghost p-2">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight capitalize"> {device?.user}'s {device.name}</h1>
                <p className="text-xs text-slate-500">{device.platform} · {device.arch}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${device.isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
              >
                <span className={device.isOnline ? 'dot-online' : 'dot-offline'} />
                {device.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <button onClick={() => setFullscreen(true)} className="btn btn-ghost p-2">
              <Maximize2 size={15} />
            </button>
          </div>
        )}

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div className={`flex gap-4 flex-1 min-h-0 ${fullscreen ? 'h-full' : ''}`}>
          {/* Screen */}
          <div
            ref={controlAreaRef}
            className={`flex-1 flex flex-col gap-3 min-w-0 ${fullscreen ? 'p-3' : ''}`}
            tabIndex={-1}
            style={{ outline: 'none' }}
          >
            {/* Toolbar */}
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap animate-fade-up delay-1">
              {/* Stream toggle */}
              <button
                onClick={toggleStream}
                className={`ctrl-btn ${streaming ? 'active' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${streaming ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {streaming ? 'Streaming' : 'Start Stream'}
              </button>

              <div className="w-px h-4 bg-white/[0.06]" />

              {/* Mouse capture toggle */}
              <button
                onClick={() => setMouseCapture(p => !p)}
                className={`ctrl-btn ${mouseCapture ? 'active' : ''}`}
                title="Toggle mouse control"
              >
                <MousePointer2 size={12} />
                Mouse {mouseCapture ? 'ON' : 'OFF'}
              </button>

              {/* Keyboard capture toggle */}
              <button
                onClick={() => setKbCapture(p => !p)}
                className={`ctrl-btn ${kbCapture ? 'active' : ''}`}
                title="Toggle keyboard capture — captures all keystrokes"
              >
                <Keyboard size={12} />
                Keyboard {kbCapture ? 'ON' : 'OFF'}
              </button>

              <div className="w-px h-4 bg-white/[0.06]" />

              {/* Quick actions */}
              {ACTIONS.map(a => (
                <button
                  key={a.type + (a.payload?.app ?? '')}
                  onClick={() => runAction(a)}
                  className={`ctrl-btn ${a.variant === 'danger' ? 'danger' : ''}`}
                >
                  <a.icon size={12} />
                  {a.label}
                </button>
              ))}

              {/* Fullscreen exit */}
              {fullscreen && (
                <button onClick={() => setFullscreen(false)} className="ctrl-btn ml-auto">
                  <Minimize2 size={12} /> Exit
                </button>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 glass rounded-2xl overflow-hidden relative animate-fade-up delay-2">
              <ScreenCanvas deviceId={deviceId} pairToken={pairToken} onMouseEvent={handleMouseEvent} />

              {/* Keyboard capture overlay indicator */}
              {kbCapture && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-semibold flex items-center gap-2 backdrop-blur-sm">
                  <Keyboard size={11} /> Keyboard captured — press Esc to release
                </div>
              )}
            </div>

            {/* Keyboard type bar (always visible shortcut) */}
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-3 animate-fade-up delay-3">
              <Volume2 size={14} className="text-slate-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Type text and press Enter to send directly to Mac…"
                className="flex-1 bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-600"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) { emit('KEYBOARD_TYPE', { text: val }); e.currentTarget.value = ''; toast(`Typed: ${val}`, 'info'); }
                  }
                }}
              />
              <kbd className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500 font-mono">Enter</kbd>
            </div>
          </div>

          {/* ── Side panel (only when not fullscreen) ────────────────────── */}
          {!fullscreen && (
            <div className="w-[220px] flex-shrink-0 flex flex-col gap-3 animate-fade-up delay-2">

              {/* Device info */}
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">Device</p>
                {[
                  ['Name', device.name],
                  ['Platform', device.platform],
                  ['Arch', device.arch],
                  ['Status', device.isOnline ? 'Online' : 'Offline'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-200 font-medium truncate ml-2">{v}</span>
                  </div>
                ))}
              </div>

              {/* Apps launcher link */}
              <Link
                href={`/apps/${deviceId}`}
                className="glass rounded-2xl p-3 flex items-center gap-2.5 hover:border-indigo-500/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
                  <LayoutGrid size={14} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white">App Launcher</p>
                  <p className="text-[10px] text-slate-500">Browse & open apps</p>
                </div>
              </Link>

              {/* Quick shortcuts panel */}
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">Shortcuts</p>
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
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
                    >
                      <span className="text-xs text-slate-400 group-hover:text-slate-200">{s.label}</span>
                      <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">⌘{s.key.toUpperCase().slice(0, 1)}</kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* System actions */}
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">System</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Lock Screen', type: 'LOCK_SCREEN', icon: Lock },
                    { label: 'Sleep', type: 'SLEEP', icon: Moon },
                    { label: 'Restart', type: 'RESTART', icon: Power },
                    { label: 'Shutdown', type: 'SHUTDOWN', icon: Power },
                  ].map(a => (
                    <button
                      key={a.type}
                      onClick={() => { emit(a.type); toast(`Sent: ${a.label}`, 'info'); }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
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
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
