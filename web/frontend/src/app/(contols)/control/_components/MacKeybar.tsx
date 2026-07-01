'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import "./key.css";

// ─── Key-name translation (browser → robot-framework / pyautogui) ──────────────
const BROWSER_TO_ROBOT: Record<string, string> = {
  ArrowLeft: 'left', ArrowRight: 'right',
  ArrowUp: 'up', ArrowDown: 'down',
  Enter: 'enter', Tab: 'tab',
  Backspace: 'backspace', Escape: 'escape',
  Delete: 'delete', Home: 'home',
  End: 'end', PageUp: 'pageup',
  PageDown: 'pagedown', ' ': 'space',
  F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4',
  F5: 'f5', F6: 'f6', F7: 'f7', F8: 'f8',
  F9: 'f9', F10: 'f10', F11: 'f11', F12: 'f12',
  '.': '.', ',': ',', '/': '/', ';': ';',
  "'": "'", '[': '[', ']': ']', '\\': '\\',
  '-': '-', '=': '=', '`': '`',
  '>': '.', '<': ',', '?': '/', ':': ';',
  '"': "'", '{': '[', '}': ']', '|': '\\',
  '_': '-', '+': '=', '~': '`',
  '!': '1', '@': '2', '#': '3', '$': '4',
  '%': '5', '^': '6', '&': '7', '*': '8',
  '(': '9', ')': '0',
};

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'OS']);
const NON_TYPE_KEYS = new Set([
  'space', 'enter', 'tab', 'backspace', 'escape', 'delete',
  'left', 'right', 'up', 'down', 'home', 'end', 'pageup', 'pagedown',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
]);

const DEDUP_MS = 40;
const lastEmitAt = new Map<string, number>();

function emitKey(
  key: string,
  modifiers: string[],
  dataChannel: RTCDataChannel | null | undefined,
) {
  const dedupKey = key + '|' + modifiers.slice().sort().join('+');
  const now = Date.now();
  if (now - (lastEmitAt.get(dedupKey) ?? 0) < DEDUP_MS) return;
  lastEmitAt.set(dedupKey, now);

  const isPlain = key.length === 1 && !NON_TYPE_KEYS.has(key) && modifiers.length === 0;

  if (dataChannel && dataChannel.readyState === 'open') {
    if (isPlain) {
      dataChannel.send(JSON.stringify({ type: 'KEYBOARD_TYPE', payload: { text: key } }));
    } else {
      dataChannel.send(JSON.stringify({ type: 'KEYBOARD_SHORTCUT', payload: { key, modifier: modifiers } }));
    }
  }
}

// ─── Props  
interface MacKeybarProps {
  dataChannel?: RTCDataChannel | null;
  /** Optional socket-level command emitter (same as page.tsx `emit`). Used for
   *  system actions (Mission Control, etc.) that robotjs cannot trigger. */
  onCommand?: (type: string) => void;
}

type ModName = 'command' | 'control' | 'alt' | 'shift';

interface KeyDef {
  label: React.ReactNode;
  /** robot-framework key name, 'MOD:xxx' for modifiers, or 'SHORTCUT:key:mod1+mod2' for preset combos */
  key: string;
  /** extra class for sizing */
  cls?: string;
  /** show a separator after this key */
  sep?: boolean;
}

const FN_ROW: KeyDef[] = [
  { label: 'Esc', key: 'escape', cls: 'mkb-w-12' },
  // { label: 'F1',  key: 'f1',  cls: 'mkb-w-10' },
  // { label: 'F2',  key: 'f2',  cls: 'mkb-w-10' },
  // { label: 'F3',  key: 'f3',  cls: 'mkb-w-10' },
  // { label: 'F4',  key: 'f4',  cls: 'mkb-w-10' },
  // { label: 'F5',  key: 'f5',  cls: 'mkb-w-10', sep: true },
  // { label: 'F6',  key: 'f6',  cls: 'mkb-w-10' },
  // { label: 'F7',  key: 'f7',  cls: 'mkb-w-10' },
  // { label: 'F8',  key: 'f8',  cls: 'mkb-w-10', sep: true },
  // { label: 'F9',  key: 'f9',  cls: 'mkb-w-10' },
  // { label: 'F10', key: 'f10', cls: 'mkb-w-11' },
  // { label: 'F11', key: 'f11', cls: 'mkb-w-11' },
  // { label: 'F12', key: 'f12', cls: 'mkb-w-11' },
];

