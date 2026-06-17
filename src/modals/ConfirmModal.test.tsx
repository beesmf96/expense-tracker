import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { ConfirmModal } from './ConfirmModal'
import { modalCtx, openModal, lang } from '../state/store'
import { t } from '../data/i18n'

describe('ConfirmModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    openModal.value = 'confirm'
    modalCtx.value = {}
  })

  it('renders the icon, title and message from context', () => {
    modalCtx.value = { confirmIcon: '🗑️', confirmTitle: 'Delete?', confirmMsg: 'Are you sure?', confirmOkLabel: 'Delete' }
    render(<ConfirmModal />)
    expect(screen.getByText('Are you sure?')).toBeTruthy()
    expect(screen.getByText(/Delete\?/)).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('falls back to the default delete label when none is given', () => {
    modalCtx.value = { confirmMsg: 'msg' }
    render(<ConfirmModal />)
    expect(screen.getByText(t('delete'))).toBeTruthy()
  })

  it('runs confirmOnOk then closes the modal', async () => {
    const onOk = vi.fn().mockResolvedValue(undefined)
    modalCtx.value = { confirmOkLabel: 'Delete', confirmOnOk: onOk }
    render(<ConfirmModal />)
    fireEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(onOk).toHaveBeenCalledOnce())
    await waitFor(() => expect(openModal.value).toBeNull())
  })

  it('cancel closes without invoking confirmOnOk', () => {
    const onOk = vi.fn()
    modalCtx.value = { confirmOnOk: onOk }
    render(<ConfirmModal />)
    fireEvent.click(screen.getByText(t('cancel')))
    expect(onOk).not.toHaveBeenCalled()
    expect(openModal.value).toBeNull()
  })
})
