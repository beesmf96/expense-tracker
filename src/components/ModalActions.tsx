import { closeM } from '../state/store'
import { t } from '../data/i18n'

interface Props {
  onSave: () => void
}

export function ModalActions({ onSave }: Props) {
  return (
    <>
      <button class="btn btn-p" onClick={onSave}>{t('save')}</button>
      <button class="btn btn-g" onClick={closeM}>{t('cancel')}</button>
    </>
  )
}
