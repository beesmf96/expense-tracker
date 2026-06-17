import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { QuickAddBar } from './QuickAddBar'
import { makeTx, makeCat, setupStoreTest } from '../test-utils/setup'
import { txs, userCats, activePage, recentCatIds } from '../state/store'
import { today } from '../lib/dateHelpers'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

vi.mock('../db/queries', () => ({
  putTx: vi.fn().mockResolvedValue(undefined),
  loadAll: vi.fn().mockResolvedValue(undefined),
}))

describe('QuickAddBar', () => {
  beforeEach(async () => {
    await setupStoreTest()
    activePage.value = 'home'
    const { putTx } = await import('../db/queries')
    vi.mocked(putTx).mockClear()
  })

  afterEach(() => {
    activePage.value = 'home'
  })

  it('renders null when activePage is not home or transactions', () => {
    activePage.value = 'settings'
    const { container } = render(<QuickAddBar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when activePage is home', () => {
    render(<QuickAddBar />)
    expect(screen.getByRole('spinbutton', { name: /amount/i })).toBeTruthy()
  })

  it('renders when activePage is transactions', () => {
    activePage.value = 'transactions'
    render(<QuickAddBar />)
    expect(screen.getByRole('spinbutton', { name: /amount/i })).toBeTruthy()
  })

  it('renders no-cats message when recentCatIds is empty', () => {
    userCats.value = []
    txs.value = []
    render(<QuickAddBar />)
    expect(screen.getByText('Add a category first')).toBeTruthy()
  })

  it('renders category pills when recentCatIds has entries', () => {
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)
    expect(screen.getByText('Bill & Subscription')).toBeTruthy()
    expect(screen.getByText('💡')).toBeTruthy()
  })

  it('amount input accepts a typed number', () => {
    render(<QuickAddBar />)
    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.input(input, { target: { value: '25.5' } })
    expect((input as HTMLInputElement).value).toBe('25.5')
  })

  it('selecting a category pill highlights it with the selected class', async () => {
    const user = userEvent.setup()
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)
    const pill = screen.getByText('Bill & Subscription').closest('.cat-pill')!
    expect(pill.className).not.toContain('selected')
    await user.click(pill)
    expect(pill.className).toContain('selected')
  })

  it('pressing Enter with amount and selected category calls putTx', async () => {
    const { putTx } = await import('../db/queries')
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)

    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.input(input, { target: { value: '42' } })
    const pill = screen.getByText('Bill & Subscription').closest('.cat-pill')!
    fireEvent.click(pill)
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(vi.mocked(putTx)).toHaveBeenCalledOnce()
    })
    const calledWith = vi.mocked(putTx).mock.calls[0][0]
    expect(calledWith.amount).toBe(42)
    expect(calledWith.category).toBe('bills_sub')
    expect(calledWith.freq).toBe('none')
    expect(calledWith.note).toBe('')
  })

  it('pressing Enter with no amount does NOT call putTx', async () => {
    const { putTx } = await import('../db/queries')
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)

    const pill = screen.getByText('Bill & Subscription').closest('.cat-pill')!
    fireEvent.click(pill)
    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(vi.mocked(putTx)).not.toHaveBeenCalled()
  })

  it('pressing Enter with no category does NOT call putTx', async () => {
    const { putTx } = await import('../db/queries')
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)

    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.input(input, { target: { value: '20' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(vi.mocked(putTx)).not.toHaveBeenCalled()
  })

  it('shows errAmount message when Enter pressed with no amount', () => {
    render(<QuickAddBar />)
    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Please enter an amount')).toBeTruthy()
  })

  it('shows errCat message when Enter pressed with amount but no category', () => {
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)
    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.input(input, { target: { value: '10' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Please select a category')).toBeTruthy()
  })

  it('clears the amount input after a successful save', async () => {
    const cat = makeCat({ id: 'bills_sub', en: 'Bill & Subscription', emoji: '💡' })
    userCats.value = [cat]
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    render(<QuickAddBar />)

    const input = screen.getByRole('spinbutton', { name: /amount/i })
    fireEvent.input(input, { target: { value: '15' } })
    const pill = screen.getByText('Bill & Subscription').closest('.cat-pill')!
    fireEvent.click(pill)
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('')
    })
  })

  it('clicking the More button calls openM with expense', async () => {
    const { openM } = await import('../state/store')
    render(<QuickAddBar />)
    const moreBtn = screen.getByRole('button', { name: 'More' })
    fireEvent.click(moreBtn)
    expect(vi.mocked(openM)).toHaveBeenCalledWith('expense', {})
  })
})

