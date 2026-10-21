// Runs the shared conformance/ vectors against artifact/src/core.js (AD-16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core.js';
import { content, vectors, applyEdits } from './helpers.mjs';

const { rubric, personaSet } = content;
const personaKeys = personaSet.personas.map((p) => p.key);
const criterionKeys = rubric.criteria.map((c) => c.key);

test('vectors target the inlined content versions', () => {
  assert.equal(vectors('derivation.json').rubric, rubric.id);
  assert.equal(vectors('outputs.json').rubric, rubric.id);
  assert.equal(vectors('outputs.json').personas, personaSet.id);
});

for (const c of vectors('derivation.json').cases) {
  test(`derivation: ${c.name}`, () => {
    const assessment = {
      scores: c.scores.map((score, i) => ({ criterion: criterionKeys[i], score, evidence: score === null ? null : 'x', explanation: 'x', offence_sources: [] })),
    };
    assert.deepEqual(core.derive(core.applyOverrides(assessment, rubric, c.kind), rubric), c.expect);
  });
}

const outputs = vectors('outputs.json');
const validators = {
  assess: (o) => core.checkAssess(o, rubric, 'others'),
  react: (o) => core.validateReact(o, personaKeys),
  discuss: (o) => core.validateDiscuss(o, personaKeys),
  rewrite: (o) => core.validateRewrite(o),
  outreach: (o) => core.validateOutreach(o, criterionKeys, personaKeys, outputs.outreach_done_positions),
};
for (const c of outputs.cases) {
  test(`output: ${c.name}`, () => {
    const outcome = validators[c.step](applyEdits(outputs.bases[c.step], c));
    assert.equal(outcome.ok, c.valid, outcome.errors.join('; '));
  });
}

test('override replaces the own-content Criterion with the rubric N/A reason', () => {
  const edited = applyEdits(outputs.bases.assess, { set: [[['scores', 9, 'score'], 5], [['scores', 9, 'evidence'], 'quote']] });
  const { value } = core.checkAssess(edited, rubric, 'others');
  assert.deepEqual(value.scores[9], {
    criterion: 'self_presentation_alignment', score: null, evidence: null,
    explanation: rubric.criteria[9].na_reason_others, offence_sources: [],
  });
});

const escaping = vectors('escaping.json');
for (const c of escaping.escape) test(`escape: ${c.input}`, () => assert.equal(core.escapeData(c.input), c.expect));
for (const c of escaping.tag) test(`tag: <${c.tag}>`, () => assert.equal(core.tagData(c.tag, c.value), c.expect));
for (const c of escaping.render) {
  test(`render: ${c.name}`, () => {
    if (c.error) assert.throws(() => core.renderPrompt(c.template, c.values, c.placeholders));
    else assert.equal(core.renderPrompt(c.template, c.values, c.placeholders), c.expect);
  });
}

for (const c of vectors('extraction.json').cases) {
  test(`extract: ${JSON.stringify(c.text)}`, () => {
    if (c.error) assert.throws(() => core.extractJson(c.text));
    else assert.deepEqual(core.extractJson(c.text), c.expect);
  });
}

const redaction = vectors('redaction.json');
for (const c of redaction.poster_from_url) test(`poster handle: ${c.url}`, () => assert.equal(core.posterHandleFromUrl(c.url), c.expect));
for (const c of redaction.redact) test(`redact: ${c.text}`, () => assert.equal(core.redactHandles(c.text, c.poster), c.expect));

const intake = vectors('intake.json');
test('intake limits match the core constants', () => {
  for (const [k, v] of Object.entries(intake.limits)) assert.equal(core.INTAKE_LIMITS[k], v, k);
});
const expand = (v) => (v && typeof v === 'object' ? v.repeat.repeat(v.times) : v);
for (const c of intake.posts) {
  test(`intake: ${c.name}`, () => {
    const post = Object.fromEntries(Object.entries(c.post).map(([k, v]) => [k, expand(v)]));
    assert.equal(core.checkPostIntake(post, c.maxImages).length === 0, c.valid);
  });
}
for (const c of intake.post_counts) test(`intake: ${c.count} Posts`, () => assert.equal(core.canAddPost(c.count), c.can_add));
