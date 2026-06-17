import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { Transactions } from './Transactions'
import { txs, userCats, viewY, viewM, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

describe('Transactions page', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'food', en: 'Food', emoji: '🍔' })]
    viewY.value = 2025
    viewM.value = 0
    txs.value = []
  })

  it('shows the empty state when no transactions exist for the month', () => {
    render(<Transactions />)
    expect(screen.getByText(/No transactions yet/)).toBeTruthy()
  })

  it('renders a row per transaction in the view month', () => {
    txs.value = [
      makeTx({ id: 't1', category: 'food', date: '2025-01-10', amount: 12 }),
      makeTx({ id: 't2', category: 'food', date: '2025-01-20', amount: 8 }),
    ]
    render(<Transactions />)
    expect(screen.getAllByText('Food')).toHaveLength(2)
    expect(screen.getByText('2025-01-10')).toBeTruthy()
    expect(screen.getByText('2025-01-20')).toBeTruthy()
  })

  it('groups transactions by day with a per-day subtotal', () => {
    txs.value = [
      makeTx({ id: 't1', category: 'food', date: '2025-01-10', amount: 12 }),
      makeTx({ id: 't2', category: 'food', date: '2025-01-10', amount: 8 }),
    ]
    render(<Transactions />)
    expect(screen.getByText('2025-01-10')).toBeTruthy()
    expect(screen.getByText('−20.00', { selector: '.day-total' })).toBeTruthy()
  })

  it('opens the detail modal with the clicked transaction', async () => {
    const { openM } = await import('../state/store')
    const tx = makeTx({ id: 't1', category: 'food', date: '2025-01-10', amount: 12 })
    txs.value = [tx]
    render(<Transactions />)
    fireEvent.click(screen.getByText('Food').closest('.row-item')!)
    expect(openM).toHaveBeenCalledWith('detail', { detailTx: tx })
  })
})
