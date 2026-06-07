import { viewY, viewM, changeMonth } from '../state/store'
import { mfmt } from '../data/i18n'

export function MonthNav() {
  return (
    <div class="month-nav">
      <button class="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
      <span class="month-nav-label">{mfmt(viewY.value, viewM.value)}</span>
      <button class="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
    </div>
  )
}
