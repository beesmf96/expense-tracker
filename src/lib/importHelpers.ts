import type { BackupFile, Freq, Transaction, Category } from '../types'
import { restoreBackup } from '../db/queries'

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

function isPlainSafeObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false
  for (const key of Object.keys(v)) {
    if (DANGEROUS_KEYS.includes(key)) return false
  }
  return true
}

function safeId(v: unknown): v is string {
  return typeof v === 'string' && !!v && !DANGEROUS_KEYS.includes(v)
}

export async function loadBackupFile(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.version !== 2) throw new Error('Unsupported backup version')
  if (!data.txs || !Array.isArray(data.txs)) throw new Error('Invalid backup file')
  const VALID_FREQS: Freq[] = ['none', 'monthly', 'quarterly', 'biannual', 'yearly']
  const cleanTxs: Transaction[] = []
  for (const tx of data.txs) {
    if (
      !isPlainSafeObject(tx) ||
      !safeId(tx.id) ||
      typeof tx.amount !== 'number' || !isFinite(tx.amount) || tx.amount <= 0 ||
      typeof tx.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ||
      !VALID_FREQS.includes(tx.freq as Freq) ||
      typeof tx.category !== 'string' || !tx.category ||
      typeof tx.note !== 'string' ||
      typeof tx.createdAt !== 'string' || !tx.createdAt ||
      (tx.isGenerated !== undefined && typeof tx.isGenerated !== 'boolean') ||
      (tx.occurrences !== undefined && (typeof tx.occurrences !== 'number' || !Number.isInteger(tx.occurrences) || tx.occurrences < 1))
    ) throw new Error('Invalid backup file')
    const cleanTx: Transaction = {
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      category: tx.category,
      note: tx.note,
      freq: tx.freq as Freq,
      createdAt: tx.createdAt,
    }
    if (tx.occurrences !== undefined) cleanTx.occurrences = tx.occurrences as number
    cleanTxs.push(cleanTx)
  }
  const rawCats: unknown = data.userCats
  const cleanCats: Category[] = []
  if (Array.isArray(rawCats)) {
    for (const cat of rawCats) {
      if (
        !isPlainSafeObject(cat) ||
        !safeId(cat.id) ||
        typeof cat.en !== 'string' ||
        typeof cat.zh !== 'string' ||
        typeof cat.emoji !== 'string' ||
        (cat.label !== undefined && typeof cat.label !== 'string') ||
        (cat.budget !== undefined && (typeof cat.budget !== 'number' || !isFinite(cat.budget) || cat.budget <= 0))
      ) throw new Error('Invalid backup file')
      const cleanCat: Category = {
        id: cat.id,
        en: cat.en,
        zh: cat.zh,
        emoji: cat.emoji,
      }
      if (cat.label !== undefined) cleanCat.label = cat.label as string
      if (cat.budget !== undefined) cleanCat.budget = cat.budget as number
      cleanCats.push(cleanCat)
    }
  }
  await restoreBackup({ txs: cleanTxs, userCats: cleanCats })
}
