# CLAUDE.md — MyLedger

## Running the app

```bash
npm run dev     # Vite dev server (http://localhost:5173)
npm run build   # Production build → dist/
```

Open in a browser after `npm run dev`. No backend, no auth, no env vars.

## Stack

| Layer | Tool |
|---|---|
| Framework | Preact 10 + JSX |
| State | @preact/signals (signals + computed) |
| Database | Dexie 4 (IndexedDB wrapper) |
| Build | Vite 8 + @preact/preset-vite |
| Language | TypeScript 6, strict mode |
| Styles | Plain CSS, 4 files split by concern |

## Folder structure

```
src/
  App.tsx              # Root: all pages + modals always mounted, shown via .page.active
  main.tsx             # Entry: loadAll() then render(<App />, document.body)
  types/index.ts       # All shared types — Freq, Lang, PageId, ModalId, Transaction, Category, etc.
  data/
    cats.ts            # CATS, COLORS, EMOJIS, FREQS — readonly constant arrays
    i18n.ts            # S object (en/zh strings), t(), mfmt(), catLabel()
  db/
    db.ts              # Dexie class — two tables: txs, cats (both keyed by id)
    queries.ts         # All DB writes; every write ends with loadAll()
  state/
    store.ts           # All signals + computed; openM()/closeM() helpers
    recurring.ts       # Pure functions: genRecurring(), monthTxs(), allGeneratedUpToDate()
  lib/
    catHelpers.ts      # Re-exports getCat/catColor from store; allCats() wrapper
    exportHelpers.ts   # CSV export, JSON backup, restore from file
  components/          # Reusable UI: BottomNav, FAB, CatGrid, EmojiGrid, FreqGrid, ProgressBar, RowItem, EmptyState
  pages/               # Home, Transactions, Recurring, Settings, ManageCats
  modals/              # Modal (base), ExpenseModal, RecurringModal, DetailModal, ConfirmModal, NewCatModal, EditCatModal, ReclassifyModal
  styles/
    global.css         # CSS vars (:root), reset, body background
    layout.css         # Pages, bottom nav, FAB, overlay/modal
    components.css     # Row items, cards, settings rows, badges
    forms.css          # Inputs, buttons, field labels
```

## Architecture patterns

### Signals-first state
All global state lives in `src/state/store.ts` as `signal<T>()` or `computed()`.
Local form state inside modals uses `useSignal()` (hook form, not imported from store).
No useState, no Context, no reducers.

### Write → loadAll() → re-render
Every DB mutation calls `loadAll()` at the end, which updates `txs` and `userCats` signals, which re-renders anything subscribed to those signals.

```ts
// Pattern used everywhere in queries.ts:
export const putTx = (tx: Transaction) => db.txs.put(tx).then(loadAll)
```

### All pages always rendered
All five pages are mounted in `App.tsx` simultaneously. Visibility is controlled only by the `.page.active` CSS class based on `activePage` signal. This avoids unmount/remount state loss.

### Modal system
`openModal` signal holds `ModalId | null`. `Modal.tsx` renders its children inside an overlay; if `openModal.value !== id`, the overlay is hidden via CSS. `openM(id, ctx)` sets both signals; `closeM()` clears both.

### Recurring transactions
Templates are stored once in IndexedDB with `freq !== 'none'`. `genRecurring()` synthesizes read-only `Transaction` objects at render time for the current view month. They are never written to the DB. Generated IDs: `{templateId}_{YYYY-MM}`. `isGenerated: true` marks them as virtual.

### Category system
`CATS` (readonly array in memory) = built-in categories. `userCats` signal = user-created categories from Dexie. `allCatsList` computed merges both, with user overrides winning for matching IDs. Colors assigned by array index position in `allCatsList`.

### i18n
`t(key)` reads `S[lang.value][key]`. `catLabel(cat)` reads `cat[lang]` with fallbacks. `lang` is a signal. `mfmt(y, m)` formats month/year per locale. All strings in `src/data/i18n.ts` — no external i18n library.

## TypeScript conventions

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- All shared types in `src/types/index.ts` — prefer literal union types over enums
- `import type { ... }` for type-only imports
- Props interfaces declared inline in each file, not exported
- Preact's `ComponentChildren` for children prop; `JSX.Element` for return type of icon components

## CSS conventions

- All design tokens as CSS variables on `:root` in `global.css` (dark theme, `--accent: #C8963C` gold)
- No CSS Modules, no Tailwind, no utility classes
- Class names: kebab-case, BEM-adjacent but not strict
- Inline `style` only for dynamic values derived from signals/data (e.g., `color`, `background`)
- CSS is written in dense single-line form per rule — match this style when editing

## Coding style

- No comments — names carry meaning
- Arrow functions for event handlers, always inline in JSX
- Template literals for conditional class strings: `` class={`row-item${onClick ? ' clickable' : ''}`} ``
- `async/await` for all DB operations
- Pure functions in `state/recurring.ts` and `lib/exportHelpers.ts` — no side effects, no signal reads

## Tests

None. No test framework is installed (no vitest, no jest). When tests are added, use Vitest with `@testing-library/preact`. Test pure functions in `state/recurring.ts` and `lib/exportHelpers.ts` first.

## Pipeline
When asked to implement a plan:

0. Update plan frontmatter status to `in-progress`
1. Create branch: feature/{plan-name}
2. @.claude/agents/coder.md
3. @.claude/agents/tester.md
4. @.claude/agents/linter.md
5. @.claude/agents/reflector.md
6. Commit and push
7. Open PR
8. Update plan frontmatter:
   - status: review
   - branch: feature/{plan-name}
   - pr: #{pr-number}
   - implemented: {today's date}