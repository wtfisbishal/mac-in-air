# Fix Keyboard Types Issue and Add Shortcuts

This plan addresses the three keyboard issues you mentioned: lag/inefficiency in typing, syncing physical keyboard presses to the virtual keyboard UI, and fixing shortcut functionality like `cmd+space` and `ctrl+tab`.

## Proposed Changes

### 1. Fix Lag and Prevent Event Flooding
The current keyboard capture listens to `keydown` but does not handle "held down" (repeated) keys properly, which floods the socket with continuous messages and causes significant lag.
- **Fix:** We will add tracking for keys that are currently pressed (using a `Set`) so that we don't send duplicate `keydown` events for the same key while it is being held down.
- **Fix:** We will handle `keyup` events to clear keys from our tracking, keeping the state clean.

### 2. Physical Keyboard Visual Sync
To make the virtual keyboard "type" and light up when you press a physical key:
- **Fix:** We will pass the captured physical `keyCode`s down to the `<MacKeyboards>` component.
- **Fix:** Since `@uiw/react-mac-keyboard` uses numerical keycodes (e.g., 65 for 'A'), we will capture `e.keyCode` from your physical presses and feed it to the UI component so the keys light up exactly as you press them.

### 3. Correct Shortcut Functionality
Currently, the codebase incorrectly treats both `Ctrl` and `Cmd` as the same `command` modifier.
- **Fix:** We will separate these modifiers so `Ctrl` correctly maps to `control` and `Cmd` maps to `command`.
- **Fix:** We will properly route shortcuts. For example, pressing `Cmd + Space` will be correctly interpreted as `key: "space", modifier: ["command"]` and sent to the desktop as a `keyboard-shortcut` event rather than a standard typing event.
- **Fix:** We will ensure `Shift` combined with characters correctly sends typing events or shortcuts as necessary.

### Affected Files
- **`web/frontend/src/app/(private)/control/[deviceId]/page.tsx`**
  - Implement a `useRef` based active-keys `Set` to track pressed keys (to stop event spam and lag).
  - Listen for both `keydown` and `keyup`.
  - Pass the active physical keycodes to the `MacKeyboards` component.
  - Fix the `ctrlKey` / `metaKey` modifier mapping.
- **`web/frontend/src/components/MacKeyBoards.tsx`**
  - Update the component to accept a `physicalKeyCodes` array from the parent so it can merge them with its own clicked keys to highlight the keys accurately.

## User Review Required

Does this cover everything you had in mind for the keyboard fixes? Once you approve, I will begin implementing these changes!
