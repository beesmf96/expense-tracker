// Shared TypeScript-compiler-API helpers for the AST-based detectors (code blocks + UI components).
// The `typescript` package (already a project dependency, TS 6) is the single allowed dependency for
// AST work; everything else stays dependency-free.
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { walkRepo, rel, matchGlob } from './lib.mjs'

export { ts }

export function sourceFilesFor(cfg, include) {
  return walkRepo(cfg)
    .filter((abs) => matchGlob(include, rel(abs)))
    .map((abs) => {
      let text
      try {
        text = readFileSync(abs, 'utf8')
      } catch {
        return null
      }
      const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      return { abs, rel: rel(abs), text, sf }
    })
    .filter(Boolean)
}

const hash = (s) => createHash('sha256').update(s).digest('hex')

// Structural signature of a subtree, normalized to ignore formatting, comments (already excluded
// from the AST) and identifier/literal text. This makes whitespace- and rename-only variants of the
// same logic hash identically (type-2/3 clone detection).
export function structuralSig(node) {
  const k = ts.SyntaxKind[node.kind]
  if (
    node.kind === ts.SyntaxKind.Identifier ||
    node.kind === ts.SyntaxKind.PrivateIdentifier
  )
    return 'Id'
  if (
    node.kind === ts.SyntaxKind.StringLiteral ||
    node.kind === ts.SyntaxKind.NumericLiteral ||
    node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword
  )
    return 'Lit'
  const parts = []
  // NB: forEachChild aborts if the callback returns truthy — keep these callbacks void.
  node.forEachChild((c) => {
    parts.push(structuralSig(c))
  })
  return parts.length ? `${k}(${parts.join(',')})` : k
}

export function nodeSize(node) {
  let n = 1
  node.forEachChild((c) => {
    n += nodeSize(c)
  })
  return n
}

export function sigHash(node) {
  return hash(structuralSig(node)).slice(0, 12)
}

export function lineOf(sf, pos) {
  return sf.getLineAndCharacterOfPosition(pos).line + 1
}

// Drops clusters whose every occurrence is nested inside an occurrence of an already-accepted,
// larger cluster — so we report the biggest meaningful repeated unit, not every inner fragment.
export function dropContained(clusters) {
  const sorted = [...clusters].sort((a, b) => b.size - a.size)
  const accepted = []
  const acceptedRanges = []
  const nested = (r) =>
    acceptedRanges.some(
      (R) => R.file === r.file && R.pos <= r.pos && r.end <= R.end && !(R.pos === r.pos && R.end === r.end),
    )
  for (const c of sorted) {
    if (c.occurrences.every((o) => nested(o))) continue
    accepted.push(c)
    for (const o of c.occurrences) acceptedRanges.push(o)
  }
  return accepted
}

// Approximate free identifiers (referenced but not declared inside the node) — used to propose
// helper/component parameters. Skips property-access member names and JSX attribute names.
export function freeIdentifiers(node) {
  const declared = new Set()
  const used = new Set()
  const visit = (n) => {
    if (ts.isParameter(n) && ts.isIdentifier(n.name)) declared.add(n.name.text)
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) declared.add(n.name.text)
    if ((ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) && n.name) declared.add(n.name.text)
    if (ts.isBindingElement(n) && ts.isIdentifier(n.name)) declared.add(n.name.text)
    if (ts.isIdentifier(n)) {
      const p = n.parent
      const isMember = ts.isPropertyAccessExpression(p) && p.name === n
      const isPropName = ts.isPropertyAssignment(p) && p.name === n
      const isJsxAttrName = p && p.kind === ts.SyntaxKind.JsxAttribute
      if (!isMember && !isPropName && !isJsxAttrName) used.add(n.text)
    }
    n.forEachChild(visit)
  }
  visit(node)
  return [...used].filter((u) => !declared.has(u)).slice(0, 8)
}
