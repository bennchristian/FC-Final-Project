// "Try the demo" sample Review (spec-fr-24-try-the-demo.md): the bad-sample rows of the I/O
// matrix, the optional file, and samplePosts. The fixture is a saved Review's JSON appendix
// (export.js) of two made-up Posts, built from the conformance bases, with its links set to null.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSampleReview, samplePosts, sampleLink, isSamplePost } from '../src/sample.js';
import { applyOverrides, derive } from '../src/core.js';
import { reviewToMarkdown } from '../src/export.js';
import { loadSampleReview } from '../content.mjs';
import { content, labels, vectors } from './helpers.mjs';

const bases = vectors('outputs.json').bases;
const MODEL = 'claude-opus-5-5';
const POSTS = [
  { pasted_text: 'A made-up caption for the sample test.', video_transcript: '' },
  { pasted_text: '', video_transcript: 'Made-up spoken words for the sample test.' },
];

function evaluation() {
  const { post_transcript, ...raw } = applyOverrides(structuredClone(bases.assess), content.rubric, 'others');
  const derived = derive(raw, content.rubric);
  return {
    post_transcript,
    assessment: raw,
    reactions: structuredClone(bases.react),
    discussion_questions: structuredClone(bases.discuss),
    gentler_rewrite: derived.rewrite_mode === 'auto' ? structuredClone(bases.rewrite) : null,
    lands_well: derived.lands_well,
    rewrite_mode: derived.rewrite_mode,
    models: { assess: MODEL, react: MODEL, discuss: MODEL, ...(derived.rewrite_mode === 'auto' ? { rewrite: MODEL } : {}) },
  };
}

// Saved the way a viewer saves a live Review: through reviewToMarkdown's JSON appendix.
function savedSample() {
  const posts = POSTS.map((p, i) => ({
    position: i + 1,
    status: 'done',
    evaluation: evaluation(),
    post: { ...p, source_url: 'https://www.instagram.com/reel/abc/', images: [] },
  }));
  const outreach = { status: 'done', output: structuredClone(bases.outreach), model: MODEL };
  const md = reviewToMarkdown({ posts, reviewSourceUrl: '', outreach }, content, labels, { exportedAt: '2026-10-29T12:00:00Z', includeJson: true });
  const sample = JSON.parse(md.split('```json\n')[1].split('\n```')[0]);
  for (const post of sample.posts) post.source_url = null; // links are removed when the sample is made
  return sample;
}

function edited(fn) {
  const sample = savedSample();
  fn(sample);
  return checkSampleReview(sample, content, labels);
}

function withTempFile(contents, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'sample-review-'));
  try {
    const path = join(dir, 'sample-review.json');
    if (contents !== undefined) writeFileSync(path, contents);
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a saved Review with its links removed is a valid sample', () => {
  assert.deepEqual(checkSampleReview(savedSample(), content, labels), []);
});

const REEL = 'https://www.instagram.com/p/DcRYltnvb77/';

test('a Post may keep its link when it is an Instagram post link', () => {
  assert.deepEqual(edited((s) => { s.posts[0].source_url = REEL; }), []);
  assert.deepEqual(edited((s) => { s.posts[1].source_url = 'https://www.instagram.com/reel/abc_1/'; }), []);
});

test('one Post with only a video transcript and no Outreach Plan is a valid sample', () => {
  assert.deepEqual(edited((s) => { s.posts = [s.posts[1]]; s.posts[0].position = 1; s.outreach = null; }), []);
});

