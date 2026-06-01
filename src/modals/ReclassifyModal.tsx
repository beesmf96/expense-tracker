import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { modalCtx, closeM, getCat, txs } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { bulkUpdateTxCat, delCat } from '../db/queries'

export function ReclassifyModal() {
  const targetId = useSignal('')
  const ctx = modalCtx.value
  const fromId = ctx.rclFrom ?? ''
  const fromCat = fromId ? getCat(fromId) : null
  const count = fromId ? txs.value.filter(tx => tx.category === fromId).length : 0

  async function confirm() {
    if (!targetId.value || !fromId) return
    await bulkUpdateTxCat(fromId, targetId.value)
    if (ctx.rclDelete) await delCat(fromId)
    targetId.value = ''
    closeM()
  }

  return (
    <Modal id="reclassify">
      <div class="modal-title">{t('reclassify')}</div>

      {fromCat && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--s2)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)' }}>
          {fromCat.emoji} {catLabel(fromCat)} — {count} {t('records2')}
        </div>
      )}

      <div class="field">
        <label>{t('moveTo')}</label>
        <CatGrid
          selectedId={targetId.value}
          onSelect={id => { if (id !== fromId) targetId.value = id }}
        />
      </div>

      <button class="btn btn-p" onClick={confirm} disabled={!targetId.value}>
        {t('moveConfirm')}
      </button>
      <button class="btn btn-g" onClick={() => { targetId.value = ''; closeM() }}>{t('cancel')}</button>
    </Modal>
  )
}
