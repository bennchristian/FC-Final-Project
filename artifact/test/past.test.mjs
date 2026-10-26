// Checks how Past Reviews are stored and read back (artifact/src/past.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pastReviewsPath, reviewTally, pastReviewRecord, pastPostRecord, restorePost, sameVersions } from '../src/past.js';
import { labels } from './helpers.mjs';

const evaluation = (landsWell, mode = landsWell ? 'none' : 'auto') => ({ lands_well: landsWell, rewrite_mode: mode, assessment: { scores: [] } });
const post = (fields) => ({ pasted_text: '', video_transcript: '', source_url: '', images: [], status: 'pending', evaluation: null, error: null, ...fields });

test('Reviews live in the viewer’s private subtree', () => {
  assert.equal(pastReviewsPath('u_123'), 'data/users/u_123');
});

test('the overall tally counts only evaluated Posts, by code', () => {
  const tally = reviewTally([
    post({ status: 'done', evaluation: evaluation(true) }),
    post({ status: 'done', evaluation: evaluation(false) }),
    post({ status: 'done', evaluation: evaluation(false, 'not_assessable') }),
    post({ status: 'failed' }),
    post({ status: 'refused' }),
    post({ status: 'pending' }),
  ]);
  assert.deepEqual(tally, { total: 6, done: 3, landsWell: 1, concerns: 1, notAssessable: 1, failed: 2 });
});

test('a stored Post keeps screenshot names, never the screenshots', () => {
  const record = pastPostRecord(post({ status: 'done', evaluation: evaluation(true), images: [{ name: 'a.jpg', blob: { size: 9 } }] }), 1);
  assert.deepEqual(record.image_names, ['a.jpg']);
  assert.equal(JSON.stringify(record).includes('blob'), false);
  assert.equal(record.position, 1);
});

test('a Post stopped mid-run is stored as pending, without a partial evaluation', () => {
  const record = pastPostRecord(post({ status: 'evaluating', evaluation: evaluation(false) }), 2);
  assert.equal(record.status, 'pending');
  assert.equal(record.evaluation, null);
});

test('a stored Post reads back into the page-memory shape', () => {
  const original = post({ pasted_text: 'Hi', status: 'done', evaluation: evaluation(true), images: [{ name: 'a.jpg' }] });
  const back = restorePost(JSON.parse(JSON.stringify(pastPostRecord(original, 1))), 7);
  assert.deepEqual(back, { ...original, id: 7, images: [{ name: 'a.jpg' }], rewriteStatus: 'idle' });
});

test('the Review record keeps a finished Outreach Plan only', () => {
  const posts = [post({ status: 'done', evaluation: evaluation(true) })];
  const base = { posts, reviewSourceUrl: '', modelId: 'm' };
  assert.equal(pastReviewRecord({ ...base, outreach: { status: 'running' } }, labels, 't').outreach, null);
  const done = { status: 'done', output: {}, model: 'm' };
  const record = pastReviewRecord({ ...base, outreach: done }, labels, '2026-10-26T00:00:00Z');
  assert.deepEqual(record.outreach, done);
  assert.equal(record.postCount, 1);
  assert.deepEqual(record.labels, labels);
});

test('only Reviews with the same versions can be reopened', () => {
  assert.equal(sameVersions(labels, { ...labels }), true);
  assert.equal(sameVersions(labels, { ...labels, rubric: 'witness-rubric@9' }), false);
  assert.equal(sameVersions(labels, undefined), false);
});
