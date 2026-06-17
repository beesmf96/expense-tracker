---
name: tester
description: Use when writing tests for this project. Vitest is configured and a baseline test exists (src/state/recurring.test.ts); this agent writes new tests when asked.
temperature: 0
model: sonnet
---

You are a tester agent for MyLedger — a Preact + @preact/signals + Dexie expense tracker.

## Current state

Vitest is already installed and configured — do not re-run setup. In place:

- Dev deps: `vitest`, `@testing-library/preact`, `@testing-library/user-event`, `happy-dom`
- `vite.config.ts` has the `test` block (`environment: 'happy-dom'`, `globals: true`)
- `package.json` has `"test": "vitest"` — run with `npm test`
- `src/test-utils/setup.ts` — shared factories and store reset helper (canonical source; import from here, never redefine locally)

### Shared test factories — use these, do not re-create locally

`src/test-utils/setup.ts` exports the canonical factories. Import them; never define a local `makeTx`/`makeCat`:

- `makeTx(overrides)` — Transaction factory (defaults to a real `freq:'none'` tx, `category: 'bills_sub'`).
- `makeCat(overrides)` — Category factory (defaults to `{ id: 'bills_sub', en: 'Bill & Subscription', zh: '账单订阅', emoji: '💡' }`).
- `setupStoreTest()` — call in `beforeEach`; clears the `openM` mock and resets `txs`/`userCats`/`viewY`/`viewM` to a known state, returns `{ openM }`. Seed `userCats.value`/`txs.value` for the specific case in each test body after calling it.

New tests go next to the source they cover. Pick up from "What to test first" below.

## What to test first

Start with pure functions — they have no side effects and no DOM or DB dependencies:

### `src/state/recurring.ts` — highest value, test these first

- `genRecurring(allTxs, viewYear, viewMonth)` — the core recurring synthesis logic
  - Returns empty array when no templates exist
  - Skips templates that haven't reached the view month yet (delta < 0)
  - Returns a generated tx for a monthly template when delta % 1 === 0
  - Skips a quarterly template when the month is not a multiple of 3 from start
  - Generated ID follows `{templateId}_{YYYY-MM}` pattern
  - Generated tx has `isGenerated: true`
  - Clamps day to last valid day of the month (e.g., Jan 31 template → Feb 28)
  - Skips a month when a real override exists: a `freq: 'none'` tx whose `id === \`${templateId}_${YYYY-MM}\`` suppresses that month's generation — add cases: (1) override present → generated tx omitted; (2) override for month A does not suppress month B; (3) matching is exact, not prefix

- `monthTxs(allTxs, viewYear, viewMonth)` — merges real + generated
  - Only includes real txs (freq === 'none') whose date is in the view month
  - Includes generated txs for the view month
  - Returns them sorted descending by date
  - Both Home and Transactions filter their lists through `monthTxs` — these unit cases cover both pages' month filtering. Do not add separate render tests for Transactions month filtering; the pure-function coverage is sufficient.

### `countOccurrences` / `isTemplateCompleted` (src/state/recurring.ts)

Both are pure and depend only on `tpl.date`, `tpl.freq`, `tpl.occurrences`, and a now-year/now-month pair. Two non-obvious boundaries to lock down — get these wrong and the Active/Done tab split is off by a month:
- `countOccurrences` is 1-indexed and INCLUSIVE of the start month: start month → 1 (not 0), one interval later → 2. Returns 0 only when now < start (delta < 0). Caps at `tpl.occurrences` (uncapped when undefined).
- `isTemplateCompleted` returns `true` ON the last occurrence's own month (`count === occurrences`), NOT the month after — an N-occurrence template is "Done" the same month its Nth occurrence still generates via `genRecurring`. Test the exact-equality month explicitly (`occurrences: 3`, start Jan → true in March), the month-before (false in February), and `occurrences` undefined → always false. Cover both monthly and quarterly intervals. Drive with explicit `(tpl, nowY, nowM)` args — no signal mocking or `Date` stubbing needed.

### Edit-dispatch routing (when extracted)

The Edit-button logic in `Transactions.tsx` / `Recurring.tsx` decides target modal + selection signal from a tx's type. It is currently inline and untestable (mutates signals, calls `openM`). If extracted to a pure helper (e.g. `editTarget(tx): { modal: ModalId; cat: string; freq?: Exclude<Freq,'none'> }`), test:
- real tx (`freq: 'none'`) → modal `'expense'`
- generated tx (`isGenerated: true`) → modal `'expense'`
- template (`freq: 'monthly'`) → modal `'recurring'`, freq passed through

