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
    i18n.ts            # S object (en/zh strings), t(), mfmt(), catLabel(), freqLabel() — label helpers that read the lang signal
  db/
    db.ts              # Dexie class — three tables: txs, cats (keyed by id), settings (keyed by key). settings stores arbitrary {key,value:unknown} rows for non-tx persisted state that can't go in localStorage (e.g. the auto-backup FileSystemDirectoryHandle). Bump version(N) when adding a table.
    queries.ts         # All DB writes; txs/cats writes end with loadAll(). settings writes update their own signals directly — do NOT call loadAll() on a settings write.
  state/
    store.ts           # All signals + computed; openM()/closeM() helpers
    recurring.ts       # Pure functions: genRecurring(), monthTxs(), allGeneratedUpToDate()
  lib/
    catHelpers.ts      # Re-exports getCat/catColor from store; allCats() wrapper
    dateHelpers.ts     # today() — signal-free date helpers (no lang/signal reads)
    exportHelpers.ts   # CSV export, JSON backup, restore from file
    txHelpers.ts       # confirmDeleteTx() — opens confirm modal then delTx
  components/          # Reusable UI: BottomNav, FAB, CatGrid, EmojiGrid, FreqGrid, ProgressBar, FormField, ModalActions, EmptyState
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
Every `txs`/`cats` mutation calls `loadAll()` at the end, which updates `txs` and `userCats` signals and fires `triggerAutoBackup()` as a fire-and-forget side effect. Writes to the `settings` table update their own signals directly — they must NOT call `loadAll()` (nothing to reload, would trigger a spurious backup).

```ts
// Pattern used everywhere in queries.ts:
export const putTx = (tx: Transaction) => db.txs.put(tx).then(loadAll)
```

### Auto-backup (File System Access API)
Feature-gated on `'showDirectoryPicker' in window` (Chrome/Edge only). A user-picked `FileSystemDirectoryHandle` is persisted in the `settings` Dexie table (key `'autoBackupHandle'`) — handles survive reload but cannot be stored in localStorage. `initAutoBackup()` runs once in `main.tsx` after `loadAll()` to rehydrate the handle into the module-level `_autoHandle` cache in `queries.ts` and re-check permission. `loadAll()` fires `triggerAutoBackup()` after every txs/cats reload, writing a dated JSON backup (`myledger-backup-YYYY-MM-DD.json`) if permission is granted. Two signals back the UI: `autoBackupFolderName` (string|null) and `needsBackupPermission` (boolean — set true when the persisted handle's permission has lapsed; re-grant requires a user gesture via `grantAutoBackupPermission()`, since `requestPermission` cannot be called from `loadAll()`).

### All pages always rendered
All five pages are mounted in `App.tsx` simultaneously. Visibility is controlled only by the `.page.active` CSS class based on `activePage` signal. This avoids unmount/remount state loss.

### Modal system
`openModal` signal holds `ModalId | null`. `Modal.tsx` renders its children inside an overlay; if `openModal.value !== id`, the overlay is hidden via CSS. `openM(id, ctx)` sets both signals; `closeM()` clears both. Modals that lead with a large category header (`DetailModal`, `CatBreakdownModal`) use the shared `<div class="row-item modal-head">` block — `.modal-head` (in `components.css`) enlarges the icon/title and drops the row border; reuse it rather than inlining the sizing.

### Recurring transactions
Templates are stored once in IndexedDB with `freq !== 'none'`. `genRecurring()` synthesizes read-only `Transaction` objects at render time for the current view month. They are never written to the DB. Generated IDs: `{templateId}_{YYYY-MM}`. `isGenerated: true` marks them as virtual.

### Category system
`CATS` (readonly array in memory) = built-in categories. `userCats` signal = user-created categories from Dexie. `allCatsList` computed merges both, with user overrides winning for matching IDs. Colors assigned by array index position in `allCatsList`.

### i18n
`t(key)` reads `S[lang.value][key]`. `catLabel(cat)` reads `cat[lang]` with fallbacks. `lang` is a signal. `mfmt(y, m)` formats month/year per locale. All strings in `src/data/i18n.ts` — no external i18n library.

### Shared month view (viewY / viewM)
`viewY` / `viewM` are global signals in `store.ts` — Home and Transactions both read them, so the selected month is shared: paging on one tab changes the other. Each page derives its list with `monthTxs(txs.value, viewY.value, viewM.value)`. The month picker UI lives in `src/components/MonthNav.tsx` — a self-contained component that reads `viewY`/`viewM` and owns the `changeMonth` logic.

### Theme
`theme` signal (`'dark' | 'light'`, in `store.ts`) is persisted to `localStorage['theme']` and mirrored to `document.documentElement[data-theme]` via an `effect()`. A pre-effect `setAttribute` at module load prevents a flash of the wrong theme. Light-mode token values live under `[data-theme="light"]` in `global.css`, overriding the `:root` (dark) defaults. This is the only `effect()` in the codebase.

## TypeScript conventions

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- All shared types in `src/types/index.ts` — prefer literal union types over enums
- `import type { ... }` for type-only imports
- Props interfaces declared inline in each file, not exported
- Preact's `ComponentChildren` for children prop; `JSX.Element` for return type of icon components

## CSS conventions

- All design tokens as CSS variables on `:root` in `global.css` (dark = default). Light theme overrides the same variable names under `[data-theme="light"]` — never add a light-mode color anywhere else.
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

Vitest is installed and configured (`vite.config.ts` `test` block, `npm test` script, `@testing-library/preact` + `happy-dom`). `src/state/recurring.test.ts` exists. Test pure functions in `state/recurring.ts` and `lib/exportHelpers.ts` first; place test files next to the source they cover.

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