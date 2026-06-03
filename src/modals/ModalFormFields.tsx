import type { Signal } from '@preact/signals'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { t } from '../data/i18n'

export function AmountField({ amount }: { amount: Signal<string> }) {
  return (
    <FormField label={t('amount')}>
      <input
        class="big-input"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount.value}
        onInput={e => { amount.value = (e.target as HTMLInputElement).value }}
      />
    </FormField>
  )
}

export function NoteField({ note, onSave }: { note: Signal<string>; onSave: () => void }) {
  return (
    <>
      <FormField label={t('note')}>
        <textarea
          placeholder="Optional note"
          value={note.value}
          onInput={e => { note.value = (e.target as HTMLTextAreaElement).value }}
        />
      </FormField>
      <ModalActions onSave={onSave} />
    </>
  )
}