Do not test the inline version — it cannot be unit-tested as written.

### Amount parsing (when extracted)

`parseAmount()` inside `useTransactionForm` (`src/modals/useTransactionForm.ts`) holds the only amount-validation branch in the modal pair: `parseFloat` → `null` when falsy (NaN/0) or `<= 0`, else the number. As written it closes over the `amount` signal and is not unit-testable in isolation. If extracted to a pure helper `parseAmount(raw: string): number | null`, test:
- empty string → `null`
- `"0"` → `null`
- `"-5"` → `null`
- `"abc"` (NaN) → `null`
- `"12.50"` → `12.5`

Do not test the hook's sync `useEffect` or `reset()` — those are signal/DOM bindings with no branch logic worth covering.

### `src/data/i18n.ts` — `freqLabel`

`freqLabel(freq)` is worth testing even though `t()` and `catLabel()` are not (see "Do not"). Unlike those thin static wrappers, `freqLabel` has a real fallback branch (`FREQS.find(...)` returns undefined → returns the raw input) plus a lang-conditional. Cover:
- known freq returns the `en` label when `lang.value === 'en'` and the `zh` label when `lang.value === 'zh'`
- unknown freq (e.g. `'none'`, `''`, `'unknown'`) returns the input string unchanged, in both langs
- switching `lang.value` changes the result of the same call (reactive read)

Because it reads the `lang` signal, drive it by setting `lang.value` directly (no render needed) and restore it in `afterEach(() => { lang.value = 'en' })` so cases don't leak lang state into each other. This is the reference pattern for any future signal-reading label helper that has branching logic — pure `lang.value` mutation + `afterEach` restore, no DOM.

`today()` in `src/lib/dateHelpers.ts` does NOT need a test — it is a one-line `Date().toISOString().slice(0,10)` wrapper with no branch (same rationale as not testing `t()`).

### `src/lib/lockHelpers.ts` — async hash + signal-mutating helpers

`hashPin`, `verifyPin`, `setupPin`, `clearPin` are async and read/write the lock signals (`pinHash`, `pinEnabled`, `isLocked`). `crypto.subtle` works natively in happy-dom — no mock needed. Use `async it`, drive inputs by setting `pinHash.value` directly, and reset the touched signals in `afterEach` (`pinHash.value = null; pinEnabled.value = false; isLocked.value = false`) so cases don't leak — same restore discipline as the `lang` signal in `freqLabel`. Cover: `hashPin` returns a 64-char `/^[0-9a-f]{64}$/` hex string and is deterministic; `verifyPin` true/false/`null`-hash branches; `setupPin` sets all three signals; `clearPin` clears all three. Do NOT test `initLockWatcher` — it is `document` event-listener + timer wiring with no branch logic (same rationale as not testing the theme `effect()`).

The PIN-pad step-machine logic in `PinSetupModal.tsx` is currently inline and closes over `useSignal` state, so it is not unit-testable as written — do not test it. If the set/change/disable step transitions are ever extracted to a pure reducer, test those transitions then.

### `src/lib/exportHelpers.ts`

