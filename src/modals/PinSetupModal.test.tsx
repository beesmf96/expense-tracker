import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { PinSetupModal } from './PinSetupModal'
import { modalCtx, openModal, lang } from '../state/store'
import { t } from '../data/i18n'

vi.mock('../lib/lockHelpers', () => ({
  setupPin: vi.fn().mockResolvedValue(undefined),
  clearPin: vi.fn(),
  verifyPin: vi.fn(),
}))

const press = (...digits: string[]) => digits.forEach(d => fireEvent.click(screen.getByText(d)))

describe('PinSetupModal', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    openModal.value = 'pin-setup'
    modalCtx.value = {}
  })

  it('renders nothing meaningful without a mode', () => {
    render(<PinSetupModal />)
    expect(screen.queryByText(t('setPIN'))).toBeNull()
  })

  it('set mode: saves the PIN when both entries match', async () => {
    const { setupPin } = await import('../lib/lockHelpers')
    modalCtx.value = { pinSetupMode: 'set' }
    render(<PinSetupModal />)
    press('1', '2', '3', '4')
    press('1', '2', '3', '4')
    await waitFor(() => expect(setupPin).toHaveBeenCalledWith('1234'))
    await waitFor(() => expect(openModal.value).toBeNull())
  })

  it('set mode: does not save when entries differ', async () => {
    const { setupPin } = await import('../lib/lockHelpers')
    modalCtx.value = { pinSetupMode: 'set' }
    render(<PinSetupModal />)
    press('1', '2', '3', '4')
    press('5', '6', '7', '8')
    await waitFor(() => expect(screen.getByText(t('enterNewPIN'))).toBeTruthy())
    expect(setupPin).not.toHaveBeenCalled()
    expect(openModal.value).toBe('pin-setup')
  })

  it('disable mode: clears the PIN when the current PIN is correct', async () => {
    const { verifyPin, clearPin } = await import('../lib/lockHelpers')
    vi.mocked(verifyPin).mockResolvedValue(true)
    modalCtx.value = { pinSetupMode: 'disable' }
    render(<PinSetupModal />)
    press('1', '2', '3', '4')
    await waitFor(() => expect(clearPin).toHaveBeenCalledOnce())
    await waitFor(() => expect(openModal.value).toBeNull())
  })

  it('disable mode: keeps the PIN when the current PIN is wrong', async () => {
    const { verifyPin, clearPin } = await import('../lib/lockHelpers')
    vi.mocked(verifyPin).mockResolvedValue(false)
    modalCtx.value = { pinSetupMode: 'disable' }
    render(<PinSetupModal />)
    press('9', '9', '9', '9')
    await waitFor(() => expect(verifyPin).toHaveBeenCalledWith('9999'))
    expect(clearPin).not.toHaveBeenCalled()
    expect(openModal.value).toBe('pin-setup')
  })

  it('change mode: verifies the old PIN then sets the new one', async () => {
    const { verifyPin, setupPin } = await import('../lib/lockHelpers')
    vi.mocked(verifyPin).mockResolvedValue(true)
    modalCtx.value = { pinSetupMode: 'change' }
    render(<PinSetupModal />)

    press('0', '0', '0', '0')
    await waitFor(() => expect(screen.getByText(t('enterNewPIN'))).toBeTruthy())
    press('1', '2', '3', '4')
    await waitFor(() => expect(screen.getByText(t('confirmPIN'))).toBeTruthy())
    press('1', '2', '3', '4')

    await waitFor(() => expect(setupPin).toHaveBeenCalledWith('1234'))
    await waitFor(() => expect(openModal.value).toBeNull())
  })
})
