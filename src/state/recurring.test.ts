import { describe, it, expect } from 'vitest'
import { genRecurring, monthTxs } from './recurring'
import { makeTx } from '../test-utils/setup'

describe('genRecurring', () => {
  it('returns empty array when no templates exist', () => {
    const txs = [makeTx({ freq: 'none' })]
    expect(genRecurring(txs, 2025, 0)).toEqual([])
  })

  it('returns empty array when txs is empty', () => {
    expect(genRecurring([], 2025, 0)).toEqual([])
  })

  it('skips a template whose start month is after the view month (delta < 0)', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-03-01' })
    expect(genRecurring([tpl], 2025, 0)).toHaveLength(0)
  })

  it('generates a monthly tx for the same month as the template start (delta === 0)', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const result = genRecurring([tpl], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-01')
    expect(result[0].isGenerated).toBe(true)
  })

  it('generates a monthly tx for a month after the template start', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const result = genRecurring([tpl], 2025, 2)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-03')
  })

  it('generated id follows {templateId}_{YYYY-MM} pattern', () => {
    const tpl = makeTx({ id: 'sub-netflix', freq: 'monthly', date: '2025-06-10' })
    const result = genRecurring([tpl], 2025, 5)
    expect(result[0].id).toBe('sub-netflix_2025-06')
  })

  it('generated tx copies template fields and has isGenerated: true and freq: none', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15', amount: 250, category: 'food', note: 'groceries' })
    const result = genRecurring([tpl], 2025, 0)
    expect(result[0].amount).toBe(250)
    expect(result[0].category).toBe('food')
    expect(result[0].note).toBe('groceries')
    expect(result[0].isGenerated).toBe(true)
  })

  it('clamps day to last valid day of the month (Jan 31 template -> Feb 28)', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-31' })
    const result = genRecurring([tpl], 2025, 1)
    expect(result[0].date).toBe('2025-02-28')
  })

  it('does not clamp when the day is valid in the target month', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const result = genRecurring([tpl], 2025, 1)
    expect(result[0].date).toBe('2025-02-15')
  })

  it('generates a quarterly tx when delta is a multiple of 3', () => {
    const tpl = makeTx({ id: 'tpl-q', freq: 'quarterly', date: '2025-01-10' })
    const result = genRecurring([tpl], 2025, 3)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-q_2025-04')
  })

  it('skips a quarterly template when delta is not a multiple of 3', () => {
    const tpl = makeTx({ id: 'tpl-q', freq: 'quarterly', date: '2025-01-10' })
    expect(genRecurring([tpl], 2025, 1)).toHaveLength(0)
    expect(genRecurring([tpl], 2025, 2)).toHaveLength(0)
  })

  it('skips generation when a real override exists for that month', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const override = makeTx({ id: 'tpl-1_2025-01', freq: 'none', date: '2025-01-20' })
    expect(genRecurring([tpl, override], 2025, 0)).toHaveLength(0)
  })

  it('override for month A does not suppress generation for month B', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const override = makeTx({ id: 'tpl-1_2025-01', freq: 'none', date: '2025-01-20' })
    const result = genRecurring([tpl, override], 2025, 1)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-02')
  })

  it('override matching is exact — a different month override does not suppress', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const otherOverride = makeTx({ id: 'tpl-1_2025-02', freq: 'none', date: '2025-02-15' })
    const result = genRecurring([tpl, otherOverride], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-01')
  })

  it('generates for multiple templates in the same view month', () => {
    const tpl1 = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-05' })
    const tpl2 = makeTx({ id: 'tpl-2', freq: 'monthly', date: '2025-01-20' })
    const result = genRecurring([tpl1, tpl2], 2025, 0)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toContain('tpl-1_2025-01')
    expect(result.map(r => r.id)).toContain('tpl-2_2025-01')
  })
})

describe('monthTxs', () => {
  it('returns empty array when there are no transactions', () => {
    expect(monthTxs([], 2025, 0)).toEqual([])
  })

  it('includes real txs (freq: none) whose date is in the view month', () => {
    const tx = makeTx({ id: 'real-1', freq: 'none', date: '2025-01-10' })
    const result = monthTxs([tx], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('real-1')
  })

  it('excludes real txs outside the view month', () => {
    const tx = makeTx({ id: 'real-1', freq: 'none', date: '2025-02-10' })
    expect(monthTxs([tx], 2025, 0)).toHaveLength(0)
  })

  it('includes generated txs for the view month from templates', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const result = monthTxs([tpl], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].isGenerated).toBe(true)
    expect(result[0].id).toBe('tpl-1_2025-01')
  })

  it('merges real and generated txs', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const real = makeTx({ id: 'real-1', freq: 'none', date: '2025-01-20' })
    const result = monthTxs([tpl, real], 2025, 0)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toContain('real-1')
    expect(result.map(r => r.id)).toContain('tpl-1_2025-01')
  })

  it('returns txs sorted descending by date', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-05' })
    const real1 = makeTx({ id: 'real-1', freq: 'none', date: '2025-01-20' })
    const real2 = makeTx({ id: 'real-2', freq: 'none', date: '2025-01-10' })
    const result = monthTxs([tpl, real1, real2], 2025, 0)
    expect(result[0].date >= result[1].date).toBe(true)
    expect(result[1].date >= result[2].date).toBe(true)
  })

  it('real override replaces generated tx — only one entry for that slot', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const override = makeTx({ id: 'tpl-1_2025-01', freq: 'none', date: '2025-01-20' })
    const result = monthTxs([tpl, override], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-01')
    expect(result[0].isGenerated).toBeUndefined()
  })
})
