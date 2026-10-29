// Checks the Review export (artifact/src/export.js) against conformance-valid outputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewToMarkdown } from '../src/export.js';
import { content, labels, vectors } from './helpers.mjs';

const bases = vectors('outputs.json').bases;
const { post_transcript, ...assessment } = bases.assess;
const evaluation = {
  post_transcript, assessment, reactions: bases.react, discussion_questions: bases.discuss,
  gentler_rewrite: bases.rewrite, lands_well: false, rewrite_mode: 'auto',
  models: { assess: 'claude-opus-5-5', react: 'claude-opus-5-5', discuss: 'claude-opus-5-5', rewrite: 'claude-opus-5-5' },
};
const review = {
  reviewSourceUrl: 'https://www.instagram.com/cedarhollow.example/',
  posts: [
    { position: 1, status: 'done', evaluation, post: { pasted_text: 'A | B', video_transcript: 'line one\nline two', source_url: '', images: [{ name: 'x.jpg' }] } },
    { position: 2, status: 'failed', evaluation: null, post: { pasted_text: 'Second', video_transcript: '', source_url: '', images: [] } },
  ],
  outreach: { status: 'done', model: 'claude-opus-5-5', output: bases.outreach },
};

test('Markdown export carries every part of the Review and labels Personas simulated', () => {
  const md = reviewToMarkdown(review, content, labels, { exportedAt: '2026-10-21T12:00:00Z', includeJson: false });
  for (const part of ['# Living Letter', '## Post 1', '> line one\n> line two', 'Screenshots: 1 (not included',
    '### Rubric Scores', '| 1. Outsider Clarity | 2 / 5 | Jargon |', '- Why: Insider phrasing', '### Persona Reactions (simulated)',
    '### Gentler Rewrite (suggestion)', '### Discussion Questions', '*Not evaluated (failed).*', '## Ministry Outreach Plan', 'Concern · Post 1']) {
    assert.ok(md.includes(part), part);
  }
  assert.ok(!md.includes('## Raw data'));
  for (const version of [labels.rubric, labels.personas, labels.prompts, 'Versions:']) assert.ok(!md.includes(version), version);
});

test('the saved file adds a JSON appendix that parses back to the Review', () => {
  const md = reviewToMarkdown(review, content, labels, { exportedAt: '2026-10-21T12:00:00Z', includeJson: true });
  const json = JSON.parse(md.split('```json\n')[1].split('\n```')[0]);
  assert.equal(json.posts.length, 2);
  assert.deepEqual(json.posts[0].evaluation.assessment.scores, assessment.scores);
  assert.equal(json.posts[0].screenshot_count, 1);
  assert.equal(JSON.stringify(json).includes('"blob"'), false);
  assert.deepEqual(json.versions, labels, 'versions stay in the data, never in the readable text');
  assert.ok(!md.split('## Raw data')[0].includes(labels.rubric));
});
