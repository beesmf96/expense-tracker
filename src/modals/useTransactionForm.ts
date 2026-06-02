import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { modalCtx, openModal, closeM } from '../state/store'
import { today } from '../lib/dateHelpers'
import type { Signal } from '@preact/signals'
import type { Transaction } from '../types'

export function useTransactionForm(
  catSignal: Signal<string>,
  onEditSync?: (tx: Transaction) => void
) {
  const amount = useSignal('')
  const date   = useSignal(today())
  const note   = useSignal('')

  const editTx       = modalCtx.value.editTx
  const openModalVal = openModal.value

  useEffect(() => {
    if (editTx) {
      amount.value    = editTx.amount.toString()
      date.value      = editTx.date
      note.value      = editTx.note
      catSignal.value = editTx.category
      onEditSync?.(editTx)
    } else {
      amount.value = ''
      date.value   = today()
      note.value   = ''
    }
  }, [editTx?.id, openModalVal])

  function parseAmount(): number | null {
    const amt = parseFloat(amount.value)
    return (!amt || amt <= 0) ? null : amt
  }

  function reset() {
    amount.value = ''
    note.value   = ''
    date.value   = today()
    closeM()
  }

  return { amount, date, note, editTx, parseAmount, reset }
}
