---
plan: dedupe-expense-recurring-modals
status: in-progress
branch: feature/dedupe-expense-recurring-modals
pr: ~
implemented: ~
---

# Refactor: Deduplicate ExpenseModal and RecurringModal

## What & Why

`fallow` identified 52 lines of duplicated code across 4 clone groups in `ExpenseModal.tsx` and `RecurringModal.tsx`. The two modals share identical signal initialisation, a near-identical `useEffect` sync block, identical save/reset boilerplate, and identical JSX for the amount and note fields. Extracting the shared logic into a custom hook and two small shared form-field components removes the duplication, makes future changes to shared behaviour a one-place edit, and reduces each modal by ~25 lines.

## Scope

- New hook `src/modals/useTransactionForm.ts` that encapsulates the shared form state and sync logic
- New file `src/modals/ModalFormFields.tsx` that exports `AmountField` and `NoteField` (modal-scoped field components)
- `ExpenseModal.tsx` and `RecurringModal.tsx` updated to use both

## Out of Scope

- Merging the two modals into one component — they serve different purposes and have distinct UX flows
- Changing any user-visible behaviour or styling
- Touching any other modal or component

## Technical Approach

### Hook: `src/modals/useTransactionForm.ts`

Encapsulates the four shared patterns currently duplicated verbatim across both modals:

```ts
import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { modalCtx, openModal, closeM } from '../state/store'
import { today } from '../lib/dateHelpers'
import type { Signal } from '@preact/signals'
import type { Transaction } from '../types'

export function useTransactionForm(
  catSignal: Signal<string>,
  onEditSync?: (tx: Transaction) => void
) {
  const amount = useSignal('')
  const date   = useSignal(today())
  const note   = useSignal('')

  const editTx      = modalCtx.value.editTx
  const openModalVal = openModal.value

  useEffect(() => {
    if (editTx) {
      amount.value       = editTx.amount.toString()
      date.value         = editTx.date
      note.value         = editTx.note
      catSignal.value    = editTx.category
      onEditSync?.(editTx)
    } else {
      amount.value = ''
      date.value   = today()
      note.value   = ''
    }
  }, [editTx?.id, openModalVal])

  function parseAmount(): number | null {
    const amt = parseFloat(amount.value)
    return (!amt || amt <= 0) ? null : amt
  }

  function reset() {
    amount.value = ''
    note.value   = ''
    date.value   = today()
    closeM()
  }

  return { amount, date, note, editTx, parseAmount, reset }
}
```

Key points:
- `catSignal` is typed as `Signal<string>` — both `selCat` and `selRCat` satisfy this type
- `onEditSync` is optional; `RecurringModal` passes `tx => { selFreq.value = tx.freq as Exclude<Freq, 'none'> }`
- `parseAmount()` replaces the inline guard `const amt = parseFloat(amount.value); if (!amt || amt <= 0) return`
- `reset()` replaces the four-line cleanup before every `closeM()` call
- `editTx` and `openModalVal` are reactive reads done in the component render context (the hook is called inside the component body), so both signals subscribe the component correctly

### Shared fields: `src/modals/ModalFormFields.tsx`

Two small named exports for the JSX blocks that are bit-for-bit identical in both modals:

```tsx
import type { Signal } from '@preact/signals'
import { FormField } from '../components/FormField'
import { ModalActions } from '../components/ModalActions'
import { t } from '../data/i18n'

export function AmountField({ amount }: { amount: Signal<string> }) {
  return (
    <FormField label={t('amount')}>
      <input
        class="big-input"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount.value}
        onInput={e => { amount.value = (e.target as HTMLInputElement).value }}
      />
    </FormField>
  )
}

export function NoteField({ note, onSave }: { note: Signal<string>, onSave: () => void }) {
  return (
    <>
      <FormField label={t('note')}>
        <textarea
          placeholder="Optional note"
          value={note.value}
          onInput={e => { note.value = (e.target as HTMLTextAreaElement).value }}
        />
      </FormField>
      <ModalActions onSave={onSave} />
    </>
  )
}
```

`Signal<string>` props are the appropriate choice here: both components directly read and write the signal value in their event handlers. Passing a value+onChange pair would require the caller to re-expose the setter, adding more boilerplate than it removes.

