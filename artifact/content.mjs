// Loads and checks the shared data layer (ARCHITECTURE.md AD-1, AD-7, AD-14) for the
// Demo Artifact build and tests. Node only; never inlined into the page.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCopyEdits } from './src/copy-edits.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const LOCK_PATH = join(CONTENT_DIR, 'published.lock.json');

const KINDS = [
  { name: 'witness-rubric', dir: 'rubric', file: (n) => `witness-rubric@${n}.json` },
  { name: 'persona-set', dir: 'personas', file: (n) => `persona-set@${n}.json` },
  { name: 'prompts', dir: 'prompts', file: (n) => `prompts@${n}` },
];

// Canonical bytes: UTF-8, LF line endings, no BOM.
function readCanonical(path) {
  const buf = readFileSync(path);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) throw new Error(`${path}: has a BOM`);
  if (buf.includes(0x0d)) throw new Error(`${path}: has CR line endings`);
  return buf;
}

function numbersFor(kind) {
  const pattern = new RegExp(`^${kind.name}@(\\d+)(\\.json)?$`);
  return readdirSync(join(CONTENT_DIR, kind.dir))
    .map((f) => f.match(pattern))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

// Canonical bytes of one version id. A prompt set is `<filename>\n<file bytes>\n`
// concatenated in ascending filename order.
function canonicalBytes(kind, n) {
  const path = join(CONTENT_DIR, kind.dir, kind.file(n));
  if (kind.name !== 'prompts') return readCanonical(path);
  const parts = readdirSync(path).sort().map((f) => Buffer.concat([Buffer.from(`${f}\n`), readCanonical(join(path, f)), Buffer.from('\n')]));
  return Buffer.concat(parts);
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function readLock() {
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
}

// Every locked id must still hash to its lock entry (AD-1). Returns error strings.
export function checkLock() {
  const errors = [];
  for (const [id, hash] of Object.entries(readLock())) {
    const [name, n] = id.split('@');
    const kind = KINDS.find((k) => k.name === name);
    if (!kind || !existsSync(join(CONTENT_DIR, kind.dir, kind.file(n)))) {
      errors.push(`${id}: locked but its file is missing`);
    } else if (sha256(canonicalBytes(kind, n)) !== hash) {
      errors.push(`${id}: locked content changed (hash mismatch). Make a new version instead.`);
    }
  }
  return errors;
}

// Adds lock entries for the latest ids that have none. Run before the first publish.
export function lockLatest() {
  const lock = readLock();
  for (const kind of KINDS) {
    const n = numbersFor(kind).at(-1);
    const id = `${kind.name}@${n}`;
    if (!lock[id]) lock[id] = sha256(canonicalBytes(kind, n));
  }
  writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

// The latest version of each name, with display labels ending `-draft` when unlocked.
export function loadContent() {
  const lock = readLock();
  const latest = Object.fromEntries(KINDS.map((k) => [k.name, numbersFor(k).at(-1)]));
  const label = (name) => {
    const id = `${name}@${latest[name]}`;
    return lock[id] ? id : `${id}-draft`;
  };

  const rubricKind = KINDS[0];
  const personaKind = KINDS[1];
  const rubric = JSON.parse(readCanonical(join(CONTENT_DIR, rubricKind.dir, rubricKind.file(latest['witness-rubric']))).toString('utf8'));
  const personaSet = JSON.parse(readCanonical(join(CONTENT_DIR, personaKind.dir, personaKind.file(latest['persona-set']))).toString('utf8'));
  const promptDir = join(CONTENT_DIR, 'prompts', `prompts@${latest.prompts}`);
  const files = Object.fromEntries(readdirSync(promptDir).sort().map((f) => [f, readCanonical(join(promptDir, f)).toString('utf8')]));
  const manifest = JSON.parse(files['manifest.json']);
  const models = JSON.parse(readFileSync(join(ROOT, 'config', 'models.json'), 'utf8'));

  return {
    content: { rubric, personaSet, prompts: { manifest, files }, models },
    labels: { rubric: label('witness-rubric'), personas: label('persona-set'), prompts: label('prompts') },
  };
}

// Manifest checks (AD-14, AD-16): every file exists, its {{placeholders}} match the
// manifest exactly, and every required rule marker is present.
export function checkPrompts(prompts) {
  const errors = [];
  const { manifest, files } = prompts;
  const markersIn = (text) => new Set([...text.matchAll(/<!-- rule:([a-z0-9_]+) -->/g)].map((m) => m[1]));
  const entries = [...Object.entries(manifest.steps), ['guardrails', { ...manifest.guardrails, placeholders: [] }]];
  for (const [step, spec] of entries) {
    const text = files[spec.file];
    if (text === undefined) {
      errors.push(`${step}: file ${spec.file} is missing`);
      continue;
    }
    const found = new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    for (const p of spec.placeholders) if (!found.has(p)) errors.push(`${spec.file}: lacks {{${p}}}`);
    for (const p of found) if (!spec.placeholders.includes(p)) errors.push(`${spec.file}: unlisted placeholder {{${p}}}`);
    const markers = markersIn(text);
    for (const r of spec.required_rules) if (!markers.has(r)) errors.push(`${spec.file}: missing rule marker ${r}`);
  }
  return errors;
}

// Light shape checks of the content files against SCHEMA.md §3.
export function checkContentShapes(content) {
  const errors = [];
  const { rubric, personaSet, models } = content;
  const criterionKeys = rubric.criteria.map((c) => c.key);
  if (new Set(criterionKeys).size !== criterionKeys.length) errors.push('rubric: duplicate criterion key');
  rubric.criteria.forEach((c, i) => {
    if (c.number !== i + 1) errors.push(`rubric: ${c.key} number out of order`);
    if (!['all', 'own_content'].includes(c.applies_to)) errors.push(`rubric: ${c.key} has unknown applies_to`);
    if (c.applies_to === 'own_content' && !c.na_reason_others) errors.push(`rubric: ${c.key} needs na_reason_others`);
    if (!Array.isArray(c.sources) || c.sources.length === 0 || c.sources.some((s) => !s.source || !s.principle)) {
      errors.push(`rubric: ${c.key} needs sources, each with source and principle`);
    }
  });
  const offenceKeys = (rubric.offence_sources || []).map((o) => o.key);
  if (offenceKeys.join() !== 'claim,tone,jargon') errors.push('rubric: offence_sources must define claim, tone and jargon');
  for (const o of rubric.offence_sources || []) {
    if (!o.name || !o.meaning || !o.effect) errors.push(`rubric: offence source ${o.key} is incomplete`);
  }
  const personaKeys = personaSet.personas.map((p) => p.key);
  if (new Set(personaKeys).size !== personaKeys.length) errors.push('personas: duplicate key');
  for (const p of personaSet.personas) {
    if (!['non_believer', 'believer_behaviour'].includes(p.frame)) errors.push(`personas: ${p.key} has unknown frame`);
    if (!p.card || !p.summary || !p.name) errors.push(`personas: ${p.key} is incomplete`);
    if (!Array.isArray(p.grounded_in) || p.grounded_in.length === 0) errors.push(`personas: ${p.key} needs grounded_in`);
  }
  for (const a of personaSet.target_audiences) {
    for (const k of a.lead_personas) if (!personaKeys.includes(k)) errors.push(`target audience ${a.key}: unknown persona ${k}`);
  }
  if (!models.artifact_picker.some((m) => m.id === models.default)) errors.push('models: default is not in the picker');
  for (const m of models.artifact_picker) {
    if (!['complex', 'default', 'quick'].includes(m.sample_tier)) errors.push(`models: ${m.id} has unknown sample_tier`);
    if (!models.prices_usd_per_mtok[m.id]) errors.push(`models: ${m.id} has no price`);
  }
  return errors;
}

// Owner copy edits (AD-12 authoring aid): the optional artifact/copy-edits.json.
// Absent → { edits: null, errors: [] }. Present → parsed and checked by checkCopyEdits.
export const COPY_EDITS_PATH = join(ROOT, 'artifact', 'copy-edits.json');

export function loadCopyEdits(path = COPY_EDITS_PATH) {
  if (!existsSync(path)) return { edits: null, errors: [] };
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { edits: null, errors: [`copy-edits.json: not valid JSON (${e.message})`] };
  }
  const errors = checkCopyEdits(json);
  return { edits: errors.length ? null : json, errors };
}
