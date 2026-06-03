import type { BackupFile, Freq } from '../types'
import { restoreBackup } from '../db/queries'

export async function loadBackupFile(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.version !== 2) throw new Error('Unsupported backup version')
  if (!data.txs || !Array.isArray(data.txs)) throw new Error('Invalid backup file')
  const VALID_FREQS: Freq[] = ['none', 'monthly', 'quarterly', 'biannual', 'yearly']
  for (const tx of data.txs) {
    if (
      typeof tx.id !== 'string' || !tx.id ||
      typeof tx.amount !== 'number' || !isFinite(tx.amount) || tx.amount <= 0 ||
      typeof tx.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ||
      !VALID_FREQS.includes(tx.freq) ||
      typeof tx.category !== 'string' || !tx.category ||
      typeof tx.note !== 'string' ||
      typeof tx.createdAt !== 'string' || !tx.createdAt
    ) throw new Error('Invalid backup file')
  }
  const validatedCats = Array.isArray(data.userCats) ? data.userCats : []
  for (const cat of validatedCats) {
    if (
      typeof cat.id !== 'string' || !cat.id ||
      typeof cat.en !== 'string' ||
      typeof cat.zh !== 'string' ||
      typeof cat.emoji !== 'string'
    ) throw new Error('Invalid backup file')
  }
  await restoreBackup({ txs: data.txs, userCats: validatedCats })
}
