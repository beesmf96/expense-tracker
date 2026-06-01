import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { selCat, closeM, modalCtx, openModal } from '../state/store'
import { t } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { putTx } from '../db/queries'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ExpenseModal() {
  const amount = useSignal('')
  const date = useSignal(today())
  const note = useSignal('')

  const editTx = modalCtx.value.editTx
  const openModalVal = openModal.value

  useEffect(() => {
    if (editTx) {
      amount.value = editTx.amount.toString()
      date.value = editTx.date
      note.value = editTx.note
      selCat.value = editTx.category
    } else {
      amount.value = ''
      date.value = today()
      note.value = ''
    }
  }, [editTx?.id, openModalVal])

  async function save() {
    const amt = parseFloat(amount.value)
    if (!amt || amt <= 0) return
    if (editTx) {
      await putTx({
        ...editTx,
        amount: amt,
        date: date.value,
        note: note.value.trim(),
        category: selCat.value,
        freq: 'none',
        isGenerated: false,
      })
    } else {
      await putTx({
        id: Date.now().toString(),
        date: date.value,
        amount: amt,
        category: selCat.value,
        note: note.value.trim(),
        freq: 'none',
        createdAt: new Date().toISOString(),
      })
    }
    amount.value = ''
    note.value = ''
    date.value = today()
    closeM()
  }

  return (
    <Modal id="expense">
      <div class="modal-title">{editTx ? t('editExpense') : t('addExpense')}</div>

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

      <FormField label={t('date')}>
        <input
          type="date"
          value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }}
        />
      </FormField>

      <FormField label={t('category')}>
        <CatGrid selectedId={selCat.value} onSelect={id => { selCat.value = id }} />
      </FormField>

      <FormField label={t('note')}>
        <textarea
          placeholder="Optional note"
          value={note.value}
          onInput={e => { note.value = (e.target as HTMLTextAreaElement).value }}
        />
      </FormField>

      <ModalActions onSave={save} />
    </Modal>
  )
}
