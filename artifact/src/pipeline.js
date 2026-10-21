// Orchestration shell of the Demo Artifact (ARCHITECTURE.md AD-2, AD-4, AD-6, AD-10).
// Calls Claude only through the `sample` capability (AD-7), never loops or retries
// on its own (AD-4), and keeps everything in page memory (AD-12).
//
// ctx = { sample, content, model }:
//   sample  the function from `await claude.use("sample")`
//   content the inlined data: { rubric, personaSet, prompts: { manifest, files } }
//   model   the picked entry from config/models.json `artifact_picker`

import {
  canonicalJson, tagData, renderPrompt, extractJson, checkAssess, derive, withoutSoundness,
  validateReact, validateDiscuss, validateRewrite, validateOutreach, redactAll, posterHandleFromUrl,
} from './core.js';

const NOT_GRANTED_CODES = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
const IMAGE_CODES = ['image_rejected', 'images_unavailable'];

// Map a `sample` rejection code to the per-Post error code the UI shows (AD-12).
export function mapSampleCode(code) {
  if (code === 'refused' || code === 'rate_limited' || code === 'cancelled') return code;
  if (NOT_GRANTED_CODES.includes(code)) return 'not_granted';
  if (IMAGE_CODES.includes(code)) return 'image_rejected';
  if (code === 'invalid_json') return 'invalid_model_output';
  return 'upstream_error';
}

function stepError(step, code, details) {
  const err = new Error(`${step}: ${code}`);
  err.step = step;
  err.code = code;
  err.details = details || [];
  return err;
}

function staticValues(content) {
  const { prompts, rubric, personaSet } = content;
  return {
    guardrails: prompts.files[prompts.manifest.guardrails.file],
    criteria: canonicalJson(rubric.criteria),
    personas: canonicalJson(personaSet.personas),
  };
}

async function callStep(ctx, step, values, { images, cache }) {
  const spec = ctx.content.prompts.manifest.steps[step];
  const prompt = renderPrompt(ctx.content.prompts.files[spec.file], values, spec.placeholders);
  const options = { model: ctx.model.id, modelTier: ctx.model.sample_tier };
  if (images && images.length) options.images = images;
  if (cache === false) options.cache = false;

  let answer;
  try {
    answer = await ctx.sample(prompt, options);
  } catch (e) {
    throw stepError(step, mapSampleCode(e && e.code));
  }
  if (answer.truncated) throw stepError(step, 'invalid_model_output', ['reply was cut short']);
  let parsed;
  try {
    parsed = extractJson(answer.text);
  } catch {
    throw stepError(step, 'invalid_model_output', ['reply held no JSON object']);
  }
  // Provenance is the model that answered, never the requested constant (AD-6).
  const model = answer.modelApplied || `${answer.modelTierApplied} tier`;
  return { parsed, model };
}

function check(step, outcome) {
  if (!outcome.ok) throw stepError(step, 'invalid_model_output', outcome.errors);
  return outcome.value;
}

function postText(post, postTranscript) {
  return { pasted_text: post.pasted_text || null, video_transcript: post.video_transcript || null, post_transcript: postTranscript };
}

