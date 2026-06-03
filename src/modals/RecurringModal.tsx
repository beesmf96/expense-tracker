import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { selRCat, selFreq } from '../state/store'
import { t } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { FreqGrid } from '../components/FreqGrid'
import { putTx } from '../db/queries'
import type { Freq } from '../types'
import { useTransactionForm } from './useTransactionForm'
import { AmountField, NoteField } from './ModalFormFields'

export function RecurringModal() {
  const { amount, date, note, errMsg, editTx, parseAmount, reset } = useTransactionForm(
    selRCat,
    tx => { selFreq.value = tx.freq as Exclude<Freq, 'none'> }
  )

  async function save() {
    errMsg.value = ''
    const amt = parseAmount()
    if (!amt) { errMsg.value = t('errAmount'); return }
    if (!selRCat.value) { errMsg.value = t('errCat'); return }
    if (editTx) {
      await putTx({
        ...editTx,
        amount: amt,
        date: date.value,
        note: note.value.trim(),
        category: selRCat.value,
        freq: selFreq.value,
      })
    } else {
      await putTx({
        id: Date.now().toString(),
        date: date.value,
        amount: amt,
        category: selRCat.value,
        note: note.value.trim(),
        freq: selFreq.value,
        createdAt: new Date().toISOString(),
      })
    }
    reset()
  }

  return (
    <Modal id="recurring">
      <div class="modal-title">{editTx ? t('editRecurring') : t('addRecurring')}</div>

      <AmountField amount={amount} />

      <FormField label={t('startDate')}>
        <input
          type="date"
          value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }}
        />
      </FormField>

      <FormField label={t('frequency')}>
        <FreqGrid
          selectedFreq={selFreq.value}
          onSelect={f => { selFreq.value = f }}
        />
      </FormField>

      <FormField label={t('category')}>
        <CatGrid selectedId={selRCat.value} onSelect={id => { selRCat.value = id }} />
      </FormField>

      <NoteField note={note} onSave={save} errMsg={errMsg} />
    </Modal>
  )
}
