import { signal, computed, effect } from '@preact/signals'
import type { Transaction, Category, Lang, Theme, PageId, ModalId, ModalContext } from '../types'
import { COLORS } from '../data/cats'

const now = new Date()

export const txs = signal<Transaction[]>([])
export const userCats = signal<Category[]>([])

export const viewY = signal(now.getFullYear())
export const viewM = signal(now.getMonth())

export const lang = signal<Lang>('en')

const _storedTheme = (localStorage.getItem('theme') as Theme) ?? 'dark'
document.documentElement.setAttribute('data-theme', _storedTheme)
export const theme = signal<Theme>(_storedTheme)
effect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
})

export const pinEnabled = signal<boolean>(localStorage.getItem('pinEnabled') === 'true')
effect(() => { localStorage.setItem('pinEnabled', String(pinEnabled.value)) })

export const pinHash = signal<string | null>(localStorage.getItem('pinHash'))
effect(() => {
  if (pinHash.value) localStorage.setItem('pinHash', pinHash.value)
  else localStorage.removeItem('pinHash')
})

export const isLocked = signal<boolean>(false)
export const pinFailCount = signal<number>(0)
export const pinLockedUntil = signal<number>(0)

export const autoBackupFolderName = signal<string | null>(null)
export const needsBackupPermission = signal(false)

export const selCat = signal('')
export const selRCat = signal('')
export const selFreq = signal<'monthly' | 'quarterly' | 'biannual' | 'yearly'>('monthly')
export const selEmoji = signal('✨')

export const activePage = signal<PageId>('home')
export const openModal = signal<ModalId | null>(null)
export const modalCtx = signal<ModalContext>({})

export const allCatsList = computed<Category[]>(() => userCats.value)

export const recentCatIds = computed<string[]>(() => {
  const seen = new Set<string>()
  const result: string[] = []
  const valid = new Set(allCatsList.value.map(c => c.id))
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  for (const tx of txs.value) {
    if (tx.date < cutoffStr) break
    if (!seen.has(tx.category) && valid.has(tx.category)) {
      seen.add(tx.category)
      result.push(tx.category)
      if (result.length === 5) break
    }
  }
  return result
})

export function changeMonth(delta: number) {
  let y = viewY.value, m = viewM.value + delta
  if (m < 0) { y--; m = 11 }
  if (m > 11) { y++; m = 0 }
  viewY.value = y
  viewM.value = m
}

export function catColor(id: string): string {
  const idx = allCatsList.value.findIndex(c => c.id === id)
  return COLORS[(idx >= 0 ? idx : 0) % COLORS.length]
}

export function getCat(id: string): Category {
  return allCatsList.value.find(c => c.id === id)
    ?? { id, en: id, zh: id, emoji: '📦' }
}

export function openM(id: ModalId, ctx: ModalContext = {}) {
  modalCtx.value = ctx
  openModal.value = id
}

export function closeM() {
  openModal.value = null
  modalCtx.value = {}
}

export const toastMsg = signal<string | null>(null)
let _toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(msg: string, durationMs = 2000) {
  if (_toastTimer) clearTimeout(_toastTimer)
  toastMsg.value = msg
  _toastTimer = setTimeout(() => { toastMsg.value = null }, durationMs)
}