const NAV_ROW: KeyDef[] = [
  { label: 'Esc', key: 'escape', cls: 'mkb-w-12' },
  { label: 'Delete', key: 'backspace', cls: 'mkb-w-24' },
  { label: 'Home', key: 'home', cls: 'mkb-w-20' },
  { label: 'End', key: 'end', cls: 'mkb-w-20' },
  { label: 'PgUp', key: 'pageup', cls: 'mkb-w-20' },
  { label: 'PgDn', key: 'pagedown', cls: 'mkb-w-20' },
  // SHORTCUT_CMD: prefix → fires as a socket command (not keyboard shortcut)
  {
    label: <span className="mkb-mod-label"><span className="mkb-mod-sym" style={{ fontSize: 13 }}>⊞</span><span className="mkb-mod-name">Mission</span></span>,
    key: 'SHORTCUT_CMD:MISSION_CONTROL', cls: 'mkb-w-20'
  },
];

const STRUCT_ROW: KeyDef[] = [
  { label: 'Caps', key: 'MOD:capslock', cls: 'mkb-w-20' },
  { label: 'Tab', key: 'tab', cls: 'mkb-w-16' },
  { label: 'return', key: 'enter', cls: 'mkb-w-20' },
  { label: <span style={{ letterSpacing: '0.15em', fontSize: 11 }}>Space</span>, key: 'space', cls: 'mkb-w-32' },
];

const MOD_STICKY: KeyDef[] = [
  { label: <span className="mkb-mod-label"><span className="mkb-mod-name">Ctrl</span></span>, key: 'MOD:control', cls: 'mkb-w-16' },
  { label: <span className="mkb-mod-label"><span className="mkb-mod-name">Opt</span></span>, key: 'MOD:alt', cls: 'mkb-w-16' },
  { label: <span className="mkb-mod-label"><span className="mkb-mod-name">Cmd</span></span>, key: 'MOD:command', cls: 'mkb-w-18' },
  { label: <span className="mkb-mod-label"><span className="mkb-mod-sym"></span><span className="mkb-mod-name">Shift</span></span>, key: 'MOD:shift', cls: 'mkb-w-20' },
];

const ARROW_KEYS: KeyDef[] = [
  { label: '▲', key: 'up' },
  { label: '▼', key: 'down' },
  { label: '◀', key: 'left' },
  { label: '▶', key: 'right' },
];

