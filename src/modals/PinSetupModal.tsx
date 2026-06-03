import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { modalCtx, closeM, showToast } from '../state/store'
import { setupPin, clearPin, verifyPin } from '../lib/lockHelpers'
import { t } from '../data/i18n'

interface PinPadProps {
  onDigit: (d: string) => void
  onBackspace: () => void
  disabled?: boolean
}

function PinPad({ onDigit, onBackspace, disabled }: PinPadProps) {
  return (
    <div class="lock-numpad">
      {['1','2','3','4','5','6','7','8','9'].map(d => (
        <button key={d} class="lock-numpad-btn" disabled={disabled} onClick={() => onDigit(d)}>{d}</button>
      ))}
      <button class="lock-numpad-btn" aria-label={t('pinBackspace')} disabled={disabled} onClick={onBackspace}>⌫</button>
      <button class="lock-numpad-btn" disabled={disabled} onClick={() => onDigit('0')}>0</button>
      <button class="lock-numpad-btn empty" aria-hidden="true" />
    </div>
  )
}

export function PinSetupModal() {
  const mode = modalCtx.value.pinSetupMode
  const step = useSignal(1)
  const pin1 = useSignal('')
  const current = useSignal('')
  const shake = useSignal(false)

  if (!mode) return <Modal id="pin-setup"><div/></Modal>

  function doShake() {
    shake.value = true
    setTimeout(() => { shake.value = false }, 400)
  }

  function stepLabel(): string {
    if (mode === 'set') {
      return step.value === 1 ? t('enterNewPIN') : t('confirmPIN')
    }
    if (mode === 'change') {
      if (step.value === 1) return t('enterCurrentPIN')
      if (step.value === 2) return t('enterNewPIN')
      return t('confirmPIN')
    }
    return t('enterCurrentPIN')
  }

  function activeDigits(): string {
    if (mode === 'set') return step.value === 1 ? pin1.value : current.value
    if (mode === 'change') {
      if (step.value === 1) return current.value
      if (step.value === 2) return pin1.value
      return current.value
    }
    return current.value
  }

  async function handleDigit(d: string) {
    const next = activeDigits() + d
    if (next.length > 4) return

    if (mode === 'set') {
      if (step.value === 1) {
        pin1.value = next
        if (next.length === 4) { step.value = 2; current.value = '' }
      } else {
        current.value = next
        if (next.length === 4) {
          if (next === pin1.value) {
            await setupPin(next)
            pin1.value = ''; current.value = ''; step.value = 1
            showToast(t('pinSet'))
            closeM()
          } else {
            doShake()
            pin1.value = ''; current.value = ''; step.value = 1
          }
        }
      }
      return
    }

    if (mode === 'change') {
      if (step.value === 1) {
        current.value = next
        if (next.length === 4) {
          const ok = await verifyPin(next)
          if (ok) { step.value = 2; current.value = ''; pin1.value = '' }
          else { doShake(); current.value = '' }
        }
      } else if (step.value === 2) {
        pin1.value = next
        if (next.length === 4) { step.value = 3; current.value = '' }
      } else {
        current.value = next
        if (next.length === 4) {
          if (next === pin1.value) {
            await setupPin(next)
            pin1.value = ''; current.value = ''; step.value = 1
            closeM()
          } else {
            doShake()
            pin1.value = ''; current.value = ''; step.value = 2
          }
        }
      }
      return
    }

    if (mode === 'disable') {
      current.value = next
      if (next.length === 4) {
        const ok = await verifyPin(next)
        if (ok) {
          clearPin()
          current.value = ''; step.value = 1
          showToast(t('pinDisabled'))
          closeM()
        } else {
          doShake()
          current.value = ''
        }
      }
    }
  }

  function handleBackspace() {
    if (mode === 'set') {
      if (step.value === 1) pin1.value = pin1.value.slice(0, -1)
      else current.value = current.value.slice(0, -1)
    } else if (mode === 'change') {
      if (step.value === 1) current.value = current.value.slice(0, -1)
      else if (step.value === 2) pin1.value = pin1.value.slice(0, -1)
      else current.value = current.value.slice(0, -1)
    } else {
      current.value = current.value.slice(0, -1)
    }
  }

  const enteredLen = activeDigits().length

  return (
    <Modal id="pin-setup">
      <div class="modal-title">{
        mode === 'set' ? t('setPIN') : mode === 'change' ? t('changePIN') : t('disablePIN')
      }</div>
      <div class="pin-modal-body">
        <div class="pin-step-label">{stepLabel()}</div>
        <div class={`lock-dots${shake.value ? ' pin-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} class={`lock-dot${i < enteredLen ? ' filled' : ''}`} />
          ))}
        </div>
        <PinPad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>
    </Modal>
  )
}
