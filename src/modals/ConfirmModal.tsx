import { Modal } from './Modal'
import { modalCtx, closeM } from '../state/store'
import { t } from '../data/i18n'

export function ConfirmModal() {
  const ctx = modalCtx.value

  return (
    <Modal id="confirm">
      <div class="modal-title">{ctx.confirmIcon} {ctx.confirmTitle}</div>
      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
        {ctx.confirmMsg}
      </p>
      <button class="btn btn-r" onClick={async () => { await ctx.confirmOnOk?.(); closeM() }}>
        {ctx.confirmOkLabel ?? t('delete')}
      </button>
      <button class="btn btn-g" onClick={closeM}>{t('cancel')}</button>
    </Modal>
  )
}
