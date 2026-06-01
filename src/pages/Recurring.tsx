import { txs, getCat, catColor, openM, selRCat, selFreq, lang } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'
import { FREQS } from '../data/cats'
import { confirmDeleteTx } from '../lib/txHelpers'
import type { Freq } from '../types'

export function Recurring() {
  const templates = txs.value.filter(tx => tx.freq !== 'none')

  if (templates.length === 0) {
    return (
      <div>
        <div class="page-title">{t('recurring')}</div>
        <EmptyState icon="🔄" message={t('noRecurring')} />
      </div>
    )
  }

  function freqLabel(freq: string): string {
    const f = FREQS.find(x => x.value === freq)
    if (!f) return freq
    return lang.value === 'zh' ? f.zh : f.en
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
              <div class="amount">−{tx.amount.toFixed(2)}</div>
              <span class="freq-badge">{freqLabel(tx.freq)}</span>
            </div>
            <div class="row-actions">
              <button
                class="row-act-btn row-act-edit"
                onClick={e => {
                  e.stopPropagation()
                  selRCat.value = tx.category
                  selFreq.value = tx.freq as Exclude<Freq, 'none'>
                  openM('recurring', { editTx: tx })
                }}
              >{t('edit')}</button>
              <button
                class="row-act-btn row-act-del"
                onClick={e => { e.stopPropagation(); confirmDeleteTx(tx, cat) }}
              >{t('delete')}</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
