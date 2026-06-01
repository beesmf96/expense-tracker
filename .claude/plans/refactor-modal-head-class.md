---
plan: refactor-modal-head-class
status: review
branch: feature/refactor-modal-head-class
pr: #13
implemented: 2026-06-02
---

# Refactor: Extract `.modal-head` modifier class

## What & Why
`DetailModal.tsx` and `CatBreakdownModal.tsx` both render an identical modal header block — a `.row-item` with a large category icon and title — using the same static inline styles copy-pasted between them. These static values belong in CSS, not `style` props. Extracting a `.modal-head` modifier class removes the duplication and makes the pattern reusable for any future modal that shows a category header.

## Scope
- Add three CSS rules under a new `.modal-head` block in `components.css`
- Update `DetailModal.tsx` header row: replace static inline styles with `.modal-head` class; keep only `style={{ background: color + '22' }}` (genuinely dynamic)
- Update `CatBreakdownModal.tsx` header row: same change

## Out of Scope
- Any other inline styles in these modals (e.g. the amount block's `margin`/`padding`/`background` in `DetailModal`)
- New modal functionality or UI changes
- CSS changes to any other component

## Technical Approach

### CSS (`src/styles/components.css`)
Add after the existing `.row-icon` rule:

```css
.modal-head{border-bottom:none;padding-bottom:0}
.modal-head .row-icon{width:48px;height:48px;font-size:22px}
.modal-head .row-title{font-size:16px}
```

### `src/modals/DetailModal.tsx` (lines 36–41 before change)
Before:
```tsx
<div class="row-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
  <div class="row-icon" style={{ background: color + '22', width: '48px', height: '48px', fontSize: '22px' }}>
  ...
  <div class="row-title" style={{ fontSize: '16px' }}>
```
After:
```tsx
<div class="row-item modal-head">
  <div class="row-icon" style={{ background: color + '22' }}>
  ...
  <div class="row-title">
```

### `src/modals/CatBreakdownModal.tsx` (lines 23–28 before change)
Identical change — same three lines, same replacement.

## Acceptance Criteria
- [ ] `.modal-head`, `.modal-head .row-icon`, `.modal-head .row-title` rules exist in `components.css`
- [ ] `DetailModal.tsx` header row uses `class="row-item modal-head"` with no static inline styles
- [ ] `CatBreakdownModal.tsx` header row uses `class="row-item modal-head"` with no static inline styles
- [ ] Both modals still show `style={{ background: color + '22' }}` on `.row-icon` (dynamic value stays)
- [ ] No other changes to either modal's logic or other elements
- [ ] Build passes (`npm run build`)
- [ ] Visual appearance of both modals is unchanged

## Edge Cases
- The `.row-item:last-child { border-bottom: none }` rule in `components.css` already removes the border on the last row — `.modal-head` is an independent override on the same element. Both can coexist with no conflict.

## Open Questions
None.
