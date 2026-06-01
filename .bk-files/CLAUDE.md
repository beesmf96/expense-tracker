# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

Open `index.html` directly in a browser — no build step, no server, no dependencies.

## Architecture

Single-file SPA (`index.html`) with all HTML, CSS, and JS inline. No framework, no bundler.

**Storage**: IndexedDB database named `myledger` (version 2) with two object stores:
- `txs` — all transactions (both one-off and recurring templates)
- `cats` — user-created categories only (built-in `CATS` array lives in memory)

**Global state** (module-level `let` vars):
- `db`, `txs`, `userCats` — loaded from IndexedDB on init
- `viewY`, `viewM` — which month the home page is displaying
- `selCat`, `selRCat`, `selFreq`, `selEmoji` — transient modal selection state
- `lang` — `'en'` or `'zh'`

**Recurring transaction pattern**: Recurring entries are stored once as a template with a `freq` field (`'monthly'|'quarterly'|'biannual'|'yearly'`). `genRecurring()` synthesizes virtual read-only transaction objects for the current view month at render time — these are never written to IndexedDB. Generated IDs follow the pattern `{templateId}_{YYYY-MM}`. `monthTxs()` merges real + generated transactions.

**Category system**: Built-in categories live in the `CATS` array (mutated in place for edits). User categories live in IndexedDB `cats` store and `userCats`. `allCats()` merges both. `COLORS` array is indexed by position in `allCats()` for consistent color assignment.

**i18n**: All UI strings live in the `S` object (`S.en` / `S.zh`). `t(key)` resolves to `S[lang][key]`. Category labels use `catLabel(c)` which reads `c[lang]` with fallbacks.

**Pages vs modals**: Pages (`page-home`, `page-transactions`, etc.) are shown/hidden via `.active` class through `showPage()`. Modals (`.overlay`) are shown/hidden via `openM(id)` / `closeM(id)` which toggle `.open` class. `renderActive()` re-renders whichever page is currently visible.

**Data flow**: All writes go through `dbPut()` / `dbDel()` → `loadAll()` → re-render. `loadAll()` reloads both `txs` and `userCats` from IndexedDB and sorts `txs` descending by date.
