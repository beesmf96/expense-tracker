---
description: Run fallow to surface refactoring targets, dead code, and duplication (standalone — not part of the pipeline)
argument-hint: "[area or 'fix']"
---

# Refactor check (fallow)

A standalone, occasional health pass over the codebase — run it every so often, **not** on every
pipeline run. It surfaces complexity hotspots ("Refactoring targets"), unused exports/files, and
copy-paste duplication so they can be cleaned up deliberately.

## Run

```bash
npx --yes fallow
```

That runs dead-code + dupes + health together. The summary line reports the refactoring targets,
e.g. `2 refactoring targets — start with src/pages/Settings.tsx (complexity)`.

Useful focused variants:
- `npx --yes fallow health` — just complexity / maintainability / hotspots (the refactoring targets)
- `npx --yes fallow dead-code` — unused exports & files, dependency cycles
- `npx --yes fallow dupes` — duplication clone groups
- `npx --yes fallow dead-code --trace <file>:<export>` — confirm before deleting an "unused" export

## What to do with the output

1. Run `npx --yes fallow` and read the summary.
2. Report the **refactoring targets** count and the named hotspots, the **unused exports/files**, and
   the top **duplication** clone groups (file:line pairs).
3. Do **not** auto-delete or auto-refactor. For each finding, give a short recommendation. Before
   proposing to remove any "unused" export, verify with `fallow dead-code --trace` (the blank-slate
   category system and signal-based wiring mean some exports look unused but are intentional —
   e.g. private seed lists).
4. If `$ARGUMENTS` is `fix`, you may run `npx --yes fallow fix` (auto-fixes only *safe* unused-code
   findings) and then report exactly what it changed for review. Otherwise leave the tree untouched.

## Notes
- This is intentionally outside `/pipeline` — it is a periodic cleanup tool, not a per-change gate.
- Findings are advisory; nothing here blocks a commit.