export default function MacKeybar({ dataChannel, onCommand }: MacKeybarProps) {
  const [stickyMods, setStickyMods] = useState<Set<ModName>>(new Set());
  const [capsActive, setCapsActive] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const stickyModsRef = useRef<Set<ModName>>(new Set());
  stickyModsRef.current = stickyMods;

  const flash = useCallback((key: string) => {
    setPressedKeys(p => new Set(p).add(key));
    setTimeout(() => setPressedKeys(p => { const n = new Set(p); n.delete(key); return n; }), 150);
  }, []);

  // ── Physical keyboard listener ─────────────────────────────────────────────
  useEffect(() => {
    const held = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      e.preventDefault();

      if (e.metaKey) { setStickyMods(p => new Set(p).add('command')); flash('MOD:command'); }
      if (e.ctrlKey) { setStickyMods(p => new Set(p).add('control')); flash('MOD:control'); }
      if (e.altKey) { setStickyMods(p => new Set(p).add('alt')); flash('MOD:alt'); }
      if (e.shiftKey) { setStickyMods(p => new Set(p).add('shift')); flash('MOD:shift'); }

      if (MODIFIER_KEYS.has(e.key)) return;

      const keyId = e.code || e.key;
      if (held.has(keyId)) return;
      held.add(keyId);

      const modifiers: string[] = [];
      if (e.metaKey || stickyModsRef.current.has('command')) modifiers.push('command');
      if (e.ctrlKey || stickyModsRef.current.has('control')) modifiers.push('control');
      if (e.altKey || stickyModsRef.current.has('alt')) modifiers.push('alt');
      if (e.shiftKey || stickyModsRef.current.has('shift')) modifiers.push('shift');
      const uniqueMods = [...new Set(modifiers)];

      const robotKey = BROWSER_TO_ROBOT[e.key] ?? (e.key.length === 1 ? e.key.toLowerCase() : null);
      if (!robotKey) return;

      flash(robotKey);
      emitKey(robotKey, uniqueMods, dataChannel);
      setStickyMods(new Set());
    };

    const onKeyUp = (e: KeyboardEvent) => {
      held.delete(e.code || e.key);
      if (!e.metaKey) setStickyMods(p => { const n = new Set(p); n.delete('command'); return n; });
      if (!e.ctrlKey) setStickyMods(p => { const n = new Set(p); n.delete('control'); return n; });
      if (!e.altKey) setStickyMods(p => { const n = new Set(p); n.delete('alt'); return n; });
      if (!e.shiftKey) setStickyMods(p => { const n = new Set(p); n.delete('shift'); return n; });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dataChannel, flash]);

  // ── Button click handler ───────────────────────────────────────────────────
  const handleKey = useCallback((keyDef: KeyDef) => {
    const { key } = keyDef;

    // ── Socket-level system command: SHORTCUT_CMD:COMMAND_TYPE ──
    // Used for actions robotjs cannot handle (Mission Control, media keys, etc.)
    if (key.startsWith('SHORTCUT_CMD:')) {
      const commandType = key.slice('SHORTCUT_CMD:'.length);
      flash(key);
      onCommand?.(commandType);
      return;
    }

    // ── Preset keyboard shortcut: SHORTCUT:key:mod1+mod2 ──
    if (key.startsWith('SHORTCUT:')) {
      const parts = key.split(':'); // ['SHORTCUT', 'up', 'control+shift']
      const robotKey = parts[1];
      const mods = parts[2] ? parts[2].split('+') : [];
      flash(key);
      emitKey(robotKey, mods, dataChannel);
      return; // do NOT disarm sticky mods
    }

    // ── Modifier toggle (sticky) ──
    if (key.startsWith('MOD:')) {
      const mod = key.slice(4) as ModName | 'capslock';

      if (mod === 'capslock') {
        setCapsActive(p => !p);
        flash('MOD:capslock');
        emitKey('capslock', [], dataChannel);
        return;
      }

      setStickyMods(prev => {
        const next = new Set(prev);
        if (next.has(mod as ModName)) next.delete(mod as ModName);
        else next.add(mod as ModName);
        return next;
      });
      flash(key);
      return;
    }

    // ── Regular key: fire with sticky mods then disarm ──
    const mods = [...stickyModsRef.current];
    flash(key);
    emitKey(key, mods, dataChannel);
    setStickyMods(new Set());
  }, [dataChannel, flash]);

  const isActive = (key: string) => {
    if (key.startsWith('SHORTCUT_CMD:')) return pressedKeys.has(key);
    if (key.startsWith('SHORTCUT:')) return pressedKeys.has(key);
    if (key.startsWith('MOD:')) {
      const mod = key.slice(4) as ModName | 'capslock';
      if (mod === 'capslock') return capsActive;
      return stickyMods.has(mod as ModName);
    }
    return pressedKeys.has(key);
  };

  const renderKey = (kd: KeyDef, idx: number) => (
    <React.Fragment key={idx}>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); handleKey(kd); }}
        className={['mkb-key', kd.cls ?? 'mkb-w-12', isActive(kd.key) ? 'mkb-key--active' : ''].join(' ')}
        aria-label={typeof kd.label === 'string' ? kd.label : kd.key}
      >
        {kd.label}
      </button>
      {kd.sep && <div className="mkb-sep" />}
    </React.Fragment>
  );

  return (
    <div className="  bg-[#eeeeee] rounded-3xl px-3 py-2 flex flex-col gap-[7px] w-full overflow-x-scroll " tabIndex={-1}>
      {/* <div className="mkb-row mkb-fn">
        {FN_ROW.map(renderKey)}
      </div> */}

      {/* Nav row */}
      {/* <div className="mkb-row">
        {NAV_ROW.map(renderKey)}
      </div> */}

      {/* Modifiers + structural + arrows */}
      <div className=" flex items-center gap-3">


        {MOD_STICKY.map(renderKey)}

        {STRUCT_ROW.map(renderKey)}

        {NAV_ROW.map(renderKey)}

        {ARROW_KEYS.map(renderKey)}

        {/* Arrow cluster */}
        {/* <div className="mkb-arrows">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); handleKey(ARROW_KEYS[0]); }}
            className={`mkb-key mkb-key--arrow ${isActive('up') ? 'mkb-key--active' : ''}`}
            aria-label="Arrow Up"
          >▲</button>
          <div className="mkb-arrow-bottom">
            {[ARROW_KEYS[2], ARROW_KEYS[1], ARROW_KEYS[3]].map((kd, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => { e.preventDefault(); handleKey(kd); }}
                className={`mkb-key mkb-key--arrow ${isActive(kd.key) ? 'mkb-key--active' : ''}`}
                aria-label={`Arrow ${kd.key}`}
              >
                {kd.label}
              </button>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
