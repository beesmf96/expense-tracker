import type { Transaction, Category, BackupFile } from '../types'
import { catLabel } from '../data/i18n'
import { lang } from '../state/store'
import { today } from './dateHelpers'

function dl(name: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.click()
  URL.revokeObjectURL(href)
}

export function exportCSV(allTxsList: Transaction[], cats: Category[]) {
  const rows = [['Date', 'Category', 'Amount', 'Frequency', 'Note']]
  for (const tx of allTxsList) {
    if (tx.freq !== 'none') continue
    const cat = cats.find(c => c.id === tx.category)
    const catName = cat ? catLabel(cat, lang.value) : tx.category
    rows.push([tx.date, catName, String(tx.amount), tx.freq, tx.note])
  }
  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  dl('myledger-export.csv', URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })))
}

export function backupJSON(allTxsList: Transaction[], userCats: Category[]) {
  const data: BackupFile = {
    version: 2,
    exportedAt: new Date().toISOString(),
    txs: allTxsList,
    userCats,
  }
  const json = JSON.stringify(data, null, 2)
  dl('myledger-backup.json', URL.createObjectURL(new Blob([json], { type: 'application/json' })))
}

export async function writeAutoBackup(
  handle: FileSystemDirectoryHandle,
  txsList: Transaction[],
  userCatsList: Category[]
): Promise<void> {
  const name = `myledger-backup-${today()}.json`
  const data: BackupFile = {
    version: 2,
    exportedAt: new Date().toISOString(),
    txs: txsList,
    userCats: userCatsList,
  }
  const json = JSON.stringify(data, null, 2)
  const fileHandle = await handle.getFileHandle(name, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(json)
  await writable.close()
}
