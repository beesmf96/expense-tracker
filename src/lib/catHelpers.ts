import { allCatsList } from '../state/store'
import type { Category } from '../types'

export function allCats(): Category[] {
  return allCatsList.value
}
