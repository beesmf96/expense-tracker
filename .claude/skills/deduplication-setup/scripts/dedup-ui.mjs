#!/usr/bin/env node
// UI-component detector. Parses .tsx with the TypeScript compiler API, finds repeated JSX subtrees
// normalized so that varying props/children become parameters (attribute values, JSX text, and
// expression contents are ignored; tag names and attribute names are kept). Flags JSX patterns
// appearing MORE THAN repetitionThreshold times and proposes an extracted Preact component —
// component name, props interface, and the call sites to replace. Report-only — never rewrites JSX.
import { ts, sourceFilesFor, nodeSize, lineOf, dropContained } from './ast.mjs'
import { loadConfig } from './lib.mjs'

const cfg = loadConfig()
const { repetitionThreshold, minNodes, include } = cfg.uiComponents

const tagName = (el) => {
  const open = ts.isJsxSelfClosingElement(el) ? el : el.openingElement
  return open?.tagName?.getText() ?? '?'
}

const attrNames = (el) => {
  const open = ts.isJsxSelfClosingElement(el) ? el : el.openingElement
  if (!open?.attributes) return []
  return open.attributes.properties
    .map((p) => (ts.isJsxAttribute(p) && p.name ? p.name.getText() : ts.isJsxSpreadAttribute(p) ? '...spread' : null))
    .filter(Boolean)
}

// Structural JSX signature: tag + sorted attribute NAMES (values ignored) + nested element tags.
// JSX text and {expression} containers collapse to a parameter slot.
const jsxSig = (node) => {
  if (ts.isJsxFragment(node)) return `Frag[${node.children.map(jsxSig).filter(Boolean).join(',')}]`
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const children = (node.children ?? []).map(jsxSig).filter(Boolean)
    return `<${tagName(node)} ${[...attrNames(node)].sort().join('|')}>[${children.join(',')}]`
  }
  return '' // JsxText / JsxExpression → ignored (treated as a param slot)
}

const groups = new Map()

for (const { rel: relPath, sf } of sourceFilesFor(cfg, include)) {
  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      const size = nodeSize(node)
      if (size >= minNodes) {
        const sig = jsxSig(node)
        if (!groups.has(sig)) groups.set(sig, [])
        groups.get(sig).push({
          file: relPath,
          pos: node.getStart(sf),
          end: node.getEnd(),
          startLine: lineOf(sf, node.getStart(sf)),
          endLine: lineOf(sf, node.getEnd()),
          size,
          tag: ts.isJsxFragment(node) ? 'Fragment' : tagName(node),
          attrs: ts.isJsxFragment(node) ? [] : attrNames(node),
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

const pascal = (s) => s.replace(/(^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (_, __, c) => c.toUpperCase())

const components = clusters.map((c, i) => {
  const props = [...new Set(c.occurrences.flatMap((o) => o.attrs))].filter((a) => a !== '...spread')
  const baseTag = c.occurrences[0].tag
  const name = /^[A-Z]/.test(baseTag) ? `${pascal(baseTag)}Wrapper` : `Extracted${pascal(baseTag)}${i + 1}`
  const propsInterface = [
    `interface ${name}Props {`,
    ...props.map((p) => `  ${p}: unknown`),
    `  children?: ComponentChildren`,
    `}`,
  ].join('\n')
  return {
    occurrences: c.occurrences.length,
    nodeSize: c.size,
    proposedComponent: {
      name,
      propsInterface,
      note: 'Replace each call site with <' + name + ' … />; refine prop types from usage.',
    },
    callSites: c.occurrences.map((o) => `${o.file}:${o.startLine}-${o.endLine}`),
  }
})

console.log(
  JSON.stringify(
    { detector: 'ui-components', repetitionThreshold, minNodes, componentCandidates: components.length, components },
    null,
    2,
  ),
)
