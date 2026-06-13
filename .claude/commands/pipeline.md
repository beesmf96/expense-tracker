---
description: Run the implementation pipeline for a plan (dynamic, verdict-gated, auto-fix loop)
argument-hint: <plan-name>
---

# Pipeline orchestrator

Run the full implementation pipeline for the plan named in `$ARGUMENTS` (the plan file is
`.claude/plans/<plan-name>.md`). You are the **orchestrator** — you do not write product code,
run tests, or review yourself. Every phase below is a **spawned `Agent` call** against the
matching `.claude/agents/*.md` definition; you read each agent's returned verdict and branch on it.

This replaces the old fixed 0→9 list with a dynamic, gated flow. The trigger is unchanged:
"run the pipeline for plan X" → `/pipeline X`.

## Verdict contract

Each reviewer's final message MUST end with a machine-readable line you parse:

- tester  → `VERDICT: pass` or `VERDICT: fail` (+ failing tests / missing coverage)
- linter  → `VERDICT: pass` or `VERDICT: fail` (+ remaining violations the coder must fix)
- security → highest severity emitted: `BLOCK` is a fail; `WARN`/`INFO`/"No security findings." pass
- coder   → `VERDICT: done` (+ one-line summary of what changed)
- reflector → advisory only; no gate

If a reviewer omits its verdict line, treat it as `fail` and re-spawn it once asking only for the verdict.

## Flow

### Gate 0 — readiness
Read `.claude/plans/<plan-name>.md`. If the **Open Questions** section has any unresolved item,
STOP and report them — do not start. (Matches coder.md: "should not proceed if any question is unanswered.")

### Phase setup
1. Set the plan frontmatter `status: in-progress`.
2. Create an isolated **worktree** for this run (`isolation: "worktree"` on the build/review agents,
   or `EnterWorktree`) on branch `feature/<plan-name>`. Keep the main checkout clean during the loop.

### Phase build
Spawn the **coder** agent (`subagent_type: coder`) with the plan path and acceptance criteria.
Wait for `VERDICT: done`.

### Phase review (parallel, round N)
Spawn **tester**, **security**, **linter** as three agents with `run_in_background: true`.
The harness re-invokes you as each finishes. Collect all three verdicts.

### Gate — dynamic auto-fix loop (cap: 3 rounds)
- All pass (tester pass, linter pass, security ≤ WARN) → go to Phase meta.
- Any fail → spawn a fresh **coder** agent with ONLY the failing reviewers' findings as input,
  then re-run ONLY the reviewers that failed. Increment the round counter.
- If round 3 still fails → STOP, leave `status: in-progress`, and report the outstanding findings.
  Do NOT land a red pipeline.

### Phase meta
Once green, spawn the **reflector** agent (advisory — it edits the agent files, never product code,
so it stays outside the fix loop and runs exactly once).

### Phase land (only reachable when green)
1. Commit and push the branch.
2. Open the PR.
3. Update plan frontmatter:
   - `status: review`
   - `branch: feature/<plan-name>`
   - `pr: '#<pr-number>'`
   - `implemented: <today's date>`
4. Report the PR URL and a one-line summary of how many fix rounds it took.

## Rules
- Never inline a phase — each is a spawned Agent call (so verdicts come back as structured tool results).
- Never reach Phase land while any reviewer verdict is fail/BLOCK.
- The reflector never gates and never enters the loop.
