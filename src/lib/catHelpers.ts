import { allCatsList, getCat, catColor } from '../state/store'
import type { Category } from '../types'

export { getCat, catColor }

export function allCats(): Category[] {
  return allCatsList.value
}
