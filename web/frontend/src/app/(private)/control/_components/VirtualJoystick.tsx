'use client';

import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import { getSocket } from '@/lib/socket';

interface VirtualJoystickProps {
  screenW: number;
  screenH: number;
  enabled: boolean;
}

// ── tunables ──────────────────────────────────────────────────────────────────
const MAX_SPEED  = 18;   // max px per frame at full joystick deflection
const THROTTLE   = 33;   // emit at most every 33ms (~30fps) to avoid socket flood

export default function VirtualJoystick({ screenW, screenH, enabled }: VirtualJoystickProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const managerRef    = useRef<ReturnType<typeof nipplejs.create> | null>(null);
  const rafRef        = useRef<number | null>(null);
  const cursorRef     = useRef({ x: screenW / 2, y: screenH / 2 });
  // normalised velocity components [-1, 1] set by joystick; zero when released
  const velRef        = useRef({ vx: 0, vy: 0 });
  const lastEmitRef   = useRef(0);

  // ── animation loop ──────────────────────────────────────────────────────────
  const startLoop = () => {
    if (rafRef.current !== null) return;
    const tick = (now: number) => {
      const { vx, vy } = velRef.current;
      if (vx !== 0 || vy !== 0) {
        cursorRef.current.x = Math.max(0, Math.min(screenW, cursorRef.current.x + vx * MAX_SPEED));
        cursorRef.current.y = Math.max(0, Math.min(screenH, cursorRef.current.y + vy * MAX_SPEED));

        // Throttle socket emissions — robotjs on desktop can't process 60 events/sec
        if (now - lastEmitRef.current >= THROTTLE) {
          lastEmitRef.current = now;
          getSocket().emit('mouse-move', {
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
    velRef.current = { vx: 0, vy: 0 };
  };

  // ── nipplejs setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    const manager = nipplejs.create({
      zone:        containerRef.current,
      mode:        'static',
      position:    { left: '50%', top: '50%' },
      color:       '#6366f1',
      size:        110,
      restOpacity: 0.75,
      fadeTime:    150,
      multitouch:  false,
    });
    managerRef.current = manager;

    // nipplejs v1 InternalEvent shape: { type, target, data: JoystickEventData }
    // JoystickEventData.vector = { x: [-1,1], y: [-1,1] } — already normalised,
    // screen-corrected (y positive = down), and dead-zone handled by nipplejs itself.
    manager.on('move', (evt: any) => {
      const d = evt?.data ?? evt;
      // vector.x = right (+), vector.y = down (+) — perfect for screen coords
      const vx: number = d?.vector?.x ?? 0;
      const vy: number = d?.vector?.y ?? 0;
      velRef.current = { vx, vy };
      startLoop();
    });

    manager.on('start', () => {
      // Reset cursor to current position on new drag; loop started by first 'move'
      lastEmitRef.current = 0;
    });

    manager.on('end', () => {
      stopLoop();
    });

    return () => {
      stopLoop();
      manager.destroy();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, screenW, screenH]);

  // Clamp virtual cursor when screen dimensions change
  useEffect(() => {
    cursorRef.current = {
      x: Math.min(cursorRef.current.x, screenW),
      y: Math.min(cursorRef.current.y, screenH),
    };
  }, [screenW, screenH]);

  return (
    <div
      className={`
        flex flex-col items-center gap-3
        transition-opacity duration-200
        ${enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}
      `}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Joystick
      </span>

      <div
        ref={containerRef}
        className="relative rounded-full touch-none select-none overflow-hidden"
        style={{
          width:  120,
          height: 120,
          background:
            'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 70%, transparent 100%)',
          border:    '1.5px solid rgba(99,102,241,0.25)',
          boxShadow: '0 0 20px rgba(99,102,241,0.08) inset, 0 4px 20px rgba(0,0,0,0.3)',
        }}
      />

      {enabled && (
        <div className="flex gap-3 mt-1">
          <button 
            onClick={() => getSocket().emit('mouse-click', { button: 'left' })} 
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            Left Click
          </button>
          <button 
            onClick={() => getSocket().emit('mouse-click', { button: 'right' })} 
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            Right Click
          </button>
        </div>
      )}

      <p className="text-[9px] text-slate-600 text-center leading-tight mt-1">
        {enabled ? 'Drag to move cursor' : 'Enable Mouse to activate'}
      </p>
    </div>
  );
}