const bad = [
  ['wrong versions', (s) => { s.versions.rubric = 'witness-rubric@1'; }, /sample\.versions: saved with witness-rubric@1 .*save the Review/],
  ['no Posts', (s) => { s.posts = []; }, /sample\.posts: expected at least one Post/],
  ['a Post with no text', (s) => { s.posts[0].pasted_text = null; }, /posts\[0\]: needs its text or video transcript/],
  ['an @handle in a Post', (s) => { s.posts[1].video_transcript += ' Follow @someone.'; }, /posts\[1\]: names an @handle/],
  ['an @handle in the Outreach Plan', (s) => { s.outreach.output.outreach_message += ' @someone'; }, /sample\.outreach: names an @handle/],
  ['a non-Instagram link', (s) => { s.posts[0].source_url = 'https://www.tiktok.com/@x/video/1'; }, /posts\[0\]\.source_url: a sample Post's link is null or an Instagram post link/],
  ['an Instagram profile link', (s) => { s.posts[0].source_url = 'https://www.instagram.com/someone/'; }, /posts\[0\]\.source_url: a sample Post's link is null or an Instagram post link/],
  ['a link that is not a string', (s) => { s.posts[0].source_url = 7; }, /posts\[0\]\.source_url: a sample Post's link is null or an Instagram post link/],
  ['a profile link', (s) => { s.review_source_url = 'https://www.instagram.com/someone/'; }, /review_source_url: a sample holds no profile link/],
  ['screenshots', (s) => { s.posts[1].screenshot_count = 1; }, /posts\[1\]\.screenshot_count: a sample Post has no screenshots/],
  ['a Post not evaluated', (s) => { s.posts[0].status = 'failed'; s.posts[0].evaluation = null; }, /posts\[0\]\.status: every sample Post must be evaluated/],
  ['an invalid assessment', (s) => { s.posts[0].evaluation.assessment.scores[0].score = 9; }, /posts\[0\]\.evaluation: assess\.scores\[0\]\.score/],
  ['a broken cross-field rule', (s) => { s.posts[0].evaluation.assessment.scores[0].offence_sources = []; }, /posts\[0\]\.evaluation: assess\.scores\[0\]\.offence_sources: required/],
  ['own-content Criterion scored', (s) => {
    const i = content.rubric.criteria.findIndex((c) => c.applies_to === 'own_content');
    s.posts[0].evaluation.assessment.scores[i].explanation = 'Scored anyway.';
  }, /own-content Criteria must be N\/A/],
  ['derived fields that disagree with the scores', (s) => { s.posts[0].evaluation.lands_well = true; }, /lands_well and rewrite_mode do not match/],
  ['a missing Persona reaction', (s) => { s.posts[1].evaluation.reactions.reactions.pop(); }, /posts\[1\]\.evaluation: react\.reactions: missing persona/],
  ['invalid discussion questions', (s) => { s.posts[1].evaluation.discussion_questions.questions = []; }, /posts\[1\]\.evaluation: discuss\.questions/],
  ['an auto rewrite missing', (s) => { s.posts[1].evaluation.gentler_rewrite = null; }, /gentler_rewrite: required when rewrite_mode is auto/],
  ['an unknown evaluation field', (s) => { s.posts[0].evaluation.extra = 1; }, /evaluation\.extra: unknown field/],
  ['an Outreach Plan not finished', (s) => { s.outreach.status = 'failed'; }, /sample\.outreach\.status: expected done/],
  ['an invalid Outreach Plan', (s) => { s.outreach.output.talking_points[0].post_position = 7; }, /sample\.outreach\.output: outreach\.talking_points\[0\]\.post_position/],
];

for (const [name, fn, pattern] of bad) {
  test(`bad sample fails: ${name}`, () => {
    const errors = edited(fn);
    assert.ok(errors.some((e) => pattern.test(e)), `${name}: ${JSON.stringify(errors)}`);
  });
}

test('draft (unlocked) labels are refused', () => {
  const sample = savedSample();
  const draft = { ...labels, prompts: `${labels.prompts}-draft` };
  sample.versions = draft;
  assert.ok(checkSampleReview(sample, content, draft).some((e) => /unlocked \(draft\)/.test(e)));
});

test('garbage never throws', () => {
  for (const value of [null, [], 'x', 1, { posts: 'x' }]) assert.ok(checkSampleReview(value, content, labels).length > 0);
});

test('no sample file: nothing to inline and no errors', () => {
  withTempFile(undefined, (path) => assert.deepEqual(loadSampleReview(content, labels, path), { sample: null, errors: [] }));
});

test('a valid sample file loads unchanged; a bad one fails with the file named', () => {
  const sample = savedSample();
  withTempFile(JSON.stringify(sample), (path) => assert.deepEqual(loadSampleReview(content, labels, path), { sample, errors: [] }));
  withTempFile('{ nope', (path) => {
    const { sample: loaded, errors } = loadSampleReview(content, labels, path);
    assert.equal(loaded, null);
    assert.match(errors[0], /^sample-review\.json: not valid JSON/);
  });
  sample.posts[0].source_url = 'https://example.com/';
  withTempFile(JSON.stringify(sample), (path) => {
    const { sample: loaded, errors } = loadSampleReview(content, labels, path);
    assert.equal(loaded, null);
    assert.ok(errors.every((e) => e.startsWith('sample-review.json: ')));
  });
});

test('samplePosts maps the sample to done Post state with fresh copies', () => {
  const sample = savedSample();
  const posts = samplePosts(sample, 5);
  assert.deepEqual(posts.map((p) => p.id), [5, 6]);
  for (const [i, p] of posts.entries()) {
    assert.deepEqual(Object.keys(p).sort(), ['demo', 'error', 'evaluation', 'id', 'images', 'pasted_text', 'rewriteStatus', 'source_url', 'status', 'video_transcript']);
    assert.equal(p.pasted_text, POSTS[i].pasted_text);
    assert.equal(p.video_transcript, POSTS[i].video_transcript);
    assert.equal(p.status, 'done');
    assert.equal(p.demo, true);
    assert.equal(p.error, null);
    assert.equal(p.rewriteStatus, 'idle');
    assert.deepEqual([p.source_url, p.images], ['', []]);
    assert.deepEqual(p.evaluation, sample.posts[i].evaluation);
  }
  posts[0].evaluation.assessment.scores[0].score = 5;
  assert.notEqual(sample.posts[0].evaluation.assessment.scores[0].score, 5, 'loading again restores the sample unchanged');
});

test('a loaded sample exports exactly like the live Review it was saved from', () => {
  const sample = savedSample();
  const posts = samplePosts(sample).map((post, i) => ({ position: i + 1, post, evaluation: post.evaluation, status: post.status }));
  const md = reviewToMarkdown({ posts, reviewSourceUrl: '', outreach: structuredClone(sample.outreach) }, content, labels, { exportedAt: sample.exported_at, includeJson: true });
  assert.deepEqual(JSON.parse(md.split('```json\n')[1].split('\n```')[0]), sample);
});

test('samplePosts keeps an Instagram link, and sampleLink names the first Post\'s', () => {
  const sample = savedSample();
  assert.equal(sampleLink(sample), '');
  sample.posts[0].source_url = REEL;
  assert.equal(sampleLink(sample), REEL);
  assert.deepEqual(samplePosts(sample).map((p) => p.source_url), [REEL, '']);
  assert.equal(sampleLink(null), '');
});

test('a sample with its link exports exactly like the live Review it was saved from', () => {
  const sample = savedSample();
  sample.posts[0].source_url = REEL;
  const posts = samplePosts(sample).map((post, i) => ({ position: i + 1, post, evaluation: post.evaluation, status: post.status }));
  const md = reviewToMarkdown({ posts, reviewSourceUrl: '', outreach: structuredClone(sample.outreach) }, content, labels, { exportedAt: sample.exported_at, includeJson: true });
  assert.deepEqual(JSON.parse(md.split('```json\n')[1].split('\n```')[0]), sample);
});

test('isSamplePost knows an unchanged sample Post, in any key order, and nothing else', () => {
  const sample = savedSample();
  sample.posts[0].source_url = REEL;
  const [post] = samplePosts(sample);
  assert.ok(isSamplePost(sample, post));
  // A saved record read back from the store may list its keys in another order.
  const reordered = { ...post, evaluation: Object.fromEntries(Object.entries(post.evaluation).reverse()) };
  assert.ok(isSamplePost(sample, reordered));
  assert.ok(!isSamplePost(sample, { ...post, source_url: '' }));
  assert.ok(!isSamplePost(sample, { ...post, status: 'evaluating', evaluation: null }));
  const changed = structuredClone(post);
  changed.evaluation.assessment.scores[0].explanation = 'Edited.';
  assert.ok(!isSamplePost(sample, changed));
  assert.ok(!isSamplePost(null, post));
});
