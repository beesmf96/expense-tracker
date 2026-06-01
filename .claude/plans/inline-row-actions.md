---
plan: inline-row-actions
status: in-progress
branch: feature/inline-row-actions
pr: ~
implemented: ~
---

# Feature: Inline Edit + Delete Buttons on Rows

## What & Why
Transactions and Recurring pages currently require two taps to edit or delete a record: tap the row to open the detail modal, then tap Edit or Delete. Adding inline action buttons lets users act in one tap directly from the list, without losing the detail modal for full info.

## Scope
- Transactions page: each row's right-side amount column is replaced with a 2-column [Edit | Delete] button group. The amount moves into the `row-info` area. Generated recurring entries (↻) show Edit only, no Delete.
- Recurring page: same treatment — amount + freq-badge move into `row-info`, right side becomes [Edit | Delete].
- Row body click still opens the detail modal (unchanged).
- New `.row-actions` CSS class for the 2-column button grid.
- Button clicks stop propagation so they don't also fire the row's onClick.

## Out of Scope
- Changing the detail modal itself.
- Adding swipe-to-delete or long-press gestures.
- Any change to Home page rows.

## Technical Approach

### Frontend

**`src/pages/Transactions.tsx`**
- Move `−{tx.amount.toFixed(2)}` into the `.row-info` div (below the date line), using the existing `.amount` class.
- Replace the `<span class="amount">` right-column with a `<div class="row-actions">` containing:
  - Edit button: calls `handleEdit(tx)` + `e.stopPropagation()`
  - Delete button (only if `!tx.isGenerated`): opens confirm modal + `e.stopPropagation()`
- Extract `handleEdit(tx)` logic (mirrors `DetailModal.handleEdit`):
  - Generated tx or `freq === 'none'`: `selCat.value = tx.category; openM('expense', { editTx: tx })`
  - Template (`freq !== 'none'`): `selRCat.value = tx.category; selFreq.value = tx.freq; openM('recurring', { editTx: tx })`
- Import `delTx` from `../db/queries`, `selCat`, `selRCat`, `selFreq` from `../state/store`.
- Add `import type { Freq } from '../types'`.

**`src/pages/Recurring.tsx`**
- Move `−{tx.amount.toFixed(2)}` and `<span class="freq-badge">` into `.row-info` (amount on one line, freq-badge below it or inline).
- Replace the right-column `<div style={{ textAlign: 'right' }}>` with `<div class="row-actions">` containing Edit + Delete buttons.
- Edit button: `selRCat.value = tx.category; selFreq.value = tx.freq as Exclude<Freq, 'none'>; openM('recurring', { editTx: tx })` + `e.stopPropagation()`
- Delete button: open confirm modal + `e.stopPropagation()`
- Import `delTx`, `selRCat`, `selFreq`; `import type { Freq }`.
- Remove the now-unused inline style div for the right column.

**`src/styles/components.css`**
Add after `.amount` rule:
```css
.row-actions{display:grid;grid-template-columns:1fr 1fr;gap:4px;flex-shrink:0}
.row-act-btn{padding:6px 10px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap}
.row-act-edit{background:var(--adim);color:var(--accent)}
.row-act-del{background:var(--r-dim);color:var(--r)}
```

**Confirm modal calls** (same pattern as DetailModal):
```ts
openM('confirm', {
  confirmIcon: '🗑️',
  confirmTitle: t('confirmDel'),
  confirmMsg: `Delete this ${catLabel(cat)} transaction of −${tx.amount.toFixed(2)}?`,
  confirmOkLabel: t('delete'),
  confirmOnOk: async () => { await delTx(tx.id) },
})
```

**i18n** — no new keys needed; uses existing `t('edit')`, `t('delete')`, `t('confirmDel')`.

## Acceptance Criteria
- [ ] Each Transactions row shows Edit + Delete buttons on the right, amount visible inside the info area
- [ ] Generated (↻) rows in Transactions show Edit button only
- [ ] Each Recurring row shows Edit + Delete buttons on the right, amount + freq-badge visible inside the info area
- [ ] Tapping Edit on a real expense opens ExpenseModal in edit mode
- [ ] Tapping Edit on a generated expense opens ExpenseModal in edit mode
- [ ] Tapping Edit on a recurring template opens RecurringModal in edit mode
- [ ] Tapping Delete opens the confirm modal; confirming deletes the record
- [ ] Tapping the row body (outside the buttons) still opens the detail modal
- [ ] Button taps do not also open the detail modal (stopPropagation works)
- [ ] No TypeScript errors; no unused imports

## Edge Cases
- `stopPropagation` must be called on both `onClick` handlers of the buttons so the row's `onClick` (detail modal) is not also triggered.
- The `handleEdit` for a generated tx must use `openM('expense', { editTx: tx })` — not `openM('recurring')` — because editing a generated occurrence saves it as a real override.
- `selFreq.value` cast: `tx.freq as Exclude<Freq, 'none'>` is safe on Recurring page because all items are pre-filtered to `freq !== 'none'`.

## Open Questions
None.
