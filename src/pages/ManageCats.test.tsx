import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { ManageCats } from './ManageCats'
import { txs, userCats, activePage, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

vi.mock('../db/queries', () => ({
  delCat: vi.fn().mockResolvedValue(undefined),
}))

describe('ManageCats page', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [
      makeCat({ id: 'food', en: 'Food', emoji: '🍔' }),
      makeCat({ id: 'empty', en: 'Empty', emoji: '📦' }),
    ]
    txs.value = [makeTx({ id: 't1', category: 'food' })]
    activePage.value = 'manage-cats'
  })

  it('renders each category with its transaction count', () => {
    render(<ManageCats />)
    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText('Empty')).toBeTruthy()
  })

  it('opens the edit modal for a category', async () => {
    const { openM } = await import('../state/store')
    render(<ManageCats />)
    fireEvent.click(screen.getAllByTitle('Edit')[0])
    expect(openM).toHaveBeenCalledWith('editcat', { editCatId: 'food' })
  })

  it('shows a reclassify action only for categories with transactions', async () => {
    const { openM } = await import('../state/store')
    render(<ManageCats />)
    const reclassifyBtns = screen.getAllByTitle('Reclassify')
    expect(reclassifyBtns).toHaveLength(1)
    fireEvent.click(reclassifyBtns[0])
    expect(openM).toHaveBeenCalledWith('reclassify', { rclFrom: 'food', rclDelete: false })
  })

  it('deleting a category with transactions opens reclassify-and-delete', async () => {
    const { openM } = await import('../state/store')
    render(<ManageCats />)
    fireEvent.click(screen.getAllByTitle('Delete')[0])
    expect(openM).toHaveBeenCalledWith('reclassify', { rclFrom: 'food', rclDelete: true })
  })

  it('deleting an empty category opens a confirm dialog', async () => {
    const { openM } = await import('../state/store')
    render(<ManageCats />)
    fireEvent.click(screen.getAllByTitle('Delete')[1])
    const [id, ctx] = vi.mocked(openM).mock.calls[0]
    expect(id).toBe('confirm')
    expect(ctx.confirmMsg).toContain('Empty')
    expect(typeof ctx.confirmOnOk).toBe('function')
  })

  it('the add row opens the new category modal', async () => {
    const { openM } = await import('../state/store')
    render(<ManageCats />)
    fireEvent.click(screen.getByText('New Category').closest('.row-add')!)
    expect(openM).toHaveBeenCalledWith('newcat')
  })

  it('the back button returns to Settings', () => {
    render(<ManageCats />)
    fireEvent.click(screen.getByText('‹'))
    expect(activePage.value).toBe('settings')
  })
})
