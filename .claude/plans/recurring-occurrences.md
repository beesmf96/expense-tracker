---
plan: recurring-occurrences
status: review
branch: feature/recurring-occurrences
pr: #26
implemented: 2026-06-07
---

# Feature: Timed Recurring (Installments / Occurrences)

## What & Why
Users sometimes pay for something in fixed instalments — e.g. a 3-month payment plan from an online shop. Currently recurring templates repeat forever; there is no way to say "only 3 times, then stop". This feature adds an optional `occurrences` count to a recurring template so it auto-stops after N firings. The Recurring page gains two tabs: **Active** (infinite plans + not-yet-finished instalment plans) and **Done** (instalment plans whose last occurrence has passed), with a live **N / total** progress badge on limited plans.

## Scope
- Add optional `occurrences?: number` field to the `Transaction` type (template rows only).
- `genRecurring()` stops generating once `occurrences` is reached.
- New pure helpers: `countOccurrences(tpl)` and `isTemplateCompleted(tpl)` for progress and tab routing.
- `RecurringModal` gets an optional "number of times" input (blank = forever).
- Recurring page: two tabs (Active / Done), progress badge "N / total" on limited templates.
- i18n strings for all new UI labels (en + zh).

## Out of Scope
- End-date input (occurrences count is the only way to limit duration).
- Automatically deleting completed templates from IndexedDB — they persist and appear in the Done tab.
- Editing the occurrences count of an existing template (edit flow reuses the same modal; changing occurrences on edit is naturally supported by the existing edit path).
- Any change to how infinite templates (`occurrences` absent/0) behave.

## Technical Approach

### Types (`src/types/index.ts`)
- Add `occurrences?: number` to the `Transaction` interface. `undefined` means infinite (current behavior). A positive integer means "fire N times total".

### Pure logic (`src/state/recurring.ts`)
- **`genRecurring()`**: after the existing `delta % interval !== 0` guard, add:
  ```ts
  if (tpl.occurrences && Math.floor(delta / interval) >= tpl.occurrences) continue
  ```
  This stops generation once the Nth occurrence index is reached.
- **`countOccurrences(tpl, nowYear, nowMonth): number`** — returns how many times the template has fired up to and including a given month. Used by the Recurring page for the progress badge.
  ```ts
  // delta 0 = occurrence 1; delta interval = occurrence 2 …
  const idx = Math.floor(delta / interval)
  return Math.min(idx + 1, tpl.occurrences ?? Infinity)
  ```
- **`isTemplateCompleted(tpl, nowYear, nowMonth): boolean`** — true when `occurrences` is set and all occurrences have passed.
  ```ts
  if (!tpl.occurrences) return false
  return countOccurrences(tpl, nowYear, nowMonth) >= tpl.occurrences
  ```

### Modal (`src/modals/RecurringModal.tsx`)
- Add a local `useSignal<string>('')` for `occurrences` input (string, parsed on save, blank = forever).
- Render an optional number input after the existing freq selector, labelled via `t('occurrencesLabel')`.
- Placeholder: `t('occurrencesPlaceholder')` (e.g. "Forever").
- On save: `parseInt(occurrencesStr, 10)` → if NaN or ≤ 0, store `undefined`; else store the number.
- Edit-mode sync: `useTransactionForm`'s `onEditSync` callback should set `occurrences` signal from `editTx.occurrences`.
- Validation: if the parsed value is non-integer or negative, block save with a toast.

### Page (`src/pages/Recurring.tsx`)
- Add tab state: `const tab = useSignal<'active' | 'done'>('active')`.
- Split templates:
  - **active**: `tpl.occurrences` is absent/0, OR `!isTemplateCompleted(tpl, nowY, nowM)`.
  - **done**: `tpl.occurrences` is set AND `isTemplateCompleted(tpl, nowY, nowM)`.
- Render tab strip (two buttons: Active / Done) above the list.
- For any template with `occurrences` set, render a small `<span class="progress-badge">N / total</span>` badge in the row's right area, using `countOccurrences(tpl, nowY, nowM)`.
- Done tab rows remain clickable (detail modal) and deletable; no edit on done rows (or allow edit — defer to existing edit behavior, no special case needed).

### i18n (`src/data/i18n.ts`)
New keys (both `en` and `zh`):
| Key | en | zh |
|---|---|---|
| `occurrencesLabel` | `'Times'` | `'次数'` |
| `occurrencesPlaceholder` | `'Forever'` | `'永久'` |
| `recurringTabActive` | `'Active'` | `'进行中'` |
| `recurringTabDone` | `'Done'` | `'已完成'` |

### CSS (`src/styles/components.css`)
- `.progress-badge` — small inline pill, e.g. same style family as existing `.freq-badge` but distinguishable. Reuse `.freq-badge` sizing / border-radius; use `var(--accent)` color to distinguish.
- Tab strip: two `<button>` elements styled similarly to any existing segmented control pattern; or plain text tabs with an underline indicator. Inspect existing tab usage in `EmojiPicker` for a reference, but apply to the page level via a `.page-tabs` class in `layout.css`.

## Acceptance Criteria
- [ ] A new recurring template can be saved with or without an occurrences count.
- [ ] Without occurrences (blank), the template behaves exactly as before (infinite).
- [ ] With `occurrences: 3` and `freq: 'monthly'`, exactly 3 virtual transactions are generated across the correct 3 months; month 4 onwards generates nothing.
- [ ] The Recurring page shows two tabs; templates route to the correct tab based on completion status today.
- [ ] Limited templates show an "N / total" badge (e.g. "2 / 3") reflecting how many occurrences have passed as of today.
- [ ] A completed template in the Done tab shows "3 / 3".
- [ ] Editing an existing limited template (including changing occurrences) works without creating a new id.
- [ ] All new UI strings appear in both en and zh; lang toggle switches them correctly.
- [ ] Existing infinite templates are unaffected.

## Edge Cases
- `occurrences: 1` — fires once on the start month only; immediately appears in Done tab.
- Start date in the future — template is active but shows "0 / N" until that month arrives.
- View month is before the start date — `genRecurring` already handles `delta < 0` skip.
- Edit path changes `occurrences` from 3 → 5 on a template that was already "done"; it should reappear in the Active tab.
- Day clamping (e.g. Jan 31 → Feb 28) already handled by existing `genRecurring` logic; no change needed.
- Quarterly / biannual / yearly with occurrences — same formula, interval just changes.

## Open Questions
None — all design decisions resolved.
