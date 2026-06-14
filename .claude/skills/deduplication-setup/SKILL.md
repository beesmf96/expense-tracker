---
name: deduplication-setup
description: Use when the user asks to scan the project for duplicate files, records, code, or UI components. Walks the entire repo (respecting excludes) and reports duplicate files (SHA-256 content hash), duplicate data records (configurable key fields), repeated code blocks (AST-based, proposing helper extractions), and repeated JSX (AST-based, proposing Preact component extractions). Manual trigger only; dry-run by default; never deletes without explicit confirmation.
---

# Deduplication Setup

A manually-triggered audit that builds **one whole-repo picture** and reports duplicates across
three dimensions: files, records, and code blocks. It is safe by default — it never removes
anything unless the user explicitly confirms, and every removal is backed up first.

## When to invoke

Invoke when the user asks to **scan the project for duplicate files, records, or code** — e.g.
"find duplicate files", "are there repeated records in my data", "dedupe the project", "check for
copy-pasted code blocks". This is a **manual trigger only** — never wire it into a git hook, commit
hook, or any automated flow.

## Core principles

1. **Whole-repo, not per-folder.** Always walk the entire `scanRoot` in a single pass (honoring
   `exclude`) so duplicates spanning different directories are caught. Never scan one folder at a
   time and compare locally — that misses cross-directory duplicates, which are the common case.
2. **Dry-run first, always.** The default config is `dryRun: true`. Report what *would* be removed.
   Only perform deletions after the user has seen the report and explicitly confirms.
3. **Back up before removing.** Every removed file/record is copied (with its original relative
   path) into `backupDir` and logged, so any action is reversible.
4. **Manual only.** No hooks, no automation, no scheduled runs.

## Configuration — `dedup.config.json`

Lives in the project root and is committed. The skill reads it on every run. If it is missing,
create it from the example below before scanning.

```json
{
  "scanRoot": ".",
  "exclude": ["node_modules", ".git", "dist", "build", ".dedup-backups"],
  "detect": ["files", "records", "code-blocks", "ui-components"],
  "dryRun": true,
  "backupDir": "./.dedup-backups",
  "reportPath": "./.dedup-report.md",
  "matchStrategy": "content-hash",
  "conflictResolution": "keep-first",
  "records": {
    "_comment": "Auto-populated from the Dexie schema (src/db/db.ts). VERIFY before --apply.",
    "sources": ["txs", "cats", "settings"],
    "keyFields": ["id"],
    "idField": "id",
    "timestampField": "createdAt"
  },
  "codeBlocks": { "repetitionThreshold": 3, "minNodes": 12, "include": ["**/*.ts", "**/*.tsx"] },
  "uiComponents": { "repetitionThreshold": 3, "minNodes": 4, "include": ["**/*.tsx"] }
}
```

| Key | Meaning |
|---|---|
| `scanRoot` | Root the walk starts from. |
| `exclude` | Directory/file names skipped anywhere in the tree. |
| `detect` | Which detectors to run: any of `files`, `records`, `code-blocks`, `ui-components`. |
| `dryRun` | When `true` (default) nothing is deleted — report only. |
| `backupDir` | Where removed items are copied/logged before deletion. |
| `reportPath` | Markdown summary output path. |
| `matchStrategy` | `exact` \| `content-hash` \| `fuzzy` (files/records; AST detectors are structural). |
| `conflictResolution` | `keep-first` \| `keep-latest` \| `merge` (see below). |
| `records.sources` | Glob(s) of JSON / JSON-array / NDJSON files holding records (auto-seeded with Dexie table names — repoint at your exported backup files). |
| `records.keyFields` | Field names that define record identity (a duplicate = same values across all key fields). |
| `records.idField` / `records.timestampField` | Used by `keep-latest` / `merge` to pick or combine survivors. |
| `codeBlocks.repetitionThreshold` | Flag a normalized code block appearing **more than** this many times (default 3). |
| `codeBlocks.minNodes` | Minimum AST node count for a statement to be considered (filters trivial repeats). |
| `codeBlocks.include` | Globs of TS/TSX files parsed for repeated blocks. |
| `uiComponents.repetitionThreshold` | Flag a normalized JSX subtree appearing **more than** this many times (default 3). |
| `uiComponents.minNodes` | Minimum AST node count for a JSX subtree to be considered. |
| `uiComponents.include` | Globs of TSX files parsed for repeated JSX. |

### Match strategy

- **`exact`** — byte-identical only (used for files; fastest path).
- **`content-hash`** — SHA-256 of file contents (default). Catches identical content under
  different names/paths.
- **`fuzzy`** — near-duplicate detection for records (normalized field comparison).

The **code-blocks** and **ui-components** detectors are always structural (AST-based) regardless of
`matchStrategy`: they parse with the TypeScript compiler API and normalize subtrees — ignoring
formatting, comments, and identifier/literal text — so whitespace- or rename-only variants of the
same logic hash identically. This replaces the old line-window approach, which missed reformatted
clones and over-flagged trivial line runs.

### Conflict resolution

When a duplicate set is found, which copy survives:

- **`keep-first`** (default) — keep the first occurrence in walk order; flag the rest.
- **`keep-latest`** — keep the one with the newest `timestampField` (records) or mtime (files).
- **`merge`** — for records, shallow-merge non-key fields into the survivor (later non-null values
  win); for files this falls back to `keep-latest`.

## Workflow

Run from the project root.

