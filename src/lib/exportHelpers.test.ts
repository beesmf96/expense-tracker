import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Transaction, Category, BackupFile } from '../types'

vi.mock('../db/queries', () => ({
  restoreBackup: vi.fn().mockResolvedValue(undefined),
}))

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test-1',
    date: '2025-01-15',
    amount: 100,
    category: 'bills_sub',
    note: '',
    freq: 'none',
    createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  }
}

function makeCat(overrides: Partial<Category>): Category {
  return {
    id: 'food',
    en: 'Food',
    zh: '食物',
    emoji: '🍔',
    ...overrides,
  }
}

describe('writeAutoBackup', () => {
  let mockWrite: ReturnType<typeof vi.fn>
  let mockClose: ReturnType<typeof vi.fn>
  let mockCreateWritable: ReturnType<typeof vi.fn>
  let mockGetFileHandle: ReturnType<typeof vi.fn>
  let mockHandle: FileSystemDirectoryHandle

  beforeEach(() => {
    mockWrite = vi.fn().mockResolvedValue(undefined)
    mockClose = vi.fn().mockResolvedValue(undefined)
    mockCreateWritable = vi.fn().mockResolvedValue({ write: mockWrite, close: mockClose })
    mockGetFileHandle = vi.fn().mockResolvedValue({ createWritable: mockCreateWritable })
    mockHandle = { getFileHandle: mockGetFileHandle } as unknown as FileSystemDirectoryHandle
  })

  it('calls getFileHandle with a filename matching myledger-backup-YYYY-MM-DD.json', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    await writeAutoBackup(mockHandle, [], [])

    expect(mockGetFileHandle).toHaveBeenCalledOnce()
    const [filename, options] = mockGetFileHandle.mock.calls[0]
    expect(filename).toMatch(/^myledger-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(options).toEqual({ create: true })
  })

  it('writes valid JSON with the BackupFile shape (version, exportedAt, txs, cats keys)', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    await writeAutoBackup(mockHandle, [], [])

    expect(mockWrite).toHaveBeenCalledOnce()
    const writtenJson = mockWrite.mock.calls[0][0] as string
    const parsed = JSON.parse(writtenJson) as BackupFile
    expect(parsed).toHaveProperty('version')
    expect(parsed).toHaveProperty('exportedAt')
    expect(parsed).toHaveProperty('txs')
    expect(parsed).toHaveProperty('userCats')
  })

  it('written JSON contains the txs passed as input', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    const txs = [makeTx({ id: 'tx-1', amount: 200 }), makeTx({ id: 'tx-2', amount: 300, category: 'food' })]
    await writeAutoBackup(mockHandle, txs, [])

    const writtenJson = mockWrite.mock.calls[0][0] as string
    const parsed = JSON.parse(writtenJson) as BackupFile
    expect(parsed.txs).toHaveLength(2)
    expect(parsed.txs[0].id).toBe('tx-1')
    expect(parsed.txs[0].amount).toBe(200)
    expect(parsed.txs[1].id).toBe('tx-2')
    expect(parsed.txs[1].amount).toBe(300)
  })

  it('written JSON contains the userCats passed as input', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    const cats = [makeCat({ id: 'food', en: 'Food' }), makeCat({ id: 'travel', en: 'Travel', zh: '旅行' })]
    await writeAutoBackup(mockHandle, [], cats)

    const writtenJson = mockWrite.mock.calls[0][0] as string
    const parsed = JSON.parse(writtenJson) as BackupFile
    expect(parsed.userCats).toHaveLength(2)
    expect(parsed.userCats[0].id).toBe('food')
    expect(parsed.userCats[1].id).toBe('travel')
  })

  it('written JSON has version 2', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    await writeAutoBackup(mockHandle, [], [])

    const writtenJson = mockWrite.mock.calls[0][0] as string
    const parsed = JSON.parse(writtenJson) as BackupFile
    expect(parsed.version).toBe(2)
  })

  it('calls createWritable on the file handle and then calls close', async () => {
    const { writeAutoBackup } = await import('./exportHelpers')
    await writeAutoBackup(mockHandle, [], [])

    expect(mockCreateWritable).toHaveBeenCalledOnce()
    expect(mockClose).toHaveBeenCalledOnce()
  })

  it('write is called before close', async () => {
    const callOrder: string[] = []
    mockWrite = vi.fn().mockImplementation(() => { callOrder.push('write'); return Promise.resolve() })
    mockClose = vi.fn().mockImplementation(() => { callOrder.push('close'); return Promise.resolve() })
    mockCreateWritable = vi.fn().mockResolvedValue({ write: mockWrite, close: mockClose })
    mockGetFileHandle = vi.fn().mockResolvedValue({ createWritable: mockCreateWritable })
    mockHandle = { getFileHandle: mockGetFileHandle } as unknown as FileSystemDirectoryHandle

    const { writeAutoBackup } = await import('./exportHelpers')
    await writeAutoBackup(mockHandle, [], [])

    expect(callOrder).toEqual(['write', 'close'])
  })
})

