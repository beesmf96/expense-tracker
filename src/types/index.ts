export type Freq = 'none' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'
export type Lang = 'en' | 'zh'
export type Theme = 'dark' | 'light'
export type PageId = 'home' | 'transactions' | 'recurring' | 'settings' | 'manage-cats' | 'search'
export type ModalId = 'expense' | 'recurring' | 'newcat' | 'editcat' | 'detail' | 'reclassify' | 'confirm' | 'cat-breakdown' | 'pin-setup'

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
  breakdownCatId?: string
  pinSetupMode?: 'set' | 'change' | 'disable'
}

export interface BackupFile {
  version: number
  exportedAt: string
  txs: Transaction[]
  userCats: Category[]
}