1. **Read config.** Load `dedup.config.json`. If absent, write the example above and tell the user.
2. **Scan files** (if `files` in `detect`):
   ```bash
   node .claude/skills/deduplication-setup/scripts/dedup-files.mjs
   ```
   Walks the whole repo, groups by content hash, prints duplicate sets as JSON.
3. **Scan records** (if `records` in `detect` and `records.sources` is non-empty):
   ```bash
   node .claude/skills/deduplication-setup/scripts/dedup-records.mjs
   ```
   Loads each source, groups by `keyFields`, applies `conflictResolution` to pick survivors.
4. **Scan code blocks** (if `code-blocks` in `detect`) — **report-only**:
   ```bash
   node .claude/skills/deduplication-setup/scripts/dedup-code.mjs
   ```
   AST-based: parses TS/TSX, normalizes statement subtrees, and flags any block appearing more than
   `repetitionThreshold` times — proposing an extracted helper (strict-typed TS signature) and the
   call sites to replace. Never rewrites code.
5. **Scan UI components** (if `ui-components` in `detect`) — **report-only**:
   ```bash
   node .claude/skills/deduplication-setup/scripts/dedup-ui.mjs
   ```
   AST-based: parses TSX, finds repeated JSX subtrees (varying props/children become parameters), and
   flags patterns appearing more than `repetitionThreshold` times — proposing an extracted Preact
   component (name + props interface) and the call sites to replace. Never rewrites JSX.
6. **Generate the report:**
   ```bash
   node .claude/skills/deduplication-setup/scripts/dedup-report.mjs
   ```
   Re-runs every enabled detector and aggregates them into `reportPath`, with the headline
   **"X duplicates found, Y to remove"** plus per-section detail (including the two AST sections,
   "Code blocks repeated >3× (helper candidates)" and "JSX repeated >3× (component candidates)").
   This step is always read-only.
7. **Present the report** to the user and stop. Do **not** delete anything yet.
8. **On explicit confirmation only**, re-run a removable detector with `--apply` (files and records
   only — code and ui are report-only and ignore `--apply`):
   - copies each item slated for removal into `backupDir` preserving its relative path,
   - appends an entry to `backupDir/removal-log.jsonl`,
   - then removes the duplicate (files unlinked; records rewritten without the dupes).
   `--apply` is refused while `dryRun` is `true` unless the user also passes `--force`, which the
   skill should only add after the user has explicitly confirmed deletion.

## Safety checklist (enforce every run)

- [ ] Manual invocation — never from a hook.
- [ ] Default to dry-run; produce the report before proposing any deletion.
- [ ] Get explicit user confirmation naming what will be removed before `--apply`.
- [ ] Every removed item backed up to `backupDir` and logged to `removal-log.jsonl`.
- [ ] Summary written to `reportPath` ("X duplicates found, Y to remove").

## Usage

Exact commands, run from the project root:

```bash
# Full read-only report — runs every enabled detector, writes reportPath, prints the headline
node .claude/skills/deduplication-setup/scripts/dedup-report.mjs

# Individual detectors (all dry-run / read-only by default; emit JSON to stdout)
node .claude/skills/deduplication-setup/scripts/dedup-files.mjs       # duplicate files
node .claude/skills/deduplication-setup/scripts/dedup-records.mjs     # duplicate records
node .claude/skills/deduplication-setup/scripts/dedup-code.mjs        # repeated code blocks (report-only)
node .claude/skills/deduplication-setup/scripts/dedup-ui.mjs          # repeated JSX (report-only)

# Deletion — only files and records support it, and only after the user has confirmed:
node .claude/skills/deduplication-setup/scripts/dedup-files.mjs --apply --force
node .claude/skills/deduplication-setup/scripts/dedup-records.mjs --apply --force
```

`--apply`/`--force` semantics:

- Without `--apply` a detector is **read-only** and just prints findings.
- `--apply` performs deletion, but is **refused while `dryRun: true`** unless `--force` is also
  passed. Only add `--force` after the user has explicitly confirmed what will be removed.
- **`dedup-code.mjs` and `dedup-ui.mjs` are report-only** — they have no removal mode and ignore
  `--apply`/`--force` (proposed extractions are for a human to apply).
- Every `--apply` removal is copied to `backupDir` (preserving relative path) and appended to
  `backupDir/removal-log.jsonl` before the original is touched.

## Helper scripts

All live in `scripts/` and read `dedup.config.json` from the project root. They are Node ESM
(`.mjs`). Files/records/report are dependency-free; the two AST detectors use the `typescript`
package (already a project dependency, TS 6) — the single allowed dependency for AST work.

- `scripts/dedup-files.mjs` — whole-repo file dedup by content hash. (supports `--apply`)
- `scripts/dedup-records.mjs` — record dedup by configured key fields. (supports `--apply`)
- `scripts/dedup-code.mjs` — AST-based repeated code-block detection → helper candidates. (report-only)
- `scripts/dedup-ui.mjs` — AST-based repeated JSX detection → Preact component candidates. (report-only)
- `scripts/dedup-report.mjs` — aggregates all detector output into the markdown report. (read-only)
- `scripts/ast.mjs` — shared TypeScript-compiler-API helpers (parse, structural hash, containment
  filter, free-identifier extraction) for the two AST detectors.
- `scripts/lib.mjs` — shared config loading, repo walk, backup, and hashing helpers.

Each detector prints machine-readable JSON to stdout; `dedup-report.mjs` re-runs them and formats the
result. Pass `--apply` (plus `--force` if `dryRun` is true and the user confirmed) to a *removable*
detector (files/records) to actually remove duplicates.
