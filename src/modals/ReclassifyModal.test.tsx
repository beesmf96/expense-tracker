import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { ReclassifyModal } from './ReclassifyModal'
import { txs, userCats, modalCtx, openModal, lang } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../db/queries', () => ({
  bulkUpdateTxCat: vi.fn().mockResolvedValue(undefined),
  delCat: vi.fn().mockResolvedValue(undefined),
}))

describe('ReclassifyModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    openModal.value = 'reclassify'
    userCats.value = [
      makeCat({ id: 'from', en: 'From Cat', emoji: '💡' }),
      makeCat({ id: 'to', en: 'To Cat', emoji: '🛒' }),
    ]
    txs.value = [makeTx({ id: 't1', category: 'from' }), makeTx({ id: 't2', category: 'from' })]
    modalCtx.value = { rclFrom: 'from' }
  })

  it('shows the source category and its transaction count', () => {
    render(<ReclassifyModal />)
    expect(document.body.textContent).toContain('From Cat')
    expect(document.body.textContent).toContain('2')
  })

  it('disables the confirm button until a target is selected', () => {
    render(<ReclassifyModal />)
    const confirmBtn = screen.getByText(t('moveConfirm')) as HTMLButtonElement
    expect(confirmBtn.disabled).toBe(true)
  })

  it('reassigns transactions to the chosen target on confirm', async () => {
    const { bulkUpdateTxCat, delCat } = await import('../db/queries')
    render(<ReclassifyModal />)

    fireEvent.click(screen.getByText('To Cat').closest('.cat-pill')!)
    const confirmBtn = screen.getByText(t('moveConfirm')) as HTMLButtonElement
    expect(confirmBtn.disabled).toBe(false)
    fireEvent.click(confirmBtn)

    await waitFor(() => expect(bulkUpdateTxCat).toHaveBeenCalledWith('from', 'to'))
    expect(delCat).not.toHaveBeenCalled()
    await waitFor(() => expect(openModal.value).toBeNull())
  })

  it('also deletes the source category when rclDelete is set', async () => {
    modalCtx.value = { rclFrom: 'from', rclDelete: true }
    const { bulkUpdateTxCat, delCat } = await import('../db/queries')
    render(<ReclassifyModal />)

    fireEvent.click(screen.getByText('To Cat').closest('.cat-pill')!)
    fireEvent.click(screen.getByText(t('moveConfirm')))

    await waitFor(() => expect(bulkUpdateTxCat).toHaveBeenCalledWith('from', 'to'))
    await waitFor(() => expect(delCat).toHaveBeenCalledWith('from'))
  })

  it('ignores selecting the source category itself', () => {
    render(<ReclassifyModal />)
    fireEvent.click(screen.getByText('From Cat').closest('.cat-pill')!)
    const confirmBtn = screen.getByText(t('moveConfirm')) as HTMLButtonElement
    expect(confirmBtn.disabled).toBe(true)
  })
})
