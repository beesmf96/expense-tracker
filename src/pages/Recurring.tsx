import { useSignal } from '@preact/signals'
import { txs, getCat, catColor, openM } from '../state/store'
import { t, catLabel, freqLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'
import { countOccurrences, isTemplateCompleted } from '../state/recurring'

export function Recurring() {
  const tab = useSignal<'active' | 'done'>('active')

  const now = new Date()
  const nowY = now.getFullYear()
  const nowM = now.getMonth()

  const templates = txs.value.filter(tx => tx.freq !== 'none')
  const activeTpls = templates.filter(tpl => !tpl.occurrences || !isTemplateCompleted(tpl, nowY, nowM))
  const doneTpls = templates.filter(tpl => tpl.occurrences != null && isTemplateCompleted(tpl, nowY, nowM))

  if (templates.length === 0) {
    return (
      <div>
        <div class="sticky-hd"><div class="page-title">{t('recurring')}</div></div>
        <EmptyState icon="🔄" message={t('noRecurring')} />
      </div>
    )
  }

  const list = tab.value === 'active' ? activeTpls : doneTpls

  return (
    <div>
      <div class="sticky-hd">
        <div class="page-title">{t('recurring')}</div>
        <div class="page-tabs">
          <button
            class={`tab-btn${tab.value === 'active' ? ' active' : ''}`}
            onClick={() => { tab.value = 'active' }}
          >
            {t('recurringTabActive')}
          </button>
          <button
            class={`tab-btn${tab.value === 'done' ? ' active' : ''}`}
            onClick={() => { tab.value = 'done' }}
          >
            {t('recurringTabDone')}
          </button>
        </div>
      </div>
      {list.map(tx => {
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
              {tx.occurrences != null && (
                <span class="progress-badge">{countOccurrences(tx, nowY, nowM)} / {tx.occurrences}</span>
              )}
            </div>
            <div class="amount">−{tx.amount.toFixed(2)}</div>
          </div>
        )
      })}
    </div>
  )
}
