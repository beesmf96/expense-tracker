import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { selEmoji, modalCtx, closeM } from '../state/store'
import { t } from '../data/i18n'
import { EmojiPicker } from '../components/EmojiPicker'
import { putCat } from '../db/queries'

export function NewCatModal() {
  const name = useSignal('')
  const budget = useSignal('')

  async function save() {
    if (!name.value.trim()) return
    const id = `cat_${Date.now()}`
    const b = parseFloat(budget.value)
    await putCat({
      id,
      en: name.value.trim(),
      zh: name.value.trim(),
      emoji: selEmoji.value,
      ...(isFinite(b) && b > 0 ? { budget: b } : {}),
    })
    const cb = modalCtx.value.newCatReturnSel
    if (cb) cb(id)
    name.value = ''
    budget.value = ''
    closeM()
  }

  return (
    <Modal id="newcat">
      <div class="modal-title">{t('addCat')}</div>

      <FormField label={t('catName')}>
        <input
          type="text"
          placeholder="e.g. Transport"
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
