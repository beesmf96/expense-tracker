#!/usr/bin/env node
// Record dedup by configured key fields.
// Loads each configured source, groups records by records.keyFields, picks a survivor per
// conflictResolution, and reports the duplicates. With --apply rewrites each source without dupes
// (backing up the original file first).
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  loadConfig,
  parseArgs,
  walkRepo,
  rel,
  matchGlob,
  loadRecords,
  recordKey,
  backupAndLog,
} from './lib.mjs'

const cfg = loadConfig()
const { apply, force } = parseArgs(process.argv)
const { keyFields, idField, timestampField } = cfg.records

function resolveSources() {
  const globs = cfg.records.sources || []
  if (!globs.length) return []
  return walkRepo(cfg).filter((abs) => matchGlob(globs, rel(abs)))
}

function pickSurvivor(group) {
  if (cfg.conflictResolution === 'keep-latest' || cfg.conflictResolution === 'merge') {
    const sorted = [...group].sort(
      (a, b) => (b[timestampField] ?? 0) > (a[timestampField] ?? 0) ? 1 : -1,
    )
    if (cfg.conflictResolution === 'merge') {
      const survivor = { ...sorted[sorted.length - 1] }
      for (const rec of sorted) for (const k of Object.keys(rec)) if (rec[k] != null) survivor[k] = rec[k]
      return survivor
    }
    return sorted[0]
  }
  return group[0] // keep-first
}

const sources = resolveSources()
const fileResults = []

for (const abs of sources) {
  let loaded
  try {
    loaded = loadRecords(abs)
  } catch (e) {
    console.error(`Skipping ${rel(abs)}: ${e.message}`)
    continue
  }
  const groups = new Map()
  loaded.records.forEach((r, i) => {
    const key = keyFields.length ? recordKey(r, keyFields) : JSON.stringify(r)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ r, i })
  })

  const dupSets = []
  const survivors = []
  for (const [key, items] of groups) {
    if (items.length < 2) {
      survivors.push(items[0].r)
      continue
    }
    const survivor = pickSurvivor(items.map((x) => x.r))
    survivors.push(survivor)
    dupSets.push({
      key,
      count: items.length,
      removed: items.length - 1,
      ids: items.map((x) => x.r?.[idField] ?? `index:${x.i}`),
    })
  }

  fileResults.push({
    source: rel(abs),
    format: loaded.format,
    total: loaded.records.length,
    duplicateSets: dupSets.length,
    recordsToRemove: dupSets.reduce((n, d) => n + d.removed, 0),
    sets: dupSets,
    _survivors: survivors,
    _abs: abs,
  })
}

const toRemove = fileResults.reduce((n, f) => n + f.recordsToRemove, 0)
const summary = {
  detector: 'records',
  keyFields,
  conflictResolution: cfg.conflictResolution,
  sourcesScanned: fileResults.length,
  recordsToRemove: toRemove,
  files: fileResults.map(({ _survivors, _abs, ...rest }) => rest),
}

if (!apply) {
  console.log(JSON.stringify(summary, null, 2))
  process.exit(0)
}

if (cfg.dryRun && !force) {
  console.error('Refusing --apply while dryRun is true. Re-run with --force after user confirmation.')
  process.exit(1)
}

for (const f of fileResults) {
  if (!f.recordsToRemove) continue
  const relPath = f.source
  // back up the original source file before rewriting
  backupAndLog(cfg, 'file', relPath, { detector: 'records', recordsRemoved: f.recordsToRemove })
  const out =
    f.format === 'ndjson'
      ? f._survivors.map((r) => JSON.stringify(r)).join('\n') + '\n'
      : JSON.stringify(f._survivors, null, 2) + '\n'
  writeFileSync(resolve(process.cwd(), relPath), out)
}
console.log(JSON.stringify({ ...summary, applied: true }, null, 2))
