import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { Settings } from './Settings'
import { lang, theme, swipeNav, pinEnabled, activePage, txs, userCats } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'
import { t } from '../data/i18n'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn(), showToast: vi.fn() }
})

vi.mock('../db/queries', () => ({
  clearAll: vi.fn().mockResolvedValue(undefined),
  saveAutoBackupHandle: vi.fn().mockResolvedValue(undefined),
  clearAutoBackupHandle: vi.fn().mockResolvedValue(undefined),
  grantAutoBackupPermission: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/exportHelpers', () => ({
  exportCSV: vi.fn(),
  backupJSON: vi.fn(),
  writeAutoBackup: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/importHelpers', () => ({
  loadBackupFile: vi.fn().mockResolvedValue(undefined),
}))

describe('Settings page', () => {
  beforeEach(() => {
    lang.value = 'en'
    theme.value = 'dark'
    swipeNav.value = true
    pinEnabled.value = false
    activePage.value = 'settings'
    txs.value = [makeTx({ id: 't1', category: 'food' })]
    userCats.value = [makeCat({ id: 'food', en: 'Food' })]
    vi.clearAllMocks()
  })

  it('navigates to Manage Categories', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText(/Manage Categories/))
    expect(activePage.value).toBe('manage-cats')
  })

  it('toggles language between EN and ZH', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('ZH'))
    expect(lang.value).toBe('zh')
    fireEvent.click(screen.getByText('EN'))
    expect(lang.value).toBe('en')
  })

  it('toggles theme between dark and light', () => {
    render(<Settings />)
    fireEvent.click(screen.getByLabelText(t('lightTheme')))
    expect(theme.value).toBe('light')
    fireEvent.click(screen.getByLabelText(t('darkTheme')))
    expect(theme.value).toBe('dark')
  })

  it('toggles swipe navigation', () => {
    render(<Settings />)
    fireEvent.click(screen.getByText('Off'))
    expect(swipeNav.value).toBe(false)
    fireEvent.click(screen.getByText('On'))
    expect(swipeNav.value).toBe(true)
  })

  it('opens PIN setup when app lock is disabled', async () => {
    const { openM } = await import('../state/store')
    render(<Settings />)
    fireEvent.click(screen.getByText(t('setPIN')))
    expect(openM).toHaveBeenCalledWith('pin-setup', { pinSetupMode: 'set' })
  })

  it('offers change/disable when app lock is enabled', async () => {
    const { openM } = await import('../state/store')
    pinEnabled.value = true
    render(<Settings />)
    fireEvent.click(screen.getByText(t('changePIN')))
    expect(openM).toHaveBeenCalledWith('pin-setup', { pinSetupMode: 'change' })
    fireEvent.click(screen.getByText(t('disablePIN')))
    expect(openM).toHaveBeenCalledWith('pin-setup', { pinSetupMode: 'disable' })
  })

  it('exports CSV and JSON from the data tools section', async () => {
    const { exportCSV, backupJSON } = await import('../lib/exportHelpers')
    render(<Settings />)
    fireEvent.click(screen.getByText(/Data Tools/))
    fireEvent.click(screen.getByText('CSV').closest('.srow')!)
    fireEvent.click(screen.getByText('JSON').closest('.srow')!)
    expect(exportCSV).toHaveBeenCalledOnce()
    expect(backupJSON).toHaveBeenCalledOnce()
  })

  it('opens a confirm dialog from the danger zone clear-all action', async () => {
    const { openM } = await import('../state/store')
    render(<Settings />)
    fireEvent.click(screen.getByText(/Danger Zone/))
    fireEvent.click(screen.getByText(/Clear All Data/))
    const [id, ctx] = vi.mocked(openM).mock.calls[0]
    expect(id).toBe('confirm')
    expect(typeof ctx.confirmOnOk).toBe('function')
  })
})
