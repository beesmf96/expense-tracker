import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { selCat, closeM } from '../state/store'
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

  async function save() {
    const amt = parseFloat(amount.value)
    if (!amt || amt <= 0) return
    await putTx({
      id: Date.now().toString(),
      date: date.value,
      amount: amt,
      category: selCat.value,
      note: note.value.trim(),
      freq: 'none',
      createdAt: new Date().toISOString(),
    })
    amount.value = ''
    note.value = ''
    date.value = today()
    closeM()
  }

  return (
    <Modal id="expense">
      <div class="modal-title">{t('addExpense')}</div>

      <div class="field">
        <label>{t('amount')}</label>
        <input
          class="big-input"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount.value}
          onInput={e => { amount.value = (e.target as HTMLInputElement).value }}
        />
      </div>

      <div class="field">
        <label>{t('date')}</label>
        <input
          type="date"
          value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }}
        />
      </div>

      <div class="field">
        <label>{t('category')}</label>
        <CatGrid selectedId={selCat.value} onSelect={id => { selCat.value = id }} />
      </div>

      <div class="field">
        <label>{t('note')}</label>
        <textarea
          placeholder="Optional note"
          value={note.value}
          onInput={e => { note.value = (e.target as HTMLTextAreaElement).value }}
        />
      </div>

      <button class="btn btn-p" onClick={save}>{t('save')}</button>
      <button class="btn btn-g" onClick={closeM}>{t('cancel')}</button>
    </Modal>
  )
}
