import { txs, getCat, catColor, openM } from '../state/store'
import { t, catLabel, freqLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'

export function Recurring() {
  const templates = txs.value.filter(tx => tx.freq !== 'none')

  if (templates.length === 0) {
    return (
      <div>
        <div class="sticky-hd"><div class="page-title">{t('recurring')}</div></div>
        <EmptyState icon="🔄" message={t('noRecurring')} />
      </div>
    )
  }

  return (
    <div>
      <div class="page-title">{t('recurring')}</div>
      {templates.map(tx => {
        const cat = getCat(tx.category)
        const color = catColor(tx.category)
        return (
          <div
            key={tx.id}
            class="row-item clickable"
            onClick={() => openM('detail', { detailId: tx.id })}
          >
            <div class="row-icon" style={{ background: color + '22' }}>
              {cat.emoji}
            </div>
            <div class="row-info">
              <div class="row-title">{catLabel(cat)}</div>
              {tx.note && <div class="row-sub">{tx.note}</div>}
              <div class="row-date">{t('since')} {tx.date}</div>
              <span class="freq-badge">{freqLabel(tx.freq)}</span>
            </div>
            <div class="amount">−{tx.amount.toFixed(2)}</div>
          </div>
        )
      })}
    </div>
  )
}
