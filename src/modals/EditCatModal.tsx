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
  const budget = useSignal('')

  const catId = modalCtx.value.editCatId ?? ''
  const openModalVal = openModal.value
  const cat = catId ? getCat(catId) : null

  useEffect(() => {
    if (cat) {
      name.value = cat.en
      selEmoji.value = cat.emoji
      budget.value = cat.budget != null ? String(cat.budget) : ''
    }
  }, [catId, openModalVal])

  async function save() {
    if (!name.value.trim() || !catId) return
    const b = parseFloat(budget.value)
    const existing = getCat(catId)
    await putCat({
      id: catId,
      label: existing.label,
      en: name.value.trim(),
      zh: name.value.trim(),
      emoji: selEmoji.value,
      ...(isFinite(b) && b > 0 ? { budget: b } : {}),
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

      <FormField label={`${t('monthlyBudget')} · ${t('budgetOptional')}`}>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={budget.value}
          onInput={e => { budget.value = (e.target as HTMLInputElement).value }}
        />
      </FormField>

      <ModalActions onSave={save} />
    </Modal>
  )
}
