import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { txs, viewY, viewM } from '../state/store'
import type { Transaction } from '../types'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

function makeTx(overrides: Partial<Transaction>): Transaction {
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

describe('Home — category row click', () => {
  let openM: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    const store = await import('../state/store')
    openM = vi.mocked(store.openM)
    openM.mockClear()
    viewY.value = 2025
    viewM.value = 0
    txs.value = []
  })

  it('calls openM with cat-breakdown and the correct breakdownCatId when a category row is clicked', async () => {
    const { Home } = await import('./Home')
    txs.value = [
      makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 }),
    ]

    render(<Home />)

    const row = screen.getByText('Bill & Subscription').closest('.row-item')
    expect(row).not.toBeNull()

    await userEvent.click(row!)

    expect(openM).toHaveBeenCalledOnce()
    expect(openM).toHaveBeenCalledWith('cat-breakdown', { breakdownCatId: 'bills_sub' })
  })

  it('calls openM with the correct breakdownCatId when multiple categories are rendered and one is clicked', async () => {
    const { Home } = await import('./Home')
    txs.value = [
      makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 }),
      makeTx({ id: 'tx-2', category: 'groceries', date: '2025-01-12', amount: 80 }),
    ]

    render(<Home />)

    const groceriesRow = screen.getByText('Groceries').closest('.row-item')
    expect(groceriesRow).not.toBeNull()

    await userEvent.click(groceriesRow!)

    expect(openM).toHaveBeenCalledWith('cat-breakdown', { breakdownCatId: 'groceries' })
  })

  it('renders EmptyState when no transactions exist for the view month', async () => {
    const { Home } = await import('./Home')
    txs.value = []

    render(<Home />)

    expect(screen.queryByText('Bill & Subscription')).toBeNull()
  })
})
