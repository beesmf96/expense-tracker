---
plan: refactor-extract-components
status: review
branch: feature/refactor-extract-components
pr: #4
implemented: 2026-06-01
---

# Feature: Extract repeated patterns into components, remove orphaned code

## What & Why

The codebase has three patterns repeated in 3–5 files each, and one component file that is defined but never imported anywhere. Extracting the repeated patterns reduces the total JSX surface and ensures future changes to layout/labels happen in one place. Deleting the orphaned file removes dead weight and confusion.

## Scope

### Extract `FormField` component
Pattern: `<div class="field"><label>{label}</label>{children}</div>`

Appears in **5 files** (14 total occurrences):
- `src/modals/ExpenseModal.tsx` — 4 times
- `src/modals/RecurringModal.tsx` — 5 times
- `src/modals/NewCatModal.tsx` — 2 times
- `src/modals/EditCatModal.tsx` — 2 times
- `src/modals/ReclassifyModal.tsx` — 1 time

New file: `src/components/FormField.tsx`

```tsx
interface Props { label: string; children: ComponentChildren }
export function FormField({ label, children }: Props) {
  return (
    <div class="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
```

Replace all 14 occurrences in the 5 modal files.

---

### Extract `ModalActions` component
Pattern: save + cancel button pair at the bottom of modal content.

Appears in **4 files**:
- `src/modals/ExpenseModal.tsx`: `<button btn-p onClick={save}>{t('save')}</button> <button btn-g onClick={closeM}>{t('cancel')}</button>`
- `src/modals/RecurringModal.tsx`: identical
- `src/modals/NewCatModal.tsx`: identical
- `src/modals/EditCatModal.tsx`: identical

`ReclassifyModal.tsx` is excluded — its cancel clears local state before calling `closeM()`, and its primary button has `disabled` and a different label.

New file: `src/components/ModalActions.tsx`

```tsx
interface Props { onSave: () => void }
export function ModalActions({ onSave }: Props) {
  return (
    <>
      <button class="btn btn-p" onClick={onSave}>{t('save')}</button>
      <button class="btn btn-g" onClick={closeM}>{t('cancel')}</button>
    </>
  )
}
```

Replace in 4 modal files.

---

### Extract `confirmDeleteTx()` helper
Pattern: `openM('confirm', { confirmIcon: '🗑️', confirmTitle: t('confirmDel'), confirmMsg: ..., confirmOkLabel: t('delete'), confirmOnOk: async () => { await delTx(tx.id) } })`

Appears in **3 files**:
- `src/pages/Transactions.tsx` (line 80–88)
- `src/pages/Recurring.tsx` (line 62–69)
- `src/modals/DetailModal.tsx` (line 67–75)

Add to `src/lib/txHelpers.ts` (new file):

```ts
export function confirmDeleteTx(tx: Transaction, cat: Category) {
  openM('confirm', {
    confirmIcon: '🗑️',
    confirmTitle: t('confirmDel'),
    confirmMsg: `Delete this ${catLabel(cat)} transaction of −${tx.amount.toFixed(2)}?`,
    confirmOkLabel: t('delete'),
    confirmOnOk: async () => { await delTx(tx.id) },
  })
}
```

Replace in 3 files.

---

### Remove orphaned `RowItem.tsx`
`src/components/RowItem.tsx` is never imported by any file. All pages use inline `.row-item` markup directly. Delete the file.

## Out of Scope

- `today()` function (2 files only — below 3-occurrence threshold)
- `freqLabel()` function (2 files only — below threshold)
- Changing the inline `.row-item` markup in pages — the content inside `.row-info` varies significantly across pages (ProgressBar, amount-inside-info, freq-badge combos) making a shared wrapper impractical without complex slots

## Technical Approach

### Frontend

Files changed:
- **New**: `src/components/FormField.tsx`
- **New**: `src/components/ModalActions.tsx`
- **New**: `src/lib/txHelpers.ts`
- **Modified**: `src/modals/ExpenseModal.tsx`, `RecurringModal.tsx`, `NewCatModal.tsx`, `EditCatModal.tsx` — use `FormField` + `ModalActions`
- **Modified**: `src/modals/ReclassifyModal.tsx` — use `FormField` only
- **Modified**: `src/pages/Transactions.tsx`, `Recurring.tsx` — use `confirmDeleteTx`
- **Modified**: `src/modals/DetailModal.tsx` — use `confirmDeleteTx`
- **Deleted**: `src/components/RowItem.tsx`

No new signals, DB queries, or types required.

## Acceptance Criteria

- [ ] `FormField` component exists in `src/components/FormField.tsx` and is used in all 5 modal files; no raw `<div class="field">` remains in modals
- [ ] `ModalActions` component exists in `src/components/ModalActions.tsx` and is used in ExpenseModal, RecurringModal, NewCatModal, EditCatModal
- [ ] `confirmDeleteTx()` helper exists in `src/lib/txHelpers.ts` and replaces the pattern in Transactions, Recurring, DetailModal
- [ ] `src/components/RowItem.tsx` is deleted
- [ ] TypeScript builds clean (`npm run build` passes with no errors)
- [ ] No new `any`, no hardcoded colors, no new comments

## Edge Cases

- `ModalActions` calls `closeM` directly (imported from store) rather than accepting it as a prop — this is consistent with how every other cancel button in the codebase works
- `confirmDeleteTx` must be defined in a non-modal file to avoid circular deps (modals → store → modals). `src/lib/txHelpers.ts` has no such risk
- After deleting `RowItem.tsx`, run `tsc --noEmit` to confirm no import site was missed

## Open Questions

None.
