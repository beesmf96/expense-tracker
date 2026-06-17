import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { RecurringModal } from './RecurringModal'
import { txs, userCats, selRCat, selFreq, modalCtx, openModal, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../db/queries', () => ({
  putTx: vi.fn().mockResolvedValue(undefined),
}))

describe('RecurringModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'rent', en: 'Rent', emoji: '🏠' })]
    txs.value = []
    selRCat.value = ''
    selFreq.value = 'monthly'
    modalCtx.value = {}
    openModal.value = 'recurring'
  })

  it('saves a new recurring template with the chosen frequency and category', async () => {
    const { putTx } = await import('../db/queries')
    render(<RecurringModal />)

    fireEvent.input(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })
    fireEvent.click(screen.getByText('Yearly'))
    fireEvent.click(screen.getByText('Rent').closest('.cat-pill')!)
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(putTx).toHaveBeenCalledOnce())
    expect(vi.mocked(putTx).mock.calls[0][0]).toMatchObject({ amount: 1200, category: 'rent', freq: 'yearly' })
  })

  it('does not save without a category', async () => {
    const { putTx } = await import('../db/queries')
    render(<RecurringModal />)
    fireEvent.input(screen.getByPlaceholderText('0.00'), { target: { value: '100' } })
    fireEvent.click(screen.getByText(t('save')))
    expect(screen.getByText(t('errCat'))).toBeTruthy()
    expect(putTx).not.toHaveBeenCalled()
  })

  it('syncs frequency from the edited template', async () => {
    const { putTx } = await import('../db/queries')
    const tx = makeTx({ id: 'r1', amount: 300, category: 'rent', freq: 'quarterly' })
    modalCtx.value = { editTx: tx }
    openModal.value = 'recurring'
    render(<RecurringModal />)

    expect(screen.getByText(t('editRecurring'))).toBeTruthy()
    expect(selFreq.value).toBe('quarterly')

    fireEvent.click(screen.getByText(t('save')))
    await waitFor(() => expect(putTx).toHaveBeenCalledOnce())
    expect(vi.mocked(putTx).mock.calls[0][0]).toMatchObject({ id: 'r1', freq: 'quarterly', category: 'rent' })
  })
})
