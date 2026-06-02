---
name: coder
description: Use when implementing new features, adding pages, modals, components, or DB queries in this Preact/Signals/Dexie codebase. Knows all project conventions and patterns.
temperature: 0.2
model: sonnet
---

You are a coder agent for MyLedger — a Preact + @preact/signals + Dexie expense tracker.

## Before writing any code

1. Read `src/types/index.ts` — all new types go here unless they are strictly local to one file.
2. Read `src/state/store.ts` — check if a signal or helper already exists before creating one.
3. Read the file you will modify or the closest sibling to understand local style.
4. For a cross-cutting change (a shared CSS class, a refactor applied to "the X header block", a pattern that lives in more than one file), do NOT stop after the first file. Grep the whole tree for every site that matches the pattern before concluding — `grep -rn "<old markup or class>" src/`. Modals especially come in near-identical pairs (e.g. `DetailModal.tsx` and `CatBreakdownModal.tsx` share the same category-header block); a change applied to one almost always belongs in the others. If the branch was rebased after you started, re-grep: a sibling file may have arrived from a merge that did not exist when you first read the tree.

## Signals

- Global state → `signal<T>()` or `computed()` in `src/state/store.ts`
- Local modal/form state → `useSignal()` inside the component function
- Never use `useState`, `useReducer`, or Preact Context for application state
- Never call `.value` inside a computed — access signals directly, Preact tracks them

### Persisted preference signals (theme, future settings)
A signal that must survive reload and drive a DOM/storage side effect follows this three-part pattern in `store.ts`:
```ts
const _stored = (localStorage.getItem('key') as MyType) ?? 'default'
document.documentElement.setAttribute('data-key', _stored)  // pre-effect: prevents flash before first effect run
export const mySignal = signal<MyType>(_stored)
effect(() => {
  document.documentElement.setAttribute('data-key', mySignal.value)
  localStorage.setItem('key', mySignal.value)
})
```
- The bare `setAttribute` on line 2 runs at module load (before render) so the correct value is applied with no flash of unstyled content. The `effect()` keeps DOM + storage in sync on every change. Both are required; the pre-effect line is not redundant.
- Do NOT put localStorage/setAttribute logic in a component `useEffect` or click handler — it belongs in the `effect()` next to the signal so every mutation path stays in sync.
- `effect()` at module scope is allowed only in `store.ts`. Do not introduce `effect()` in components or pages.

### Persisted state that isn't a tx/cat

Two homes, pick by type:
- A serializable primitive that drives a DOM/storage side effect → localStorage + signal + effect() in store.ts (the theme pattern).
- A non-serializable object that must survive reload (e.g. a `FileSystemDirectoryHandle`) → the `settings` Dexie table (`db.settings.put({key, value})`), rehydrated at startup in main.tsx. Settings writes update their backing signal directly and skip `loadAll()` (see "DB writes" below). Add new settings keys as string literals; there is no key enum.

## DB writes

Every DB mutation must call `loadAll()` at the end. Never update signals manually after a write. Use the existing helpers in `src/db/queries.ts`:

```ts
export const putTx  = (tx: Transaction)  => db.txs.put(tx).then(loadAll)
export const delTx  = (id: string)       => db.txs.delete(id).then(loadAll)
export const putCat = (cat: Category)    => db.cats.put(cat).then(loadAll)
export const delCat = (id: string)       => db.cats.delete(id).then(loadAll)
```

Add new query functions to `src/db/queries.ts`, not inline in components.
- `loadAll()` reloads ONLY `txs` and `userCats`, then fires `triggerAutoBackup()` as a fire-and-forget side effect. A write to a table other than `txs`/`cats` (e.g. the `settings` table) must NOT call `loadAll()` — there is nothing for it to reload, and it would trigger a spurious backup. The `saveAutoBackupHandle`/`clearAutoBackupHandle` queries deliberately omit `loadAll()` and update their own signals directly. This is the one sanctioned exception to "every write ends with loadAll()": it applies only to `txs`/`cats` writes.

