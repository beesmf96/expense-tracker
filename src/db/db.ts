import Dexie, { type Table } from 'dexie'
import type { Transaction, Category } from '../types'

class MyLedgerDB extends Dexie {
  txs!: Table<Transaction>
  cats!: Table<Category>
  settings!: Table<{ key: string; value: unknown }>

  constructor() {
    super('myledger')
    this.version(2).stores({
      txs: 'id',
      cats: 'id',
    })
    this.version(3).stores({
      txs: 'id',
      cats: 'id',
      settings: 'key',
    })
  }
}

export const db = new MyLedgerDB()
