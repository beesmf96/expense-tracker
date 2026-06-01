import { viewY, viewM } from '../state/store'
import { mfmt } from '../data/i18n'

export function MonthNav() {
  function changeMonth(delta: number) {
    let y = viewY.value, m = viewM.value + delta
    if (m < 0) { y--; m = 11 }
    if (m > 11) { y++; m = 0 }
    viewY.value = y
    viewM.value = m
  }

  return (
    <div class="month-nav">
      <button class="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
      <span class="month-nav-label">{mfmt(viewY.value, viewM.value)}</span>
      <button class="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
    </div>
  )
}
