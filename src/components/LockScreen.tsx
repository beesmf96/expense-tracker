import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { isLocked, pinEnabled, pinFailCount, pinLockedUntil } from '../state/store'
import { verifyPin } from '../lib/lockHelpers'
import { t } from '../data/i18n'

export function LockScreen() {
  const digits = useSignal('')
  const shake = useSignal(false)
  const countdown = useSignal(0)

  const locked = isLocked.value && pinEnabled.value

  useEffect(() => {
    if (!locked) return
    const lockedUntil = pinLockedUntil.value
    if (lockedUntil <= Date.now()) { countdown.value = 0; return }
    countdown.value = Math.ceil((lockedUntil - Date.now()) / 1000)
    const id = setInterval(() => {
      const remaining = Math.ceil((pinLockedUntil.value - Date.now()) / 1000)
      if (remaining <= 0) { countdown.value = 0; clearInterval(id); return }
      countdown.value = remaining
    }, 1000)
    return () => clearInterval(id)
  }, [locked, pinLockedUntil.value])

  if (!locked) return null

  const inCooldown = pinLockedUntil.value > Date.now() && countdown.value > 0

  async function handleDigit(d: string) {
    if (inCooldown) return
    const next = digits.value + d
    digits.value = next
    if (next.length < 4) return
    const ok = await verifyPin(next)
    if (ok) {
      isLocked.value = false
      pinFailCount.value = 0
      pinLockedUntil.value = 0
      digits.value = ''
    } else {
      pinFailCount.value = pinFailCount.value + 1
      const fails = pinFailCount.value
      if (fails >= 5) {
        pinLockedUntil.value = Date.now() + 300_000
      } else if (fails >= 3) {
        pinLockedUntil.value = Date.now() + 30_000
      }
      shake.value = true
      digits.value = ''
      setTimeout(() => { shake.value = false }, 400)
    }
  }

  function handleBackspace() {
    if (inCooldown) return
    digits.value = digits.value.slice(0, -1)
  }

  return (
    <div class="lock-screen">
      <div class="lock-title">{t('footer')}</div>
      <div class={`lock-dots${shake.value ? ' pin-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} class={`lock-dot${i < digits.value.length ? ' filled' : ''}`} />
        ))}
      </div>
      {inCooldown && (
        <div class="lock-countdown">{t('pinTryAgainIn')} {countdown.value}{t('pinSeconds')}</div>
      )}
      <div class="lock-numpad">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} class="lock-numpad-btn" disabled={inCooldown} onClick={() => handleDigit(d)}>{d}</button>
        ))}
        <button class="lock-numpad-btn" aria-label={t('pinBackspace')} disabled={inCooldown} onClick={handleBackspace}>⌫</button>
        <button class="lock-numpad-btn" disabled={inCooldown} onClick={() => handleDigit('0')}>0</button>
        <button class="lock-numpad-btn empty" aria-hidden="true" />
      </div>
    </div>
  )
}
