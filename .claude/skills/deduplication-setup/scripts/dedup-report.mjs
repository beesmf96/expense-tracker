#!/usr/bin/env node
// Dry-run report generation. Runs each enabled detector (read-only), aggregates the results into a
// single markdown report at cfg.reportPath, and prints the headline "X duplicates found, Y to
// remove" to stdout. Never deletes anything.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const cfg = loadConfig()

function run(script) {
  try {
    const out = execFileSync('node', [join(here, script)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    return JSON.parse(out)
  } catch (e) {
    return { error: e.message }
  }
}

const detect = new Set(cfg.detect)
const files = detect.has('files') ? run('dedup-files.mjs') : null
const records = detect.has('records') && (cfg.records.sources || []).length ? run('dedup-records.mjs') : null
const code = detect.has('code-blocks') ? run('dedup-code.mjs') : null
const ui = detect.has('ui-components') ? run('dedup-ui.mjs') : null

let found = 0
let toRemove = 0
const lines = ['# Deduplication Report', '', `_Generated ${new Date().toISOString()}_`, '']
lines.push(`- Match strategy: \`${cfg.matchStrategy}\``)
lines.push(`- Conflict resolution: \`${cfg.conflictResolution}\``)
lines.push(`- Dry run: \`${cfg.dryRun}\``)
lines.push('')

if (files) {
  found += files.duplicateSets || 0
  toRemove += files.filesToRemove || 0
  lines.push('## Duplicate files (content hash)', '')
  if (!files.sets?.length) lines.push('_None found._', '')
  else {
    for (const s of files.sets) {
      lines.push(`- keep \`${s.keep}\``)
      for (const r of s.remove) lines.push(`  - remove \`${r}\``)
    }
    lines.push('')
  }
}

if (records) {
  found += records.files?.reduce((n, f) => n + f.duplicateSets, 0) || 0
  toRemove += records.recordsToRemove || 0
  lines.push('## Duplicate records (key fields)', '')
  lines.push(`Key fields: \`${(records.keyFields || []).join(', ') || '(whole record)'}\``, '')
  const any = records.files?.some((f) => f.duplicateSets)
  if (!any) lines.push('_None found._', '')
  else {
    for (const f of records.files) {
      if (!f.duplicateSets) continue
      lines.push(`- \`${f.source}\` — ${f.recordsToRemove} to remove across ${f.duplicateSets} set(s)`)
      for (const set of f.sets) lines.push(`  - key \`${set.key}\`: ${set.count} copies → keep 1 (ids: ${set.ids.join(', ')})`)
    }
    lines.push('')
  }
}

if (code) {
  found += code.helperCandidates || 0
  lines.push(`## Code blocks repeated >${code.repetitionThreshold ?? 3}× (helper candidates)`, '')
  lines.push('_AST-based (TypeScript compiler API); report-only — no auto-rewrite._', '')
  if (!code.blocks?.length) lines.push('_None found._', '')
  else {
    for (const b of code.blocks) {
      lines.push(`- **${b.occurrences}× · ${b.nodeSize} nodes** → propose \`${b.proposedHelper.name}\``)
      lines.push('  - signature: `' + b.proposedHelper.signature + '`')
      lines.push('  - call sites:')
      for (const cs of b.callSites) lines.push(`    - \`${cs}\``)
      lines.push('  - first occurrence:')
      lines.push('    ```ts')
      for (const l of b.snippet.split('\n')) lines.push('    ' + l)
      lines.push('    ```')
    }
    lines.push('')
  }
}

if (ui) {
  found += ui.componentCandidates || 0
  lines.push(`## JSX repeated >${ui.repetitionThreshold ?? 3}× (component candidates)`, '')
  lines.push('_AST-based JSX clustering; report-only — no auto-rewrite._', '')
  if (!ui.components?.length) lines.push('_None found._', '')
  else {
    for (const c of ui.components) {
      lines.push(`- **${c.occurrences}× · ${c.nodeSize} nodes** → propose \`<${c.proposedComponent.name} />\``)
      lines.push('  - props interface:')
      lines.push('    ```ts')
      for (const l of c.proposedComponent.propsInterface.split('\n')) lines.push('    ' + l)
      lines.push('    ```')
      lines.push('  - call sites:')
      for (const cs of c.callSites) lines.push(`    - \`${cs}\``)
    }
    lines.push('')
  }
}

lines.unshift('')
lines.unshift(`**${found} duplicates found, ${toRemove} to remove.**`)

writeFileSync(resolve(process.cwd(), cfg.reportPath), lines.join('\n'))
console.log(`${found} duplicates found, ${toRemove} to remove. Report written to ${cfg.reportPath}`)
