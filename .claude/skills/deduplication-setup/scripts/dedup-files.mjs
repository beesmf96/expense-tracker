#!/usr/bin/env node
// Whole-repo file dedup by content hash.
// Dry-run (default): prints duplicate sets as JSON. With --apply: backs up + removes dupes.
import { unlinkSync } from 'node:fs'
import { loadConfig, parseArgs, walkRepo, rel, hashFile, sha256, mtime, backupAndLog } from './lib.mjs'
import { readFileSync } from 'node:fs'

const cfg = loadConfig()
const { apply, force } = parseArgs(process.argv)

const files = walkRepo(cfg)
const byHash = new Map()

for (const abs of files) {
  let key
  try {
    // exact and content-hash both reduce to SHA-256 of bytes here; exact == byte-identical.
    key = cfg.matchStrategy === 'exact' ? sha256(readFileSync(abs)) : hashFile(abs)
  } catch {
    continue
  }
  if (!byHash.has(key)) byHash.set(key, [])
  byHash.get(key).push(abs)
}

const sets = []
for (const [hash, group] of byHash) {
  if (group.length < 2) continue
  const ordered =
    cfg.conflictResolution === 'keep-latest'
      ? [...group].sort((a, b) => mtime(b) - mtime(a))
      : group // keep-first / merge → walk order, first survives
  const keep = ordered[0]
  const remove = ordered.slice(1)
  sets.push({ hash, keep: rel(keep), remove: remove.map(rel) })
}

const toRemove = sets.reduce((n, s) => n + s.remove.length, 0)
const summary = { detector: 'files', duplicateSets: sets.length, filesToRemove: toRemove, sets }

if (!apply) {
  console.log(JSON.stringify(summary, null, 2))
  process.exit(0)
}

if (cfg.dryRun && !force) {
  console.error('Refusing --apply while dryRun is true. Re-run with --force after user confirmation.')
  process.exit(1)
}

for (const s of sets) {
  for (const relPath of s.remove) {
    backupAndLog(cfg, 'file', relPath, { hash: s.hash, keptInstead: s.keep })
    unlinkSync(relPath)
  }
}
console.log(JSON.stringify({ ...summary, applied: true }, null, 2))
