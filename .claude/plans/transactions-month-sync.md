---
plan: transactions-month-sync
status: review
branch: feature/transactions-month-sync
pr: '#10'
implemented: '2026-06-01'
---

# Feature: Transactions Tab Synced to Home Month

## What & Why
The Home tab shows a monthly summary for a selected month. The Transactions (Records) tab currently shows all transactions across all time, grouped by month. Users expect that when they select May 2026 on Home and switch to the Records tab, they see only May's records — not everything. Syncing both tabs to the same shared `viewY`/`viewM` signals makes navigation feel coherent.

## Scope
- Transactions page filters to the current `viewY`/`viewM` month (same signals Home already uses)
- Month navigator (prev/next arrows + month label) added to the Transactions page — mutating the shared signals, so navigation on either tab affects both
- Month-group section headers removed (redundant when showing a single month)
- EmptyState shown when the selected month has no records

## Out of Scope
- Separate/independent month navigation on Transactions
- Showing all-time records in any view
- Pagination or infinite scroll

## Technical Approach

### State
- No new signals. `viewY` and `viewM` from `src/state/store.ts` are already exported and used by Home. Transactions will read them directly.

### `src/pages/Transactions.tsx`
- Import `viewY`, `viewM` from `../state/store`
- Import `monthTxs` from `../state/recurring`
- Replace the current all-tx query (`txs.value.filter(...)` + `allGeneratedUpToDate()` + sort) with `monthTxs(txs.value, viewY.value, viewM.value)` — this already merges real + generated and sorts descending
- Add a `changeMonth(delta)` helper (identical to the one in `Home.tsx`) that mutates `viewY.value` / `viewM.value`
- Add a `<div class="month-nav">` block (same markup as in `Home.tsx`) below the page title, above the list
- Remove the `groups` Map and the `month-group` section header rendering — the list is now flat (single month, date visible on each row)
- Keep the existing row layout unchanged

### i18n
- No new keys needed — `t('records')`, `mfmt()` and all row labels already exist

### CSS
- No new rules needed — `.month-nav`, `.month-nav-btn` are already defined in `layout.css`

## Acceptance Criteria
- [ ] Selecting May 2026 on Home then switching to Records shows only May 2026 transactions
- [ ] Changing month with the Transactions nav arrows also updates the Home summary
- [ ] Changing month on Home also updates the Transactions list
- [ ] An empty month shows the EmptyState component
- [ ] Generated (recurring) transactions for the selected month appear in the list
- [ ] The month navigator displays the correct locale-formatted month label

## Edge Cases
- Month with no real or generated transactions → EmptyState (already handled by existing guard)
- Switching from a month with many records to one with zero should clear the list (signal reactivity handles this automatically)

## Open Questions
None — approach is fully determined.
