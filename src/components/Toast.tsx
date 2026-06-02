import { toastMsg } from '../state/store'

export function Toast() {
  const msg = toastMsg.value
  return (
    <div class={`toast${msg ? ' toast-visible' : ''}`}>
      {msg}
    </div>
  )
}
