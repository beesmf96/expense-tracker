---
plan: update-coder-agent-loadall-rules
status: review
branch: feature/update-coder-agent-loadall-rules
pr: #15
implemented: 2026-06-02
---

# Task: Update coder.md with loadAll() fan-out rules

## What & Why

During the auto-backup-fsapi pipeline, the reflector identified three additions needed in `.claude/agents/coder.md`. The pipeline's auto mode classifier hard-blocked those edits because `.claude/agents/` is a protected path. The rules were applied to `linter.md`, `tester.md`, and `CLAUDE.md` but not `coder.md`, leaving a gap: a future coder could (1) call `loadAll()` on a `settings` write triggering a spurious backup, (2) let a fire-and-forget side-effect error bubble up and abort a tx save, or (3) not know which home to use for non-serializable persisted state.

## Scope

Three targeted additions to `.claude/agents/coder.md`:

1. **loadAll() fan-out + settings exception** — after the existing "Add new query functions…" line under "DB writes": clarify that `loadAll()` now also fires `triggerAutoBackup()` as a side effect, and that `db.settings` writes must NOT call `loadAll()` (they update their own signals directly).

2. **Persisted state that isn't a tx/cat** — new subsection under "DB writes": two homes — localStorage + signal + effect() for serializable primitives (theme pattern); `settings` Dexie table for non-serializable objects (FileSystemDirectoryHandle pattern). Document that settings writes update their signal directly, never call `loadAll()`, and use plain string literal keys.

3. **Side-effect writes layered onto loadAll()** — new subsection under "DB writes": exception to the "let Dexie throws propagate" rule. Side-effect writes fired from `loadAll()` (e.g. auto-backup) must be fire-and-forget (try/catch, signal for failure state) so a failed backup never aborts the tx save that triggered it.

## Out of Scope

- Any changes to `linter.md`, `tester.md`, `CLAUDE.md` — those were already updated in the auto-backup-fsapi PR.
- Adding a permission rule to allow `.claude/agents/` edits in auto mode — that is a separate settings concern.
- Any code changes to the app itself.

## Technical Approach

Edit `.claude/agents/coder.md` with three targeted additions. Exact wording from the reflector's output:

### Addition 1 — after "Add new query functions to `src/db/queries.ts`, not inline in components."

```
- `loadAll()` reloads ONLY `txs` and `userCats`, then fires `triggerAutoBackup()` as a fire-and-forget side effect. A write to a table other than `txs`/`cats` (e.g. the `settings` table) must NOT call `loadAll()` — there is nothing for it to reload, and it would trigger a spurious backup. The `saveAutoBackupHandle`/`clearAutoBackupHandle` queries deliberately omit `loadAll()` and update their own signals directly. This is the one sanctioned exception to "every write ends with loadAll()": it applies only to `txs`/`cats` writes.
```

### Addition 2 — new subsection "Persisted state that isn't a tx/cat" under DB writes

```
### Persisted state that isn't a tx/cat

Two homes, pick by type:
- A serializable primitive that drives a DOM/storage side effect → localStorage + signal + effect() in store.ts (the theme pattern).
- A non-serializable object that must survive reload (e.g. a `FileSystemDirectoryHandle`) → the `settings` Dexie table (`db.settings.put({key, value})`), rehydrated at startup in main.tsx. Do NOT call `loadAll()` on a settings write; update the backing signal directly in the query function. Add new settings keys as string literals; there is no key enum.
```

### Addition 3 — new subsection or bullet in "Do not" section

```
### Side-effect writes layered onto loadAll()

The "let Dexie throws propagate" rule applies to core txs/cats persistence only. Side-effect writes fired from within `loadAll()` (e.g. the auto-backup file write via `triggerAutoBackup`) must be fire-and-forget: wrap in try/catch, swallow the error, and surface failure state via a signal instead. A failed side-effect write must never abort the tx save that triggered `loadAll()` — hence the `.catch(() => {})` on `triggerAutoBackup` in `loadAll()`.
```

## Acceptance Criteria

- [ ] All three additions are present in `.claude/agents/coder.md`
- [ ] `npm run build` still passes (no app code changes, but verify nothing regressed)
- [ ] Wording matches the reflector's output above exactly (or is improved but semantically equivalent)

## Edge Cases

- The auto mode classifier may block edits to `.claude/agents/coder.md` again. If so, the implementer must either run with elevated permissions or the user must apply the edits manually.

## Open Questions

None — content is fully specified above. Do not proceed if the classifier will block the edits; surface that to the user instead.
