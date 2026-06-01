import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { Modal } from './Modal'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { selRCat, selFreq, closeM, modalCtx, openModal } from '../state/store'
import { t } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { FreqGrid } from '../components/FreqGrid'
import { putTx } from '../db/queries'
import type { Freq } from '../types'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function RecurringModal() {
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
      selRCat.value = editTx.category
      selFreq.value = editTx.freq as Exclude<Freq, 'none'>
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
    amount.value = ''
    note.value = ''
    date.value = today()
    closeM()
  }

  return (
    <Modal id="recurring">
      <div class="modal-title">{editTx ? t('editRecurring') : t('addRecurring')}</div>

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
