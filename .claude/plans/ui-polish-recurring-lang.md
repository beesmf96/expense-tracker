---
plan: ui-polish-recurring-lang
status: in-progress
branch: feature/ui-polish-recurring-lang
pr: ~
implemented: ~
---

# Feature: UI Polish — Recurring Row, Language Toggle, CSS Hex Cleanup

## What & Why

Three small UI fixes to improve consistency across the app: the language toggle shows "中文" while the other option shows "EN" — these should match conventions. The Recurring page rows still have inline Edit/Delete buttons (the old pattern from before the Records redesign in PR #6), so they need to be brought into parity. Finally, a handful of hardcoded hex color values appear in CSS outside of `:root`, bypassing the variable system.

## Scope

1. **Language toggle** (`src/pages/Settings.tsx`): Change the Chinese button label from `中文` to `ZH` so both toggles use the same two-letter uppercase convention.

2. **Recurring page rows** (`src/pages/Recurring.tsx`): Mirror the Records page layout — remove `.row-actions` (Edit + Delete buttons), remove `.amount` from inside `.row-info`, and add `<div class="amount">` as a direct child of `.row-item` after `.row-info`. Keep the existing `onClick={() => openM('detail', { detailId: tx.id })}` on the row unchanged — clicking still opens the detail modal. Remove now-unused imports (`selRCat`, `selFreq`, `confirmDeleteTx` and its `import`).

3. **CSS hex color cleanup** (`src/styles/layout.css`, `src/styles/forms.css`): Replace the two hardcoded `#0C0B0A` values (FAB text color and primary button text color) with `var(--bg)`, which already holds that value in `:root`. Note: `#fff` on `.btn-r` has no existing variable; add `--white: #fff` to `:root` in `global.css` and use `var(--white)` there.

## Out of Scope

- Changing what happens when a recurring row is clicked (modal behaviour stays the same)
- Adding new language options or changing the language switching logic
- COLORS array in `src/data/cats.ts` — those are chart/icon palette data constants, not UI tokens
- `rgba(...)` values in `.fab` box-shadows — those are one-off shadow effects, not primary colors
- `rgba(200,150,60,...)` values in `body::before` gradient — same rationale

## Technical Approach

### Settings.tsx
- Line 60: `中文` → `ZH`

### Recurring.tsx
- Remove `selRCat`, `selFreq` from the store import (line 1)
- Remove `confirmDeleteTx` import (line 5)
- Remove `import type { Freq }` (line 6) — no longer needed after removing edit dispatch
- In the row JSX: delete the `<div class="row-actions">` block entirely
- Move `<div class="amount">−{tx.amount.toFixed(2)}</div>` out of `.row-info` and place it as a sibling after `.row-info`, matching Transactions.tsx line 56
- Remove `<span class="freq-badge">` from inside `.row-info`; move it to sit between `.row-info` and `.amount` (or keep inside `.row-info` above `.row-date` — match whatever looks consistent with Records; freq-badge stays in `.row-info` per current Records pattern)

### CSS
- `src/styles/global.css` `:root`: add `--white: #fff`
- `src/styles/layout.css` `.fab`: `color:#0C0B0A` → `color:var(--bg)`
- `src/styles/forms.css` `.btn-p`: `color:#0C0B0A` → `color:var(--bg)`
- `src/styles/forms.css` `.btn-r`: `color:#fff` → `color:var(--white)`

## Acceptance Criteria

- [ ] Language toggle shows "ZH" and "EN" (both two-letter uppercase)
- [ ] Recurring rows show: icon | info (title, note, date, freq-badge) | amount — no edit/delete buttons
- [ ] Clicking a recurring row still opens the detail modal (unchanged)
- [ ] No unused imports remain in `Recurring.tsx` after removing inline actions
- [ ] `#0C0B0A` and `#fff` no longer appear outside `:root` in CSS files
- [ ] TypeScript compiles without errors (`npm run build`)

## Edge Cases

- After removing `selRCat`, `selFreq` imports from `Recurring.tsx`, verify no other usage in that file depended on them (there isn't — they were only used in the removed Edit button handler)
- `freq-badge` placement: it lives inside `.row-info` in the current Recurring layout; keep it there (matches how the Records page shows the `↻` badge inside `.row-info > .row-date`)

## Open Questions

None — scope is fully defined.
