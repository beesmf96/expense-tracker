import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { txs, userCats, modalCtx, openModal } from '../state/store'
import { makeTx, makeCat, setupStoreTest } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

describe('CatBreakdownModal', () => {
  let openM: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    openM = (await setupStoreTest()).openM
    modalCtx.value = {}
    openModal.value = 'cat-breakdown'
  })

  it('renders nothing meaningful when breakdownCatId is absent', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    modalCtx.value = {}

    render(<CatBreakdownModal />)

    expect(screen.queryByText('Category Breakdown')).toBeNull()
  })

  it('renders the category name and total amount when breakdownCatId is set', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    userCats.value = [makeCat()]
    txs.value = [
      makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 }),
      makeTx({ id: 'tx-2', category: 'bills_sub', date: '2025-01-15', amount: 30 }),
    ]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    expect(screen.getByText('Bill & Subscription')).toBeTruthy()
    expect(screen.getByText(/−80\.00/)).toBeTruthy()
  })

  it('only shows transactions matching the breakdownCatId', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    txs.value = [
      makeTx({ id: 'tx-bills', category: 'bills_sub', date: '2025-01-10', amount: 50 }),
      makeTx({ id: 'tx-grocery', category: 'groceries', date: '2025-01-12', amount: 80 }),
    ]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    const rows = screen.getAllByText(/−\d/)
    expect(rows).toHaveLength(2)
    const amounts = rows.map(r => r.textContent)
    expect(amounts).toContain('−50.00')
    expect(amounts).not.toContain('−80.00')
  })

  it('shows note in row-sub when transaction has a note', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    txs.value = [
      makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50, note: 'Netflix' }),
    ]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    expect(screen.getByText('Netflix')).toBeTruthy()
  })

  it('does not render note when transaction note is empty', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    txs.value = [
      makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50, note: '' }),
    ]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    const rowSubs = document.querySelectorAll('.row-sub')
    expect(rowSubs).toHaveLength(1)
  })

  it('calls openM with detail and the clicked transaction when a tx row is clicked', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    const tx = makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 })
    txs.value = [tx]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    const txRow = screen.getByText('2025-01-10').closest('.row-item')
    expect(txRow).not.toBeNull()

    await userEvent.click(txRow!)

    expect(openM).toHaveBeenCalledWith('detail', { detailTx: tx })
  })

  it('renders empty tx list when no transactions match the breakdownCatId for the view month', async () => {
    const { CatBreakdownModal } = await import('./CatBreakdownModal')
    userCats.value = [makeCat()]
    txs.value = [
      makeTx({ id: 'tx-grocery', category: 'groceries', date: '2025-01-12', amount: 80 }),
    ]
    modalCtx.value = { breakdownCatId: 'bills_sub' }

    render(<CatBreakdownModal />)

    expect(screen.getByText('Bill & Subscription')).toBeTruthy()
    expect(screen.queryByText(/−\d{2,}\.\d{2}$/)).toBeNull()
  })
})
