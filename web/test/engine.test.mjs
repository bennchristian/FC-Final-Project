// The demo evaluator must pass the Artifact's own pipeline and validators for any Post.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, loadSampleReview } from '../../artifact/content.mjs';
import { evaluatePost, createOutreach, requestRewrite } from '../../artifact/src/pipeline.js';
import { answer, stepOf } from '../demo-engine.js';

const { content, labels } = loadContent();
const { sample } = loadSampleReview(content, labels);
const samples = sample.posts.filter((p) => p.status === 'done').map((p) => ({ text: p.video_transcript || p.pasted_text, evaluation: p.evaluation }));

function ctx() {
  return {
    content,
    model: { id: 'claude-opus-5-5', sample_tier: 'complex' },
    sample: async (prompt) => ({ text: JSON.stringify(answer(prompt, content, samples)), truncated: false, modelApplied: 'living-letter-demo' }),
  };
}

const POSTS = {
  harsh: 'You people need to repent! Sinners will burn in hell. This nation has become wicked and the Democrats are to blame. Romans 6:23.',
  gentle: 'Last week a few of us cooked meals and sat with neighbours at the shelter. Honestly, I am still learning what love looks like. I believe Jesus is with the lonely. What helps you when you feel alone?',
  plain: 'God is good.',
  jargon: 'Washed in the blood, sanctified and saved by grace. Hallelujah! Amen.',
  long: 'Work has been brutal and my anxiety is high. '.repeat(40),
};

function post(text, extra = {}) {
  return { pasted_text: text, video_transcript: '', source_url: '', images: [], ...extra };
}

for (const [name, text] of Object.entries(POSTS)) {
  test(`evaluates a ${name} Post through the real pipeline`, async () => {
    const ev = await evaluatePost(ctx(), post(text), { reviewSourceUrl: '', cache: true });
    assert.equal(ev.assessment.scores.length, content.rubric.criteria.length);
    assert.equal(ev.reactions.reactions.length, content.personaSet.personas.length);
    assert.ok(ev.discussion_questions.questions.length >= 4);
    if (ev.rewrite_mode === 'auto') assert.ok(ev.gentler_rewrite.rewrite.length > 0);
  });
}

test('a harsh Post gets low scores and an automatic rewrite', async () => {
  const ev = await evaluatePost(ctx(), post(POSTS.harsh), { reviewSourceUrl: '', cache: true });
  assert.equal(ev.rewrite_mode, 'auto');
  assert.equal(ev.lands_well, false);
  assert.ok(!/\bwicked\b/i.test(ev.gentler_rewrite.rewrite));
});

test('a gentle Post lands well', async () => {
  const ev = await evaluatePost(ctx(), post(POSTS.gentle), { reviewSourceUrl: '', cache: true });
  assert.equal(ev.lands_well, true);
});

test('a screenshot-only Post is reported as not assessable', async () => {
  const ev = await evaluatePost(ctx(), post('', { images: [{ blob: new Blob(['x']) }] }), { reviewSourceUrl: '', cache: true });
  assert.equal(ev.rewrite_mode, 'not_assessable');
});

test('the sample reel gets its real saved results', async () => {
  const s = sample.posts[0];
  const ev = await evaluatePost(ctx(), post('', { video_transcript: s.video_transcript, source_url: s.source_url }), { reviewSourceUrl: '', cache: true });
  assert.deepEqual(ev.assessment.scores, s.evaluation.assessment.scores);
  assert.deepEqual(ev.reactions, s.evaluation.reactions);
});

test('the on-demand rewrite and the Outreach Plan validate', async () => {
  const ev = await evaluatePost(ctx(), post(POSTS.gentle), { reviewSourceUrl: '', cache: true });
  if (ev.rewrite_mode === 'offer') await requestRewrite(ctx(), post(POSTS.gentle), ev, { reviewSourceUrl: '', cache: true });
  const harsh = await evaluatePost(ctx(), post(POSTS.harsh), { reviewSourceUrl: '', cache: true });
  const plan = await createOutreach(ctx(), [
    { position: 1, post: post(POSTS.gentle), evaluation: ev },
    { position: 2, post: post(POSTS.harsh), evaluation: harsh },
  ], { reviewSourceUrl: '', cache: true });
  assert.ok(plan.output.talking_points.length >= 3);
  assert.ok(plan.output.talking_points.some((t) => t.kind === 'concern'));
});

test('every prompt step is recognised', () => {
  for (const step of ['assess', 'react', 'discuss', 'rewrite', 'outreach']) {
    const file = content.prompts.files[content.prompts.manifest.steps[step].file];
    assert.equal(stepOf(file), step);
  }
});
