import { getSocket } from "@/lib/socket";
import React, { useState, useRef, useEffect } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
 
const BROWSER_TO_ROBOT: Record<string, string> = {
    ArrowLeft: "left",   ArrowRight: "right",
    ArrowUp: "up",       ArrowDown: "down",
    Enter: "enter",      Tab: "tab",
    Backspace: "backspace", Escape: "escape",
    Delete: "delete",    Home: "home",
    End: "end",          PageUp: "pageup",
    PageDown: "pagedown"," ": "space",
    F1: "f1",  F2: "f2",  F3: "f3",  F4: "f4",
    F5: "f5",  F6: "f6",  F7: "f7",  F8: "f8",
    F9: "f9",  F10: "f10", F11: "f11", F12: "f12",
};
 
const VIRTUAL_TO_ROBOT: Record<string, string> = {
    "{enter}": "enter",   "{tab}": "tab",
    "{bksp}": "backspace","{space}": "space",
    "{left}": "left",     "{right}": "right",
    "{up}": "up",         "{down}": "down",
    "{esc}": "escape",
    "{f1}": "f1",  "{f2}": "f2",  "{f3}": "f3",  "{f4}": "f4",
    "{f5}": "f5",  "{f6}": "f6",  "{f7}": "f7",  "{f8}": "f8",
    "{f9}": "f9",  "{f10}": "f10","{f11}": "f11","{f12}": "f12",
};

/** Modifier-only keys — never emit as main key */
const MODIFIER_KEYS = new Set(["Meta", "Control", "Alt", "Shift", "CapsLock", "OS"]);

/** Non-printable keys that must always use keyboard-shortcut (keyTap), not keyboard-type */
const NON_TYPE_KEYS = new Set([
    "space", "enter", "tab", "backspace", "escape", "delete",
    "left", "right", "up", "down", "home", "end", "pageup", "pagedown",
    "f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11","f12",
]);

/** Virtual modifier button → { internal mod name, button keys to highlight } */
const VMOD_MAP: Record<string, { mod: string; vkeys: string[] }> = {
    "{command}":   { mod: "command", vkeys: ["{command}"]                    },
    "{control}":   { mod: "control", vkeys: ["{control}"]                    },
    "{option}":    { mod: "alt",     vkeys: ["{option}"]                     },
    "{shiftleft}": { mod: "shift",   vkeys: ["{shiftleft}", "{shiftright}"]  },
    "{shiftright}":{ mod: "shift",   vkeys: ["{shiftleft}", "{shiftright}"]  },
};

// ─── Layouts ──────────────────────────────────────────────────────────────────

const LAYOUTS = {
    default: [
        "{esc} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{control} {option} {command} {space} {command} {option} {up}",
        "                  {left} {down} {right}",
    ],
    shift: [
        "{esc} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
        "{tab} Q W E R T Y U I O P { } |",
        "{capslock} A S D F G H J K L : \" {enter}",
        "{shiftleft} Z X C V B N M < > ? {shiftright}",
        "{control} {option} {command} {space} {command} {option} {up} ",
        "        {left} {down} {right}",
    ],
};

const DISPLAY_MAP: Record<string, string> = {
    "{command}":   "⌘ Cmd",  "{option}":    "⌥ Opt",
    "{control}":   "⌃ Ctrl", "{shiftleft}": "⇧",
    "{shiftright}":"⇧",       "{capslock}":  "⇪ Caps",
    "{tab}":       "⇥ Tab",  "{bksp}":      "⌫",
    "{enter}":     "↵",       "{space}":     "Space",
    "{esc}":       "Esc",     "{empty}":      "",
    "{left}":      "◀",       "{right}":     "▶",
    "{up}":        "▲",       "{down}":      "▼",
    "{f1}": "F1",  "{f2}": "F2",  "{f3}": "F3",  "{f4}": "F4",
    "{f5}": "F5",  "{f6}": "F6",  "{f7}": "F7",  "{f8}": "F8",
    "{f9}": "F9",  "{f10}":"F10", "{f11}":"F11",  "{f12}":"F12",
};

 
const DEDUP_MS = 40;
const lastEmitAt = new Map<string, number>();

function emitKey(key: string, modifiers: string[]) {
    const dedupKey = key + "|" + modifiers.sort().join("+");
    const now = Date.now();
    if (now - (lastEmitAt.get(dedupKey) ?? 0) < DEDUP_MS) return; // drop duplicate
    lastEmitAt.set(dedupKey, now);

    const socket = getSocket();
    const isPlain = key.length === 1 && !NON_TYPE_KEYS.has(key) && modifiers.length === 0;
    if (isPlain) {
        socket.emit("keyboard-type", { text: key });
    } else {
        socket.emit("keyboard-shortcut", { key, modifier: modifiers });
    }
}
 
