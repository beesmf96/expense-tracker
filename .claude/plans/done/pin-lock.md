---
plan: pin-lock
status: done
branch: feature/pin-lock
pr: #23
implemented: 2026-06-03
---

# Feature: PIN Lock

## What & Why

An optional 4-digit PIN that locks the app after 1 minute of inactivity (or when the browser tab becomes hidden). The user sets the PIN in Settings and sees a full-screen numpad lock screen on return. Protects personal spending data from casual shoulder-surfers or family members picking up an unlocked device.

## Scope

- Enable / disable PIN lock in Settings (new "App Lock" section)
- Set PIN and Change PIN via a stepped modal (`PinSetupModal`)
- Disable PIN via a verify-then-clear flow in the same modal
- Lock triggers: 60s idle (no click/keydown/touchstart) OR tab hidden for ≥ 60s
- Lock screen: full-screen numpad overlay with 4-dot progress indicator
- Wrong PIN: progressive delay — 3 fails → 30s cooldown, 5+ fails → 5min cooldown
- PIN stored as SHA-256 hash in `localStorage` (key `pinHash`); enabled flag in `localStorage` (key `pinEnabled`)
- Full i18n (en + zh)

## Out of Scope

- Biometric / device credential unlock
- Persisting fail count across page reloads (in-memory only — a determined user can reload; this feature targets casual protection only)
- Backend validation or server-side PIN
- Recovery / forgot-PIN flow (user can clear app data via Danger Zone as last resort)

## Technical Approach

### New signals — `src/state/store.ts`

Follow the same three-part `localStorage` + pre-effect + `effect()` pattern as `theme`:

```ts
// pinEnabled
const _storedPinEnabled = localStorage.getItem('pinEnabled') === 'true'
export const pinEnabled = signal<boolean>(_storedPinEnabled)
effect(() => { localStorage.setItem('pinEnabled', String(pinEnabled.value)) })

// pinHash — no pre-effect needed (no DOM attribute to set)
export const pinHash = signal<string | null>(localStorage.getItem('pinHash'))
effect(() => {
  if (pinHash.value) localStorage.setItem('pinHash', pinHash.value)
  else localStorage.removeItem('pinHash')
})

// lock state — in-memory only
export const isLocked = signal<boolean>(false)
export const pinFailCount = signal<number>(0)
export const pinLockedUntil = signal<number>(0)   // ms timestamp; 0 = not locked
```

`isLocked` starts `false` regardless of `pinEnabled` — the app is unlocked until the idle timer fires after the first user interaction.

### New helper — `src/lib/lockHelpers.ts`

Pure helpers + the idle/visibility watcher (called once from `main.tsx`):

```ts
export async function hashPin(pin: string): Promise<string>   // Web Crypto SHA-256 → hex
export async function verifyPin(pin: string): Promise<boolean> // compare hash
export async function setupPin(newPin: string): Promise<void>  // hash + save to pinHash + enable
export function clearPin(): void                               // clear pinHash, set pinEnabled false, unlock
export function initLockWatcher(): void                        // registers listeners, called from main.tsx
```

`initLockWatcher` sets up:
- `['click', 'keydown', 'touchstart', 'mousemove']` → reset 60s idle timer (only when `pinEnabled.value`)
- `visibilitychange` → record `_hiddenAt` on hide; on show, if elapsed ≥ 60s and `pinEnabled.value`, set `isLocked.value = true`

### New component — `src/components/LockScreen.tsx`

Rendered unconditionally in `App.tsx`, visible only when `isLocked.value && pinEnabled.value`:

```
┌─────────────────────────┐
│         MyLedger        │
│                         │
│       ● ● ○ ○           │  (4-dot progress)
│                         │
│  [1] [2] [3]            │
│  [4] [5] [6]            │
│  [7] [8] [9]            │
│  [⌫] [0] [ ]            │
│                         │
│  "Try again in 28s"     │  (shown during cooldown)
└─────────────────────────┘
```

- 4th digit entered → auto-verify (no Submit button)
- On correct PIN: `isLocked.value = false`, reset `pinFailCount` and `pinLockedUntil`
- On wrong PIN: increment `pinFailCount`; if ≥ 3, set `pinLockedUntil = Date.now() + 30_000`; if ≥ 5, set `pinLockedUntil = Date.now() + 300_000`
- During cooldown: numpad disabled, countdown shown via `useSignal` + `setInterval`
- Layout: position fixed, full viewport, `z-index` above modal overlay

### New modal — `src/modals/PinSetupModal.tsx`

`ModalId: 'pin-setup'`, driven by `modalCtx.value.pinSetupMode: 'set' | 'change' | 'disable'`

