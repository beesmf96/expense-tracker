import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { ExpenseModal } from './ExpenseModal'
import { txs, userCats, selCat, modalCtx, openModal, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../db/queries', () => ({
  putTx: vi.fn().mockResolvedValue(undefined),
}))

describe('ExpenseModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'food', en: 'Food', emoji: '🍔' })]
    txs.value = []
    selCat.value = ''
    modalCtx.value = {}
    openModal.value = 'expense'
  })

  it('shows the add title for a new expense', () => {
    render(<ExpenseModal />)
    expect(screen.getByText(t('addExpense'))).toBeTruthy()
  })

  it('saves a new expense with amount and selected category', async () => {
    const { putTx } = await import('../db/queries')
    render(<ExpenseModal />)

    fireEvent.input(screen.getByPlaceholderText('0.00'), { target: { value: '25' } })
    fireEvent.click(screen.getByText('Food').closest('.cat-pill')!)
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(putTx).toHaveBeenCalledOnce())
    expect(vi.mocked(putTx).mock.calls[0][0]).toMatchObject({ amount: 25, category: 'food', freq: 'none', note: '' })
  })

  it('shows an amount error and does not save when amount is missing', async () => {
    const { putTx } = await import('../db/queries')
    render(<ExpenseModal />)
    fireEvent.click(screen.getByText(t('save')))
    expect(screen.getByText(t('errAmount'))).toBeTruthy()
    expect(putTx).not.toHaveBeenCalled()
  })

  it('shows a category error when amount is set but no category chosen', async () => {
    const { putTx } = await import('../db/queries')
    render(<ExpenseModal />)
    fireEvent.input(screen.getByPlaceholderText('0.00'), { target: { value: '10' } })
    fireEvent.click(screen.getByText(t('save')))
    expect(screen.getByText(t('errCat'))).toBeTruthy()
    expect(putTx).not.toHaveBeenCalled()
  })

  it('prefills and updates an existing expense in edit mode', async () => {
    const { putTx } = await import('../db/queries')
    const tx = makeTx({ id: 'e1', amount: 50, category: 'food', note: 'lunch', freq: 'none' })
    modalCtx.value = { editTx: tx }
    openModal.value = 'expense'
    render(<ExpenseModal />)

    expect(screen.getByText(t('editExpense'))).toBeTruthy()
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement
    expect(amountInput.value).toBe('50')

    fireEvent.input(amountInput, { target: { value: '75' } })
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(putTx).toHaveBeenCalledOnce())
    expect(vi.mocked(putTx).mock.calls[0][0]).toMatchObject({ id: 'e1', amount: 75, category: 'food', freq: 'none', isGenerated: false })
  })
})
