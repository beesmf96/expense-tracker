import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { NewCatModal } from './NewCatModal'
import { selEmoji, modalCtx, openModal, lang } from '../state/store'
import { t } from '../data/i18n'

vi.mock('../db/queries', () => ({
  putCat: vi.fn().mockResolvedValue(undefined),
}))

describe('NewCatModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    openModal.value = 'newcat'
    modalCtx.value = {}
    selEmoji.value = '🚌'
  })

  it('saves a new category with the typed name and selected emoji', async () => {
    const { putCat } = await import('../db/queries')
    render(<NewCatModal />)

    fireEvent.input(screen.getByPlaceholderText('e.g. Transport'), { target: { value: 'Transport' } })
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(putCat).toHaveBeenCalledOnce())
    const arg = vi.mocked(putCat).mock.calls[0][0]
    expect(arg).toMatchObject({ en: 'Transport', zh: 'Transport', emoji: '🚌' })
    expect(arg.id).toMatch(/^cat_\d+$/)
  })

  it('does not save when the name is blank', async () => {
    const { putCat } = await import('../db/queries')
    render(<NewCatModal />)
    fireEvent.input(screen.getByPlaceholderText('e.g. Transport'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText(t('save')))
    expect(putCat).not.toHaveBeenCalled()
  })

  it('invokes the newCatReturnSel callback with the new id and closes', async () => {
    const cb = vi.fn()
    modalCtx.value = { newCatReturnSel: cb }
    render(<NewCatModal />)

    fireEvent.input(screen.getByPlaceholderText('e.g. Transport'), { target: { value: 'Food' } })
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(cb).toHaveBeenCalledOnce())
    expect(cb.mock.calls[0][0]).toMatch(/^cat_\d+$/)
    await waitFor(() => expect(openModal.value).toBeNull())
  })
})
