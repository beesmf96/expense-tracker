import { txs, getCat, catColor, openM, selCat, selRCat, selFreq } from '../state/store'
import { t, mfmt, catLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'
import { allGeneratedUpToDate } from '../state/recurring'
import { delTx } from '../db/queries'
import type { Transaction, Freq } from '../types'

export function Transactions() {
  const all = [
    ...txs.value.filter(tx => tx.freq === 'none'),
    ...allGeneratedUpToDate(txs.value),
  ].sort((a, b) => b.date.localeCompare(a.date))

  if (all.length === 0) {
    return (
      <div>
        <div class="page-title">{t('records')}</div>
        <EmptyState icon="📋" message={t('noRecords')} />
      </div>
    )
  }

  function handleEdit(tx: Transaction) {
    if (tx.isGenerated || tx.freq === 'none') {
      selCat.value = tx.category
      openM('expense', { editTx: tx })
    } else {
      selRCat.value = tx.category
      selFreq.value = tx.freq as Exclude<Freq, 'none'>
      openM('recurring', { editTx: tx })
    }
  }

  const groups = new Map<string, typeof all>()
  for (const tx of all) {
    const key = tx.date.slice(0, 7)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  return (
    <div>
      <div class="page-title">{t('records')}</div>
      {[...groups.entries()].map(([key, items]) => {
        const [y, m] = key.split('-').map(Number)
        return (
          <div key={key}>
            <div class="month-group">{mfmt(y, m - 1)}</div>
            {items.map(tx => {
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
                      {tx.isGenerated && <span class="freq-badge" style={{ marginLeft: '6px' }}>↻</span>}
                    </div>
                    <div class="amount">−{tx.amount.toFixed(2)}</div>
                  </div>
                  <div class="row-actions">
                    <button
                      class="row-act-btn row-act-edit"
                      onClick={e => { e.stopPropagation(); handleEdit(tx) }}
                    >{t('edit')}</button>
                    {!tx.isGenerated && (
                      <button
                        class="row-act-btn row-act-del"
                        onClick={e => {
                          e.stopPropagation()
                          openM('confirm', {
                            confirmIcon: '🗑️',
                            confirmTitle: t('confirmDel'),
                            confirmMsg: `Delete this ${catLabel(cat)} transaction of −${tx.amount.toFixed(2)}?`,
                            confirmOkLabel: t('delete'),
                            confirmOnOk: async () => { await delTx(tx.id) },
                          })
                        }}
                      >{t('delete')}</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
