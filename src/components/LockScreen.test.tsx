import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { LockScreen } from './LockScreen'
import { isLocked, pinEnabled, pinFailCount, pinLockedUntil, lang } from '../state/store'

vi.mock('../lib/lockHelpers', () => ({
  verifyPin: vi.fn(),
}))

const press = (...digits: string[]) => digits.forEach(d => fireEvent.click(screen.getByText(d)))

describe('LockScreen', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
    isLocked.value = false
    pinEnabled.value = true
    pinFailCount.value = 0
    pinLockedUntil.value = 0
  })

  afterEach(() => {
    isLocked.value = false
    pinFailCount.value = 0
    pinLockedUntil.value = 0
  })

  it('renders nothing when not locked', () => {
    isLocked.value = false
    const { container } = render(<LockScreen />)
    expect(container.firstChild).toBeNull()
  })

  it('unlocks when the correct PIN is entered', async () => {
    const { verifyPin } = await import('../lib/lockHelpers')
    vi.mocked(verifyPin).mockResolvedValue(true)
    isLocked.value = true
    render(<LockScreen />)
    press('1', '2', '3', '4')
    await waitFor(() => expect(isLocked.value).toBe(false))
    expect(pinFailCount.value).toBe(0)
  })

  it('tracks failed attempts and enters a cooldown after 3 fails', async () => {
    const { verifyPin } = await import('../lib/lockHelpers')
    vi.mocked(verifyPin).mockResolvedValue(false)
    isLocked.value = true
    render(<LockScreen />)

    press('0', '0', '0', '0')
    await waitFor(() => expect(pinFailCount.value).toBe(1))
    press('0', '0', '0', '0')
    await waitFor(() => expect(pinFailCount.value).toBe(2))
    press('0', '0', '0', '0')
    await waitFor(() => expect(pinFailCount.value).toBe(3))

    expect(pinLockedUntil.value).toBeGreaterThan(Date.now())
    expect(isLocked.value).toBe(true)
  })
})
