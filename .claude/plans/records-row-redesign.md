---
plan: records-row-redesign
status: review
branch: feature/records-row-redesign
pr: #6
implemented: 2026-06-01
---

# Feature: Records Row Redesign — Amount Right-Aligned, Actions in Detail Modal Only

## What & Why
The Records page (2nd tab) currently shows inline Edit/Delete buttons on every row, which makes rows busy and redundant — the Detail modal (opened by tapping the row) already exposes the same Edit and Delete actions. This plan removes the inline buttons from rows, moves the amount to the right-side slot freed up by the removal, and keeps edit/delete exclusively in the Detail modal.

## Scope
- `src/pages/Transactions.tsx`: remove `.row-actions` block from each row; move the amount element out of `.row-info` and place it as a direct flex child of `.row-item` (right slot).
- `src/styles/components.css`: ensure `.amount` renders correctly as a right-side flex item (no new class needed — `flex:1` on `.row-info` already pushes it right; verify no style gap).
- `src/modals/DetailModal.tsx`: no logic changes — Edit and Delete buttons already exist here and remain as-is.

## Out of Scope
- Recurring page (3rd tab) — keeps its current inline Edit/Delete row buttons.
- Home page row layout — not touched.
- DetailModal visual redesign — buttons stay where they are.
- Any change to the Recurring page's row layout or modals.

## Technical Approach

### Frontend

**`src/pages/Transactions.tsx`**
- Remove the entire `<div class="row-actions">…</div>` block (Edit + Delete buttons) from the transaction row.
- Remove the `handleEdit` function (no longer needed on this page — it already exists in `DetailModal.tsx`).
- Move `<div class="amount">−{tx.amount.toFixed(2)}</div>` from inside `.row-info` to after the closing `</div>` of `.row-info`, as a direct child of `.row-item`.
- Clean up now-unused imports: `selCat`, `selRCat`, `selFreq` from `store`; `confirmDeleteTx` from `txHelpers`; `Freq` type — remove any that become unused after the above.

**`src/styles/components.css`**
- No new rules needed. `.amount` already has `white-space:nowrap` so it won't wrap as a right-side flex item. Verify visually.

### No backend changes

## Acceptance Criteria
- [ ] Records page rows show: icon | info (title, note, date, badge) | amount (right-aligned)
- [ ] No Edit or Delete buttons visible on any row in the Records page
- [ ] Tapping a row opens the Detail modal with the existing Edit and Delete buttons
- [ ] Edit and Delete actions in the Detail modal work correctly for both real and generated transactions
- [ ] Generated recurring rows (↻ badge) still show the recurrence indicator in the date line
- [ ] Recurring page (3rd tab) is unaffected — still shows inline Edit/Delete
- [ ] No TypeScript compiler errors (`npm run build` passes)
- [ ] No unused imports or variables

## Edge Cases
- Generated recurring transactions (`tx.isGenerated === true`) have no Delete button in the Detail modal — this is already handled by the `!tx.isGenerated` guard in `DetailModal.tsx`. No change needed.
- Amount column width: some amounts may be long (e.g., `−1,234.56`). `.amount` already has `white-space:nowrap` so it won't wrap or clip.
- The `handleEdit` function in `Transactions.tsx` is currently only called by the removed buttons — it must be deleted to satisfy `noUnusedLocals`.

## Open Questions
None — requirements are clear.
