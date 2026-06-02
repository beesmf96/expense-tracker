---
plan: cat-grid-horizontal-scroll
status: in-progress
branch: feature/cat-grid-horizontal-scroll
pr: ~
implemented: ~
---

# Feature: Horizontal-Scroll Category Grid

## What & Why
The current category picker in ExpenseModal renders an nx2 vertical grid. When the user has many categories, the modal grows tall and requires significant scrolling to reach the note/save fields. This feature replaces the grid with a 5-row × n-column layout that scrolls horizontally, keeping the modal compact regardless of how many categories exist.

## Scope
- Replace the `.cat-grid` 2-column vertical layout with a 5-row horizontal-scroll grid
- Categories fill column by column (top-to-bottom, then next column)
- Container has a fixed height (5 rows) and overflows horizontally with `overflow-x: auto`
- Right-edge fade gradient (CSS `mask-image` or `::after` overlay) hints that more content exists off-screen; fade disappears when scrolled to the end
- A pinned "selected category" label is shown above the scroll grid — always visible, shows the currently selected category's emoji + name
- The ➕ Add Category pill remains the last item in the grid
- Changes are confined to `CatGrid.tsx` and `forms.css` (and `components.css` if the selected-label block needs a shared class)

## Out of Scope
- Search / filter input for categories
- Drag-to-reorder categories
- Any changes to `RecurringModal` (it has its own `CatGrid` usage — leave it unchanged for now)
- Pagination dots / page indicators
- Auto-scroll to the selected category on open

## Technical Approach

### CSS (`src/styles/forms.css`)
- `.cat-grid`: change to CSS Grid with `grid-template-rows: repeat(5, auto)` + `grid-auto-flow: column` + `grid-auto-columns: <pill-width>` + `overflow-x: auto` + fixed height. Remove `grid-template-columns: repeat(2, 1fr)`.
- Pill width: fixed (e.g. `120px`) so columns are uniform and the scroll is predictable.
- Right-fade: wrap `.cat-grid` in a `.cat-grid-wrap` container with `position:relative; overflow:hidden`. Add a `::after` pseudo-element: `position:absolute; right:0; top:0; bottom:0; width:32px; background: linear-gradient(to right, transparent, var(--bg))` with `pointer-events:none`. Use JS (scroll event) or pure CSS (`scroll-snap` + `:has` not widely supported) — simplest approach: always show fade, accept that it shows faintly when fully scrolled (low cost, high compat).
- Scrollbar: hide with `-webkit-scrollbar: none` + `scrollbar-width: none` for a clean mobile feel.

### Component (`src/components/CatGrid.tsx`)
- Add a selected-label block above the grid: reads `selectedId`, looks up the cat from `allCatsList.value`, renders `<div class="cat-sel-label"><span>{cat.emoji}</span> <span>{catLabel(cat)}</span></div>`. Falls back gracefully if `selectedId` doesn't match any cat.
- Wrap `.cat-grid` in `.cat-grid-wrap` for the fade overlay.
- No logic changes — `onSelect` and `openM('newcat')` remain the same.

### i18n
- No new string keys needed (selected label is derived from `catLabel(cat)`, not a static string).

## Acceptance Criteria
- [ ] Category grid shows at most 5 rows of pills; additional categories extend the grid to the right
- [ ] User can flick/scroll horizontally to see all categories
- [ ] A right-edge fade gradient is visible when there are off-screen categories to the right
- [ ] Selected category emoji + label is always visible above the scroll grid (pinned, not inside the scroll container)
- [ ] ➕ Add Category pill is always the last item
- [ ] Selecting a category updates the pinned label immediately
- [ ] Modal height is not affected by the number of categories (beyond the 5-row fixed height)
- [ ] Works correctly with the default built-in categories (~13 items) and with many user-added categories
- [ ] No regressions in RecurringModal (uses the same CatGrid component)
- [ ] Light and dark themes render correctly

## Edge Cases
- **Fewer than 5 categories**: grid should not have empty visual rows — use `grid-template-rows: repeat(min(count, 5), auto)` or let the grid naturally collapse; confirm it doesn't leave large blank space.
- **Exactly 5 categories**: single column, no horizontal scroll needed — fade should not appear (or appear so faint it doesn't mislead).
- **Selected category is off-screen**: pinned label above always shows it — user never loses track of their selection even without auto-scroll.
- **Very long category names**: `.clabel` already has `text-overflow: ellipsis` — confirm it still truncates correctly at fixed pill width.
- **RecurringModal**: also uses `<CatGrid>` — the new layout must not break it. Acceptance criteria includes a manual check there.

## Open Questions
None — ready for implementation.
