import { Modal } from './Modal'
import { modalCtx, closeM, txs, getCat, catColor, openM, viewY, viewM } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { monthTxs } from '../state/recurring'

export function CatBreakdownModal() {
  const catId = modalCtx.value.breakdownCatId

  if (!catId) return <Modal id="cat-breakdown"><div /></Modal>

  const cat = getCat(catId)
  const color = catColor(catId)
  const all = monthTxs(txs.value, viewY.value, viewM.value)
  const catTxs = all.filter(tx => tx.category === catId)
  const amt = catTxs.reduce((s, tx) => s + tx.amount, 0)
  const total = all.reduce((s, tx) => s + tx.amount, 0)
  const pct = total > 0 ? (amt / total) * 100 : 0

  return (
    <Modal id="cat-breakdown">
      <div class="modal-title">{t('catBreakdown')}</div>

      <div class="row-item modal-head">
        <div class="row-icon" style={{ background: color + '22' }}>
          {cat.emoji}
        </div>
        <div class="row-info">
          <div class="row-title">{catLabel(cat)}</div>
          <div class="row-sub">−{amt.toFixed(2)} · {pct.toFixed(0)}%</div>
        </div>
      </div>

      <div class="cat-breakdown-list">
        {catTxs.map(tx => (
          <div key={tx.id} class="row-item clickable" onClick={() => openM('detail', { detailTx: tx, returnTo: { id: 'cat-breakdown', ctx: { breakdownCatId: catId } } })}>
            <div class="row-info">
              <div class="row-title">{tx.date}</div>
              {tx.note && <div class="row-sub">{tx.note}</div>}
            </div>
            <span class="amount">−{tx.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <button class="btn btn-g" onClick={closeM}>{t('close')}</button>
    </Modal>
  )
}
