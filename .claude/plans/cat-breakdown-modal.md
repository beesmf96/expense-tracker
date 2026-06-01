---
plan: cat-breakdown-modal
status: review
branch: feature/cat-breakdown-modal
pr: #12
implemented: 2026-06-02
---

# Feature: Category Breakdown Modal

## What & Why
On the Home page "By Category" section, tapping a category row currently opens the new-expense modal with that category pre-selected. This is misleading — the user is trying to understand their spending, not add a new expense. This feature replaces that tap action with a read-only breakdown modal that shows the total, percentage of the month, and every individual transaction that makes up that category's spend for the current view month.

## Scope
- New `CatBreakdownModal` mounted in `App.tsx`
- `'cat-breakdown'` added to `ModalId`
- `breakdownCatId?: string` added to `ModalContext`
- Home page category row `onClick` updated to `openM('cat-breakdown', { breakdownCatId: catId })`
- Modal shows:
  - Category header: emoji + name
  - Total amount + percentage of month total (e.g. `−120.00  ·  34%`)
  - Scrollable list of transactions in that category for the view month, sorted date descending
  - Each row: date (left), note if present (sub-line), amount (right) — tapping a row opens `DetailModal` via `openM('detail', { detailTx: tx })`
  - Close button at the bottom
- i18n: new string `catBreakdown` (`'Category Breakdown'` / `'类别明细'`) used as the modal title

## Out of Scope
- Filtering or sorting controls inside the modal
- Navigation to the Transactions tab from the modal
- Adding or editing transactions from within the modal (edit/delete lives in DetailModal once opened)
- Breakdown across multiple months

## Technical Approach

### Types (`src/types/index.ts`)
- Add `'cat-breakdown'` to `ModalId` union
- Add `breakdownCatId?: string` to `ModalContext`

### i18n (`src/data/i18n.ts`)
- Add `catBreakdown: 'Category Breakdown'` to `S.en`
- Add `catBreakdown: '类别明细'` to `S.zh`

### New modal (`src/modals/CatBreakdownModal.tsx`)
- Read `modalCtx.value.breakdownCatId` and `openModal.value` (reactive reads)
- Derive filtered transactions: `monthTxs(txs.value, viewY.value, viewM.value).filter(tx => tx.category === catId)`
- Derive month total from `monthTxs(...)` (all cats, same month) for percentage
- Render header block: category emoji + name, `−total · pct%`
- Render transaction list rows (date, note sub-line, amount); each row `onClick` calls `openM('detail', { detailTx: tx })`
- Render `<button class="btn btn-g" onClick={closeM}>{t('close')}</button>`
- Rows use existing `.row-item.clickable`, `.row-info`, `.row-title`, `.row-sub`, `.amount` classes — no new CSS needed

### App.tsx
- Import and mount `<CatBreakdownModal />` alongside the other modals

### Home.tsx
- Change category row `onClick` from `() => openM('expense', {})` to `() => openM('cat-breakdown', { breakdownCatId: catId })`

## Acceptance Criteria
- [ ] Tapping a category row on Home opens the breakdown modal (not the expense modal)
- [ ] Modal title shows the i18n string `catBreakdown`
- [ ] Header shows correct category emoji, name, total amount, and percentage of month total
- [ ] Transaction list shows only transactions in that category for the current view month
- [ ] List is sorted date descending
- [ ] Tapping a transaction row opens DetailModal
- [ ] Close button dismisses the modal
- [ ] Works correctly in both EN and ZH language modes
- [ ] Works in both light and dark themes
- [ ] If the category has no transactions (edge case: stale view), modal shows an empty state

## Edge Cases
- `breakdownCatId` is undefined when the modal is first mounted (before ever being opened) — guard with `if (!catId) return <Modal id="cat-breakdown"><div /></Modal>` matching the DetailModal guard pattern
- Month total is 0 — avoid division by zero in pct calculation (`total > 0 ? ... : 0`)
- A category with a single generated recurring transaction — `isGenerated` txs are included in the list and tapping them opens DetailModal normally (DetailModal already handles them)

## Open Questions
None — all clarifications resolved before planning.
