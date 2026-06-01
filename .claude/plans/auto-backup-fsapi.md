---
plan: auto-backup-fsapi
status: review
branch: feature/auto-backup-fsapi
pr: #14
implemented: 2026-06-02
---

# Feature: Auto Backup via File System Access API

## What & Why

Users currently must remember to manually tap "Backup JSON" in Settings. If they forget, a browser data clear or device wipe loses everything. This feature lets the user pick a local folder once; the app then silently writes a dated JSON backup file there after every data change — producing a real, restorable file on disk with zero ongoing effort.

The backup format is the existing `BackupFile` type (version 2), which `loadBackupFile` and `restoreBackup` already understand, so no restore-path changes are needed.

## Scope

- New Settings card: pick a backup folder, see current folder name, grant access if permission lapsed, clear the folder
- Auto-write `myledger-backup-YYYY-MM-DD.json` to that folder after every `loadAll()` call (i.e., after every DB write and on app start)
- Silent fail if permission has not been re-granted in the current session; Settings shows a "Grant access" prompt instead
- Chrome/Edge only (Firefox lacks the API); the Settings row is hidden on unsupported browsers

## Out of Scope

- Google Drive or any remote backup
- Keeping multiple dated files or a rolling window (same-day file is overwritten)
- Backup on a timer — every write is enough
- Restore from the auto-backup folder (user still uses the existing "Restore JSON" flow)
- Firefox fallback

## Technical Approach

### DB schema (`src/db/db.ts`)

Add a `settings` table (version 3) for generic key-value storage. The `FileSystemDirectoryHandle` is structured-cloneable and can be stored directly in IndexedDB.

```ts
this.version(3).stores({ txs: 'id', cats: 'id', settings: 'key' })
```

Add `settings!: Table<{ key: string; value: unknown }>` to the class.

### New signals (`src/state/store.ts`)

```ts
export const autoBackupFolderName = signal<string | null>(null)
export const needsBackupPermission = signal(false)
```

No localStorage persistence — these are derived from the DB handle on each session.

### DB helpers (`src/db/queries.ts`)

Add a module-level cache to avoid querying IndexedDB on every `loadAll()`:

```ts
let _autoHandle: FileSystemDirectoryHandle | null = null
```

New functions:
- `initAutoBackup()` — called once from `main.tsx`; loads the handle, sets `autoBackupFolderName`, checks `queryPermission()`, sets `needsBackupPermission`
- `saveAutoBackupHandle(handle)` — stores handle, updates `_autoHandle` + signal
- `clearAutoBackupHandle()` — deletes setting, clears handle + signals
- `triggerAutoBackup(txsList, catsList)` — internal; checks `_autoHandle`, queries permission, calls `writeAutoBackup` on success

Modify `loadAll()` to call `triggerAutoBackup(loadedTxs, loadedCats).catch(() => {})` at the end (fire-and-forget).

### Backup writer (`src/lib/exportHelpers.ts`)

New function (reuses existing `BackupFile` shape):

```ts
export async function writeAutoBackup(
  handle: FileSystemDirectoryHandle,
  txsList: Transaction[],
  userCats: Category[]
): Promise<void>
```

Writes `myledger-backup-YYYY-MM-DD.json` using `handle.getFileHandle(name, { create: true })` → `createWritable()` → `write(json)` → `close()`.

### Entry point (`src/main.tsx`)

After the existing `loadAll()` call, add `initAutoBackup()`:

```ts
await loadAll()
await initAutoBackup()
```

### i18n (`src/data/i18n.ts`)

New keys (both `en` and `zh`):

| key | en | zh |
|---|---|---|
| `autoBackup` | `Auto Backup` | `自动备份` |
| `folderNotSet` | `Not configured` | `未配置` |
| `pickFolder` | `Pick folder` | `选择文件夹` |
| `grantAccess` | `Grant access` | `授权访问` |
| `clearFolder` | `Clear` | `清除` |

### Settings UI (`src/pages/Settings.tsx`)

Add a new `settings-card` between the existing backup card and the language/appearance card. Only rendered when `'showDirectoryPicker' in window` (feature-detect).

```
┌──────────────────────────────────────┐
│ 📂 Auto Backup   [folder name / Not configured] │
│  [Pick folder]   [Grant access?]  [Clear]       │
└──────────────────────────────────────┘
```

- The top row shows `autoBackupFolderName.value ?? t('folderNotSet')`
- "Pick folder" button: calls `showDirectoryPicker()` → `saveAutoBackupHandle(handle)` → immediately calls `writeAutoBackup` for the first backup
- "Grant access" button: shown when `needsBackupPermission.value === true`; calls `_autoHandle.requestPermission({ mode: 'readwrite' })`, on success sets `needsBackupPermission.value = false` and triggers a backup
- "Clear" button: shown when a folder is set; calls `clearAutoBackupHandle()`
- All three action buttons are inside the card (not `.srow` click targets) — use small inline buttons or a secondary `.srow` with right-side buttons

Use `useSignal` for a local `permError` string to surface unexpected failures inline rather than `alert()`.

## Acceptance Criteria

- [ ] Picking a folder writes the first backup immediately and shows the folder name in Settings
- [ ] Adding a transaction triggers a new backup file write (same-day file overwritten, visible in the OS folder)
- [ ] Closing and reopening the browser tab shows the folder name in Settings (handle survived the session)
- [ ] After a new browser session, the "Grant access" button appears; clicking it re-enables auto-backup
- [ ] Clearing the folder removes the handle; no further auto-backups fire
- [ ] The backup JSON can be restored via the existing "Restore JSON" flow (Settings → Restore)
- [ ] The auto-backup card does not appear on Firefox (feature-detect hides it)
- [ ] No TypeScript errors; `npm run build` passes

## Edge Cases

- **Permission lapses between writes**: `triggerAutoBackup` calls `queryPermission()` before writing; if not `'granted'`, sets `needsBackupPermission = true` and returns — no error thrown
- **Folder deleted from disk**: `createWritable()` throws; catch silently, set `needsBackupPermission = true` as a proxy indicator
- **Multiple rapid writes**: `loadAll()` is called after each DB write; if two writes happen within the same second, the second write simply overwrites the same file — safe, no race condition because `writeAutoBackup` is async and the second call starts after the first resolves (IndexedDB writes are sequential via `loadAll`)
- **First-time pick cancelled**: `showDirectoryPicker()` throws `AbortError`; catch it and do nothing
- **`settings` table missing on existing installs**: Dexie version migration handles this automatically via the new `version(3).stores()` call — existing `txs` and `cats` data is preserved

## Open Questions

None — ready to implement.