describe('recentCatIds computed', () => {
  beforeEach(async () => {
    await setupStoreTest()
    activePage.value = 'home'
  })

  it('is empty when there are no transactions', () => {
    userCats.value = [makeCat({ id: 'bills_sub' })]
    txs.value = []
    expect(recentCatIds.value).toEqual([])
  })

  it('is empty when userCats is empty (no valid category ids)', () => {
    userCats.value = []
    txs.value = [makeTx({ category: 'bills_sub', date: today() })]
    expect(recentCatIds.value).toEqual([])
  })

  it('only includes category ids that exist in userCats', () => {
    userCats.value = [makeCat({ id: 'bills_sub' })]
    txs.value = [
      makeTx({ id: 't1', category: 'bills_sub', date: today() }),
      makeTx({ id: 't2', category: 'unknown_cat', date: today() }),
    ]
    expect(recentCatIds.value).toEqual(['bills_sub'])
  })

  it('deduplicates: same category used multiple times appears once', () => {
    userCats.value = [makeCat({ id: 'bills_sub' })]
    txs.value = [
      makeTx({ id: 't1', category: 'bills_sub', date: today() }),
      makeTx({ id: 't2', category: 'bills_sub', date: today() }),
      makeTx({ id: 't3', category: 'bills_sub', date: today() }),
    ]
    expect(recentCatIds.value).toEqual(['bills_sub'])
  })

  it('caps results at 5 unique categories', () => {
    userCats.value = [
      makeCat({ id: 'cat1', en: 'Cat 1' }),
      makeCat({ id: 'cat2', en: 'Cat 2' }),
      makeCat({ id: 'cat3', en: 'Cat 3' }),
      makeCat({ id: 'cat4', en: 'Cat 4' }),
      makeCat({ id: 'cat5', en: 'Cat 5' }),
      makeCat({ id: 'cat6', en: 'Cat 6' }),
    ]
    txs.value = [
      makeTx({ id: 't1', category: 'cat1', date: today() }),
      makeTx({ id: 't2', category: 'cat2', date: today() }),
      makeTx({ id: 't3', category: 'cat3', date: today() }),
      makeTx({ id: 't4', category: 'cat4', date: today() }),
      makeTx({ id: 't5', category: 'cat5', date: today() }),
      makeTx({ id: 't6', category: 'cat6', date: today() }),
    ]
    expect(recentCatIds.value).toHaveLength(5)
    expect(recentCatIds.value).toEqual(['cat1', 'cat2', 'cat3', 'cat4', 'cat5'])
  })

  it('respects insertion order of txs (first-seen wins)', () => {
    userCats.value = [
      makeCat({ id: 'cat1', en: 'Cat 1' }),
      makeCat({ id: 'cat2', en: 'Cat 2' }),
    ]
    txs.value = [
      makeTx({ id: 't1', category: 'cat2', date: today() }),
      makeTx({ id: 't2', category: 'cat1', date: today() }),
    ]
    expect(recentCatIds.value).toEqual(['cat2', 'cat1'])
  })

  it('updates reactively when txs changes', () => {
    userCats.value = [
      makeCat({ id: 'cat1', en: 'Cat 1' }),
      makeCat({ id: 'cat2', en: 'Cat 2' }),
    ]
    txs.value = [makeTx({ id: 't1', category: 'cat1', date: today() })]
    expect(recentCatIds.value).toEqual(['cat1'])

    txs.value = [
      makeTx({ id: 't1', category: 'cat1', date: today() }),
      makeTx({ id: 't2', category: 'cat2', date: today() }),
    ]
    expect(recentCatIds.value).toEqual(['cat1', 'cat2'])
  })

  it('updates reactively when userCats changes', () => {
    userCats.value = []
    txs.value = [makeTx({ id: 't1', category: 'bills_sub', date: today() })]
    expect(recentCatIds.value).toEqual([])

    userCats.value = [makeCat({ id: 'bills_sub' })]
    expect(recentCatIds.value).toEqual(['bills_sub'])
  })
})
