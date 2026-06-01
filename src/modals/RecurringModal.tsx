import { useSignal } from '@preact/signals'
import { Modal } from './Modal'
import { selRCat, selFreq, closeM } from '../state/store'
import { t } from '../data/i18n'
import { CatGrid } from '../components/CatGrid'
import { FreqGrid } from '../components/FreqGrid'
import { putTx } from '../db/queries'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function RecurringModal() {
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
      category: selRCat.value,
      note: note.value.trim(),
      freq: selFreq.value,
      createdAt: new Date().toISOString(),
    })
    amount.value = ''
    note.value = ''
    date.value = today()
    closeM()
  }

  return (
    <Modal id="recurring">
      <div class="modal-title">{t('addRecurring')}</div>

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
        <label>{t('startDate')}</label>
        <input
          type="date"
          value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }}
        />
      </div>

      <div class="field">
        <label>{t('frequency')}</label>
        <FreqGrid
          selectedFreq={selFreq.value}
          onSelect={f => { selFreq.value = f }}
        />
      </div>

      <div class="field">
        <label>{t('category')}</label>
        <CatGrid selectedId={selRCat.value} onSelect={id => { selRCat.value = id }} />
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
