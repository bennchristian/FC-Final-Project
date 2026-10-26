// Owner copy edits (spec-copy-editor.md I/O matrix rows 1-3 and the stale-edit row).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeText, checkCopyEdits, matchCopyEdits, STYLE_KEYS, FONT_CHOICES } from '../src/copy-edits.js';
import { loadCopyEdits } from '../content.mjs';

const valid = {
  version: 1,
  edits: [
    { text: 'Start here', n: 0, html: 'Begin <em>here</em>' },
    {
      text: 'Review',
      n: 1,
      style: { fontFamily: FONT_CHOICES[2].value, fontSize: '60px', fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline', translate: '-12.5px 40px' },
    },
  ],
};

function withTempFile(contents, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'copy-edits-'));
  try {
    const path = join(dir, 'copy-edits.json');
    if (contents !== undefined) writeFileSync(path, contents);
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('normalizeText collapses whitespace and no-break spaces and trims', () => {
  assert.equal(normalizeText('  To the church\n   in the 21st  century, '), 'To the church in the 21st century,');
  assert.equal(normalizeText(''), '');
  assert.equal(normalizeText(undefined), '');
});

test('the style keys are the six the editor writes', () => {
  assert.deepEqual(STYLE_KEYS, ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'translate']);
});

test('no edits file: nothing to inline and no errors', () => {
  withTempFile(undefined, (path) => assert.deepEqual(loadCopyEdits(path), { edits: null, errors: [] }));
});

test('valid edits file: accepted unchanged', () => {
  assert.deepEqual(checkCopyEdits(valid), []);
  withTempFile(JSON.stringify(valid), (path) => assert.deepEqual(loadCopyEdits(path), { edits: valid, errors: [] }));
});

test('invalid JSON fails with the file named', () => {
  withTempFile('{ nope', (path) => {
    const { edits, errors } = loadCopyEdits(path);
    assert.equal(edits, null);
    assert.match(errors[0], /^copy-edits\.json: not valid JSON/);
  });
});

const bad = [
  ['wrong version', { version: 2, edits: [] }, /^version: must be 1$/],
  ['edits not a list', { version: 1, edits: {} }, /^edits: must be a list$/],
  ['unknown top-level field', { version: 1, edits: [], extra: 1 }, /unknown field "extra"/],
  ['empty text', { version: 1, edits: [{ text: '   ', n: 0, html: 'x' }] }, /^edits\[0\]\.text: must not be empty$/],
  ['non-string text', { version: 1, edits: [{ text: 3, n: 0, html: 'x' }] }, /^edits\[0\]\.text: must be a string$/],
  ['unnormalized text', { version: 1, edits: [{ text: 'a  b', n: 0, html: 'x' }] }, /^edits\[0\]\.text: must be normalized/],
  ['bad n', { version: 1, edits: [{ text: 'a', n: -1, html: 'x' }] }, /^edits\[0\]\.n: /],
  ['non-string html', { version: 1, edits: [{ text: 'a', n: 0, html: 5 }] }, /^edits\[0\]\.html: must be a string$/],
  ['unknown edit field', { version: 1, edits: [{ text: 'a', n: 0, html: 'x', color: 'red' }] }, /^edits\[0\]\.color: unknown field$/],
  ['unknown style key', { version: 1, edits: [{ text: 'a', n: 0, style: { color: 'red' } }] }, /^edits\[0\]\.style\.color: unknown style key$/],
  ['non-string style value', { version: 1, edits: [{ text: 'a', n: 0, style: { fontSize: 60 } }] }, /^edits\[0\]\.style\.fontSize: must be a string$/],
  ['bad style value', { version: 1, edits: [{ text: 'a', n: 0, style: { fontFamily: 'x; background: url(y)' } }] }, /^edits\[0\]\.style\.fontFamily: invalid value/],
  ['no html or style', { version: 1, edits: [{ text: 'a', n: 0 }] }, /^edits\[0\]: needs html or style$/],
  ['duplicate box', { version: 1, edits: [{ text: 'a', n: 0, html: 'x' }, { text: 'a', n: 0, html: 'y' }] }, /^edits\[1\]: duplicates/],
];

for (const [name, json, pattern] of bad) {
  test(`bad file shape fails, naming the field: ${name}`, () => {
    const errors = checkCopyEdits(json);
    assert.ok(errors.some((e) => pattern.test(e)), `${JSON.stringify(errors)} should match ${pattern}`);
  });
}

test('a bad file is not inlined', () => {
  withTempFile(JSON.stringify({ version: 2, edits: [] }), (path) => {
    const { edits, errors } = loadCopyEdits(path);
    assert.equal(edits, null);
    assert.deepEqual(errors, ['version: must be 1']);
  });
});

test('each edit goes to the n-th box with its original text; unmatched edits are stale', () => {
  const boxes = ['Review', 'How it works', 'Start here', 'Review', 'Add Post'];
  const edits = [
    { text: 'Review', n: 1, html: 'Reviews' },
    { text: 'Start here', n: 0, html: 'Begin' },
    { text: 'Review', n: 2, html: 'gone' },
    { text: 'Old wording', n: 0, html: 'gone too' },
  ];
  const { matches, stale } = matchCopyEdits(boxes, edits);
  assert.deepEqual(matches.map((m) => [m.box, m.edit.html]), [[3, 'Reviews'], [2, 'Begin']]);
  assert.deepEqual(stale, [edits[2], edits[3]]);
});
