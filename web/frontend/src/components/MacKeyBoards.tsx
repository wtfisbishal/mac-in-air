 
'use client';

import { useEffect, useState, useRef } from 'react';
import MacKeyboard from '@uiw/react-mac-keyboard';

interface MacKeyboardsProps {
  onVirtualShortcut?: (key: string, modifiers: string[]) => void;
  onPhysicalKeyDown?: (e: KeyboardEvent) => void;
}

export default function MacKeyboards({
  onVirtualShortcut,
  onPhysicalKeyDown,
}: MacKeyboardsProps) {
  const [keyCode, setKeyCode] = useState<number[]>([]);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const pressedKeys = useRef<Set<number>>(new Set());

  const toggleModifier = (modifier: string) => {
    setModifiers(prev =>
      prev.includes(modifier)
        ? prev.filter(m => m !== modifier)
        : [...prev, modifier]
    );
  };

  // Capture physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent lag and socket flooding
      
      pressedKeys.current.add(e.keyCode);
      setKeyCode(Array.from(pressedKeys.current));
      
      onPhysicalKeyDown?.(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.keyCode);
      setKeyCode(Array.from(pressedKeys.current));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPhysicalKeyDown]);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Active modifiers */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => toggleModifier('command')}
          className={modifiers.includes('command') ? 'bg-blue-500' : 'bg-zinc-800'}
        >
          ⌘
        </button>
        <button
          onClick={() => toggleModifier('shift')}
          className={modifiers.includes('shift') ? 'bg-blue-500' : 'bg-zinc-800'}
        >
          ⇧
        </button>
        <button
          onClick={() => toggleModifier('control')}
          className={modifiers.includes('control') ? 'bg-blue-500' : 'bg-zinc-800'}
        >
          ⌃
        </button>
        <button
          onClick={() => toggleModifier('alt')}
          className={modifiers.includes('alt') ? 'bg-blue-500' : 'bg-zinc-800'}
        >
          ⌥
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        {modifiers.map(mod => (
          <span
            key={mod}
            className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs"
          >
            {mod}
          </span>
        ))}
      </div>

      <MacKeyboard
        keyCode={keyCode}
        className="w-fit shadow shadow-white/40"
        onMouseDown={(e, item) => {
          if (item.keycode < 0) return;

          const key = item.name?.[0]?.toLowerCase();
          if (!key) return;

          const modifierKeys = ["command", "shift", "control", "option", "alt"];
          if (modifierKeys.includes(key)) {
            toggleModifier(key === "option" ? "alt" : key);
            return;
          }

          pressedKeys.current.add(item.keycode);
          setKeyCode(Array.from(pressedKeys.current));

          onVirtualShortcut?.(key, modifiers);

          setModifiers([]);
        }}
        onMouseUp={(e, item) => {
          pressedKeys.current.clear();
          setKeyCode([]);
        }}
      />
    </div>
  );
}                         