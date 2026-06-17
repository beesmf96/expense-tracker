import type { Transaction, Freq } from '../types'

const FREQ_INTERVAL: Record<Exclude<Freq, 'none'>, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
}

export function genRecurring(allTxs: Transaction[], viewYear: number, viewMonth: number): Transaction[] {
  const generated: Transaction[] = []
  const templates = allTxs.filter(tx => tx.freq !== 'none')
  const overrides = new Set(allTxs.filter(tx => tx.freq === 'none').map(tx => tx.id))

  for (const tpl of templates) {
    const [sy, sm] = tpl.date.split('-').map(Number)
    const startYear = sy
    const startMonth = sm - 1

    const delta = (viewYear - startYear) * 12 + (viewMonth - startMonth)
    if (delta < 0) continue

    const interval = FREQ_INTERVAL[tpl.freq as Exclude<Freq, 'none'>]
    if (delta % interval !== 0) continue
    if (tpl.occurrences && Math.floor(delta / interval) >= tpl.occurrences) continue

    const origDay = parseInt(tpl.date.split('-')[2])
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const day = Math.min(origDay, daysInMonth)
    const genDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

    if (overrides.has(`${tpl.id}_${monthKey}`)) continue

    generated.push({
      ...tpl,
      id: `${tpl.id}_${monthKey}`,
      date: genDate,
      isGenerated: true,
    })
  }

  return generated
}

export function monthTxs(allTxs: Transaction[], viewYear: number, viewMonth: number): Transaction[] {
  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const real = allTxs.filter(tx => tx.freq === 'none' && tx.date.startsWith(monthKey))
  const generated = genRecurring(allTxs, viewYear, viewMonth)
  return [...real, ...generated].sort((a, b) => b.date.localeCompare(a.date))
}

export function monthTotal(allTxs: Transaction[], viewYear: number, viewMonth: number): number {
  return monthTxs(allTxs, viewYear, viewMonth).reduce((s, tx) => s + tx.amount, 0)
}

export function countOccurrences(tpl: Transaction, nowYear: number, nowMonth: number): number {
  const [sy, sm] = tpl.date.split('-').map(Number)
  const startYear = sy
  const startMonth = sm - 1
  const delta = (nowYear - startYear) * 12 + (nowMonth - startMonth)
  if (delta < 0) return 0
  const interval = FREQ_INTERVAL[tpl.freq as Exclude<Freq, 'none'>]
  const idx = Math.floor(delta / interval)
  return Math.min(idx + 1, tpl.occurrences ?? Infinity)
}

export function isTemplateCompleted(tpl: Transaction, nowYear: number, nowMonth: number): boolean {
  if (!tpl.occurrences) return false
  return countOccurrences(tpl, nowYear, nowMonth) >= tpl.occurrences
}
