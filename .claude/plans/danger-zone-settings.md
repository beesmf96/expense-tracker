---
plan: danger-zone-settings
status: in-progress
branch: feature/danger-zone-settings
pr: ~
implemented: ~
---

# Feature: Danger Zone in Settings

## What & Why
Add a collapsible "Danger Zone" section to the Settings page that the user must explicitly toggle open before the destructive "Clear All Data" action is visible. This prevents accidental taps on the most destructive operation in the app.

## Scope
- Replace the existing standalone "Clear All Data" card in Settings with a "Danger Zone" section header + toggle chevron
- When collapsed (default), only the section header is visible
- When expanded, the "Clear All Data" row appears below the header
- The header uses a red/danger color treatment to signal destructiveness
- Local `useSignal(false)` tracks open/closed state — no store changes
- Add `dangerZone` i18n key to both `S.en` and `S.zh`
- Add CSS for the danger zone card variant

## Out of Scope
- Any new modal (the existing `confirm` modal flow is unchanged)
- Persisting the danger zone open/closed state across sessions
- Adding more items to the danger zone beyond "Clear All Data"
- Animation/transition on expand (keep it simple)

## Technical Approach

### Frontend

**`src/pages/Settings.tsx`**
- Import `useSignal` from `@preact/signals`
- Add `const dangerOpen = useSignal(false)` local signal
- Replace the last `settings-card` div (lines 64–74) with:
  ```tsx
  <div class={`settings-card danger-zone-card`}>
    <div class="srow" onClick={() => { dangerOpen.value = !dangerOpen.value }}>
      <span class="srow-left" style={{ color: 'var(--r)' }}>⚠️ {t('dangerZone')}</span>
      <span style={{ color: 'var(--r)', fontSize: '14px', transform: dangerOpen.value ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>›</span>
    </div>
    {dangerOpen.value && (
      <div class="srow" onClick={() => openM('confirm', {
        confirmIcon: '🗑️',
        confirmTitle: t('confirmClear'),
        confirmMsg: 'This will permanently delete all transactions and categories.',
        confirmOkLabel: t('clearAll'),
        confirmOnOk: () => clearAll(),
      })}>
        <span class="srow-left" style={{ color: 'var(--r)' }}>🗑️ {t('clearAll')}</span>
      </div>
    )}
  </div>
  ```

**`src/data/i18n.ts`**
- Add `dangerZone: 'Danger Zone'` to `S.en`
- Add `dangerZone: '危险区域'` to `S.zh`

**`src/styles/components.css`**
- Add `.danger-zone-card` rule: red-tinted border to visually distinguish it
  ```css
  .danger-zone-card{border-color:rgba(200,100,100,.25)}
  ```

## Acceptance Criteria
- [ ] Danger Zone section header is always visible in Settings, with a chevron indicator
- [ ] Clicking the header toggles the section open/closed
- [ ] When closed, "Clear All Data" is not visible
- [ ] When open, "Clear All Data" row appears and tapping it opens the existing confirm modal
- [ ] Confirm modal flow (confirm → clearAll()) is unchanged
- [ ] Danger zone card has a red-tinted border to signal danger
- [ ] `dangerZone` key renders correctly in both EN and ZH
- [ ] TypeScript strict mode passes — no `any`, no unused vars

## Edge Cases
- Chevron rotation uses inline `transform` (dynamic value from signal) — valid use of inline style per CSS conventions
- The danger zone starts closed on every page visit (local signal, not persisted) — this is intentional

## Open Questions
None.
