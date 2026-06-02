import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { txs, userCats } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return {
    ...actual,
    openM: vi.fn(),
  }
})

vi.mock('../db/queries', () => ({
  putTx: vi.fn().mockResolvedValue(undefined),
  delTx: vi.fn().mockResolvedValue(undefined),
  loadAll: vi.fn().mockResolvedValue(undefined),
}))

describe('Search page', () => {
  beforeEach(async () => {
    txs.value = []
    userCats.value = []
    const { openM } = await import('../state/store')
    vi.mocked(openM).mockClear()
  })

  it('empty query shows empty state', async () => {
    txs.value = [makeTx({ note: 'coffee run' })]
    const { Search } = await import('./Search')
    render(<Search />)
    expect(screen.getByText('Search your expenses')).toBeTruthy()
  })

  it('shows no result rows when query is empty', async () => {
    txs.value = [makeTx({ note: 'coffee run' })]
    const { Search } = await import('./Search')
    render(<Search />)
    expect(screen.queryByText('coffee run')).toBeNull()
  })

  it('matches a tx by note (case-insensitive)', async () => {
    const user = userEvent.setup()
    txs.value = [makeTx({ id: 'tx-1', note: 'Netflix subscription', freq: 'none' })]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'netflix')
    expect(screen.getByText('Netflix subscription')).toBeTruthy()
  })

  it('matches a tx by category label (case-insensitive)', async () => {
    const user = userEvent.setup()
    userCats.value = [makeCat()]
    txs.value = [makeTx({ id: 'tx-2', category: 'bills_sub', note: '', freq: 'none' })]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'bill')
    expect(screen.getByText('Bill & Subscription')).toBeTruthy()
  })

  it('shows empty state when query matches nothing', async () => {
    const user = userEvent.setup()
    txs.value = [makeTx({ note: 'groceries', freq: 'none' })]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'zzznomatch')
    expect(screen.getByText('No results')).toBeTruthy()
  })

  it('does not show a result row when query matches nothing', async () => {
    const user = userEvent.setup()
    txs.value = [makeTx({ note: 'groceries', freq: 'none' })]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'zzznomatch')
    expect(screen.queryByText('groceries')).toBeNull()
  })

  it('excludes template txs (freq !== none) even when note matches', async () => {
    const user = userEvent.setup()
    txs.value = [makeTx({ id: 'tpl-1', freq: 'monthly', note: 'rent payment' })]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'rent')
    expect(screen.queryByText('rent payment')).toBeNull()
  })

  it('excludes template txs (freq !== none) while including real txs with same note', async () => {
    const user = userEvent.setup()
    txs.value = [
      makeTx({ id: 'tpl-1', freq: 'monthly', note: 'gym' }),
      makeTx({ id: 'real-1', freq: 'none', note: 'gym' }),
    ]
    const { Search } = await import('./Search')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'gym')
    const matches = screen.getAllByText('gym')
    expect(matches).toHaveLength(1)
  })

  it('clicking a result row calls openM with detail and the correct tx', async () => {
    const user = userEvent.setup()
    const tx = makeTx({ id: 'tx-click', note: 'dentist', freq: 'none' })
    txs.value = [tx]
    const { Search } = await import('./Search')
    const { openM } = await import('../state/store')
    render(<Search />)
    const input = screen.getByRole('searchbox')
    await user.type(input, 'dentist')
    const row = screen.getByText('dentist').closest('.row-item')!
    await user.click(row)
    expect(openM).toHaveBeenCalledWith('detail', { detailTx: tx })
  })
})
