'use client';

import { useEffect, useRef, useState } from 'react';
import type nipplejsType from 'nipplejs';

interface VirtualJoystickProps {
  screenW: number;
  screenH: number;
  enabled: boolean;
   dataChannel?: RTCDataChannel | null;
}

// Speed presets — multiplier applied on top of MAX_SPEED
const SPEED_PRESETS: { label: string; value: number }[] = [
  { label: '1×',   value: 1.0 },
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2.0 },
];

// tunables
const MAX_SPEED = 6;    // px per frame at full joystick deflection (at 1× speed)
const THROTTLE  = 16;   // emit at most every ~16 ms (~60 fps); desktop side throttles anyway
const SMOOTHING = 0.18; // lower = smoother but sluggish; 0.18 feels natural

function sendMouseEvent(
  dataChannel: RTCDataChannel | null | undefined,
  type: 'MOUSE_MOVE' | 'MOUSE_CLICK',
  payload: Record<string, unknown>
) {
   if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({ type, payload }));
    return;
  }  
}

export default function VirtualJoystick({ screenW, screenH, enabled, dataChannel }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef   = useRef<ReturnType<typeof nipplejsType.create> | null>(null);
  const rafRef       = useRef<number | null>(null);
  const cursorRef    = useRef({ x: screenW / 2, y: screenH / 2 });

  // Raw joystick target velocity [-1, 1]; smoothed velocity accumulated over frames
  const rawVelRef    = useRef({ vx: 0, vy: 0 });
  const smoothVelRef = useRef({ vx: 0, vy: 0 });

  const lastEmitRef  = useRef(0);

  // Speed multiplier — kept in both state (for UI) and ref (for RAF loop)
  const [speedIdx, setSpeedIdx] = useState(0);
  const speedRef = useRef(SPEED_PRESETS[0].value);

  // Keep a stable ref to the current data channel so the RAF loop can read it
  const dcRef = useRef(dataChannel);
  useEffect(() => { dcRef.current = dataChannel; }, [dataChannel]);

  // ── animation loop ──────────────────────────────────────────────────────────
  const startLoop = () => {
    if (rafRef.current !== null) return;

    const tick = (now: number) => {
      const { vx: rawVx, vy: rawVy } = rawVelRef.current;

      // Exponential smoothing toward raw target
      smoothVelRef.current.vx += (rawVx - smoothVelRef.current.vx) * SMOOTHING;
      smoothVelRef.current.vy += (rawVy - smoothVelRef.current.vy) * SMOOTHING;

      const { vx, vy } = smoothVelRef.current;
      const speed = speedRef.current;

      if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
        cursorRef.current.x = Math.max(0, Math.min(screenW, cursorRef.current.x + vx * MAX_SPEED * speed));
        cursorRef.current.y = Math.max(0, Math.min(screenH, cursorRef.current.y + vy * MAX_SPEED * speed));

        if (now - lastEmitRef.current >= THROTTLE) {
          lastEmitRef.current = now;
          sendMouseEvent(dcRef.current, 'MOUSE_MOVE', {
            x: Math.round(cursorRef.current.x),
            y: Math.round(cursorRef.current.y),
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rawVelRef.current    = { vx: 0, vy: 0 };
    // Let smoothing decay naturally — don't hard-reset so release feels smooth
  };

  // nipplejs setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    let manager: ReturnType<typeof nipplejsType.create>;
    
    import('nipplejs').then((module) => {
      const nipplejs = module.default || module;
      manager = nipplejs.create({
        zone: containerRef.current!,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        size: 80,
        restOpacity: 0.75,
        fadeTime: 150,
        multitouch: false,
      });
      managerRef.current = manager;

      manager.on('move', (evt: any) => {
        const d = evt?.data || evt;
        if (!d || !d.vector) return;

        const vx: number =  d.vector.x;
        const vy: number = -d.vector.y; // nipplejs y is positive UP; screen is positive DOWN

        rawVelRef.current = { vx, vy };
        startLoop();
      });

      manager.on('start', () => {
        lastEmitRef.current = 0;
        smoothVelRef.current = { vx: 0, vy: 0 };
      });

      manager.on('end', () => {
        rawVelRef.current = { vx: 0, vy: 0 };
        // loop keeps running so smoothing can decay; it will stop emitting when vel ≈ 0
        setTimeout(stopLoop, 300); // give 300 ms for smooth coast-to-stop
      });
    });

    return () => {
      stopLoop();
      if (managerRef.current) {
        managerRef.current.destroy();
      }
      managerRef.current = null;
    };
   }, [enabled, screenW, screenH]);

  // Clamp virtual cursor when screen dimensions change
  useEffect(() => {
    cursorRef.current = {
      x: Math.min(cursorRef.current.x, screenW),
      y: Math.min(cursorRef.current.y, screenH),
    };
  }, [screenW, screenH]);

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEED_PRESETS.length;
    setSpeedIdx(next);
    speedRef.current = SPEED_PRESETS[next].value;
  };

  const currentPreset = SPEED_PRESETS[speedIdx];

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-opacity duration-200 ${
        enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'
      }`}
    >
      {/* ── Joystick with speed badge in center ── */}
      <div
        ref={containerRef}
        className="relative rounded-full touch-none select-none overflow-hidden"
        style={{
          width: 120,
          height: 120,
          border: '1.5px solid rgba(99,102,241,0.25)',
          boxShadow: '0 0 20px rgba(99,102,241,0.08) inset, 0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Speed cycle button — centered, tappable but doesn't interfere with joystick drag */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); cycleSpeed(); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            background:
              speedIdx === 0
                ? 'rgba(30,30,50,0.55)'
                : speedIdx === 1
                ? 'linear-gradient(135deg, rgba(99,102,241,0.55), rgba(139,92,246,0.55))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.65), rgba(239,68,68,0.55))',
            boxShadow:
              speedIdx === 0
                ? '0 0 6px rgba(99,102,241,0.2)'
                : speedIdx === 1
                ? '0 0 10px rgba(99,102,241,0.45)'
                : '0 0 14px rgba(245,158,11,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
          }}
          className="active:scale-90"
          title={`Speed: ${currentPreset.label} — tap to cycle`}
        >
          <span
            style={{
              fontSize: speedIdx === 1 ? 9 : 10,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.3px',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {currentPreset.label}
          </span>
        </button>
      </div>

      {/* ── Click buttons ── */}
      {enabled && (
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => sendMouseEvent(dataChannel, 'MOUSE_CLICK', { button: 'left' })}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            L Click
          </button>
          <button
            onClick={() => sendMouseEvent(dataChannel, 'MOUSE_CLICK', { button: 'right' })}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            R Click
          </button>
        </div>
      )}
    </div>
  );
}