**`'set'` mode** (no existing PIN):
1. Enter new 4-digit PIN (auto-advance on 4th digit)
2. Confirm PIN (must match) → save hash, enable, close

**`'change'` mode** (existing PIN):
1. Verify current PIN
2. Enter new PIN
3. Confirm new PIN → save new hash, close

**`'disable'` mode**:
1. Verify current PIN → `clearPin()`, close

Each step shows 4 dots + numpad (same layout as LockScreen, reuse the numpad sub-component).
On mismatch/wrong PIN: shake animation + clear entry, stay on same step.

Extract `<PinPad>` as a shared sub-component (local to `src/modals/PinSetupModal.tsx`, not exported) to avoid duplication with `LockScreen`.

### Modified files

| File | Change |
|---|---|
| `src/types/index.ts` | Add `'pin-setup'` to `ModalId`; add `pinSetupMode?: 'set' \| 'change' \| 'disable'` to `ModalContext` |
| `src/state/store.ts` | Add 5 signals: `pinEnabled`, `pinHash`, `isLocked`, `pinFailCount`, `pinLockedUntil` |
| `src/main.tsx` | Call `initLockWatcher()` after `loadAll()` |
| `src/App.tsx` | Import and render `<LockScreen />` and `<PinSetupModal />` |
| `src/pages/Settings.tsx` | Add new "App Lock" `settings-card` section (see UI below) |
| `src/data/i18n.ts` | Add all new strings to both `S.en` and `S.zh` |

### Settings UI (App Lock section)

**PIN disabled:**
```
┌──────────────────────────────────┐
│ 🔒 App Lock              [Set PIN]│
└──────────────────────────────────┘
```
Clicking "Set PIN" → `openM('pin-setup', { pinSetupMode: 'set' })`

**PIN enabled:**
```
┌──────────────────────────────────┐
│ 🔒 App Lock                  ON  │
│    [Change PIN]  [Disable PIN]   │
└──────────────────────────────────┘
```
"Change PIN" → `openM('pin-setup', { pinSetupMode: 'change' })`
"Disable PIN" → `openM('pin-setup', { pinSetupMode: 'disable' })`

### New i18n keys

```
appLock, setPIN, changePIN, disablePIN,
enterNewPIN, confirmPIN, enterCurrentPIN,
pinMismatch, pinWrong, pinSet, pinDisabled,
pinTryAgainIn, pinSeconds,
lockOn, lockOff
```

### CSS

- `LockScreen` styles → `src/styles/layout.css` (`.lock-screen`, `.lock-dots`, `.lock-numpad`, `.lock-numpad-btn`, `.lock-countdown`)
- `PinSetupModal` reuses `.lock-dots` and `.lock-numpad` (import via same CSS file)
- Shake animation: `@keyframes pin-shake` in `layout.css`, applied via `.pin-shake` class for 400ms on wrong entry

## Acceptance Criteria

- [ ] Settings → App Lock section renders with correct state (disabled by default)
- [ ] "Set PIN": entering 4 digits twice (matching) enables lock; `pinEnabled` persists across page reload
- [ ] "Change PIN": requires correct current PIN before accepting new PIN
- [ ] "Disable PIN": requires correct current PIN; disables lock and removes hash from localStorage
- [ ] After 60s idle with no interaction, lock screen appears
- [ ] After tab is hidden for ≥ 60s and user returns, lock screen appears
- [ ] Correct PIN unlocks and returns to app state (active page unchanged)
- [ ] Wrong PIN increments counter; 3rd wrong shows 30s countdown; 5th wrong shows 5min countdown
- [ ] Numpad is disabled during cooldown; countdown ticks down in real time
- [ ] Lock screen is not shown when `pinEnabled` is false
- [ ] All new strings appear correctly in both EN and ZH

## Edge Cases

- **Pin set, then disabled, then page reloaded**: `isLocked` starts `false` regardless — user is not locked out on fresh load even if they were locked before (in-memory only; acceptable tradeoff for a personal app)
- **User disables PIN while lock screen is showing**: cannot happen — `PinSetupModal` is behind the lock screen overlay
- **Very fast tab switch (< 60s)**: should NOT trigger lock — only hidden duration ≥ 60s locks
- **Setting a PIN of "0000" or repeated digits**: allowed — no PIN strength enforcement
- **Web Crypto unavailable** (very old browser): `crypto.subtle.digest` is available in all Chromium/Firefox/Safari since ~2014; no fallback needed
- **Clearing all data (Danger Zone) while PIN is enabled**: `clearAll()` in `queries.ts` wipes `txs`/`cats`/`settings` tables but does NOT clear localStorage — `pinEnabled`/`pinHash` survive the data wipe intentionally (lock protects the app, not just the data)

## Open Questions

None — all design decisions resolved before implementation.
