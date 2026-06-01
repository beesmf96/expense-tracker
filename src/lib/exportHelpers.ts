import type { Transaction, Category, BackupFile } from '../types'
import { catLabel } from '../data/i18n'
import { lang } from '../state/store'
import { restoreBackup } from '../db/queries'

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
  dl('myledger-export.csv', URL.createObjectURL(new Blob([csv], { type: 'text/csv' })))
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

export async function loadBackupFile(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (!data.txs || !Array.isArray(data.txs)) throw new Error('Invalid backup file')
  await restoreBackup({ txs: data.txs, userCats: data.userCats ?? [] })
}
