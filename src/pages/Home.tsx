import { viewY, viewM, txs, catColor, getCat, openM, changeMonth, swipeNav } from '../state/store'
import { t, mfmt, catLabel } from '../data/i18n'
import { monthTxs, monthTotal } from '../state/recurring'
import { ProgressBar } from '../components/ProgressBar'
import { EmptyState } from '../components/EmptyState'
import { MonthNav } from '../components/MonthNav'

let _swipeX = 0

export function Home() {
  const year = viewY.value
  const month = viewM.value
  const current = monthTxs(txs.value, year, month)
  const total = current.reduce((s, tx) => s + tx.amount, 0)
  const byCat = new Map<string, number>()
  for (const tx of current) {
    byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amount)
  }
  const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1])

  const prevY = month === 0 ? year - 1 : year
  const prevM = month === 0 ? 11 : month - 1
  const prevTotal = monthTotal(txs.value, prevY, prevM)
  const deltaPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null
  const deltaUp = total > prevTotal

  return (
    <div
      onTouchStart={(e) => { _swipeX = e.touches[0].clientX }}
      onTouchEnd={(e) => { if (!swipeNav.value) return; const dx = e.changedTouches[0].clientX - _swipeX; if (Math.abs(dx) > 50) { navigator.vibrate?.(10); changeMonth(dx < 0 ? 1 : -1) } }}
    >
      <div class="sticky-hd">
        <div class="home-hd">
          <span class="wordmark">MyLedger</span>
        </div>
        <MonthNav />
        <div class="summary-wrap">
          <div class="summary-label">{t('thisMonth')}</div>
          <div class="summary-amount">{total.toFixed(2)}</div>
          {deltaPct !== null && deltaPct !== 0 && (
            <div class={`summary-delta${deltaUp ? ' up' : ' down'}`}>
              {deltaUp ? '▲' : '▼'} {Math.abs(deltaPct)}% {t('vsMonth')} {mfmt(prevY, prevM)}
            </div>
          )}
          <div class="summary-month">{mfmt(year, month)}</div>
        </div>
        {sorted.length > 0 && <div class="section-title">{t('byCat')}</div>}
      </div>

      {sorted.length === 0
        ? <EmptyState icon="💸" message={t('noExpense')} />
        : sorted.map(([catId, amt]) => {
              const cat = getCat(catId)
              const color = catColor(catId)
              const hasBudget = cat.budget != null && cat.budget > 0
              const pct = hasBudget
                ? (amt / cat.budget!) * 100
                : total > 0 ? (amt / total) * 100 : 0
              const over = hasBudget && amt > cat.budget!
              return (
                <div key={catId} class="row-item clickable" onClick={() => openM('cat-breakdown', { breakdownCatId: catId })}>
                  <div class="row-icon" style={{ background: color + '22' }}>
                    {cat.emoji}
                  </div>
                  <div class="row-info">
                    <div class="row-title">
                      {catLabel(cat)}
                      {hasBudget && <span class={`progress-badge${over ? ' over' : ''}`}>{Math.round(pct)}%</span>}
                    </div>
                    <ProgressBar pct={pct} color={color} over={over} />
                  </div>
                  <span class="amount">−{amt.toFixed(2)}</span>
                </div>
              )
        })
      }
    </div>
  )
}
