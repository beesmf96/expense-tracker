---
plan: theme-light-dark
status: in-progress
branch: feature/theme-light-dark
pr: ~
implemented: ~
---

# Feature: Light / Dark Theme Toggle

## What & Why
MyLedger ships with an Obsidian Gold dark theme. This feature adds a Parchment Gold light theme and a toggle in Settings so users can switch between modes. The preference persists across sessions via localStorage.

## Scope
- `Theme` type (`'dark' | 'light'`) in `src/types/index.ts`
- `theme` signal in `src/state/store.ts`, initialized from `localStorage`, synced back via `effect()`
- Light-mode token overrides (`[data-theme="light"]`) in `src/styles/global.css` — Parchment Gold palette
- Override for `body::before` ambient gradient (reduced opacity on light bg)
- Override for `input[type=date]` color-scheme on light bg
- Appearance toggle row in Settings page (reuses `.lang-toggle` / `.lang-btn` pattern)
- Toggle buttons use icons instead of text: 🌙 for dark, ☀️ for light
- i18n keys: `appearance` in both `en` and `zh`; `darkTheme` / `lightTheme` repurposed as `aria-label` values only

## Out of Scope
- OS `prefers-color-scheme` auto-detection (manual toggle only)
- Per-page or per-component theme overrides
- Any accent color changes beyond the CSS token layer

## Technical Approach

### State
- `theme` signal lives in `store.ts` alongside `lang`
- `effect()` applies `data-theme` attribute to `document.documentElement` and writes to `localStorage`
- Pre-effect `setAttribute` call on init prevents flash before signals hydrate

### CSS
- All dark values remain on `:root` (default, no selector)
- Light overrides use `[data-theme="light"]` on `:root` equivalent — high specificity wins over bare element rules
- Parchment Gold palette: warm cream backgrounds (`#FAF7F2`), deeper gold accent (`#A67828`), warm near-black text (`#1A1208`)

### Settings UI
- New row inside the language `settings-card`, same `srow` + `lang-toggle` pattern
- No new CSS classes needed

## Acceptance Criteria
- [ ] Dark mode looks identical to pre-feature baseline
- [ ] Light mode renders Parchment Gold palette across all pages and modals
- [ ] Toggle in Settings switches theme immediately without page reload
- [ ] Theme preference persists after page refresh
- [ ] `input[type=date]` picker uses correct color-scheme in both modes
- [ ] Toggle buttons show 🌙 / ☀️ icons, not text
- [ ] `aria-label` set on each button using the i18n key for accessibility
- [ ] `appearance` key present in both EN and ZH

## Edge Cases
- First visit (no localStorage key): defaults to dark
- Switching theme while a modal is open: modal should re-theme without closing

## Open Questions
None — implementation is prototyped and visually verified.
