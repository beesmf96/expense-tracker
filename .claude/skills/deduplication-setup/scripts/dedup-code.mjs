#!/usr/bin/env node
// AST-based repeated code-block detection (replaces the old sliding line-window).
// Parses .ts/.tsx with the TypeScript compiler API, normalizes statement subtrees (ignoring
// formatting, comments, and identifier/literal text), hashes them, and flags any normalized block
// appearing MORE THAN repetitionThreshold times. For each cluster it proposes an extracted helper
// (strict-typed TS signature) and the call sites to replace. Report-only — never rewrites code.
import {
  ts,
  sourceFilesFor,
  structuralSig,
  nodeSize,
  lineOf,
  dropContained,
  freeIdentifiers,
} from './ast.mjs'
import { loadConfig } from './lib.mjs'

const cfg = loadConfig()
const { repetitionThreshold, minNodes, include } = cfg.codeBlocks

const groups = new Map() // structural signature → occurrences

for (const { rel: relPath, sf } of sourceFilesFor(cfg, include)) {
  const visit = (node) => {
    if (ts.isStatement(node) && !ts.isBlock(node)) {
      const size = nodeSize(node)
      if (size >= minNodes) {
        const sig = structuralSig(node)
        if (!groups.has(sig)) groups.set(sig, [])
        groups.get(sig).push({
          file: relPath,
          pos: node.getStart(sf),
          end: node.getEnd(),
          startLine: lineOf(sf, node.getStart(sf)),
          endLine: lineOf(sf, node.getEnd()),
          size,
          text: node.getText(sf),
          params: freeIdentifiers(node),
        })
      }
    }
    node.forEachChild(visit)
  }
  visit(sf)
}

let clusters = []
for (const [sig, occ] of groups) {
  if (occ.length > repetitionThreshold) clusters.push({ sig, size: occ[0].size, occurrences: occ })
}
clusters = dropContained(clusters)
clusters.sort((a, b) => b.occurrences.length - a.occurrences.length)

const blocks = clusters.map((c, i) => {
  const params = [...new Set(c.occurrences.flatMap((o) => o.params))].slice(0, 8)
  const name = `extractedBlock${i + 1}`
  const signature = `function ${name}(${params.map((p) => `${p}: unknown`).join(', ')}): void`
  return {
    occurrences: c.occurrences.length,
    nodeSize: c.size,
    proposedHelper: { name, signature, note: 'Refine param/return types from the call sites before extracting.' },
    snippet: c.occurrences[0].text.split('\n').slice(0, 12).join('\n'),
    callSites: c.occurrences.map((o) => `${o.file}:${o.startLine}-${o.endLine}`),
  }
})

console.log(
  JSON.stringify(
    { detector: 'code-blocks', repetitionThreshold, minNodes, helperCandidates: blocks.length, blocks },
    null,
    2,
  ),
)
