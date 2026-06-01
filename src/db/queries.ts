import { db } from './db'
import { txs, userCats } from '../state/store'
import type { Transaction, Category } from '../types'

export async function loadAll() {
  const [loadedTxs, loadedCats] = await Promise.all([
    db.txs.toArray(),
    db.cats.toArray(),
  ])
  txs.value = loadedTxs.sort((a, b) => b.date.localeCompare(a.date))
  userCats.value = loadedCats
}

export const putTx = (tx: Transaction) => db.txs.put(tx).then(loadAll)
export const delTx = (id: string) => db.txs.delete(id).then(loadAll)
export const putCat = (cat: Category) => db.cats.put(cat).then(loadAll)
export const delCat = (id: string) => db.cats.delete(id).then(loadAll)

export async function bulkUpdateTxCat(fromId: string, toId: string) {
  const affected = await db.txs.where('category').equals(fromId).toArray()
  await db.txs.bulkPut(affected.map(tx => ({ ...tx, category: toId })))
  await loadAll()
}

export async function clearAll() {
  await db.transaction('rw', db.txs, db.cats, async () => {
    await db.txs.clear()
    await db.cats.clear()
  })
  await loadAll()
}

export async function restoreBackup(data: { txs: Transaction[]; userCats: Category[] }) {
  await db.transaction('rw', db.txs, db.cats, async () => {
    await db.txs.clear()
    await db.cats.clear()
    await db.txs.bulkPut(data.txs)
    await db.cats.bulkPut(data.userCats)
  })
  await loadAll()
}
