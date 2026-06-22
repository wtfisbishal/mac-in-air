import { getSocket } from "@/lib/socket";
import React, { useState, useRef, useEffect } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./key.css";
 
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

    ".": ".",  ",": ",",  "/": "/",  ";": ";",
    "'": "'",  "[": "[",  "]": "]",  "\\": "\\",
    "-": "-",  "=": "=",  "`": "`",

    ">": ".",  "<": ",",  "?": "/",  ":": ";",
    "\"": "'", "{": "[",  "}": "]",  "|": "\\",
    "_": "-",  "+": "=",  "~": "`",
    "!": "1",  "@": "2",  "#": "3",  "$": "4",
    "%": "5",  "^": "6",  "&": "7",  "*": "8",
    "(": "9",  ")": "0",
};

const VIRTUAL_TO_ROBOT: Record<string, string> = {
    "{enter}": "enter",   "{tab}": "tab",
    "{bksp}": "backspace", "{space}": "space",
    "{left}": "left",     "{right}": "right",
    "{up}": "up",         "{down}": "down",
    "{esc}": "escape",
    "{f1}": "f1",  "{f2}": "f2",  "{f3}": "f3",  "{f4}": "f4",
    "{f5}": "f5",  "{f6}": "f6",  "{f7}": "f7",  "{f8}": "f8",
    "{f9}": "f9",  "{f10}": "f10","{f11}": "f11","{f12}": "f12",
};


const MODIFIER_KEYS = new Set(["Meta", "Control", "Alt", "Shift", "CapsLock", "OS"]);


const NON_TYPE_KEYS = new Set([
    "space", "enter", "tab", "backspace", "escape", "delete",
    "left", "right", "up", "down", "home", "end", "pageup", "pagedown",
    "f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11","f12",
]);


const VMOD_MAP: Record<string, { mod: string; vkeys: string[] }> = {
    "{command}":   { mod: "command", vkeys: ["{command}"]                    },
    "{control}":   { mod: "control", vkeys: ["{control}"]                    },
    "{option}":    { mod: "alt",     vkeys: ["{option}"]                     },
    "{shiftleft}": { mod: "shift",   vkeys: ["{shiftleft}", "{shiftright}"]  },
    "{shiftright}":{ mod: "shift",   vkeys: ["{shiftleft}", "{shiftright}"]  },
};

const LAYOUTS = {
    default: [

        "{esc} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",

        "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",

        "{tab} q w e r t y u i o p [ ] \\",

        "{capslock} a s d f g h j k l ; ' {enter}",

        "{shiftleft} z x c v b n m , . / {shiftright}",

        "{control} {option} {command} {space} {command} {option} {left} {up} {down} {right}",
    ],
    shift: [
        "{esc} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
        "{tab} Q W E R T Y U I O P { } |",
        "{capslock} A S D F G H J K L : \" {enter}",
        "{shiftleft} Z X C V B N M < > ? {shiftright}",
        "{control} {option} {command} {space} {command} {option} {left} {up} {down} {right}",
    ],
};

const DISPLAY_MAP: Record<string, string> = {
    "{command}":   "⌘ Cmd",  "{option}":    "⌥ Opt",
    "{control}":   "⌃ Ctrl", "{shiftleft}": "⇧",
    "{shiftright}":"⇧",       "{capslock}":  "⇪ Caps",
    "{tab}":       "⇥ Tab",  "{bksp}":      "⌫",
    "{enter}":     "↵",       "{space}":     "Space",
    "{esc}":       "Esc",
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
    if (now - (lastEmitAt.get(dedupKey) ?? 0) < DEDUP_MS) return;
    lastEmitAt.set(dedupKey, now);

    const socket = getSocket();
    const isPlain = key.length === 1 && !NON_TYPE_KEYS.has(key) && modifiers.length === 0;
    if (isPlain) {
        socket.emit("keyboard-type", { text: key });
    } else {
        socket.emit("keyboard-shortcut", { key, modifier: modifiers });
    }
}
 
export default function NormalKeyboard() {
    const keyboardRef = useRef<any>(null);

    useEffect(() => {
        const heldKeys = new Set<string>();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            e.preventDefault();

            if (MODIFIER_KEYS.has(e.key)) {
                highlightModifiers(e);
                return;
            }

            const keyId = e.code || e.key;
            if (heldKeys.has(keyId)) return;
            heldKeys.add(keyId);

            const modifiers: string[] = [];
            if (e.metaKey)  modifiers.push("command");
            if (e.ctrlKey)  modifiers.push("control");
            if (e.altKey)   modifiers.push("alt");
            if (e.shiftKey) modifiers.push("shift");

            
            let robotKey = BROWSER_TO_ROBOT[e.key] ?? (e.key.length === 1 ? e.key : null);
 
            if (!robotKey) return;

            emitKey(robotKey, modifiers);
            highlightModifiers(e);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            heldKeys.delete(e.code || e.key);
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
        <div
            className="w-full   max-md:w-[1000px] h-full "
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

        // If shift is a sticky modifier and we're pressing a shift-variant key
        // (e.g. ">"), pass the base key + shift modifier so the remote receives it correctly
        emitKey(key, modifiers);

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
        if (button === "{capslock}") return;

        // Resolve to robot key name
        // For shift-layout keys like > < ? etc., map to base key (. , / etc.)
        let robotKey = VIRTUAL_TO_ROBOT[button] ?? button;

        // Strip any remaining curly-brace wrappers for unknown tokens
        if (robotKey.startsWith("{") && robotKey.endsWith("}")) return;

        fireAndDisarm(robotKey);
    };

    return (
        <div className="mac-keyboard-wrapper w-full flex justify-center">
            <Keyboard
                keyboardRef={(r) => (keyboardRef.current = r)}
                layout={LAYOUTS}
                display={DISPLAY_MAP}
                layoutName={layout}
                onKeyPress={onKeyPress}
            />
        </div>
    );
}