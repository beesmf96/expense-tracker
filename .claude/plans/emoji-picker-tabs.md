---
plan: emoji-picker-tabs
status: in-progress
branch: feature/emoji-picker-tabs
pr: ~
implemented: ~
---

# Feature: Categorized Emoji Picker with Tabs

## What & Why

The current emoji picker in `NewCatModal` and `EditCatModal` shows a flat grid of 48 hardcoded emojis. Users creating custom categories often can't find a fitting icon because the selection is too narrow. This replaces the flat grid with a tabbed picker grouped by theme — giving ~150 curated emojis organized into 8 browsable categories without adding any external dependencies.

## Scope

- 8 emoji groups: Bills & Money, Food & Drink, Transport, Home, Shopping, Health, Entertainment, Other
- ~150–160 total emojis across all groups (no duplicates)
- Horizontal-scrollable tab strip above the grid — clicking a tab swaps the emoji grid below
- Active tab persists only for the duration of the modal open (resets on next open)
- Used in both `NewCatModal` and `EditCatModal`
- Full i18n tab labels (en + zh)

## Out of Scope

- Emoji search / text filter
- Recently used / favourites tracking
- Skin tone variants
- Any external emoji library or JSON dataset
- Changes to how the selected emoji is stored (still a plain string on `Category.emoji`)

## Technical Approach

### Data layer — `src/data/cats.ts`

Replace the flat `EMOJIS` array with a structured `EMOJI_GROUPS` constant:

```ts
export type EmojiGroupKey = 'money' | 'food' | 'transport' | 'home' | 'shopping' | 'health' | 'entertainment' | 'other'

export const EMOJI_GROUPS: readonly { key: EmojiGroupKey; emojis: readonly string[] }[] = [
  { key: 'money',         emojis: ['💰','💳','🏦','💵','💸','🏧','💹','📈','🧾','🪙','💎','🤑'] },
  { key: 'food',          emojis: ['🍕','🍔','🍽️','☕','🥤','🍜','🥐','🍣','🍱','🧃','🍺','🧋','🥗','🍰','🛒'] },
  { key: 'transport',     emojis: ['🚗','🚌','✈️','🚂','🛵','🚲','🛣️','⛽','🅿️','🚕','🏍️','🛳️','🚁','🚦'] },
  { key: 'home',          emojis: ['🏠','💡','🔌','🛁','🧹','🌿','🏗️','🪴','🧺','🛋️','🪟','🔑','🏡','🧰'] },
  { key: 'shopping',      emojis: ['🛍️','👗','💄','👠','💅','💍','🕶️','🎒','👟','🧴','🪥','🧸','🎀','👔'] },
  { key: 'health',        emojis: ['💊','🏥','🧠','💪','🦷','🩺','🧴','🩹','🏋️','🧘','🩻','🫀','🌡️'] },
  { key: 'entertainment', emojis: ['🎬','🎮','📱','🎵','🎨','🎪','🏆','🎯','📚','💻','🎭','🎤','🎸','🎲'] },
  { key: 'other',         emojis: ['✨','🎓','🎁','🐾','🌈','⭐','🎉','🤝','🌍','📦','🔔','🗓️','📷','🏖️','🚀'] },
]
```

Keep the existing `EMOJIS` flat array as-is to avoid breaking any future test that imports it. `EmojiGrid` will stop importing `EMOJIS` directly.

### Frontend

**`src/components/EmojiGrid.tsx`** — add an `emojis` prop so the grid renders any slice, rather than being hardcoded to the `EMOJIS` import:

```ts
interface Props {
  emojis: readonly string[]
  selectedEmoji: string
  onSelect: (emoji: string) => void
}
```

**`src/components/EmojiPicker.tsx`** — new wrapper component:
- Renders a tab strip (`.emoji-tabs`) + `<EmojiGrid>` filtered to the active group
- Active tab is `useSignal<EmojiGroupKey>('money')` — local form state, resets per component instance (not a global signal)
- Tab labels read from `src/data/i18n.ts` via `t('emojiGroup_money')` etc.
- Tab strip uses the same `.cat-grid-wrap` horizontal-scroll + right-fade pattern as `CatGrid`

**`src/modals/NewCatModal.tsx`** and **`src/modals/EditCatModal.tsx`** — replace `<EmojiGrid ... />` with `<EmojiPicker ... />`. Props surface stays identical (`selectedEmoji` + `onSelect`).

**`src/data/i18n.ts`** — add tab label keys to both `S.en` and `S.zh`:

```ts
emojiGroup_money:         { en: 'Money',   zh: '金融' }
emojiGroup_food:          { en: 'Food',    zh: '餐饮' }
emojiGroup_transport:     { en: 'Travel',  zh: '出行' }
emojiGroup_home:          { en: 'Home',    zh: '家居' }
emojiGroup_shopping:      { en: 'Shop',    zh: '购物' }
emojiGroup_health:        { en: 'Health',  zh: '健康' }
emojiGroup_entertainment: { en: 'Fun',     zh: '娱乐' }
emojiGroup_other:         { en: 'Other',   zh: '其他' }
```

**`src/styles/forms.css`** — add `.emoji-tabs` strip styles (horizontal scroll + pill buttons, reuse `.cat-grid-wrap` fade pattern). `.emoji-grid` height stays unchanged.

### CSS layout

```
┌──────────────────────────────────────────────┐
│ [Money][Food][Travel][Home][Shop]...  →fade  │  .emoji-tabs (scrollable pill strip)
│──────────────────────────────────────────────│
│  💰  💳  🏦  💵  💸  🏧  💹  📈             │
│  🧾  🪙  💎  🤑                              │  .emoji-grid (unchanged layout)
└──────────────────────────────────────────────┘
```

## Acceptance Criteria

- [ ] `NewCatModal` shows a tab strip with 8 group labels above the emoji grid
- [ ] `EditCatModal` shows the same tab strip
- [ ] Clicking a tab swaps the emoji grid to show only emojis in that group
- [ ] The active tab is visually distinguished (`.active` modifier class)
- [ ] Tab strip scrolls horizontally on narrow screens without clipping
- [ ] Right-edge fade appears on the tab strip (same as `CatGrid`)
- [ ] A previously-selected emoji stays highlighted when switching tabs (the selection is per-category, not per-tab)
- [ ] Opening the modal always starts on the first tab (`money`)
- [ ] Tab labels are translated in both EN and ZH
- [ ] `npm run build` passes with no TypeScript errors

## Edge Cases

- An emoji that exists in a group the user is not currently viewing is still shown as selected if the user switches to that group — the `selectedEmoji` prop drives highlighting regardless of active tab.
- `EmojiGrid` must still render correctly when passed an empty array (edge case: a group with 0 emojis would show nothing — acceptable; all groups have ≥ 10 emojis by design).
- Keeping `EMOJIS` flat array in `cats.ts` ensures no existing import breaks during the transition; it can be removed in a follow-up cleanup once no test references it.

## Open Questions

None — ready to implement.
