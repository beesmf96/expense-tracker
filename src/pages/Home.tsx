import { viewY, viewM, txs, catColor, getCat, openM } from '../state/store'
import { t, mfmt, catLabel } from '../data/i18n'
import { monthTxs } from '../state/recurring'
import { ProgressBar } from '../components/ProgressBar'
import { EmptyState } from '../components/EmptyState'

export function Home() {
  const year = viewY.value
  const month = viewM.value
  const current = monthTxs(txs.value, year, month)
  const total = current.reduce((s, tx) => s + tx.amount, 0)
  // Group by category
  const byCat = new Map<string, number>()
  for (const tx of current) {
    byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amount)
  }
  const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1])

  function changeMonth(delta: number) {
    let y = viewY.value, m = viewM.value + delta
    if (m < 0) { y--; m = 11 }
    if (m > 11) { y++; m = 0 }
    viewY.value = y
    viewM.value = m
  }

  return (
    <div>
      <div class="home-hd">
        <span class="wordmark">MyLedger</span>
      </div>

      <div class="month-nav">
        <button class="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
        <span class="month-nav-label">{mfmt(year, month)}</span>
        <button class="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
      </div>

      <div class="summary-wrap">
        <div class="summary-label">{t('thisMonth')}</div>
        <div class="summary-amount">{total.toFixed(2)}</div>
        <div class="summary-month">{mfmt(year, month)}</div>
      </div>

      {sorted.length === 0
        ? <EmptyState icon="💸" message={t('noExpense')} />
        : (
          <>
            <div class="section-title">{t('byCat')}</div>
            {sorted.map(([catId, amt]) => {
              const cat = getCat(catId)
              const color = catColor(catId)
              const pct = total > 0 ? (amt / total) * 100 : 0
              return (
                <div key={catId} class="row-item clickable" onClick={() => openM('expense', {})}>
                  <div class="row-icon" style={{ background: color + '22' }}>
                    {cat.emoji}
                  </div>
                  <div class="row-info">
                    <div class="row-title">{catLabel(cat)}</div>
                    <ProgressBar pct={pct} color={color} />
                  </div>
                  <span class="amount">−{amt.toFixed(2)}</span>
                </div>
              )
            })}
          </>
        )
      }
    </div>
  )
}
