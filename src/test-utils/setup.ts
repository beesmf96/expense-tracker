import { vi } from 'vitest'
import type { Transaction, Category } from '../types'
import { txs, userCats, viewY, viewM } from '../state/store'

export function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test-1',
    date: '2025-01-15',
    amount: 100,
    category: 'bills_sub',
    note: '',
    freq: 'none',
    createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  }
}

export function makeCat(overrides: Partial<Category>): Category {
  return {
    id: 'bills_sub',
    en: 'Bill & Subscription',
    zh: '账单订阅',
    emoji: '💡',
    ...overrides,
  }
}

export async function setupStoreTest(): Promise<{ openM: ReturnType<typeof vi.fn> }> {
  const store = await import('../state/store')
  const openM = vi.mocked(store.openM)
  openM.mockClear()
  viewY.value = 2025
  viewM.value = 0
  txs.value = []
  userCats.value = []
  return { openM }
}
