---
plan: fix-test-failures-allcatslist
status: in-progress
branch: feature/fix-test-failures-allcatslist
pr: ~
implemented: ~
---

# Fix: 6 Pre-existing Test Failures (tests must seed their own category data)

## What & Why

Six tests across three files are failing. Root-cause analysis reveals two distinct bugs — one in test setup, one in a test assertion:

1. **Tests assume built-in categories exist, but the app no longer ships them.** `allCatsList` is intentionally `computed(() => userCats.value)` — the app is a blank slate and users configure their own categories. Tests that use `makeTx({ category: 'bills_sub' })` and then assert on the label `'Bill & Subscription'` are relying on built-in data that no longer exists. The fix is to have tests seed `userCats.value` with whatever category objects they need, the same way they seed `txs.value`. Do NOT restore the `CATS` merge in `store.ts` — the blank-slate design is intentional.

2. **One wrong assertion in `Search.test.tsx` line 45.** The test `'empty query shows empty state'` expects `'No results'`, but when the query is empty the page renders `t('searchHint')` = `'Search your expenses'`. `'No results'` is `t('searchEmpty')`, shown only when a non-empty query yields zero matches.

## Scope

- Add `makeCat` factory and reset `userCats` in `src/test-utils/setup.ts`
- Update `Home.test.tsx`, `CatBreakdownModal.test.tsx`, and `Search.test.tsx` to seed `userCats.value` before rendering
- Fix the single wrong assertion in `Search.test.tsx`
- All 6 failing tests pass; 67 currently-passing tests do not regress

## Out of Scope

- Restoring `export const CATS` or merging built-ins into `allCatsList` — the blank-slate design stays
- Changing any production code (`store.ts`, `cats.ts`, pages, modals)
- Adding new test cases beyond fixing the 6 failures

## Technical Approach

### 1. `src/test-utils/setup.ts` — add `makeCat` and reset `userCats`

Export a `makeCat` factory alongside `makeTx`, and update `setupStoreTest` to also reset `userCats`:

```ts
import { vi } from 'vitest'
import type { Transaction, Category } from '../types'
import { txs, userCats, viewY, viewM } from '../state/store'

export function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test-1', date: '2025-01-15', amount: 100, category: 'bills_sub',
    note: '', freq: 'none', createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  }
}

export function makeCat(overrides: Partial<Category>): Category {
  return {
    id: 'bills_sub', en: 'Bill & Subscription', zh: '账单订阅', emoji: '💡',
    ...overrides,
  }
}

export async function setupStoreTest() {
  const store = await import('../state/store')
  const openM = vi.mocked(store.openM)
  openM.mockClear()
  viewY.value = 2025
  viewM.value = 0
  txs.value = []
  userCats.value = []        // ← added: ensure no cat bleed between tests
  return { openM }
}
```

The `makeCat` default produces the `bills_sub` category since that is the most-used category in existing tests. Tests needing a different category pass overrides.

### 2. `src/pages/Home.test.tsx` — seed categories

Import `makeCat` and seed `userCats.value` in every test that asserts on a category label:

```ts
import { txs, userCats } from '../state/store'
import { makeTx, makeCat, setupStoreTest } from '../test-utils/setup'

// In the test that uses 'Bill & Subscription':
userCats.value = [makeCat()]
txs.value = [makeTx({ id: 'tx-1', category: 'bills_sub', ... })]

// In the test that uses 'Groceries':
userCats.value = [makeCat(), makeCat({ id: 'groceries', en: 'Groceries', zh: '杂货', emoji: '🛒' })]
txs.value = [makeTx({ category: 'bills_sub', ... }), makeTx({ category: 'groceries', ... })]
```

### 3. `src/modals/CatBreakdownModal.test.tsx` — seed categories

Same pattern: add `userCats` to the import from store, seed it in each test that asserts on a category label:

```ts
import { txs, userCats, modalCtx, openModal } from '../state/store'
import { makeTx, makeCat, setupStoreTest } from '../test-utils/setup'

// In tests asserting 'Bill & Subscription':
userCats.value = [makeCat()]
```

### 4. `src/pages/Search.test.tsx` — seed categories + fix assertion

Two changes:

**a) Wrong assertion fix (line 45):**
```ts
// Before:
expect(screen.getByText('No results')).toBeTruthy()
// After:
expect(screen.getByText('Search your expenses')).toBeTruthy()
```

**b) Seed `userCats` in the category-label test:**
```ts
// In 'matches a tx by category label (case-insensitive)':
import { txs, userCats } from '../state/store'
userCats.value = [makeCat()]
```

Note: `Search.test.tsx` does not use `setupStoreTest`, so it must reset `userCats.value` explicitly in its own `beforeEach`. Update the `beforeEach` block:

```ts
beforeEach(async () => {
  txs.value = []
  userCats.value = []      // ← added
  const { openM } = await import('../state/store')
  vi.mocked(openM).mockClear()
})
```

## Acceptance Criteria

- [ ] `npm test -- --run` passes with 0 failures (6 failing → 0 failing, 73 total)
- [ ] `npm run build` passes with no TypeScript errors
- [ ] No production code (`store.ts`, `cats.ts`, pages, modals) is modified
- [ ] `userCats.value` is reset to `[]` in every `beforeEach` that previously reset `txs.value`, preventing bleed between tests

## Edge Cases

- The `'renders nothing meaningful when breakdownCatId is absent'` test in `CatBreakdownModal.test.tsx` does not assert on a category label — it does not need `userCats` seeding
- Tests that assert `'Bill & Subscription'` is absent (e.g. checking empty states) must still seed the category — the component uses `catLabel(getCat(catId))` and without seeding would render the raw ID, which is also absent, so those tests would coincidentally pass. Seed anyway for correctness and clarity

## Open Questions

None — all clarifications resolved before planning.
