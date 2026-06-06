import { useSignal } from '@preact/signals'
import { activePage, recentCatIds, catColor, getCat, selCat, openM, showToast } from '../state/store'
import { putTx } from '../db/queries'
import { today } from '../lib/dateHelpers'
import { t, catLabel } from '../data/i18n'

export function QuickAddBar() {
  const amount = useSignal('')
  const localCat = useSignal('')
  const errMsg = useSignal('')

  const page = activePage.value
  if (page !== 'home' && page !== 'transactions') return null

  const cats = recentCatIds.value

  function handleSubmit() {
    const amt = parseFloat(amount.value)
    if (!isFinite(amt) || amt <= 0) { errMsg.value = t('errAmount'); return }
    if (!localCat.value) { errMsg.value = t('errCat'); return }
    errMsg.value = ''
    putTx({
      id: crypto.randomUUID(),
      date: today(),
      amount: amt,
      category: localCat.value,
      note: '',
      freq: 'none',
      createdAt: new Date().toISOString(),
    }).then(() => {
      showToast(t('quickSaved'))
      amount.value = ''
      localCat.value = ''
    })
  }

  function handleMore() {
    selCat.value = localCat.value
    amount.value = ''
    openM('expense', {})
  }

  return (
    <div class="quick-add-bar">
      <input
        class="qab-amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        aria-label={t('amount')}
        value={amount.value}
        onInput={e => { amount.value = (e.target as HTMLInputElement).value; errMsg.value = '' }}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
      />
      <div class="qab-cats">
        {cats.length === 0
          ? <span class="qab-no-cats" onClick={() => { activePage.value = 'manage-cats' }}>{t('quickNoCats')}</span>
          : cats.map(id => {
              const cat = getCat(id)
              return (
                <div
                  key={id}
                  class={`cat-pill qab-pill${localCat.value === id ? ' selected' : ''}`}
                  style={{ background: catColor(id) + '22' }}
                  onClick={() => { localCat.value = id; errMsg.value = '' }}
                >
                  <span class="cemoji">{cat.emoji}</span>
                  <span class="clabel">{catLabel(cat)}</span>
                </div>
              )
            })
        }
      </div>
      {errMsg.value && <span class="qab-err">{errMsg.value}</span>}
      <button class="qab-more btn-small btn-small-g" onClick={handleMore}>{t('more')}</button>
    </div>
  )
}
