import { signal, computed, effect } from '@preact/signals'
import type { Transaction, Category, Lang, Theme, PageId, ModalId, ModalContext } from '../types'
import { CATS, COLORS } from '../data/cats'

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

export const selCat = signal('lifestyle')
export const selRCat = signal('bills_sub')
export const selFreq = signal<'monthly' | 'quarterly' | 'biannual' | 'yearly'>('monthly')
export const selEmoji = signal('✨')

export const activePage = signal<PageId>('home')
export const openModal = signal<ModalId | null>(null)
export const modalCtx = signal<ModalContext>({})

export const allCatsList = computed<Category[]>(() => {
  const overrides = new Map(userCats.value.map(c => [c.id, c]))
  return CATS.map(c => overrides.get(c.id) ?? c).concat(
    userCats.value.filter(c => !CATS.find(b => b.id === c.id))
  )
})

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
