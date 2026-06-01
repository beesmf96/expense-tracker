import { txs, getCat, catColor, openM, viewY, viewM } from '../state/store'
import { t, mfmt, catLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'
import { monthTxs } from '../state/recurring'

export function Transactions() {
  const year = viewY.value
  const month = viewM.value
  const all = monthTxs(txs.value, year, month)

  function changeMonth(delta: number) {
    let y = viewY.value, m = viewM.value + delta
    if (m < 0) { y--; m = 11 }
    if (m > 11) { y++; m = 0 }
    viewY.value = y
    viewM.value = m
  }

  return (
    <div>
      <div class="page-title">{t('records')}</div>
      <div class="month-nav">
        <button class="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
        <span>{mfmt(year, month)}</span>
        <button class="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
      </div>
      <div class="page-divider" />
      {all.length === 0
        ? <EmptyState icon="📋" message={t('noRecords')} />
        : all.map(tx => {
            const cat = getCat(tx.category)
            const color = catColor(tx.category)
            return (
              <div
                key={tx.id}
                class="row-item clickable"
                onClick={() => openM('detail', { detailTx: tx })}
              >
                <div class="row-icon" style={{ background: color + '22' }}>
                  {cat.emoji}
                </div>
                <div class="row-info">
                  <div class="row-title">{catLabel(cat)}</div>
                  {tx.note && <div class="row-sub">{tx.note}</div>}
                  <div class="row-date">
                    {tx.date}
                    {tx.isGenerated && <span class="freq-badge">↻</span>}
                  </div>
                </div>
                <div class="amount">−{tx.amount.toFixed(2)}</div>
              </div>
            )
          })
      }
    </div>
  )
}
