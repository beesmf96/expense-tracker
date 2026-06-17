import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { hashPin, verifyPin, setupPin, clearPin, initLockWatcher } from './lockHelpers'
import { pinHash, pinEnabled, isLocked } from '../state/store'

describe('hashPin', () => {
  it('returns a hex string of length 64', async () => {
    const result = await hashPin('1234')
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input always returns same hash', async () => {
    const a = await hashPin('1234')
    const b = await hashPin('1234')
    expect(a).toBe(b)
  })

  it('returns different hashes for different inputs', async () => {
    const a = await hashPin('1234')
    const b = await hashPin('5678')
    expect(a).not.toBe(b)
  })
})

describe('verifyPin', () => {
  afterEach(() => {
    pinHash.value = null
  })

  it('returns true when pin matches the stored pinHash', async () => {
    pinHash.value = await hashPin('1234')
    expect(await verifyPin('1234')).toBe(true)
  })

  it('returns false when pin does not match the stored pinHash', async () => {
    pinHash.value = await hashPin('1234')
    expect(await verifyPin('9999')).toBe(false)
  })

  it('returns false when pinHash.value is null', async () => {
    pinHash.value = null
    expect(await verifyPin('1234')).toBe(false)
  })
})

describe('setupPin', () => {
  afterEach(() => {
    pinHash.value = null
    pinEnabled.value = false
    isLocked.value = false
  })

  it('sets pinHash.value to the hash of the new PIN', async () => {
    await setupPin('4321')
    expect(await verifyPin('4321')).toBe(true)
  })

  it('sets pinEnabled.value to true', async () => {
    await setupPin('4321')
    expect(pinEnabled.value).toBe(true)
  })

  it('sets isLocked.value to false', async () => {
    isLocked.value = true
    await setupPin('4321')
    expect(isLocked.value).toBe(false)
  })
})

describe('clearPin', () => {
  afterEach(() => {
    pinHash.value = null
    pinEnabled.value = false
    isLocked.value = false
  })

  it('sets pinHash.value to null', async () => {
    await setupPin('1234')
    clearPin()
    expect(pinHash.value).toBeNull()
  })

  it('sets pinEnabled.value to false', async () => {
    await setupPin('1234')
    clearPin()
    expect(pinEnabled.value).toBe(false)
  })

  it('sets isLocked.value to false', async () => {
    await setupPin('1234')
    isLocked.value = true
    clearPin()
    expect(isLocked.value).toBe(false)
  })
})

describe('initLockWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    isLocked.value = false
    pinEnabled.value = false
  })

  afterEach(() => {
    vi.useRealTimers()
    isLocked.value = false
    pinEnabled.value = false
  })

  it('locks after 60s of inactivity when pin is enabled', () => {
    pinEnabled.value = true
    initLockWatcher()
    vi.advanceTimersByTime(60_000)
    expect(isLocked.value).toBe(true)
  })

  it('does not lock on the idle timer when pin is disabled', () => {
    pinEnabled.value = false
    initLockWatcher()
    vi.advanceTimersByTime(60_000)
    expect(isLocked.value).toBe(false)
  })

  it('resets the idle timer on user activity', () => {
    pinEnabled.value = true
    initLockWatcher()
    vi.advanceTimersByTime(59_000)
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(59_000)
    expect(isLocked.value).toBe(false)
    vi.advanceTimersByTime(1_000)
    expect(isLocked.value).toBe(true)
  })

  it('locks on return to visibility after being hidden 60s or more', () => {
    pinEnabled.value = true
    initLockWatcher()

    const setVisibility = (state: DocumentVisibilityState) =>
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })

    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    vi.setSystemTime(Date.now() + 61_000)

    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(isLocked.value).toBe(true)
    setVisibility('visible')
  })
})
