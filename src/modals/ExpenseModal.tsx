import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { selCat } from '../state/store'
import { t } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { putTx } from '../db/queries'
import { useTransactionForm } from './useTransactionForm'
import { AmountField, NoteField } from './ModalFormFields'

export function ExpenseModal() {
  const { amount, date, note, errMsg, editTx, parseAmount, reset } = useTransactionForm(selCat)

  async function save() {
    errMsg.value = ''
    const amt = parseAmount()
    if (!amt) { errMsg.value = t('errAmount'); return }
    if (!selCat.value) { errMsg.value = t('errCat'); return }
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
    reset()
  }

  return (
    <Modal id="expense">
      <div class="modal-title">{editTx ? t('editExpense') : t('addExpense')}</div>

      <AmountField amount={amount} />

      <FormField label={t('date')}>
        <input
          type="date"
          value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }}
        />
      </FormField>

      <FormField label={t('category')}>
        <CatGrid selectedId={selCat.value} onSelect={id => { selCat.value = selCat.value === id ? '' : id }} />
      </FormField>

      <NoteField note={note} onSave={save} errMsg={errMsg} />
    </Modal>
  )
}
