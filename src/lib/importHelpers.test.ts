import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadBackupFile } from './importHelpers'
import { restoreBackup } from '../db/queries'

vi.mock('../db/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/queries')>()
  return { ...actual, restoreBackup: vi.fn() }
})

const mockRestore = vi.mocked(restoreBackup)

const fileOf = (obj: unknown) =>
  ({ text: async () => JSON.stringify(obj) } as File)

const validTx = {
  id: 't1', date: '2026-06-01', amount: 12.5, category: 'food',
  note: '', freq: 'none', createdAt: '2026-06-01T00:00:00.000Z',
}
const validCat = { id: 'food', en: 'Food', zh: '食物', emoji: '🍔' }
const backup = (over: Record<string, unknown> = {}) =>
  ({ version: 2, exportedAt: 'x', txs: [validTx], userCats: [validCat], ...over })

beforeEach(() => mockRestore.mockReset())

describe('loadBackupFile validation', () => {
  it('accepts a valid backup and writes sanitized data', async () => {
    await loadBackupFile(fileOf(backup()))
    expect(mockRestore).toHaveBeenCalledOnce()
    expect(mockRestore.mock.calls[0][0].txs[0].id).toBe('t1')
  })

  it('rejects unsupported version', async () => {
    await expect(loadBackupFile(fileOf(backup({ version: 1 })))).rejects.toThrow()
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('rejects a null array entry without crashing', async () => {
    await expect(loadBackupFile(fileOf(backup({ txs: [null] })))).rejects.toThrow('Invalid backup file')
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('rejects bad optional field types (isGenerated / label)', async () => {
    await expect(loadBackupFile(fileOf(backup({ txs: [{ ...validTx, isGenerated: 'yes' }] })))).rejects.toThrow()
    await expect(loadBackupFile(fileOf(backup({ userCats: [{ ...validCat, label: 5 }] })))).rejects.toThrow()
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('rejects prototype-pollution keys on entries', async () => {
    const poisoned = JSON.parse('{"version":2,"exportedAt":"x","txs":[{"id":"t1","date":"2026-06-01","amount":1,"category":"c","note":"","freq":"none","createdAt":"x","__proto__":{"polluted":true}}],"userCats":[]}')
    await expect(loadBackupFile(fileOf(poisoned))).rejects.toThrow('Invalid backup file')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('rejects dangerous id values', async () => {
    await expect(loadBackupFile(fileOf(backup({ userCats: [{ ...validCat, id: '__proto__' }] })))).rejects.toThrow()
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('strips unknown extra fields before writing', async () => {
    await loadBackupFile(fileOf(backup({ txs: [{ ...validTx, evil: 'x', isGenerated: true }] })))
    const written = mockRestore.mock.calls[0][0].txs[0] as Record<string, unknown>
    expect(written.evil).toBeUndefined()
    expect(written.isGenerated).toBeUndefined()
  })
})