// Evaluate one Post: step 1 (Assess + React in parallel, with images), derive, then
// step 2 (Discuss, plus Rewrite when rewrite_mode is auto). `onRound` renders step 1
// as soon as both calls validate (AD-10). Throws an Error with `.code` and `.step`.
export async function evaluatePost(ctx, post, { reviewSourceUrl, cache, onRound }) {
  const { rubric, personaSet } = ctx.content;
  const personaKeys = personaSet.personas.map((p) => p.key);
  const poster = posterHandleFromUrl(post.source_url) || posterHandleFromUrl(reviewSourceUrl);
  const base = staticValues(ctx.content);
  const images = post.images.map((img) => img.blob);

  const step1Post = tagData('post', {
    pasted_text: post.pasted_text || null,
    video_transcript: post.video_transcript || null,
    screenshot_count: images.length,
  });
  const [assess, react] = await Promise.all([
    callStep(ctx, 'assess', { ...base, foundation: tagData('creator_foundation', null), post: step1Post }, { images, cache }),
    callStep(ctx, 'react', { ...base, post: step1Post }, { images, cache }),
  ]);

  const checked = check('assess', checkAssess(assess.parsed, rubric, 'others'));
  const { post_transcript, ...assessmentRaw } = redactAll(checked, poster);
  const derived = derive(assessmentRaw, rubric);
  const reactions = redactAll(check('react', validateReact(react.parsed, personaKeys)), poster);

  const evaluation = {
    post_transcript,
    assessment: assessmentRaw,
    reactions,
    discussion_questions: null,
    gentler_rewrite: null,
    lands_well: derived.lands_well,
    rewrite_mode: derived.rewrite_mode,
    models: { assess: assess.model, react: react.model },
  };
  if (onRound) onRound(evaluation);

  // Step 2. Images are never sent outside step 1 (AD-2).
  const step2Post = tagData('post', postText(post, post_transcript));
  const assessmentForDiscuss = { ...assessmentRaw, lands_well: derived.lands_well, rewrite_mode: derived.rewrite_mode };
  const assessmentForRewrite = withoutSoundness(assessmentForDiscuss);
  const shared = { ...base, post: step2Post, reactions: tagData('reactions', reactions) };

  const [discuss, rewrite] = await Promise.all([
    callStep(ctx, 'discuss', { ...shared, assessment: tagData('assessment', assessmentForDiscuss) }, { cache }),
    derived.rewrite_mode === 'auto'
      ? callStep(ctx, 'rewrite', { ...shared, assessment: tagData('assessment', assessmentForRewrite) }, { cache })
      : null,
  ]);
  evaluation.discussion_questions = redactAll(check('discuss', validateDiscuss(discuss.parsed, personaKeys)), poster);
  evaluation.models.discuss = discuss.model;
  if (rewrite) {
    evaluation.gentler_rewrite = redactAll(check('rewrite', validateRewrite(rewrite.parsed)), poster);
    evaluation.models.rewrite = rewrite.model;
  }
  return evaluation;
}

// The "Suggest a gentler version" action, only when rewrite_mode is offer (FR-11).
export async function requestRewrite(ctx, post, evaluation, { reviewSourceUrl, cache }) {
  if (evaluation.rewrite_mode !== 'offer' || evaluation.gentler_rewrite) throw stepError('rewrite', 'conflict');
  const poster = posterHandleFromUrl(post.source_url) || posterHandleFromUrl(reviewSourceUrl);
  const assessment = withoutSoundness({ ...evaluation.assessment, lands_well: evaluation.lands_well, rewrite_mode: evaluation.rewrite_mode });
  const values = {
    ...staticValues(ctx.content),
    post: tagData('post', postText(post, evaluation.post_transcript)),
    assessment: tagData('assessment', assessment),
    reactions: tagData('reactions', evaluation.reactions),
  };
  const rewrite = await callStep(ctx, 'rewrite', values, { cache });
  return { output: redactAll(check('rewrite', validateRewrite(rewrite.parsed)), poster), model: rewrite.model };
}

// Ministry Outreach Plan over every evaluated Post of the Review (FR-13). Source URLs
// are never sent (AD-13); positions are 1-based places in the Review.
export async function createOutreach(ctx, donePosts, { reviewSourceUrl, cache }) {
  const { rubric, personaSet } = ctx.content;
  const poster = posterHandleFromUrl(reviewSourceUrl);
  const evaluations = donePosts.map(({ position, post, evaluation }) => ({
    position,
    post: postText(post, evaluation.post_transcript),
    assessment: withoutSoundness(evaluation.assessment),
    reactions: evaluation.reactions,
  }));
  const values = {
    guardrails: staticValues(ctx.content).guardrails,
    evaluations: tagData('evaluations', evaluations),
  };
  const outreach = await callStep(ctx, 'outreach', values, { cache });
  const valid = validateOutreach(
    outreach.parsed,
    rubric.criteria.map((c) => c.key),
    personaSet.personas.map((p) => p.key),
    donePosts.map((d) => d.position),
  );
  return { output: redactAll(check('outreach', valid), poster), model: outreach.model };
}
