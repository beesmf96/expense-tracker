import type { Transaction, Category } from '../types'
import { openM } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { delTx } from '../db/queries'

export function confirmDeleteTx(tx: Transaction, cat: Category) {
  const txId = tx.id
  openM('confirm', {
    confirmIcon: '🗑️',
    confirmTitle: t('confirmDel'),
    confirmMsg: `Delete this ${catLabel(cat)} transaction of −${tx.amount.toFixed(2)}?`,
    confirmOkLabel: t('delete'),
    confirmOnOk: async () => { await delTx(txId) },
  })
}
