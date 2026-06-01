import { Modal } from './Modal'
import { modalCtx, closeM, txs, getCat, catColor, openM, selCat, selRCat, selFreq } from '../state/store'
import { t, catLabel, freqLabel } from '../data/i18n'
import { confirmDeleteTx } from '../lib/txHelpers'
import type { Freq } from '../types'

export function DetailModal() {
  const ctx = modalCtx.value
  const tx = ctx.detailTx ?? (ctx.detailId ? txs.value.find(t => t.id === ctx.detailId) : undefined)

  if (!tx) return <Modal id="detail"><div /></Modal>

  const t2 = tx
  const cat = getCat(t2.category)
  const color = catColor(t2.category)
  const isTemplate = t2.freq !== 'none'

  function handleEdit() {
    if (t2.isGenerated === true) {
      selCat.value = t2.category
      openM('expense', { editTx: t2 })
    } else if (t2.freq !== 'none') {
      selRCat.value = t2.category
      selFreq.value = t2.freq as Exclude<Freq, 'none'>
      openM('recurring', { editTx: t2 })
    } else {
      selCat.value = t2.category
      openM('expense', { editTx: t2 })
    }
  }

  return (
    <Modal id="detail">
      <div class="modal-title">{t('txDetail')}</div>

      <div class="row-item modal-head">
        <div class="row-icon" style={{ background: color + '22' }}>
          {cat.emoji}
        </div>
        <div class="row-info">
          <div class="row-title">{catLabel(cat)}</div>
          {tx.note && <div class="row-sub">{tx.note}</div>}
        </div>
      </div>

      <div style={{ margin: '20px 0', padding: '16px', background: 'var(--s2)', borderRadius: '12px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '36px', color: 'var(--r)', fontWeight: 700 }}>
          −{tx.amount.toFixed(2)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>{tx.date}</div>
        {isTemplate && (
          <div style={{ marginTop: '8px' }}>
            <span class="freq-badge">{freqLabel(tx.freq)}</span>
          </div>
        )}
      </div>

      <button class="btn btn-p" onClick={handleEdit}>{t('edit')}</button>
      {!tx.isGenerated && (
        <button class="btn btn-r" onClick={() => confirmDeleteTx(t2, cat)}>{t('delete')}</button>
      )}
      <button class="btn btn-g" onClick={closeM}>{t('close')}</button>
    </Modal>
  )
}
