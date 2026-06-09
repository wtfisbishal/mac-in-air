// 'use client'
// import { useState } from "react";

// import MacKeyboard from "@uiw/react-mac-keyboard";

// interface MacKeyboardsProps {
//   onKeyPress?: (keyName: string, keyCode: number) => void;
// }

// export default function MacKeyboards({ onKeyPress }: MacKeyboardsProps) {
//   const [keyCode, setKeyCode] = useState<number[]>([]);
//   return (
//     <div className="w-full flex justify-center  ">
//       <MacKeyboard
//       keyCode={keyCode}
//       className="w-fit shadow shadow-white/40"  
//       onMouseDown={(e, item) => {


//   console.log("KEY ITEM:", item);

//         // console.log("MacKeyboard onMouseDown item:", item);
//         if (item.keycode > -1) {
//           setKeyCode([item.keycode]);
//           if (onKeyPress && item.name && item.name.length > 0) {
             
//             console.log("MacKeyboard passing to onKeyPress:", item.name[0]);
//             onKeyPress(item.name[0], item.keycode);
//           } else {
//             console.warn("MacKeyboard item missing name:", item);
//           }
//         }
//       }}
      
//       onMouseUp={() =>{
//         setKeyCode([]);
//       }}
//     />
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import MacKeyboard from '@uiw/react-mac-keyboard';

interface MacKeyboardsProps {
  onShortcut?: (key: string, modifiers: string[]) => void;
}

export default function MacKeyboards({
  onShortcut,
}: MacKeyboardsProps) {
  const [keyCode, setKeyCode] = useState<number[]>([]);
 const [modifiers, setModifiers] = useState<string[]>([]);

const toggleModifier = (modifier: string) => {
  setModifiers(prev =>
    prev.includes(modifier)
      ? prev.filter(m => m !== modifier)
      : [...prev, modifier]
  );
};
  // Capture physical modifier keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mods: string[] = [];

      if (e.metaKey) mods.push('command');
      if (e.ctrlKey) mods.push('control');
      if (e.altKey) mods.push('alt');
      if (e.shiftKey) mods.push('shift');

      setModifiers(mods);
    };

    const handleKeyUp = () => {
      setModifiers([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);   
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

    const modifierKeys = [
      "command",
      "shift",
      "control",
      "option",
      "alt",
    ];

    // Toggle modifier instead of sending it
    if (modifierKeys.includes(key)) {
      toggleModifier(key === "option" ? "alt" : key);
      return;
    }

    setKeyCode([item.keycode]);

    onShortcut?.(key, modifiers);

    // Optional: clear modifiers after shortcut
    setModifiers([]);
  }}
  onMouseUp={() => {
    setKeyCode([]);
  }}
/>
    </div>
  );
}                         