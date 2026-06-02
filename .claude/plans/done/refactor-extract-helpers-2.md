---
plan: refactor-extract-helpers-2
status: review
branch: feature/refactor-extract-helpers-2
pr: #11
implemented: 2026-06-01
---

# Feature: Extract duplicated helper functions — `today()` and `freqLabel()`

## What & Why

Two pure helper functions are defined identically in two files each. Any bug fix or
behaviour change requires editing both copies. Extracting them to their canonical homes
(`dateHelpers.ts` for the date utility, `i18n.ts` for the i18n formatter) removes the
duplication and aligns with the codebase's existing `catLabel()` pattern.

## Scope

### Extract `today()` to `src/lib/dateHelpers.ts`

Defined identically in:
- `src/modals/ExpenseModal.tsx` (line 11–13, called 3× in the file)
- `src/modals/RecurringModal.tsx` (line 13–15, called 3× in the file)

```ts
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
```

New file: `src/lib/dateHelpers.ts`
Remove the local definition from both modal files; import `today` from there instead.

---

### Extract `freqLabel()` to `src/data/i18n.ts`

Defined with logically identical bodies in:
- `src/pages/Recurring.tsx` (line 18–21, called once)
- `src/modals/DetailModal.tsx` (line 20–23, called once)

```ts
export function freqLabel(freq: string): string {
  const f = FREQS.find(x => x.value === freq)
  return f ? (lang.value === 'zh' ? f.zh : f.en) : freq
}
```

Home: `src/data/i18n.ts` — same file as `catLabel()`, same shape (reads `lang` signal,
returns a localized string). Requires adding `import { FREQS } from './cats'` to `i18n.ts`.
Remove the local definition from both files; import `freqLabel` from `../data/i18n` instead.

## Out of Scope

- Row-item JSX pattern across Transactions/Recurring/Search/Home — inner content varies
  too much per page to extract without complex slot props (same reasoning as previous plan)
- Hardcoded `"Optional note"` placeholder in ExpenseModal and RecurringModal — this is
  an i18n fix that requires adding new `S.en`/`S.zh` keys; out of scope for this refactor
- `ManageCats` back-navigation header — unique to one page, not a duplicate

## Technical Approach

### Frontend

Files changed:
- **New**: `src/lib/dateHelpers.ts` — exports `today()`
- **Modified**: `src/modals/ExpenseModal.tsx` — remove local `today()`, import from `dateHelpers`
- **Modified**: `src/modals/RecurringModal.tsx` — remove local `today()`, import from `dateHelpers`
- **Modified**: `src/data/i18n.ts` — add `import { FREQS } from './cats'`, export `freqLabel()`
- **Modified**: `src/pages/Recurring.tsx` — remove local `freqLabel()`, import from `i18n`
- **Modified**: `src/modals/DetailModal.tsx` — remove local `freqLabel()`, import from `i18n`

No new signals, DB queries, or types required.

## Acceptance Criteria

- [ ] `src/lib/dateHelpers.ts` exists and exports `today(): string`
- [ ] No local `today()` definition remains in `ExpenseModal.tsx` or `RecurringModal.tsx`
- [ ] `freqLabel()` is exported from `src/data/i18n.ts`
- [ ] No local `freqLabel()` definition remains in `Recurring.tsx` or `DetailModal.tsx`
- [ ] `npm run build` passes with no TypeScript errors
- [ ] No new `any`, no hardcoded colours, no new comments

## Edge Cases

- `freqLabel` in `Recurring.tsx` has a two-line guard form; `DetailModal.tsx` uses a
  ternary. Both are equivalent — use the ternary form in `i18n.ts` (matches `catLabel`
  style). The two-line variant in `Recurring.tsx` was the only divergence; removing it
  is safe.
- `dateHelpers.ts` is intentionally small — one function. Do not pad it or merge it
  into `txHelpers.ts`; `today()` is not transaction-specific.

## Open Questions

None.
