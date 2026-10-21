// Shared test helpers: load conformance vectors and apply their set/delete edits.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent } from '../content.mjs';

export const { content, labels } = loadContent();

export function vectors(name) {
  return JSON.parse(readFileSync(join(ROOT, 'conformance', name), 'utf8'));
}

export function applyEdits(base, edits = {}) {
  const value = structuredClone(base);
  for (const [path, v] of edits.set || []) {
    let node = value;
    for (const key of path.slice(0, -1)) node = node[key];
    node[path.at(-1)] = v;
  }
  for (const path of edits.delete || []) {
    let node = value;
    for (const key of path.slice(0, -1)) node = node[key];
    const last = path.at(-1);
    if (Array.isArray(node)) node.splice(last, 1);
    else delete node[last];
  }
  return value;
}
