import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { selEmoji, modalCtx, closeM } from '../state/store'
import { t } from '../data/i18n'
import { EmojiGrid } from '../components/EmojiGrid'
import { putCat } from '../db/queries'

export function NewCatModal() {
  const name = useSignal('')

  async function save() {
    if (!name.value.trim()) return
    const id = `cat_${Date.now()}`
    await putCat({
      id,
      en: name.value.trim(),
      zh: name.value.trim(),
      emoji: selEmoji.value,
    })
    const cb = modalCtx.value.newCatReturnSel
    if (cb) cb(id)
    name.value = ''
    closeM()
  }

  return (
    <Modal id="newcat">
      <div class="modal-title">{t('addCat')}</div>

      <div class="field">
        <label>{t('catName')}</label>
        <input
          type="text"
          placeholder="e.g. Transport"
          value={name.value}
          onInput={e => { name.value = (e.target as HTMLInputElement).value }}
        />
      </div>

      <div class="field">
        <label>{t('chooseIcon')}</label>
        <EmojiGrid selectedEmoji={selEmoji.value} onSelect={e => { selEmoji.value = e }} />
      </div>

      <button class="btn btn-p" onClick={save}>{t('save')}</button>
      <button class="btn btn-g" onClick={closeM}>{t('cancel')}</button>
    </Modal>
  )
}
