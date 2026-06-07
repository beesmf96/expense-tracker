import { txs, getCat, catColor, openM, viewY, viewM, changeMonth } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'
import { MonthNav } from '../components/MonthNav'
import { monthTxs } from '../state/recurring'

let _swipeX = 0

export function Transactions() {
  const year = viewY.value
  const month = viewM.value
  const all = monthTxs(txs.value, year, month)

  return (
    <div
      onTouchStart={(e) => { _swipeX = e.touches[0].clientX }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - _swipeX; if (Math.abs(dx) > 50) changeMonth(dx < 0 ? 1 : -1) }}
    >
      <div class="page-title">{t('records')}</div>
      <MonthNav />
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
