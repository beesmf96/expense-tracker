import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Transaction, Category, BackupFile } from '../types'

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
