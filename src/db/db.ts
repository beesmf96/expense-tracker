import Dexie, { type Table } from 'dexie'
import type { Transaction, Category } from '../types'

class MyLedgerDB extends Dexie {
  txs!: Table<Transaction>
  cats!: Table<Category>

  constructor() {
    super('myledger')
    this.version(2).stores({
      txs: 'id',
      cats: 'id',
    })
  }
}

export const db = new MyLedgerDB()