describe('loadBackupFile', () => {
  function makeBackup(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
      version: 2,
      exportedAt: '2025-01-01T00:00:00.000Z',
      txs: [{
        id: 'tx-1',
        date: '2025-01-15',
        amount: 100,
        category: 'food',
        note: '',
        freq: 'none',
        createdAt: '2025-01-15T00:00:00.000Z',
      }],
      userCats: [],
      ...overrides,
    })
  }

  function makeFile(json: string): File {
    return new File([json], 'backup.json', { type: 'application/json' })
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('resolves without throwing for a valid backup and calls restoreBackup once', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const { restoreBackup } = await import('../db/queries')
    await expect(loadBackupFile(makeFile(makeBackup()))).resolves.toBeUndefined()
    expect(restoreBackup).toHaveBeenCalledOnce()
  })

  it('throws Unsupported backup version when version !== 2', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    await expect(loadBackupFile(makeFile(makeBackup({ version: 1 })))).rejects.toThrow('Unsupported backup version')
  })

  it('throws Invalid backup file when txs is missing', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const json = JSON.stringify({ version: 2, exportedAt: '2025-01-01T00:00:00.000Z', userCats: [] })
    await expect(loadBackupFile(makeFile(json))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when txs is not an array', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    await expect(loadBackupFile(makeFile(makeBackup({ txs: 'not-an-array' })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx amount is a string', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: '100', category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx amount is NaN', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: NaN, category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    const json = JSON.stringify({ version: 2, exportedAt: '2025-01-01T00:00:00.000Z', txs, userCats: [] }, (_k, v: unknown) => (typeof v === 'number' && isNaN(v) ? null : v))
    await expect(loadBackupFile(makeFile(json))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx amount is negative', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: -50, category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx date is malformed', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025/01/15', amount: 100, category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx freq is unknown', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: 100, category: 'food', note: '', freq: 'weekly', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx id is an empty string', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: '', date: '2025-01-15', amount: 100, category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when a tx note is null', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: 100, category: 'food', note: null, freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when the second tx is invalid and the first is valid', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const txs = [
      { id: 'tx-1', date: '2025-01-15', amount: 100, category: 'food', note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z' },
      { id: 'tx-2', date: '2025-01-16', amount: -99, category: 'food', note: '', freq: 'none', createdAt: '2025-01-16T00:00:00.000Z' },
    ]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
  })

  it('does not call restoreBackup when validation fails', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const { restoreBackup } = await import('../db/queries')
    const txs = [{ id: 'tx-1', date: '2025-01-15', amount: 100, category: 'food', note: '', freq: 'weekly', createdAt: '2025-01-15T00:00:00.000Z' }]
    await expect(loadBackupFile(makeFile(makeBackup({ txs })))).rejects.toThrow('Invalid backup file')
    expect(restoreBackup).not.toHaveBeenCalled()
  })

  it('resolves and calls restoreBackup with userCats when backup has one valid category', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const { restoreBackup } = await import('../db/queries')
    const userCats = [{ id: 'cat-1', en: 'Food', zh: '食物', emoji: '🍔' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).resolves.toBeUndefined()
    expect(restoreBackup).toHaveBeenCalledOnce()
    const callArg = vi.mocked(restoreBackup).mock.calls[0][0]
    expect(callArg.userCats).toEqual(userCats)
  })

  it('resolves when userCats key is absent (treated as empty array)', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const json = JSON.stringify({ version: 2, exportedAt: '2025-01-01T00:00:00.000Z', txs: [] })
    await expect(loadBackupFile(makeFile(json))).resolves.toBeUndefined()
  })

  it('throws Invalid backup file when cat.id is an empty string', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const userCats = [{ id: '', en: 'Food', zh: '食物', emoji: '🍔' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when cat.id is null', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const userCats = [{ id: null, en: 'Food', zh: '食物', emoji: '🍔' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when cat.en is a number', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const userCats = [{ id: 'cat-1', en: 42, zh: '食物', emoji: '🍔' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).rejects.toThrow('Invalid backup file')
  })

  it('throws Invalid backup file when cat.emoji is missing (undefined serialised as absent key)', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const userCats = [{ id: 'cat-1', en: 'Food', zh: '食物' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).rejects.toThrow('Invalid backup file')
  })

  it('does not call restoreBackup when userCats validation fails', async () => {
    const { loadBackupFile } = await import('./exportHelpers')
    const { restoreBackup } = await import('../db/queries')
    const userCats = [{ id: '', en: 'Food', zh: '食物', emoji: '🍔' }]
    await expect(loadBackupFile(makeFile(makeBackup({ userCats })))).rejects.toThrow('Invalid backup file')
    expect(restoreBackup).not.toHaveBeenCalled()
  })
})
