---
plan: edit-expense-recurring
status: review
branch: feature/edit-expense-recurring
pr: '#2'
implemented: '2026-06-01'
---

# Feature: Edit Expense & Recurring Transactions

## What & Why

Users need to edit existing expenses and recurring templates after they've been saved. The primary use case is correcting discrepancies — e.g. when splitting a bill with a friend, the actual amount paid differs from what was initially recorded. Currently the `DetailModal` only supports delete; there is no way to fix a typo, adjust an amount, change a category, or correct a date.

## Scope

- Edit button in `DetailModal` for all three transaction types: regular expense, recurring template, and generated recurring instance
- Regular expense edit: pre-fill `ExpenseModal` with existing data; save overwrites the same DB record
- Recurring template edit: pre-fill `RecurringModal` with existing data; save overwrites the template
- Generated recurring instance edit ("override this month"): save a pinned real `freq: 'none'` transaction with the generated ID (e.g. `tpl-1_2025-02`) so `genRecurring` skips generating that month
- `genRecurring` updated to skip months that already have a real override for that template

## Out of Scope

- Bulk editing multiple transactions at once
- Partial editing (only amount or only category) — full form is always shown
- Changing a regular expense into a recurring one or vice versa
- Preserving virtual past generated instances when a template is updated (only explicitly pinned months are immune to template changes)
- Edit from the list row directly (must tap row → DetailModal → Edit)

## Technical Approach

### State / Types

**`src/types/index.ts`**
- Add `editTx?: Transaction` to `ModalContext`

**`src/data/i18n.ts`**
- Add `edit`, `editExpense`, `editRecurring` keys to both `S.en` and `S.zh`

**`src/state/store.ts`**
- No changes needed — `selCat`, `selRCat`, `selFreq` are already exported and will be set by the caller before opening the modal (same pattern as `EditCatModal` setting `selEmoji`)

### DB / Recurring

**`src/state/recurring.ts` — `genRecurring`**
- Before pushing a generated tx, check if `allTxs` contains a `freq: 'none'` transaction whose `id === \`${tpl.id}_${monthKey}\`` (an existing real override)
- If so, `continue` — let the real record stand

```ts
const overrides = new Set(
  allTxs.filter(tx => tx.freq === 'none').map(tx => tx.id)
)
// inside the loop:
if (overrides.has(`${tpl.id}_${monthKey}`)) continue
```

### Modals

**`src/modals/ExpenseModal.tsx`**
- Read `modalCtx.value.editTx` to detect edit mode
- Use `useEffect([editTx?.id])` to sync `amount`, `date`, `note` signals and `selCat.value` when the modal opens for a different tx
- Reset signals (to defaults) in the same effect when `editTx` is undefined (add mode)
- Title: `t('editExpense')` vs `t('addExpense')`
- On save in edit mode:
  - Regular: `putTx({ ...editTx, amount, date, note, category: selCat.value })`
  - Generated override: `putTx({ ...editTx, freq: 'none', isGenerated: false, amount, date, note, category: selCat.value })` — same ID `{tpl}_{YYYY-MM}`, drops `isGenerated`

**`src/modals/RecurringModal.tsx`**
- Same pattern: `useEffect([editTx?.id])` syncs `amount`, `date`, `note`, `selRCat.value`, `selFreq.value`
- Title: `t('editRecurring')` vs `t('addRecurring')`
- On save: `putTx({ ...editTx, amount, date, note, category: selRCat.value, freq: selFreq.value })`

**`src/modals/DetailModal.tsx`**
- Import `selCat`, `selRCat`, `selFreq` from store
- Add Edit button above the Delete button (or below amount block)
- Routing logic:
  - `tx.isGenerated === true` → set `selCat.value = tx.category`, open `'expense'` with `editTx: tx`
  - `tx.freq !== 'none'` (template) → set `selRCat.value = tx.category; selFreq.value = tx.freq`, open `'recurring'` with `editTx: tx`
  - `tx.freq === 'none'` (regular) → set `selCat.value = tx.category`, open `'expense'` with `editTx: tx`

### CSS

No new CSS classes needed. The Edit button uses existing `.btn.btn-p` (primary). Delete button stays `.btn.btn-r`. Cancel stays `.btn.btn-g`.

## Acceptance Criteria

- [ ] Tapping a regular expense row → DetailModal → Edit opens ExpenseModal pre-filled with correct amount, date, category, note
- [ ] Saving the edit overwrites the original record (same ID) — no duplicate created
- [ ] Tapping a recurring template row → DetailModal → Edit opens RecurringModal pre-filled with correct data including frequency
- [ ] Saving the recurring edit updates the template; previously pinned overrides are unaffected
- [ ] Tapping a generated recurring row → DetailModal → Edit opens ExpenseModal pre-filled
- [ ] Saving creates a real `freq: 'none'` transaction with the generated ID; that month is no longer auto-generated
- [ ] Template amount change does NOT affect existing pinned overrides
- [ ] Cancelling edit from any modal leaves the original record unchanged
- [ ] Both EN and ZH strings are correct for all new labels

## Edge Cases

- **Generated tx edited then template deleted**: the pinned real tx remains; it shows in Transactions as a normal one-off
- **Generated tx edited twice**: second edit overwrites the first (same ID, `putTx` upserts)
- **Edit cancel with dirty fields**: signals are re-synced next time the modal opens for the same tx (same `editTx.id` dependency → `useEffect` won't re-run; user sees stale values). Mitigation: sync effect also runs when `openModal.value` transitions to `'expense'`/`'recurring'` — watch `openModal.value + editTx?.id` together as the effect key
- **Template start date change**: allowed — user may have started the recurring on the wrong date
- **Amount set to 0 or empty on edit**: same validation as add (`if (!amt || amt <= 0) return`)

## Open Questions

None — all resolved before planning.
