// Checks the Gentler Rewrite highlights (rewriteChanges in artifact/src/core.js): display only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../content.mjs';
import { rewriteChanges } from '../src/core.js';

const marked = (runs) => runs.map((r) => (r.changed ? `[${r.text}]` : r.text)).join('');

test('new or changed words are marked; kept words, case and punctuation aside, are not', () => {
  const runs = rewriteChanges('You can NOT call yourself a faithful Christian.', 'You cannot, I think, call yourself a faithful Christian!');
  assert.equal(marked(runs), 'You [cannot, I think,] call yourself a faithful Christian!');
});

test('joining the runs gives back the rewrite exactly, line breaks included', () => {
  const rewrite = 'First line kept here.\n\nA  brand new   second line.';
  const runs = rewriteChanges('First line kept here. Old second line.', rewrite);
  assert.equal(runs.map((r) => r.text).join(''), rewrite);
});

test('short chance matches inside a rewritten passage stay marked', () => {
  // "the" alone matches, but a kept run under three words between changes is not worth breaking the highlight.
  const runs = rewriteChanges('Go away from the people now', 'We welcome the stranger at our table');
  assert.equal(marked(runs), '[We welcome the stranger at our table]');
});

test('an unchanged rewrite marks nothing; no original or an oversized one draws no diff', () => {
  assert.deepEqual(rewriteChanges('Same words here.', 'Same words here.'), [{ text: 'Same words here.', changed: false }]);
  assert.equal(rewriteChanges('', 'Anything'), null);
  assert.equal(rewriteChanges('word '.repeat(2001), 'word '.repeat(2001)), null);
});

test('the Try the demo sample keeps its opening and marks the rewritten lines', () => {
  const sample = JSON.parse(readFileSync(join(ROOT, 'artifact', 'sample-review.json'), 'utf8'));
  const post = sample.posts[0];
  const runs = rewriteChanges(post.pasted_text || post.evaluation.post_transcript, post.evaluation.gentler_rewrite.rewrite);
  assert.equal(runs[0].text, 'Should a Christian attend a ');
  assert.equal(runs[0].changed, false);
  assert.ok(runs.some((r) => r.changed && r.text.includes('same-sex wedding')));
});

test('case and edge punctuation do not count as changes', () => {
  assert.deepEqual(rewriteChanges('Love is love.', 'love, is Love').filter((r) => r.changed), []);
});
