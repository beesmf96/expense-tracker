import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { EditCatModal } from './EditCatModal'
import { userCats, selEmoji, modalCtx, openModal, lang } from '../state/store'
import { makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../db/queries', () => ({
  putCat: vi.fn().mockResolvedValue(undefined),
}))

describe('EditCatModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    userCats.value = [makeCat({ id: 'c1', en: 'Food', zh: '食物', emoji: '🍔' })]
    selEmoji.value = '✨'
    modalCtx.value = { editCatId: 'c1' }
    openModal.value = 'editcat'
  })

  it('prefills the input with the existing category name', () => {
    render(<EditCatModal />)
    const input = screen.getByDisplayValue('Food') as HTMLInputElement
    expect(input).toBeTruthy()
  })

  it('saves the edited name while preserving the id', async () => {
    const { putCat } = await import('../db/queries')
    render(<EditCatModal />)

    fireEvent.input(screen.getByDisplayValue('Food'), { target: { value: 'Groceries' } })
    fireEvent.click(screen.getByText(t('save')))

    await waitFor(() => expect(putCat).toHaveBeenCalledOnce())
    expect(vi.mocked(putCat).mock.calls[0][0]).toMatchObject({ id: 'c1', en: 'Groceries', zh: 'Groceries', emoji: '🍔' })
  })

  it('does not save when the name is cleared', async () => {
    const { putCat } = await import('../db/queries')
    render(<EditCatModal />)
    fireEvent.input(screen.getByDisplayValue('Food'), { target: { value: '  ' } })
    fireEvent.click(screen.getByText(t('save')))
    expect(putCat).not.toHaveBeenCalled()
  })
})
