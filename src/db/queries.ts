import { db } from './db'
import { txs, userCats, autoBackupFolderName, needsBackupPermission } from '../state/store'
import { writeAutoBackup } from '../lib/exportHelpers'
import type { Transaction, Category } from '../types'

let _autoHandle: FileSystemDirectoryHandle | null = null

async function triggerAutoBackup(txsList: Transaction[], catsList: Category[]): Promise<void> {
  if (!_autoHandle) return
  const perm = await _autoHandle.queryPermission({ mode: 'readwrite' })
  if (perm !== 'granted') {
    needsBackupPermission.value = true
    return
  }
  try {
    await writeAutoBackup(_autoHandle, txsList, catsList)
  } catch {
    needsBackupPermission.value = true
  }
}

export async function initAutoBackup(): Promise<void> {
  const row = await db.settings.get('autoBackupHandle')
  if (!row) return
  const handle = row.value as FileSystemDirectoryHandle
  _autoHandle = handle
  autoBackupFolderName.value = handle.name
  const perm = await handle.queryPermission({ mode: 'readwrite' })
  needsBackupPermission.value = perm !== 'granted'
}

export async function saveAutoBackupHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await db.settings.put({ key: 'autoBackupHandle', value: handle })
  _autoHandle = handle
  autoBackupFolderName.value = handle.name
  needsBackupPermission.value = false
}

export async function clearAutoBackupHandle(): Promise<void> {
  await db.settings.delete('autoBackupHandle')
  _autoHandle = null
  autoBackupFolderName.value = null
  needsBackupPermission.value = false
}

export async function grantAutoBackupPermission(): Promise<void> {
  if (!_autoHandle) return
  const handle = _autoHandle
  const result = await handle.requestPermission({ mode: 'readwrite' })
  if (result === 'granted') {
    needsBackupPermission.value = false
    await writeAutoBackup(handle, txs.value, userCats.value)
  }
}

export async function loadAll() {
  const [loadedTxs, loadedCats] = await Promise.all([
    db.txs.toArray(),
    db.cats.toArray(),
  ])
  txs.value = loadedTxs.sort((a, b) => b.date.localeCompare(a.date))
  userCats.value = loadedCats
  triggerAutoBackup(loadedTxs, loadedCats).catch(() => {})
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
