---
plan: search-tab
status: review
branch: feature/search-tab
pr: '#9'
implemented: '2026-06-01'
---

# Feature: Global Search Tab

## What & Why
Users occasionally need to find a specific transaction across all time — a note they remember, a category they want to verify. The Records tab only shows the current view month, making cross-month lookup impossible without manual browsing. A dedicated Search tab lets users find any transaction instantly by note text or category name.

## Scope
- New Search tab in the bottom nav (5th tab)
- Search input at the top of the page
- Results filtered in real-time from real transactions only (`freq === 'none'`) by note and category name
- Result rows use the same layout as Records rows, with full date visible
- Tapping a result opens `DetailModal`

## Out of Scope
- Searching by amount or date range
- Navigating to the record's month in Records on tap
- Filtering/sorting search results
- Persistent search history (deferred — may add later)

## Technical Approach

### State
- Add `'search'` to `PageId` union in `src/types/index.ts`
- No new signals needed — search query is local form state (`useSignal('')`) inside the Search page
- Results derived inline from `txs.value` + `genRecurring()` filtered by query

### New files
- `src/pages/Search.tsx` — search input + result list

### Modified files
- `src/types/index.ts` — add `'search'` to `PageId`
- `src/App.tsx` — mount `<Search />`, add to bottom nav
- `src/data/i18n.ts` — add strings: `searchPlaceholder`, `searchEmpty`, `search` (tab label) for both `en` and `zh`
- `src/styles/components.css` — result row date styling if needed

### Result row layout
- Same `.row-item` structure as Records rows
- Show: category color dot + name, note, amount, **full date** (YYYY-MM-DD)
- Tap → `openM('detail', { tx })` (same as Records)

### Search logic
- Filter `txs.value` where `freq === 'none'` (real txs only)
- Match if `tx.note` contains query (case-insensitive) OR `catLabel(getCat(tx.category))` contains query (case-insensitive)
- Empty query → show no results

## Acceptance Criteria
- [ ] Search tab appears in bottom nav with correct icon and label (EN/ZH)
- [ ] Typing in the search input filters results in real-time
- [ ] Results match on note text (case-insensitive)
- [ ] Results match on category name (case-insensitive, respects current lang)
- [ ] Each result row shows full date, category, note, and amount
- [ ] Tapping a result opens `DetailModal`
- [ ] Empty state shown when no results match
- [ ] Search input clears when navigating away and back to the Search tab

## Edge Cases
- Empty query: show empty state or no results (not all transactions — avoids a wall of data)
- Very long note or category name: text should truncate, not break layout
- Search real txs only (`freq === 'none'`); recurring templates do not appear in results
