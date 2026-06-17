import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { DetailModal } from './DetailModal'
import { txs, userCats, modalCtx, openModal, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

vi.mock('../lib/txHelpers', () => ({
  confirmDeleteTx: vi.fn(),
}))

describe('DetailModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'food', en: 'Food', emoji: '🍔' })]
    txs.value = []
    modalCtx.value = {}
    openModal.value = 'detail'
  })

  it('renders nothing meaningful when there is no transaction', () => {
    render(<DetailModal />)
    expect(screen.queryByText(t('txDetail'))).toBeNull()
  })

  it('renders the category, amount and date for the detail transaction', () => {
    modalCtx.value = { detailTx: makeTx({ id: 'd1', category: 'food', amount: 42, date: '2025-02-03' }) }
    render(<DetailModal />)
    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText(/−42\.00/)).toBeTruthy()
    expect(screen.getByText('2025-02-03')).toBeTruthy()
  })

  it('edit on a plain expense opens the expense modal in edit mode', async () => {
    const { openM } = await import('../state/store')
    const tx = makeTx({ id: 'd1', category: 'food', freq: 'none' })
    modalCtx.value = { detailTx: tx }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('edit')))
    expect(openM).toHaveBeenCalledWith('expense', { editTx: tx })
  })

  it('edit on a recurring template opens the recurring modal', async () => {
    const { openM } = await import('../state/store')
    const tx = makeTx({ id: 'd2', category: 'food', freq: 'monthly' })
    modalCtx.value = { detailTx: tx }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('edit')))
    expect(openM).toHaveBeenCalledWith('recurring', { editTx: tx })
  })

  it('edit on a generated occurrence opens the expense modal', async () => {
    const { openM } = await import('../state/store')
    const tx = makeTx({ id: 'd3_2025-02', category: 'food', freq: 'monthly', isGenerated: true })
    modalCtx.value = { detailTx: tx }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('edit')))
    expect(openM).toHaveBeenCalledWith('expense', { editTx: tx })
  })

  it('hides delete for generated occurrences and shows it otherwise', () => {
    const generated = makeTx({ id: 'g_2025-02', category: 'food', freq: 'monthly', isGenerated: true })
    modalCtx.value = { detailTx: generated }
    const { unmount } = render(<DetailModal />)
    expect(screen.queryByText(t('delete'))).toBeNull()
    unmount()

    modalCtx.value = { detailTx: makeTx({ id: 'd1', category: 'food' }) }
    render(<DetailModal />)
    expect(screen.getByText(t('delete'))).toBeTruthy()
  })

  it('delete button triggers confirmDeleteTx', async () => {
    const { confirmDeleteTx } = await import('../lib/txHelpers')
    const tx = makeTx({ id: 'd1', category: 'food' })
    modalCtx.value = { detailTx: tx }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('delete')))
    expect(confirmDeleteTx).toHaveBeenCalledOnce()
  })

  it('close returns to the previous modal when returnTo is set', async () => {
    const { openM } = await import('../state/store')
    modalCtx.value = {
      detailTx: makeTx({ id: 'd1', category: 'food' }),
      returnTo: { id: 'cat-breakdown', ctx: { breakdownCatId: 'food' } },
    }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('close')))
    expect(openM).toHaveBeenCalledWith('cat-breakdown', { breakdownCatId: 'food' })
  })

  it('close just closes when there is no returnTo', () => {
    modalCtx.value = { detailTx: makeTx({ id: 'd1', category: 'food' }) }
    render(<DetailModal />)
    fireEvent.click(screen.getByText(t('close')))
    expect(openModal.value).toBeNull()
  })
})
