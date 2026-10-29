// Checks how the Gentler Rewrite marks its changes (artifact/src/core.js rewriteChanges).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewriteChanges } from '../src/core.js';

const bold = (runs) => runs.filter((r) => r.changed).map((r) => r.text);

test('words the rewrite adds or replaces are marked; shared words are not', () => {
  const runs = rewriteChanges('Should a Christian attend a gay wedding? Of course not.', 'Should a Christian attend a same-sex wedding? My answer is no.');
  assert.deepEqual(bold(runs), ['same-sex', 'My answer is no.']);
  assert.equal(runs.map((r) => r.text).join(''), 'Should a Christian attend a same-sex wedding? My answer is no.');
});

test('case and edge punctuation do not count as changes', () => {
  assert.deepEqual(bold(rewriteChanges('Love is love.', 'love, is Love')), []);
});

test('an unchanged or empty rewrite has nothing marked', () => {
  assert.deepEqual(bold(rewriteChanges('Same words here', 'Same words here')), []);
  assert.deepEqual(rewriteChanges('Anything', ''), []);
});
