import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { Recurring } from './Recurring'
import { txs, userCats, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

describe('Recurring page', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'rent', en: 'Rent', emoji: '🏠' })]
    txs.value = []
  })

  it('shows the empty state when there are no templates', () => {
    txs.value = [makeTx({ id: 't1', category: 'rent', freq: 'none' })]
    render(<Recurring />)
    expect(screen.getByText(/No recurring expenses/)).toBeTruthy()
  })

  it('lists only recurring templates (freq !== none)', () => {
    txs.value = [
      makeTx({ id: 'r1', category: 'rent', freq: 'monthly', amount: 1200 }),
      makeTx({ id: 't2', category: 'rent', freq: 'none', amount: 5 }),
    ]
    render(<Recurring />)
    expect(screen.getByText('Rent')).toBeTruthy()
    expect(screen.getByText('−1200.00')).toBeTruthy()
    expect(screen.queryByText('−5.00')).toBeNull()
  })

  it('shows a per-tab empty state when the active tab has no templates', () => {
    txs.value = [makeTx({ id: 'r1', category: 'rent', freq: 'monthly', occurrences: 1 })]
    render(<Recurring />)
    expect(screen.getByText('No active recurring expenses.')).toBeTruthy()
    expect(screen.queryByText('Rent')).toBeNull()
    fireEvent.click(screen.getByText('Done'))
    expect(screen.getByText('Rent')).toBeTruthy()
    expect(screen.queryByText('No active recurring expenses.')).toBeNull()
  })

  it('opens the detail modal by id when a template is clicked', async () => {
    const { openM } = await import('../state/store')
    txs.value = [makeTx({ id: 'r1', category: 'rent', freq: 'monthly' })]
    render(<Recurring />)
    fireEvent.click(screen.getByText('Rent').closest('.row-item')!)
    expect(openM).toHaveBeenCalledWith('detail', { detailId: 'r1' })
  })
})