export default function MyComponent() {
    const keyboardRef = useRef<any>(null);

    useEffect(() => {
        // Tracks currently held keys (by e.code) to guard against rare
        // browser quirks where keydown fires twice for the same physical key.
        const heldKeys = new Set<string>();

        const onKeyDown = (e: KeyboardEvent) => {
            // Block key-repeat events (holding a key) — robotjs has no use for them
            if (e.repeat) return;

            // Prevent browser from consuming Tab (focus-cycle), Space (scroll),
            // and Arrow keys (page scroll) while this keyboard is active.
            e.preventDefault();

            // Modifier-only press: just highlight the key on-screen, don't emit
            if (MODIFIER_KEYS.has(e.key)) {
                highlightModifiers(e);
                return;
            }

            // Deduplicate held keys (safety net on top of the dedup gate)
            const keyId = e.code || e.key;
            if (heldKeys.has(keyId)) return;
            heldKeys.add(keyId);

            // Resolve modifiers from the native event (most accurate source)
            const modifiers: string[] = [];
            if (e.metaKey)  modifiers.push("command");
            if (e.ctrlKey)  modifiers.push("control");
            if (e.altKey)   modifiers.push("alt");
            if (e.shiftKey) modifiers.push("shift");

            // Resolve robot key name
            const robotKey = BROWSER_TO_ROBOT[e.key] ?? (e.key.length === 1 ? e.key : null);
            if (!robotKey) return;

            emitKey(robotKey, modifiers); // ← single emit
            highlightModifiers(e);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            heldKeys.delete(e.code || e.key);
            // Remove modifier highlights as soon as each modifier is released
            if (!e.metaKey)  removeTheme("{command}");
            if (!e.altKey)   removeTheme("{option}");
            if (!e.ctrlKey)  removeTheme("{control}");
            if (!e.shiftKey) { removeTheme("{shiftleft}"); removeTheme("{shiftright}"); }
        };

        const highlightModifiers = (e: KeyboardEvent) => {
            if (e.metaKey)  addTheme("{command}");
            if (e.altKey)   addTheme("{option}");
            if (e.ctrlKey)  addTheme("{control}");
            if (e.shiftKey) { addTheme("{shiftleft}"); addTheme("{shiftright}"); }
        };

        const addTheme    = (k: string) => keyboardRef.current?.addButtonTheme(k, "hg-activeButton");
        const removeTheme = (k: string) => keyboardRef.current?.removeButtonTheme(k, "hg-activeButton");

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup",   onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup",   onKeyUp);
        };
    }, []);

    return (
        // tabIndex={-1} ensures the wrapper div can receive focus but is not part
        // of the Tab order — prevents Tab key from cycling focus into keyboard buttons
        <div
            className="w-full max-md:w-[900px] h-full  max-md:overflow-x-auto   flex flex-col items-center gap-4"
            tabIndex={-1}
            style={{ outline: "none" }}
        >
            <VirtualKeyboard keyboardRef={keyboardRef} />
        </div>
    );
}

 
interface VirtualKeyboardProps {
    keyboardRef: React.MutableRefObject<any>;
}

function VirtualKeyboard({ keyboardRef }: VirtualKeyboardProps) {
    const [layout, setLayout] = useState<"default" | "shift">("default");
    const stickyMods = useRef<Set<string>>(new Set());

    const armModifier = (mod: string, vkeys: string[]) => {
        if (stickyMods.current.has(mod)) {
            stickyMods.current.delete(mod);
            vkeys.forEach(k => keyboardRef.current?.removeButtonTheme(k, "hg-activeButton"));
            if (mod === "shift") setLayout("default");
        } else {
            stickyMods.current.add(mod);
            vkeys.forEach(k => keyboardRef.current?.addButtonTheme(k, "hg-activeButton"));
            if (mod === "shift") setLayout("shift");
        }
    };

    const fireAndDisarm = (key: string) => {
        const modifiers = Array.from(stickyMods.current);
        emitKey(key, modifiers); // ← single emit (dedup gate handles any race)

        // Disarm all sticky modifiers
        stickyMods.current.clear();
        Object.values(VMOD_MAP).forEach(({ vkeys }) =>
            vkeys.forEach(k => keyboardRef.current?.removeButtonTheme(k, "hg-activeButton"))
        );
        setLayout("default");
    };

    const onKeyPress = (button: string) => {
        // Modifier toggle (sticky)
        const vmod = VMOD_MAP[button];
        if (vmod) { armModifier(vmod.mod, vmod.vkeys); return; }
        // Inert buttons
        if (button === "{capslock}" || button === "{empty}") return;
        // Regular key
        fireAndDisarm(VIRTUAL_TO_ROBOT[button] ?? button);
    };

    return (
        <Keyboard
            keyboardRef={(r) => (keyboardRef.current = r)}
            layout={LAYOUTS}
            display={DISPLAY_MAP}
            layoutName={layout}
            onKeyPress={onKeyPress}
            //  physicalKeyboardHighlight is intentionally REMOVED.
            // That prop adds its own document.addEventListener("keydown") inside
            // the library and in some builds calls onKeyPress() for physical keys,
            // creating a second emit path and causing infinite loops for Tab/Space.
            // We do our own highlighting in the useEffect above.
        />
    );
}