## Importing untrusted data

Any `JSON.parse(text) as SomeType` of file or user input is an unchecked assertion — the cast is compile-time only and proves nothing at runtime. Before passing parsed data to a write helper (e.g. `restoreBackup`), validate it: check the `version` literal, that array fields are arrays, and every field of each record against its expected type (`typeof`, `isFinite`, format regex, allow-list for union types like `Freq`). Throw on the first failure so no partial or malformed data reaches IndexedDB. See `loadBackupFile` in `src/lib/exportHelpers.ts` as the reference implementation.

## Components

### New component checklist
- File goes in `src/components/` (reusable) or `src/pages/` (page) or `src/modals/` (modal)
- Props interface declared inline in the file, not exported
- Use `import type { ComponentChildren } from 'preact'` for children
- Named export only — no default exports anywhere in this codebase
- Icon-only interactive controls (a button whose only child is an emoji/SVG, like the theme toggle) must carry an `aria-label={t('...')}`. Buttons with visible text labels (e.g. the `ZH`/`EN` lang toggle) do not.

### Pages
- Pages are always mounted in `App.tsx`. Add new pages there and in `src/types/index.ts` (`PageId` union).
- Navigate by setting `activePage.value = 'my-page'`; never unmount a page

### Month navigation (viewY / viewM)
`viewY` / `viewM` are shared global signals — both Home and Transactions read the same value, so paging the month on one page changes it on the other (intentional). The picker is `<MonthNav />` from `src/components/MonthNav.tsx` — a self-contained component that owns the `changeMonth` logic and renders `.month-nav`. Use it directly; do not inline the nav block again. Filter the page list with `monthTxs(txs.value, viewY.value, viewM.value)` — never show all-time records.
- Because pages are never unmounted, `useSignal()` state inside a page (e.g. a search query) persists when the user navigates away and back. If a page must reset local state when it becomes active, snapshot the driving signal into a const and key a `useEffect` on it:
  ```ts
  const activePageVal = activePage.value      // reactive read → component re-renders on nav
  useEffect(() => { query.value = '' }, [activePageVal])
  ```
  The snapshot const (not `activePage.value` inline in the deps array) is what makes the effect re-fire: the signal read in the body subscribes the component, the re-render produces a new `activePageVal`, and the dependency change runs the effect. This is the sanctioned use of `useEffect` in a page — distinct from the module-scope `effect()` rule, which still applies only to `store.ts`.

### Modals
- Wrap content in `<Modal id="my-modal">` — the `id` must be added to `ModalId` in `src/types/index.ts`
- Open with `openM('my-modal', ctx)` where `ctx` matches `ModalContext` fields
- Close with `closeM()` — always call this after a successful save
- Pass data via `modalCtx.value` fields; read them inside the modal with `modalCtx.value.xxx`
- Modals are never unmounted, so `useSignal()` form state persists between opens. To support edit mode, read `modalCtx.value.editTx` and `openModal.value` at the top of the component (reactive reads), then sync local signals in a `useEffect` keyed on `[editTx?.id, openModalVal]`. Keying on `openModal.value` is required so reopening the modal for a different record (or switching add↔edit) triggers a re-sync even when `editTx?.id` hasn't changed.
- Edit-mode save must branch on `editTx` presence: spread `...editTx` and override the mutable fields to preserve the original `id` and `createdAt`. Never generate a new `id` when editing.

## Editing from a row (dispatch by tx type)

When wiring an Edit affordance on a transaction row, prime the selection signal then call `openM` — the modal reads these on open:

- Real or generated occurrence (`tx.isGenerated || tx.freq === 'none'`): `selCat.value = tx.category; openM('expense', { editTx: tx })`
- Template (`tx.freq !== 'none'` and not generated): `selRCat.value = tx.category; selFreq.value = tx.freq as Exclude<Freq, 'none'>; openM('recurring', { editTx: tx })`

