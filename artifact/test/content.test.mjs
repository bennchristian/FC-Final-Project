// Checks the shared content against SCHEMA.md §3, the PRD lists, and AD-1/AD-14.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLock, checkPrompts, checkContentShapes } from '../content.mjs';
import { content } from './helpers.mjs';

test('locked content still matches content/published.lock.json', () => assert.deepEqual(checkLock(), []));
test('content shapes are consistent', () => assert.deepEqual(checkContentShapes(content), []));
test('every prompt file has its placeholders and rule markers', () => assert.deepEqual(checkPrompts(content.prompts), []));

test('rubric v1 has the ten PRD Criteria in order', () => {
  assert.deepEqual(content.rubric.criteria.map((c) => c.name), [
    'Outsider Clarity', 'Cultural Awareness', 'Gentleness & Respect', 'Welcome over Judgment', 'Kingdom over Party',
    'Humility & Integrity', 'Love Made Visible', 'Invitation & Dialogue', 'Clear Conviction', 'Self-Presentation Alignment',
  ]);
  for (const c of content.rubric.criteria) assert.deepEqual(Object.keys(c.guidance), ['1', '2', '3', '4', '5'], c.key);
});

test('persona set v1 has the seven PRD Personas with the convention keys', () => {
  assert.deepEqual(content.personaSet.personas.map((p) => p.key), [
    'seeker', 'drifter', 'neighbor_other_faith', 'exvangelical', 'skeptic', 'progressive', 'emboldened_believer',
  ]);
  assert.deepEqual(content.personaSet.target_audiences.map((a) => a.key), ['curious', 'dechurched', 'other_faiths', 'secular', 'believers']);
  assert.equal(content.personaSet.personas.find((p) => p.key === 'emboldened_believer').frame, 'believer_behaviour');
});

test('the default model is claude-opus-5-5 and the picker offers Opus, Sonnet and Haiku 5.5', () => {
  assert.equal(content.models.default, 'claude-opus-5-5');
  assert.deepEqual(content.models.artifact_picker.map((m) => m.id), ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']);
});

test('no prompt uses the word "verdict" except to forbid it', () => {
  for (const [file, text] of Object.entries(content.prompts.files)) {
    const uses = text.split('\n').filter((line) => /verdict/i.test(line) && !/never use the word "verdict"/i.test(line));
    assert.deepEqual(uses, [], file);
  }
});
