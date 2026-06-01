import { Modal } from './Modal'
import { modalCtx, closeM, txs, getCat, catColor, openM } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { delTx } from '../db/queries'
import { FREQS } from '../data/cats'
import { lang } from '../state/store'

export function DetailModal() {
  const ctx = modalCtx.value
  const tx = ctx.detailTx ?? (ctx.detailId ? txs.value.find(t => t.id === ctx.detailId) : undefined)

  if (!tx) return <Modal id="detail"><div /></Modal>

  const cat = getCat(tx.category)
  const color = catColor(tx.category)
  const isTemplate = tx.freq !== 'none'

  function freqLabel(freq: string): string {
    const f = FREQS.find(x => x.value === freq)
    return f ? (lang.value === 'zh' ? f.zh : f.en) : freq
  }

  return (
    <Modal id="detail">
      <div class="modal-title">{t('txDetail')}</div>

      <div class="row-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div class="row-icon" style={{ background: color + '22', width: '48px', height: '48px', fontSize: '22px' }}>
          {cat.emoji}
        </div>
        <div class="row-info">
          <div class="row-title" style={{ fontSize: '16px' }}>{catLabel(cat)}</div>
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

      {!tx.isGenerated && (
        <button class="btn btn-r" onClick={() => {
          openM('confirm', {
            confirmIcon: '🗑️',
            confirmTitle: t('confirmDel'),
            confirmMsg: `Delete this ${catLabel(cat)} transaction of −${tx.amount.toFixed(2)}?`,
            confirmOkLabel: t('delete'),
            confirmOnOk: async () => { await delTx(tx.id) },
          })
        }}>
          {t('delete')}
        </button>
      )}
      <button class="btn btn-g" onClick={closeM}>{t('close')}</button>
    </Modal>
  )
}
