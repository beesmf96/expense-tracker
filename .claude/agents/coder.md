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

## DB writes

Every DB mutation must call `loadAll()` at the end. Never update signals manually after a write. Use the existing helpers in `src/db/queries.ts`:

```ts
export const putTx  = (tx: Transaction)  => db.txs.put(tx).then(loadAll)
export const delTx  = (id: string)       => db.txs.delete(id).then(loadAll)
export const putCat = (cat: Category)    => db.cats.put(cat).then(loadAll)
export const delCat = (id: string)       => db.cats.delete(id).then(loadAll)
```

Add new query functions to `src/db/queries.ts`, not inline in components.

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

## CSS

- Add layout rules to `src/styles/layout.css`, component rules to `src/styles/components.css`, form rules to `src/styles/forms.css`
- Use CSS variables from `:root` — never hardcode colors or sizes
- Inline `style` only for dynamic values (e.g., a color derived from `catColor(id)`)
- Class names: kebab-case. Match existing density (single-line CSS rules)
- Conditional classes: `` class={`base-class${condition ? ' modifier' : ''}`} ``
- Before adding any `class="..."` to JSX, confirm the class is actually defined in one of the four CSS files (`global.css`, `layout.css`, `components.css`, `forms.css`). Do not invent class names like `search-input-wrap` or `form-input` — these do not exist. Grep the styles dir first.
- Standalone form inputs (a search box, a single field outside a modal) reuse the existing `.field` wrapper with an unclassed `<input>` inside it: `<div class="field"><input .../></div>`. `.field input` is already styled in `forms.css` (full-width, bottom-border, accent focus). There is no `.form-input` class — never add one.
- Page titles use `<div class="page-title">{t('...')}</div>` (defined in `layout.css`) — not `<h1>` or a custom class.

## TypeScript

- Strict mode is on — no `any`, no non-null assertions unless provably safe
- `import type` for type-only imports
- Props interfaces: inline in file, not exported
- Prefer literal union types over enums (matches existing `Freq`, `Lang`, `PageId`, `ModalId`)
- `noUnusedLocals` and `noUnusedParameters` are enforced — remove unused vars before finishing
- TypeScript does not propagate narrowing (`if (!x) return`) into nested function declarations that close over `x`, even if the function is defined after the guard. Capture into a fresh const after the guard (`const safe = x`) and use that const inside the closure. Prefer this over `!` non-null assertions.

## Do not

- Add comments explaining what code does — only write code that explains itself
- Add error boundaries, loading spinners, or fallback states for internal DB operations (Dexie throws are unrecoverable — let them propagate)
- Add backwards-compatibility shims or unused exports
- Default export anything
- Invent features, signals, UI, or state that the prompt did not ask for. When a task names specific edits, make exactly those edits and nothing more.
- Rewrite a whole file when the task is a set of surgical edits — regenerating a file from scratch introduces unrelated drift (new imports, new signals, new UI). Use targeted edits instead.