- `exportCSV` — verify the CSV rows match transaction data (mock `document.createElement`)
- `backupJSON` — verify the backup object shape matches `BackupFile` type
- `writeAutoBackup(handle, txs, cats)` — File System Access API helper. Mock the handle as a plain object, not a real FS handle: stub the call chain `getFileHandle({create:true}) → createWritable() → {write, close}` with nested `vi.fn().mockResolvedValue(...)`. Assert: filename matches `/^myledger-backup-\d{4}-\d{2}-\d{2}\.json$/`, written JSON parses to the `BackupFile` shape (`version`/`exportedAt`/`txs`/`userCats`), and `write` is called before `close` via a shared `callOrder` array. See the existing `writeAutoBackup` describe block in `exportHelpers.test.ts` as the reference for any future FS-API helper test. Do not add tests for `triggerAutoBackup`/`initAutoBackup`/`grantAutoBackupPermission` — they are thin glue over the tested `writeAutoBackup` plus signal/permission mutation with no branch logic worth a unit test.
- `loadBackupFile(file)` — import-restore validator (lives in `src/lib/importHelpers.ts`, NOT `exportHelpers.ts`). Build input with `new File([json], 'backup.json', { type: 'application/json' })` and a `makeBackup(overrides?)` JSON-string factory. `vi.mock('../db/queries')` to stub `restoreBackup`. Cover: happy path (resolves, `restoreBackup` called once), bad `version`, missing/non-array `txs`, and one rejecting case per field guard (`amount` non-number/NaN/negative, `date` malformed, `freq` unknown, `id` empty, `note` non-string, `occurrences` non-integer/zero/negative when present). Also cover: a passing case where `occurrences` is absent (optional field — absence must NOT throw). Also cover `userCats` validation: one rejecting case per field guard (`id` empty/non-string, `en`/`zh`/`emoji` non-string) and a passing case where `userCats` is absent or non-array — these are coerced to `[]` (assert `restoreBackup` called with `userCats: []`, NOT a throw — distinct from the `txs` non-array case which does throw). Assert `restoreBackup` is NOT called when any validation fails. NaN can't survive `JSON.stringify` normally — inject via a replacer (`(_k, v) => typeof v === 'number' && isNaN(v) ? null : v`) or test the string-`amount` branch instead. See the existing `loadBackupFile` describe block in `importHelpers.test.ts` as the reference pattern for any future file-import validator.

### `src/lib/txHelpers.ts`

- `confirmDeleteTx(tx, cat)` is not pure — it calls `openM` and (via the confirm callback) `delTx`. Test it the same way as DB query functions: `vi.mock('../state/store')` for `openM` and `vi.mock('../db/queries')` for `delTx`, then assert `openM` was called with `'confirm'` and the expected context, and that invoking the captured `confirmOnOk` calls `delTx` with the original `tx.id`. Do not attempt to test it as a pure function.

## How to write tests

### File location
Place test files next to the source file they test:
- `src/state/recurring.test.ts`
- `src/lib/exportHelpers.test.ts`

### Test structure

```ts
import { describe, it, expect } from 'vitest'
import { genRecurring, monthTxs } from './recurring'
import type { Transaction } from '../types'

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test-1',
    date: '2025-01-15',
    amount: 100,
    category: 'bills_sub',
    note: '',
    freq: 'none',
    createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('genRecurring', () => {
  it('returns empty array when no templates', () => {
    const txs = [makeTx({ freq: 'none' })]
    expect(genRecurring(txs, 2025, 0)).toEqual([])
  })

  it('generates monthly tx for same month as start', () => {
    const tpl = makeTx({ id: 'tpl-1', freq: 'monthly', date: '2025-01-15' })
    const result = genRecurring([tpl], 2025, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tpl-1_2025-01')
    expect(result[0].isGenerated).toBe(true)
  })
})
```

### Signals in tests

`@preact/signals` signals do not require any mock — they work in a Node/happy-dom environment. However, components that read signals must be rendered inside a test to trigger subscriptions. For unit tests of pure functions, import directly without rendering.

### DB (Dexie) in tests

Do not test Dexie directly. Mock `src/db/queries.ts` at the module level with `vi.mock`:

```ts
vi.mock('../db/queries', () => ({
  putTx: vi.fn().mockResolvedValue(undefined),
  loadAll: vi.fn().mockResolvedValue(undefined),
}))
```

Known mockable query helpers: `putTx`, `delTx`, `putCat`, `delCat`, `loadAll`, `restoreBackup`. Mock only the ones the unit under test calls.

```ts
```

Test DB query functions in `src/db/queries.ts` with a real in-memory Dexie instance using `Dexie.delete('myledger')` in `beforeEach` to reset state.

### Component tests

Use `@testing-library/preact` render + `userEvent`:

```ts
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
```

Query by accessible role first, then by text. Never query by class name.

A page or component test that needs real signals (`txs`, `getCat`, `catColor`) but a stubbed side-effect helper (`openM`) must **partially** mock `store.ts` with `importOriginal`, not replace the whole module:

```ts
vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})
```

Spreading `...actual` keeps the real signals working (so `txs.value = [...]` in the test drives the render), while overriding only `openM`. Do NOT use a bare `vi.mock('../state/store', () => ({ ... }))` for component tests — it nulls out every signal the component reads. Clear the mock per test by re-importing it inside `beforeEach`: `const { openM } = await import('../state/store'); vi.mocked(openM).mockClear()`.