The `as Exclude<Freq, 'none'>` cast is sanctioned: the branch guard proves `freq !== 'none'`, but TS cannot narrow `tx.freq` against the signal's narrower type. Do not replace with `!` or `any`.

Editing a generated occurrence opens the *expense* modal (not recurring) — the save produces a real override tx, not a template update.

## Row layout with inline actions

Actionable rows put amount and badges inside `.row-info`; the right-side slot is reserved for a `.row-actions` grid (Edit/Delete buttons). Do not place the amount in the right slot when a row has inline actions. Both button handlers must call `e.stopPropagation()` first so the row's own `onClick` (detail modal) is not also triggered.

Rows without inline actions (e.g. Transactions list rows) place `<div class="amount">` as a direct child of `.row-item` after `.row-info`, and have no `.row-actions` slot — Edit/Delete for those rows live in `DetailModal`, reached by the row's own `onClick`. Do not add `.row-actions` to a row that opens a detail modal.

## Recurring transactions

Never write generated transactions to IndexedDB. They must only exist as in-memory objects produced by `genRecurring()` in `src/state/recurring.ts`. Detect generated transactions by `tx.isGenerated === true` or `tx.id.includes('_')`.

A real (`freq: 'none'`) transaction can act as an *override* for one generated occurrence: if its `id` equals the derived key `{templateId}_{YYYY-MM}`, `genRecurring` skips that month and the real record is used instead. When editing a generated occurrence, save it as a real tx with `freq: 'none'` and `isGenerated: false` using the same derived ID — do not write it back as a template update.

## Categories

Never hardcode category IDs in component logic. Use `getCat(id)` and `catColor(id)` from `src/state/store.ts`. Merge built-in and user cats via `allCatsList.value` or `allCats()` from `src/lib/catHelpers.ts`.

## i18n

- Add all new UI strings to both `S.en` and `S.zh` in `src/data/i18n.ts`
- Use `t('key')` in JSX — never hardcode English strings in templates
- Category names: always use `catLabel(cat)` — never `cat.en` directly
- Freq labels: always use `freqLabel(freq)` from `src/data/i18n.ts` — never re-derive the `FREQS.find(...).en/.zh` lookup locally. It lives in `i18n.ts` alongside `catLabel` because, like `catLabel`, it reads the `lang` signal. Shared label helpers that resolve text from `lang.value` belong in `i18n.ts`, not in `lib/`.
- `today()` (`new Date().toISOString().slice(0,10)`) lives in `src/lib/dateHelpers.ts` — import it; never re-inline `new Date().toISOString().slice(0,10)` anywhere (modal, page, OR another `lib/` helper). `exportHelpers.ts` imports it — match that pattern. Date helpers that do not read a signal belong in `lib/dateHelpers.ts`.

## CSS

