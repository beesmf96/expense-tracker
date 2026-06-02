import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { txs, getCat, catColor, openM, activePage, selCat } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { EmptyState } from '../components/EmptyState'

export function Search() {
  const query = useSignal('')
  const activePageVal = activePage.value

  useEffect(() => {
    query.value = ''
  }, [activePageVal])

  const q = query.value.trim().toLowerCase()
  const realTxs = txs.value.filter(tx => tx.freq === 'none')
  const results = q === ''
    ? []
    : realTxs.filter(tx => {
        const cat = getCat(tx.category)
        return tx.note.toLowerCase().includes(q) || catLabel(cat).toLowerCase().includes(q)
      })

  return (
    <div>
      <div class="page-title">{t('search')}</div>
      <div class="field">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query.value}
          onInput={e => { query.value = (e.target as HTMLInputElement).value }}
        />
      </div>
      {q === '' && (
        <EmptyState icon="🔍" message={t('searchHint')} />
      )}
      {q !== '' && results.length === 0 && (
        <EmptyState icon="🔍" message={t('searchEmpty')}>
          <button class="btn-small btn-small-p" onClick={() => { selCat.value = ''; openM('expense') }}>{t('addExpense')}</button>
        </EmptyState>
      )}
      {results.map(tx => {
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
              <div class="row-date">{tx.date}</div>
            </div>
            <div class="amount">−{tx.amount.toFixed(2)}</div>
          </div>
        )
      })}
    </div>
  )
}
