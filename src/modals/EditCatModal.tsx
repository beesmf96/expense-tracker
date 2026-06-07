import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { selEmoji, modalCtx, openModal, closeM, getCat } from '../state/store'
import { t } from '../data/i18n'
import { EmojiPicker } from '../components/EmojiPicker'
import { putCat } from '../db/queries'

export function EditCatModal() {
  const name = useSignal('')

  const catId = modalCtx.value.editCatId ?? ''
  const openModalVal = openModal.value
  const cat = catId ? getCat(catId) : null

  useEffect(() => {
    if (cat) {
      name.value = cat.en
      selEmoji.value = cat.emoji
    }
  }, [catId, openModalVal])

  async function save() {
    if (!name.value.trim() || !catId) return
    await putCat({
      ...getCat(catId),
      id: catId,
      en: name.value.trim(),
      zh: name.value.trim(),
      emoji: selEmoji.value,
    })
    closeM()
  }

  return (
    <Modal id="editcat">
      <div class="modal-title">{t('editCat')}</div>

      <FormField label={t('catName')}>
        <input
          type="text"
          value={name.value}
          onInput={e => { name.value = (e.target as HTMLInputElement).value }}
        />
      </FormField>

      <FormField label={t('chooseIcon')}>
        <EmojiPicker selectedEmoji={selEmoji.value} onSelect={e => { selEmoji.value = e }} />
      </FormField>

      <ModalActions onSave={save} />
    </Modal>
  )
}