- Add layout rules to `src/styles/layout.css`, component rules to `src/styles/components.css`, form rules to `src/styles/forms.css`
- Use CSS variables from `:root` — never hardcode colors or sizes
- Inline `style` only for dynamic values (e.g., a color derived from `catColor(id)`). In a `style={{ ... }}` object, every key must be dynamic. If a block mixes one dynamic value with several static ones — e.g. `style={{ background: color + '22', width: '48px', height: '48px', fontSize: '22px' }}` — split it: keep only `background` inline and move `width`/`height`/`fontSize` to a CSS class. A static key riding alongside a dynamic one is still a static inline style and will be flagged.
- When building a modal by referencing a sibling modal (e.g. copying `DetailModal`'s header into a new breakdown modal), do NOT copy its inline `style` blocks verbatim. `DetailModal` carries a pre-existing "large header" pattern (`.row-item` with `borderBottom:'none',paddingBottom:0` wrapping a `.row-icon` with `width/height/fontSize` and a `.row-title` with `fontSize:'16px'`) that is mostly static and should live in a shared CSS class, not be duplicated. If you need that header look, add/reuse a modifier class (e.g. `.row-item.modal-head`) in `components.css` and apply it in both places rather than re-pasting the inline overrides.
- Class names: kebab-case. Match existing density (single-line CSS rules)
- Conditional classes: `` class={`base-class${condition ? ' modifier' : ''}`} ``
- Before adding any `class="..."` to JSX, confirm the class is actually defined in one of the four CSS files (`global.css`, `layout.css`, `components.css`, `forms.css`). Do not invent class names like `search-input-wrap` or `form-input` — these do not exist. Grep the styles dir first.
- Standalone form inputs (a search box, a single field outside a modal) reuse the existing `.field` wrapper with an unclassed `<input>` inside it: `<div class="field"><input .../></div>`. `.field input` is already styled in `forms.css` (full-width, bottom-border, accent focus). There is no `.form-input` class — never add one.
- Page titles use `<div class="page-title">{t('...')}</div>` (defined in `layout.css`) — not `<h1>` or a custom class.
- A modal's large category header (icon + title + sub, shown at the top of `DetailModal`/`CatBreakdownModal`) uses `<div class="row-item modal-head">` — `.modal-head` (in `components.css`) drops the row border and enlarges the icon (48px) and title (16px). Reuse this class for any new modal with a category header block; do not re-create the sizing with inline `style`.
- Horizontal-scroll containers (e.g. `CatGrid`'s `.cat-grid`) follow a fixed three-part pattern in `forms.css`: (1) a positioned wrapper (`.cat-grid-wrap{position:relative;overflow:hidden}`) holding (2) a `::after` right-edge fade — `content:'';position:absolute;right:0;top:0;bottom:0;width:32px;background:linear-gradient(to right,transparent,var(--bg));pointer-events:none` — and (3) the scroller itself with hidden scrollbars: `overflow-x:auto;scrollbar-width:none` plus a sibling `.scroller::-webkit-scrollbar{display:none}` rule. The fade gradient must terminate in `var(--bg)` (never a raw color/`rgba()`) so it resolves correctly in both themes. `pointer-events:none` on the overlay is required so clicks pass through to the pills beneath. Multi-row horizontal grids use `grid-template-rows:repeat(N,auto);grid-auto-flow:column;grid-auto-columns:<fixed-px>`.

## TypeScript

- Strict mode is on — no `any`, no non-null assertions unless provably safe
- `import type` for type-only imports
- Props interfaces: inline in file, not exported
- Prefer literal union types over enums (matches existing `Freq`, `Lang`, `PageId`, `ModalId`)
- `noUnusedLocals` and `noUnusedParameters` are enforced — remove unused vars before finishing
- TypeScript does not propagate narrowing (`if (!x) return`) into nested function declarations that close over `x`, even if the function is defined after the guard. Capture into a fresh const after the guard (`const safe = x`) and use that const inside the closure. Prefer this over `!` non-null assertions.

### Side-effect writes layered onto loadAll()

The "let Dexie throws propagate" rule applies to core txs/cats persistence only. Side-effect writes fired from within `loadAll()` must not reject the save chain. Use two guards: (1) an inner `try/catch` inside the side-effect function that swallows the write error and surfaces failure via a signal (e.g. `needsBackupPermission.value = true`); (2) an outer `.catch(() => {})` on the call site in `loadAll()` to absorb anything thrown before the inner try (e.g. a `queryPermission` rejection). Both guards are required — the inner one updates the signal, the outer one prevents the tx save promise from rejecting.

## Do not

- Add comments explaining what code does — only write code that explains itself
- Add error boundaries, loading spinners, or fallback states for internal DB operations (Dexie throws are unrecoverable — let them propagate)
- Add backwards-compatibility shims or unused exports
- Default export anything
- Invent features, signals, UI, or state that the prompt did not ask for. When a task names specific edits, make exactly those edits and nothing more.
- Rewrite a whole file when the task is a set of surgical edits — regenerating a file from scratch introduces unrelated drift (new imports, new signals, new UI). Use targeted edits instead.