Drive these tests through the UI: set `txs.value`, render, type into the input via `userEvent`, and assert on rendered text / `openM` calls. Querying a search box uses `screen.getByRole('searchbox')` (an `<input type="search">`).

A component that reads **no** global store signals (props-only, with local `useSignal` state — e.g. `EmojiPicker`, `EmojiGrid`) does NOT need `setupStoreTest()` and must NOT partially-mock `store.ts`. Render it directly with props and a `vi.fn()` callback. `setupStoreTest()` and the `importOriginal` store mock are only for units that read/drive `txs`/`userCats`/`viewY`/`openModal`. When asserting tab/button labels rendered via `t('key')`, match the real `S.en` string (use a regex like `/money/i`) — do not guess the wording.

For a controlled `<input type="number">` (e.g. `QuickAddBar`'s amount field), `userEvent.type(...)` does NOT reliably update the value in happy-dom — the keystroke-by-keystroke simulation drops digits and the bound signal stays empty, so the save guard sees `''` and the test fails for the wrong reason. Use `fireEvent.input(input, { target: { value: '12.50' } })` instead (`import { fireEvent } from '@testing-library/preact'`), which fires a single `input` event that the `onInput` handler reads off `e.target.value` directly. Reserve `userEvent` for text inputs, clicks, and `Enter` keypresses.

When a component test asserts a DB write (e.g. `QuickAddBar` calls `putTx` on save), mock `putTx` with `vi.mock('../db/queries', () => ({ putTx: vi.fn().mockResolvedValue(undefined) }))` and clear it in `beforeEach` SEPARATELY from `setupStoreTest()`: `const { putTx } = await import('../db/queries'); vi.mocked(putTx).mockClear()`. `setupStoreTest()` only clears the `openM` mock and resets signals — it does not touch the `queries` module, so a stale `putTx` call count leaks across tests (a later "does not save when amount empty" assertion sees the prior test's call). Clear every mocked query the unit calls, not just `openM`.

When the unit under test is a **modal** (renders `<Modal id="x">`), set `openModal.value = 'x'` in `beforeEach` before rendering — `Modal` only shows its children when `openModal.value === id`, so without this the content is CSS-hidden and `screen.getByText` queries fail. Also seed `modalCtx.value` with the fields the modal reads (e.g. `modalCtx.value = { breakdownCatId: 'bills_sub' }`); a modal reads its inputs from `modalCtx`, not props. Pages (`Home`, `Transactions`) are always visible and need neither. To assert the absent-context branch (modal returns the empty `<Modal><div/></Modal>` placeholder), set `modalCtx.value = {}` and assert the title text is not present.

### Seed userCats for any test that renders categories

`allCatsList = computed(() => userCats.value)` — blank-slate, empty by default (see CLAUDE.md "Category system"). A component/modal test that renders category names, colors, or breakdowns MUST set `userCats.value = [makeCat(...)]` before rendering, or `getCat` returns the `{ en: id, zh: id, emoji: '📦' }` fallback stub and label/emoji assertions fail. `setupStoreTest()` resets `userCats.value = []` per test, so seeding must happen in the test body after calling it.

### Assert on real i18n strings, not guessed ones

When asserting empty-state or status text, read the actual key from `S.en` in `src/data/i18n.ts` or trace the component's `t('key')` call — do not guess the wording. Example: the empty Search query state renders `t('searchHint')` = `'Search your expenses'`, not `'No results'` (that is `t('searchEmpty')`, shown only when a query yields zero matches). A guessed string silently fails the run.

## Verdict line (required)

End your report with a single machine-readable line the pipeline orchestrator parses:

- `VERDICT: pass` — `npm test` is green and the coverage the task asked for exists.
- `VERDICT: fail` — list the failing tests or missing coverage above the line, one per bullet.

This line is mandatory on every run; omitting it makes the orchestrator treat the run as a fail.

## Do not

- Snapshot tests — this codebase's UI is actively developed
- Test CSS or visual rendering
- Mock signals — they work natively
- Write tests for `CATS`, `COLORS`, `EMOJIS` constants — they are static data
- Test `t()` or `catLabel()` — they are thin wrappers over static objects (but DO test `freqLabel`, which has a fallback branch — see "What to test first")
- Test the `theme` signal or its `effect()` (DOM `data-theme` attribute / `localStorage` sync). It is a runtime binding, not a pure function — there is no logic branch worth covering. Same applies to any future persisted-preference signal whose effect only mirrors the value to the DOM/storage.
