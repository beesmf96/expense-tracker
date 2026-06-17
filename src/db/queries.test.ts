import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from './db'
import {
  putTx, delTx, putCat, delCat, loadAll,
  bulkUpdateTxCat, clearAll, restoreBackup,
  saveAutoBackupHandle, clearAutoBackupHandle, initAutoBackup,
} from './queries'
import { txs, userCats, autoBackupFolderName, needsBackupPermission } from '../state/store'
import { makeTx, makeCat } from '../test-utils/setup'

vi.mock('../lib/exportHelpers', () => ({
  writeAutoBackup: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(async () => {
  await clearAutoBackupHandle()
  await db.settings.clear()
  await db.txs.clear()
  await db.cats.clear()
  txs.value = []
  userCats.value = []
  autoBackupFolderName.value = null
  needsBackupPermission.value = false
})

describe('putTx / delTx', () => {
  it('persists a transaction and reflects it in the txs signal', async () => {
    await putTx(makeTx({ id: 't1', amount: 42 }))
    expect(await db.txs.get('t1')).toMatchObject({ id: 't1', amount: 42 })
    expect(txs.value.map(t => t.id)).toEqual(['t1'])
  })

  it('deletes a transaction and updates the txs signal', async () => {
    await putTx(makeTx({ id: 't1' }))
    await delTx('t1')
    expect(await db.txs.get('t1')).toBeUndefined()
    expect(txs.value).toEqual([])
  })

  it('upserts (put with an existing id replaces, not duplicates)', async () => {
    await putTx(makeTx({ id: 't1', amount: 10 }))
    await putTx(makeTx({ id: 't1', amount: 99 }))
    expect(txs.value).toHaveLength(1)
    expect(txs.value[0].amount).toBe(99)
  })
})

describe('putCat / delCat', () => {
  it('persists a category and reflects it in the userCats signal', async () => {
    await putCat(makeCat({ id: 'c1', en: 'Food' }))
    expect(await db.cats.get('c1')).toMatchObject({ id: 'c1', en: 'Food' })
    expect(userCats.value.map(c => c.id)).toEqual(['c1'])
  })

  it('deletes a category and updates the userCats signal', async () => {
    await putCat(makeCat({ id: 'c1' }))
    await delCat('c1')
    expect(await db.cats.get('c1')).toBeUndefined()
    expect(userCats.value).toEqual([])
  })
})

describe('loadAll', () => {
  it('sorts transactions by date descending', async () => {
    await db.txs.bulkPut([
      makeTx({ id: 'a', date: '2025-01-01' }),
      makeTx({ id: 'b', date: '2025-03-01' }),
      makeTx({ id: 'c', date: '2025-02-01' }),
    ])
    await loadAll()
    expect(txs.value.map(t => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('loads categories into the userCats signal', async () => {
    await db.cats.bulkPut([makeCat({ id: 'c1' }), makeCat({ id: 'c2' })])
    await loadAll()
    expect(userCats.value.map(c => c.id).sort()).toEqual(['c1', 'c2'])
  })
})

describe('bulkUpdateTxCat', () => {
  it('reassigns every transaction from one category to another', async () => {
    await db.txs.bulkPut([
      makeTx({ id: 't1', category: 'old' }),
      makeTx({ id: 't2', category: 'old' }),
      makeTx({ id: 't3', category: 'keep' }),
    ])
    await bulkUpdateTxCat('old', 'new')
    const all = await db.txs.toArray()
    expect(all.filter(t => t.category === 'new').map(t => t.id).sort()).toEqual(['t1', 't2'])
    expect(all.find(t => t.id === 't3')!.category).toBe('keep')
  })
})

describe('clearAll', () => {
  it('empties both txs and cats tables and signals', async () => {
    await db.txs.bulkPut([makeTx({ id: 't1' })])
    await db.cats.bulkPut([makeCat({ id: 'c1' })])
    await clearAll()
    expect(await db.txs.count()).toBe(0)
    expect(await db.cats.count()).toBe(0)
    expect(txs.value).toEqual([])
    expect(userCats.value).toEqual([])
  })
})

describe('restoreBackup', () => {
  it('replaces existing data with the backup contents', async () => {
    await db.txs.bulkPut([makeTx({ id: 'old' })])
    await db.cats.bulkPut([makeCat({ id: 'oldcat' })])
    await restoreBackup({
      txs: [makeTx({ id: 'new1' }), makeTx({ id: 'new2' })],
      userCats: [makeCat({ id: 'newcat' })],
    })
    expect((await db.txs.toArray()).map(t => t.id).sort()).toEqual(['new1', 'new2'])
    expect((await db.cats.toArray()).map(c => c.id)).toEqual(['newcat'])
    expect(txs.value).toHaveLength(2)
    expect(userCats.value.map(c => c.id)).toEqual(['newcat'])
  })
})

describe('auto-backup handle (settings)', () => {
  it('saveAutoBackupHandle persists the folder name and clears the permission flag', async () => {
    needsBackupPermission.value = true
    const handle = { name: 'Backups' } as unknown as FileSystemDirectoryHandle
    await saveAutoBackupHandle(handle)
    expect(autoBackupFolderName.value).toBe('Backups')
    expect(needsBackupPermission.value).toBe(false)
    expect(await db.settings.get('autoBackupHandle')).toBeTruthy()
  })

  it('clearAutoBackupHandle removes the row and resets the signals', async () => {
    await saveAutoBackupHandle({ name: 'Backups' } as unknown as FileSystemDirectoryHandle)
    await clearAutoBackupHandle()
    expect(await db.settings.get('autoBackupHandle')).toBeUndefined()
    expect(autoBackupFolderName.value).toBeNull()
    expect(needsBackupPermission.value).toBe(false)
  })

  it('initAutoBackup is a no-op when no handle was ever stored', async () => {
    await initAutoBackup()
    expect(autoBackupFolderName.value).toBeNull()
    expect(needsBackupPermission.value).toBe(false)
  })
})
