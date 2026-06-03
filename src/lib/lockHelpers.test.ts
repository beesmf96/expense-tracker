import { describe, it, expect, afterEach } from 'vitest'
import { hashPin, verifyPin, setupPin, clearPin } from './lockHelpers'
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
