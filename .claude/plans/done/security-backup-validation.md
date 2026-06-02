---
plan: security-backup-validation
status: review
branch: feature/security-backup-validation
pr: #17
implemented: 2026-06-02
---

# Fix: Backup Restore Validation

## What & Why
`loadBackupFile` in `src/lib/exportHelpers.ts` passes JSON-parsed data straight to `restoreBackup` with only an `Array.isArray` guard. A crafted or corrupted backup file can write records with wrong field types (e.g. `amount: "abc"`, missing `id`, unknown `freq` value) directly into IndexedDB via `db.txs.bulkPut`. Two gaps found by security audit: no version check and no per-field Transaction validation.

## Scope

- Add `data.version === 2` check in `loadBackupFile` — throw `'Unsupported backup version'` if not.
- Add per-field validation for every item in `data.txs` before calling `restoreBackup` — throw `'Invalid backup file'` on first failure.
- Fields to validate per `Transaction` (matches `src/types/index.ts`):
  - `typeof id === 'string' && id.length > 0`
  - `typeof amount === 'number' && isFinite(amount) && amount > 0`
  - `typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)`
  - `freq` is one of `'none' | 'monthly' | 'quarterly' | 'biannual' | 'yearly'`
  - `typeof category === 'string' && category.length > 0`
  - `typeof note === 'string'`
  - `typeof createdAt === 'string' && createdAt.length > 0`

## Out of Scope

- `userCats` field-level validation (lower risk: corrupted categories display wrong but don't affect financial data)
- Migrating v1 backups — unsupported versions throw, user must export a fresh backup
- UI error messages beyond the existing `alert()` in `Settings.tsx`
- CSV import validation (no CSV import path exists in this app)

## Technical Approach

### Change — `src/lib/exportHelpers.ts`

Replace the body of `loadBackupFile` with:

```ts
export async function loadBackupFile(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.version !== 2) throw new Error('Unsupported backup version')
  if (!data.txs || !Array.isArray(data.txs)) throw new Error('Invalid backup file')
  const FREQS: Freq[] = ['none', 'monthly', 'quarterly', 'biannual', 'yearly']
  for (const tx of data.txs) {
    if (
      typeof tx.id !== 'string' || !tx.id ||
      typeof tx.amount !== 'number' || !isFinite(tx.amount) || tx.amount <= 0 ||
      typeof tx.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date) ||
      !FREQS.includes(tx.freq) ||
      typeof tx.category !== 'string' || !tx.category ||
      typeof tx.note !== 'string' ||
      typeof tx.createdAt !== 'string' || !tx.createdAt
    ) throw new Error('Invalid backup file')
  }
  await restoreBackup({ txs: data.txs, userCats: data.userCats ?? [] })
}
```

The `Freq` import is already available via `src/types/index.ts`. No new files, no new signals, no UI changes.

## Acceptance Criteria
- [ ] Restoring a valid v2 backup still works end-to-end
- [ ] Restoring a file with `version: 1` throws and shows the existing alert
- [ ] Restoring a file where one tx has `amount: "abc"` throws before any DB write
- [ ] Restoring a file where one tx has an invalid date format throws before any DB write
- [ ] Restoring a file where one tx has an unknown `freq` throws before any DB write
- [ ] Tests cover each invalid-field branch in `exportHelpers.test.ts`

## Edge Cases
- A backup where `amount` is a negative number (e.g. refund) — current validation requires `> 0`. Acceptable: MyLedger only records expenses; negative amounts are not a valid domain value.
- A backup where `isGenerated: true` — `isGenerated` is optional (`boolean | undefined`), so no validation needed; it is stripped on write anyway by the real-tx save path.

## Open Questions
None. Ready to implement.
