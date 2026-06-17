import { describe, it, expect } from 'vitest'
import { allCats } from './catHelpers'
import { userCats } from '../state/store'
import { makeCat } from '../test-utils/setup'

describe('allCats', () => {
  it('returns the current userCats list', () => {
    userCats.value = [makeCat({ id: 'a' }), makeCat({ id: 'b' })]
    expect(allCats().map(c => c.id)).toEqual(['a', 'b'])
  })

  it('returns an empty array when there are no categories', () => {
    userCats.value = []
    expect(allCats()).toEqual([])
  })
})
