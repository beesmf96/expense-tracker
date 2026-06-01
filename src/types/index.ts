export type Freq = 'none' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'
export type Lang = 'en' | 'zh'
export type PageId = 'home' | 'transactions' | 'recurring' | 'settings' | 'manage-cats'
export type ModalId = 'expense' | 'recurring' | 'newcat' | 'editcat' | 'detail' | 'reclassify' | 'confirm'

export interface Transaction {
  id: string
  date: string       // YYYY-MM-DD
  amount: number
  category: string
  note: string
  freq: Freq
  createdAt: string
  isGenerated?: boolean
}

export interface Category {
  id: string
  en: string
  zh: string
  label?: string
  emoji: string
}

export interface ModalContext {
  detailId?: string
  detailTx?: Transaction
  editTx?: Transaction
  editCatId?: string
  rclFrom?: string
  rclDelete?: boolean
  newCatReturnSel?: (id: string) => void
  confirmIcon?: string
  confirmTitle?: string
  confirmMsg?: string
  confirmOkLabel?: string
  confirmOnOk?: () => void
}

export interface BackupFile {
  version: number
  exportedAt: string
  txs: Transaction[]
  userCats: Category[]
}
