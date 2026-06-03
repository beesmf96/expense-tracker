import { pinEnabled, pinHash, isLocked } from '../state/store'

export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = pinHash.value
  if (!stored) return false
  const h = await hashPin(pin)
  return h === stored
}

export async function setupPin(newPin: string): Promise<void> {
  pinHash.value = await hashPin(newPin)
  pinEnabled.value = true
  isLocked.value = false
}

export function clearPin(): void {
  pinHash.value = null
  pinEnabled.value = false
  isLocked.value = false
}

let _idleTimer: ReturnType<typeof setTimeout> | null = null
let _hiddenAt: number | null = null

function resetTimer() {
  if (_idleTimer) clearTimeout(_idleTimer)
  _idleTimer = setTimeout(() => {
    if (pinEnabled.value) isLocked.value = true
  }, 60_000)
}

export function initLockWatcher(): void {
  const events: string[] = ['click', 'keydown', 'touchstart', 'mousemove']
  for (const ev of events) {
    document.addEventListener(ev, resetTimer, { passive: true })
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      _hiddenAt = Date.now()
    } else {
      if (pinEnabled.value && _hiddenAt !== null && (Date.now() - _hiddenAt) >= 60_000) {
        isLocked.value = true
      }
      _hiddenAt = null
      resetTimer()
    }
  })

  resetTimer()
}
