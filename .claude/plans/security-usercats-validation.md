---
plan: security-usercats-validation
status: in-progress
branch: feature/security-usercats-validation
pr: ~
implemented: ~
---

# Fix: Validate userCats Before Restore

## What & Why
`loadBackupFile` validates every `Transaction` field before calling `restoreBackup`, but passes `data.userCats` through with only a `?? []` fallback. A crafted backup with malformed `Category` items (missing `id`, wrong types) can write garbage directly to Dexie's `cats` table. Found by the first full security audit on main.

## Scope

Add a validation loop over `data.userCats` in `loadBackupFile` before `restoreBackup` is called. Fields to validate per `Category` (matches `src/types/index.ts`):
- `typeof id === 'string' && id.length > 0`
- `typeof en === 'string'`
- `typeof zh === 'string'`
- `typeof emoji === 'string'`

`label` is optional (`label?: string`) — skip it.

## Out of Scope

- Validating `exportedAt` on `BackupFile` (not consumed by any read path)
- Length-capping strings (no defined max length in the domain)
- UI error message changes

## Technical Approach

### Change — `src/lib/exportHelpers.ts`

After the `txs` validation loop and before `restoreBackup`, add:

```ts
const validatedCats = (data.userCats ?? [])
for (const cat of validatedCats) {
  if (
    typeof cat.id !== 'string' || !cat.id ||
    typeof cat.en !== 'string' ||
    typeof cat.zh !== 'string' ||
    typeof cat.emoji !== 'string'
  ) throw new Error('Invalid backup file')
}
await restoreBackup({ txs: data.txs, userCats: validatedCats })
```

No new imports needed. No other files change.

## Acceptance Criteria
- [ ] Restoring a valid backup still works end-to-end
- [ ] Restoring a file where one userCat has `id: null` throws before any DB write
- [ ] Restoring a file where one userCat has `emoji: 123` throws before any DB write
- [ ] `restoreBackup` is NOT called when userCats validation fails
- [ ] Tests cover each invalid-field branch

## Edge Cases
- `data.userCats` absent entirely — `?? []` produces empty array, loop runs zero iterations, restore proceeds. Valid (built-in-only setups produce no userCats).

## Open Questions
None. Ready to implement.
