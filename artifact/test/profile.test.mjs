// Checks the viewer's profile and the Profile Summary (artifact/src/profile.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileRecord, personaOrder, profileSummary, ROLES } from '../src/profile.js';

const AUDIENCES = ['curious', 'dechurched', 'secular'];
const TARGETS = [
  { key: 'curious', lead_personas: ['seeker', 'drifter'] },
  { key: 'dechurched', lead_personas: ['drifter', 'exvangelical'] },
  { key: 'secular', lead_personas: ['skeptic'] },
];
const PERSONAS = ['seeker', 'drifter', 'exvangelical', 'skeptic', 'believer'];

const RUBRIC = {
  thresholds: { auto_rewrite_below: 3 },
  criteria: [{ key: 'clarity' }, { key: 'gentleness' }, { key: 'conviction' }],
};
const evaluation = (scores, valences = {}, mode = 'none') => ({
  rewrite_mode: mode,
  assessment: { scores: Object.entries(scores).map(([criterion, score]) => ({ criterion, score })) },
  reactions: { reactions: Object.entries(valences).map(([persona, valence]) => ({ persona, valence })) },
});
const post = (excerpt, scores, valences, mode) => ({ excerpt, savedAt: '2026-10-28T00:00:00Z', evaluation: evaluation(scores, valences, mode) });

test('a profile keeps only known roles and audiences, every audience once, in the viewer’s order', () => {
  const record = profileRecord({ role: 'creator', come_across: '  warm  ', theology: 'Reformed', audiences: ['secular', 'nope', 'secular'] }, AUDIENCES, 't');
  assert.equal(record.role, 'creator');
  assert.equal(record.come_across, 'warm');
  assert.deepEqual(record.audiences, ['secular', 'curious', 'dechurched']);
  assert.equal(profileRecord({ role: 'admin' }, AUDIENCES, 't').role, '');
  assert.deepEqual(ROLES, ['creator', 'leader', 'individual']);
  assert.equal(profileRecord({ theology: 'x'.repeat(3000) }, AUDIENCES, 't').theology.length, 2000);
});

test('ranked audiences put their lead Personas first, each once, and keep every Persona', () => {
  assert.deepEqual(personaOrder(['secular', 'dechurched'], TARGETS, PERSONAS), ['skeptic', 'drifter', 'exvangelical', 'seeker', 'believer']);
  assert.deepEqual(personaOrder([], TARGETS, PERSONAS), PERSONAS);
});

test('the summary works out averages, patterns, Personas, strongest and weakest Posts and top changes', () => {
  const summary = profileSummary([
    post('A', { clarity: 2, gentleness: 4, conviction: 5 }, { seeker: 'negative', skeptic: 'negative', believer: 'positive' }),
    post('B', { clarity: 1, gentleness: 5, conviction: 4 }, { seeker: 'negative', skeptic: 'mixed', believer: 'positive' }),
    post('C', { clarity: 4, gentleness: 4, conviction: null }, { seeker: 'positive', skeptic: 'negative', believer: 'positive' }),
    post('D', { clarity: 5, gentleness: 2, conviction: 3 }, { seeker: 'positive' }),
    post('E', { clarity: 1, gentleness: 1, conviction: 1 }, {}, 'not_assessable'),
  ], RUBRIC, PERSONAS);

  assert.equal(summary.postCount, 4);
  assert.equal(summary.notAssessable, 1);
  assert.deepEqual(summary.averages.find((a) => a.criterion === 'clarity'), { criterion: 'clarity', average: 3, scored: 4 });
  assert.deepEqual(summary.averages.find((a) => a.criterion === 'conviction'), { criterion: 'conviction', average: 4, scored: 3 });
  assert.deepEqual(summary.concernPatterns, [{ criterion: 'clarity', count: 2, of: 4 }]);
  assert.deepEqual(summary.strengthPatterns.map((p) => p.criterion), ['gentleness', 'clarity', 'conviction']);
  assert.deepEqual(summary.reactWell.map((p) => p.key), ['believer']);
  assert.deepEqual(summary.reactBadly.map((p) => p.key), ['skeptic']);
  assert.deepEqual(summary.strongest.map((p) => p.excerpt), ['C', 'A']);
  // Averages: C 4, A 3.7, B 3.3, D 3.3. Four Posts show two at each end, weakest first.
  assert.deepEqual(summary.weakest.map((p) => p.excerpt), ['D', 'B']);
  assert.deepEqual(summary.weakest.map((p) => p.average), [3.3, 3.3]);
  assert.deepEqual(summary.topChanges, [{ criterion: 'clarity', concerns: 2, of: 4 }, { criterion: 'gentleness', concerns: 1, of: 4 }]);
});

test('with no saved Posts the summary is empty, not an error', () => {
  const summary = profileSummary([], RUBRIC, PERSONAS);
  assert.equal(summary.postCount, 0);
  assert.deepEqual(summary.strongest, []);
  assert.deepEqual(summary.weakest, []);
  assert.deepEqual(summary.topChanges, []);
});
