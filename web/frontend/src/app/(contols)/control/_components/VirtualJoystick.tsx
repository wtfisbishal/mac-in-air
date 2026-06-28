'use client';

import { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';

interface VirtualJoystickProps {
  screenW?: number;
  screenH?: number;
  enabled?: boolean;
  dataChannel?: RTCDataChannel | null;
}

// ── Tuning ───────────────────────────────────────────────────────────────────
const TICK_MS        = 14;   // ~72 fps
const BASE_SPEED     = 14;   // px/tick at max push
const ACCEL_EXPONENT = 1.7;  // exponential feel
const DEAD_ZONE      = 0.05; // ignore wobble < 5 %
// ────────────────────────────────────────────────────────────────────────────

export default function VirtualJoystick({
  enabled = false,
  dataChannel,
}: VirtualJoystickProps) {
  const zoneRef      = useRef<HTMLDivElement>(null);
  const vecRef       = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a live ref to dataChannel so the setInterval closure always sees it
  const dcRef        = useRef<RTCDataChannel | null | undefined>(dataChannel);
  const enabledRef   = useRef(enabled);
  const [active, setActive]   = useState(false);
  const [label,  setLabel]    = useState<'Ready' | 'Moving' | 'Disabled'>('Disabled');

  // Sync refs on every render so closures see fresh values
  useEffect(() => { dcRef.current      = dataChannel; }, [dataChannel]);
  useEffect(() => { enabledRef.current = enabled;     }, [enabled]);

  useEffect(() => {
    setLabel(enabled ? 'Ready' : 'Disabled');
  }, [enabled]);

  // ── Dispatch loop ─────────────────────────────────────────────────────────
  const startLoop = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (!enabledRef.current) return;

      const { x, y } = vecRef.current;
      const dist = Math.sqrt(x * x + y * y);
      if (dist < DEAD_ZONE) return;

      const speed = BASE_SPEED * Math.pow(dist, ACCEL_EXPONENT);
      const dx    = (x / dist) * speed;
      const dy    = -(y / dist) * speed; // nipplejs Y is flipped

      const dc = dcRef.current;
      if (!dc || dc.readyState !== 'open') return;

      dc.send(JSON.stringify({
        type: 'MOUSE_MOVE_RELATIVE',
        payload: { dx: Math.round(dx), dy: Math.round(dy) },
      }));
    }, TICK_MS);
  };

  const stopLoop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    vecRef.current = { x: 0, y: 0 };
  };

  // ── Mount nipplejs ────────────────────────────────────────────────────────
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const manager = nipplejs.create({
      zone,
      mode:        'static',
      position:    { left: '50%', top: '50%' },
      size:        140,
      color:       '#6366f1',   // indigo — nipplejs only accepts hex/named
      restOpacity: 0.6,
      fadeTime:    200,
    });

    manager.on('start', () => {
      setActive(true);
      setLabel('Moving');
      startLoop();
    });

    manager.on('move', (_evt, data) => {
      if (data?.vector) {
        vecRef.current = { x: data.vector.x, y: data.vector.y };
      }
    });

    manager.on('end', () => {
      setActive(false);
      setLabel(enabledRef.current ? 'Ready' : 'Disabled');
      stopLoop();
    });

    return () => {
      stopLoop();
      manager.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only mount once

  return (
    <div
      className="flex flex-col items-center gap-3 w-full select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Joystick zone container */}
      <div
        style={{
          position:   'relative',
          width:      176,
          height:     176,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, rgba(99,102,241,0.13), rgba(0,0,0,0.38))',
          boxShadow: active
            ? '0 0 0 2px rgba(99,102,241,0.65), inset 0 0 30px rgba(99,102,241,0.18)'
            : '0 0 0 1px rgba(255,255,255,0.06), inset 0 0 22px rgba(0,0,0,0.45)',
          transition: 'box-shadow 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* Crosshair */}
        <span style={{
          position: 'absolute', left: '50%', top: '12%',
          width: 1, height: '76%',
          background: 'rgba(255,255,255,0.08)',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }} />
        <span style={{
          position: 'absolute', top: '50%', left: '12%',
          height: 1, width: '76%',
          background: 'rgba(255,255,255,0.08)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />

        {/* nipplejs attaches to this element */}
        <div
          ref={zoneRef}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            // Must NOT have pointer-events: none — nipple needs touch/mouse events
          }}
        />
      </div>

      {/* Status */}
      <p
        className="text-[10px] tracking-widest uppercase font-medium transition-colors"
        style={{ color: active ? '#818cf8' : enabled ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.4)' }}
      >
        {label}
      </p>

      <p className="text-[9px] text-slate-600 text-center">
        Push farther for faster movement
      </p>
    </div>
  );
}
