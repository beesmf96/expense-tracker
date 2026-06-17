import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { txs, userCats } from '../state/store'
import { makeTx, makeCat, setupStoreTest } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

describe('Home — category row click', () => {
  let openM: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    openM = (await setupStoreTest()).openM
  })

  it('calls openM with cat-breakdown and the correct breakdownCatId when a category row is clicked', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat()]
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
    userCats.value = [
      makeCat(),
      makeCat({ id: 'groceries', en: 'Groceries', zh: '杂货', emoji: '🛒' }),
    ]
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

describe('Home — budgets', () => {
  beforeEach(async () => { await setupStoreTest() })

  it('shows a percent-of-budget badge when the category has a budget', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat({ budget: 100 })]
    txs.value = [makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 })]

    render(<Home />)

    const badge = screen.getByText('50%')
    expect(badge.className).toContain('progress-badge')
    expect(badge.className).not.toContain('over')
  })

  it('marks the badge over when spend exceeds the budget', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat({ budget: 100 })]
    txs.value = [makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 150 })]

    render(<Home />)

    const badge = screen.getByText('150%')
    expect(badge.className).toContain('over')
  })

  it('shows no budget badge when the category has no budget', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat()]
    txs.value = [makeTx({ id: 'tx-1', category: 'bills_sub', date: '2025-01-10', amount: 50 })]

    render(<Home />)

    expect(screen.queryByText(/%$/)).toBeNull()
  })
})

describe('Home — month-over-month delta', () => {
  beforeEach(async () => { await setupStoreTest() })

  it('shows an upward delta when this month exceeds the previous month', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat()]
    txs.value = [
      makeTx({ id: 'prev', category: 'bills_sub', date: '2024-12-10', amount: 100 }),
      makeTx({ id: 'cur', category: 'bills_sub', date: '2025-01-10', amount: 150 }),
    ]

    render(<Home />)

    const delta = document.querySelector('.summary-delta')
    expect(delta).not.toBeNull()
    expect(delta!.className).toContain('up')
    expect(delta!.textContent).toContain('50%')
  })

  it('renders no delta when there is no previous-month data', async () => {
    const { Home } = await import('./Home')
    userCats.value = [makeCat()]
    txs.value = [makeTx({ id: 'cur', category: 'bills_sub', date: '2025-01-10', amount: 150 })]

    render(<Home />)

    expect(document.querySelector('.summary-delta')).toBeNull()
  })
})