These components live in `src/modals/` (not `src/components/`) because they are modal-specific — `AmountField` uses `class="big-input"` which is a modal-form styling class, and `NoteField` couples the note textarea to `ModalActions`.

### `ExpenseModal.tsx` after refactor

```tsx
export function ExpenseModal() {
  const { amount, date, note, editTx, parseAmount, reset } = useTransactionForm(selCat)

  async function save() {
    const amt = parseAmount()
    if (!amt) return
    if (!selCat.value) return
    if (editTx) {
      await putTx({ ...editTx, amount: amt, date: date.value, note: note.value.trim(),
        category: selCat.value, freq: 'none', isGenerated: false })
    } else {
      await putTx({ id: Date.now().toString(), date: date.value, amount: amt,
        category: selCat.value, note: note.value.trim(), freq: 'none',
        createdAt: new Date().toISOString() })
    }
    reset()
  }

  return (
    <Modal id="expense">
      <div class="modal-title">{editTx ? t('editExpense') : t('addExpense')}</div>
      <AmountField amount={amount} />
      <FormField label={t('date')}>
        <input type="date" value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }} />
      </FormField>
      <FormField label={t('category')}>
        <CatGrid selectedId={selCat.value} onSelect={id => { selCat.value = id }} />
      </FormField>
      <NoteField note={note} onSave={save} />
    </Modal>
  )
}
```

### `RecurringModal.tsx` after refactor

```tsx
export function RecurringModal() {
  const { amount, date, note, editTx, parseAmount, reset } = useTransactionForm(
    selRCat,
    tx => { selFreq.value = tx.freq as Exclude<Freq, 'none'> }
  )

  async function save() {
    const amt = parseAmount()
    if (!amt) return
    if (!selRCat.value) return
    if (editTx) {
      await putTx({ ...editTx, amount: amt, date: date.value, note: note.value.trim(),
        category: selRCat.value, freq: selFreq.value })
    } else {
      await putTx({ id: Date.now().toString(), date: date.value, amount: amt,
        category: selRCat.value, note: note.value.trim(), freq: selFreq.value,
        createdAt: new Date().toISOString() })
    }
    reset()
  }

  return (
    <Modal id="recurring">
      <div class="modal-title">{editTx ? t('editRecurring') : t('addRecurring')}</div>
      <AmountField amount={amount} />
      <FormField label={t('startDate')}>
        <input type="date" value={date.value}
          onInput={e => { date.value = (e.target as HTMLInputElement).value }} />
      </FormField>
      <FormField label={t('frequency')}>
        <FreqGrid selectedFreq={selFreq.value} onSelect={f => { selFreq.value = f }} />
      </FormField>
      <FormField label={t('category')}>
        <CatGrid selectedId={selRCat.value} onSelect={id => { selRCat.value = id }} />
      </FormField>
      <NoteField note={note} onSave={save} />
    </Modal>
  )
}
```

## Acceptance Criteria

- [ ] Adding a new expense works identically to before (amount, date, category, note saved correctly)
- [ ] Editing an existing expense pre-fills all fields and saves the update with the original `id`/`createdAt`
- [ ] Editing a generated occurrence creates a real override tx with `freq: 'none'` and `isGenerated: false`
- [ ] Adding a recurring template works identically (freq saved, template written to DB)
- [ ] Editing a recurring template pre-fills all fields including frequency and saves correctly
- [ ] Opening and closing either modal multiple times in a row resets form state cleanly
- [ ] Switching from edit mode to add mode (open modal for edit, close, open for new) resets all fields
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] All existing tests pass with no change to test count

## Edge Cases

- `onEditSync` is called only inside the `if (editTx)` branch — it must not be called in the `else` (reset) branch, as `RecurringModal` uses it to set `selFreq` which already has a correct default and should not be reset by the hook
- `parseAmount()` returns `null` for `NaN`, negative, and zero — callers guard with `if (!amt) return`, which correctly rejects all three since `null` is falsy
- `NoteField` wraps both the textarea and `ModalActions` — coder must import `Fragment` (`<>`) or verify preact handles the fragment return correctly in JSX
- TypeScript: `Signal<string>` from `@preact/signals` — import the type with `import type { Signal } from '@preact/signals'`

## Open Questions

None — all clarifications resolved before planning.
