import type { Category } from '../types'

type ActiveFreq = 'monthly' | 'quarterly' | 'biannual' | 'yearly'

const CATS: readonly Category[] = [
  { id: 'lifestyle',        zh: '生活方式',   en: 'Lifestyle',           emoji: '✨' },
  { id: 'loan',             zh: '贷款',       en: 'Loan',                emoji: '🏦' },
  { id: 'eating_out',       zh: '外食',       en: 'Eating Out',          emoji: '🍽️' },
  { id: 'bills_sub',        zh: '账单订阅',   en: 'Bill & Subscription', emoji: '💡' },
  { id: 'groceries',        zh: '杂货',       en: 'Groceries',           emoji: '🛒' },
  { id: 'insurance',        zh: '保险',       en: 'Insurance',           emoji: '🛡️' },
  { id: 'car_petrol',       zh: '油费',       en: 'Car-Petrol',          emoji: '⛽' },
  { id: 'entertainment',    zh: '娱乐',       en: 'Entertainment',       emoji: '🎬' },
  { id: 'coffee',           zh: '咖啡',       en: 'Coffee Breaks',       emoji: '☕' },
  { id: 'psychology',       zh: '心理',       en: 'Psychology',          emoji: '🧠' },
  { id: 'holidays',         zh: '假期',       en: 'Holidays',            emoji: '🏖️' },
  { id: 'public_transport', zh: '公共交通',   en: 'Public Transport',    emoji: '🚌' },
  { id: 'car_parking',      zh: '停车费',     en: 'Car-Parking Fee',     emoji: '🅿️' },
  { id: 'shopping',         zh: '购物',       en: 'Shopping',            emoji: '🛍️' },
  { id: 'general',          zh: '一般',       en: 'General',             emoji: '📦' },
  { id: 'car_tolls',        zh: '过路费',     en: 'Car-Tolls',           emoji: '🛣️' },
  { id: 'gifts',            zh: '礼物',       en: 'Gifts',               emoji: '🎁' },
  { id: 'medical',          zh: '医疗',       en: 'Medical',             emoji: '💊' },
  { id: 'bank_charges',     zh: '银行费',     en: 'Bank Charges',        emoji: '🏧' },
]

export const COLORS: readonly string[] = [
  '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B', '#C77DFF', '#FF9F1C',
  '#2EC4B6', '#E71D36', '#FF6B35', '#F72585', '#4CC9F0', '#ADB5BD',
  '#B5E48C', '#90E0EF', '#FFC8DD', '#FFAFCC',
]

export const EMOJIS: readonly string[] = [
  '✨','🏦','🍽️','💡','🛒','🛡️','⛽','🎬','☕','🧠','🏖️','🚌',
  '🅿️','🛍️','📦','🛣️','🎁','💊','🏧','🏠','🚗','✈️','🎮','📱',
  '💄','👗','🐾','🎓','💪','🍕','🍔','🥤','🎵','📚','💻','🏋️',
  '🧴','🛁','🧹','🌿','💰','🎪','🎨','🎯','🏆','🌈','⭐','🔑',
]

export type EmojiGroupKey = 'money' | 'food' | 'transport' | 'home' | 'shopping' | 'health' | 'entertainment' | 'other'

export const EMOJI_GROUPS: readonly { key: EmojiGroupKey; emojis: readonly string[] }[] = [
  { key: 'money',         emojis: ['💰','💳','🏦','💵','💸','🏧','💹','📈','🧾','🪙','💎','🤑'] },
  { key: 'food',          emojis: ['🍕','🍔','🍽️','☕','🥤','🍜','🥐','🍣','🍱','🧃','🍺','🧋','🥗','🍰','🛒'] },
  { key: 'transport',     emojis: ['🚗','🚌','✈️','🚂','🛵','🚲','🛣️','⛽','🅿️','🚕','🏍️','🛳️','🚁','🚦'] },
  { key: 'home',          emojis: ['🏠','💡','🔌','🛁','🧹','🌿','🏗️','🪴','🧺','🛋️','🪟','🔑','🏡','🧰'] },
  { key: 'shopping',      emojis: ['🛍️','👗','💄','👠','💅','💍','🕶️','🎒','👟','🧴','🪥','🧸','🎀','👔'] },
  { key: 'health',        emojis: ['💊','🏥','🧠','💪','🦷','🩺','🧴','🩹','🏋️','🧘','🩻','🫀','🌡️'] },
  { key: 'entertainment', emojis: ['🎬','🎮','📱','🎵','🎨','🎪','🏆','🎯','📚','💻','🎭','🎤','🎸','🎲'] },
  { key: 'other',         emojis: ['✨','🎓','🎁','🐾','🌈','⭐','🎉','🤝','🌍','📦','🔔','🗓️','📷','🏖️','🚀'] },
]

export const FREQS: readonly { value: ActiveFreq; en: string; zh: string }[] = [
  { value: 'monthly',   en: 'Monthly',   zh: '每月'   },
  { value: 'quarterly', en: 'Quarterly', zh: '每季度' },
  { value: 'biannual',  en: 'Biannual',  zh: '每半年' },
  { value: 'yearly',    en: 'Yearly',    zh: '每年'   },
]
