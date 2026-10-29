// The "Try the demo" sample Review (PRD FR-24, ARCHITECTURE.md AD-12).
// Pure: no DOM, no I/O. The build checks artifact/sample-review.json with checkSampleReview and
// inlines it as SAMPLE_REVIEW; the page replays it on the guided demo's Send with samplePosts.
// The sample keeps the shape of a saved Review's JSON appendix (export.js), with no screenshot,
// profile link or handle. A Post's link may be kept when it is an Instagram post link (the
// public reel the tour fills in for the viewer, PRD §7.2 exception); otherwise it is null.

import { validateAssessShape, validateAssessRules, applyOverrides, derive, validateReact, validateDiscuss, validateRewrite, validateOutreach, isInstagramPostLink } from './core.js';

const SAMPLE_KEYS = ['exported_at', 'versions', 'review_source_url', 'posts', 'outreach'];
const SAMPLE_POST_KEYS = ['position', 'status', 'source_url', 'pasted_text', 'video_transcript', 'screenshot_count', 'evaluation'];
const EVALUATION_KEYS = ['post_transcript', 'assessment', 'reactions', 'discussion_questions', 'gentler_rewrite', 'lands_well', 'rewrite_mode', 'models'];
const RESAVE = 'Run the sample Post in the live Artifact, save the Review and replace artifact/sample-review.json with its JSON appendix (links set to null).';
const HANDLE = /@\w/;

function isPlainRecord(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function exactKeys(obj, keys, path, errors) {
  if (!isPlainRecord(obj)) {
    errors.push(`${path}: expected an object`);
    return false;
  }
  const before = errors.length;
  for (const k of Object.keys(obj)) if (!keys.includes(k)) errors.push(`${path}.${k}: unknown field`);
  for (const k of keys) if (!(k in obj)) errors.push(`${path}.${k}: missing`);
  return errors.length === before;
}

function prefixed(path, list) {
  return list.map((e) => `${path}: ${e}`);
}

// One saved Evaluation, checked with the same validators the pipeline uses.
function checkSampleEvaluation(ev, content, path) {
  const errors = [];
  if (!exactKeys(ev, EVALUATION_KEYS, path, errors)) return errors;
  const { rubric, personaSet } = content;
  const personaKeys = personaSet.personas.map((p) => p.key);

  const assess = { post_transcript: ev.post_transcript, ...(isPlainRecord(ev.assessment) ? ev.assessment : {}) };
  const shape = validateAssessShape(assess, rubric);
  if (shape.length) {
    errors.push(...prefixed(path, shape));
  } else {
    const rules = validateAssessRules(ev.assessment);
    errors.push(...prefixed(path, rules));
    if (JSON.stringify(applyOverrides(ev.assessment, rubric, 'others')) !== JSON.stringify(ev.assessment)) {
      errors.push(`${path}: own-content Criteria must be N/A on an Others’ Review`);
    }
    if (!rules.length) {
      const derived = derive(ev.assessment, rubric);
      if (ev.lands_well !== derived.lands_well || ev.rewrite_mode !== derived.rewrite_mode) {
        errors.push(`${path}: lands_well and rewrite_mode do not match the scores`);
      }
    }
  }

  errors.push(...prefixed(path, validateReact(ev.reactions, personaKeys).errors));
  if (ev.discussion_questions === null) errors.push(`${path}.discussion_questions: missing`);
  else errors.push(...prefixed(path, validateDiscuss(ev.discussion_questions, personaKeys).errors));

  if (ev.gentler_rewrite !== null) errors.push(...prefixed(path, validateRewrite(ev.gentler_rewrite).errors));
  if (ev.rewrite_mode === 'auto' && ev.gentler_rewrite === null) errors.push(`${path}.gentler_rewrite: required when rewrite_mode is auto`);
  if (['none', 'not_assessable'].includes(ev.rewrite_mode) && ev.gentler_rewrite !== null) {
    errors.push(`${path}.gentler_rewrite: must be null when rewrite_mode is ${ev.rewrite_mode}`);
  }

  const models = ev.models;
  const needed = ['assess', 'react', 'discuss', ...(ev.gentler_rewrite ? ['rewrite'] : [])];
  if (!isPlainRecord(models) || needed.some((k) => typeof models[k] !== 'string' || !models[k].trim())) {
    errors.push(`${path}.models: needs the model for ${needed.join(', ')}`);
  }
  return errors;
}

function isTextOrNull(v) {
  return v === null || typeof v === 'string';
}

// Returns error strings; an empty list means the sample may ship. `labels` are the page's
// version labels (FR-7): a sample saved under other versions must be saved again.
export function checkSampleReview(sample, content, labels) {
  const errors = [];
  if (!exactKeys(sample, SAMPLE_KEYS, 'sample', errors)) return errors;

  const v = sample.versions;
  if (!isPlainRecord(v) || v.rubric !== labels.rubric || v.personas !== labels.personas || v.prompts !== labels.prompts) {
    const saved = isPlainRecord(v) ? `${v.rubric} · ${v.personas} · ${v.prompts}` : 'no versions';
    errors.push(`sample.versions: saved with ${saved}, but the page uses ${labels.rubric} · ${labels.personas} · ${labels.prompts}. ${RESAVE}`);
  }
  if (Object.values(labels).some((l) => String(l).endsWith('-draft'))) errors.push('sample.versions: the page uses unlocked (draft) versions; lock them first');
  if (sample.review_source_url !== null) errors.push('sample.review_source_url: a sample holds no profile link');

  if (!Array.isArray(sample.posts) || sample.posts.length === 0) {
    errors.push('sample.posts: expected at least one Post');
    return errors;
  }
  sample.posts.forEach((post, i) => {
    const path = `sample.posts[${i}]`;
    if (!exactKeys(post, SAMPLE_POST_KEYS, path, errors)) return;
    if (post.position !== i + 1) errors.push(`${path}.position: expected ${i + 1}`);
    if (post.status !== 'done') errors.push(`${path}.status: every sample Post must be evaluated (done)`);
    if (post.source_url !== null && !isInstagramPostLink(post.source_url)) {
      errors.push(`${path}.source_url: a sample Post's link is null or an Instagram post link`);
    }
    if (post.screenshot_count !== 0) errors.push(`${path}.screenshot_count: a sample Post has no screenshots`);
    if (!isTextOrNull(post.pasted_text) || !isTextOrNull(post.video_transcript) || !(post.pasted_text || post.video_transcript)) {
      errors.push(`${path}: needs its text or video transcript`);
    }
    if (HANDLE.test(JSON.stringify(post))) errors.push(`${path}: names an @handle`);
    if (post.status === 'done') errors.push(...checkSampleEvaluation(post.evaluation, content, `${path}.evaluation`));
  });

  // The Outreach Plan is optional; when present it must be a finished, valid plan.
  const o = sample.outreach;
  if (o !== null && exactKeys(o, ['status', 'output', 'model'], 'sample.outreach', errors)) {
    if (o.status !== 'done') errors.push('sample.outreach.status: expected done');
    if (typeof o.model !== 'string' || !o.model.trim()) errors.push('sample.outreach.model: missing');
    if (HANDLE.test(JSON.stringify(o.output))) errors.push('sample.outreach: names an @handle');
    const valid = validateOutreach(
      o.output,
      content.rubric.criteria.map((c) => c.key),
      content.personaSet.personas.map((p) => p.key),
      sample.posts.map((p) => p.position),
    );
    errors.push(...prefixed('sample.outreach.output', valid.errors));
  }
  return errors;
}

// The page's Post state for a checked sample, ids from `firstId`. Each call returns fresh
// copies, so loading the sample again always restores it unchanged. `demo` marks sample Posts.
export function samplePosts(sample, firstId = 1) {
  return sample.posts.map((p, i) => ({
    id: firstId + i,
    pasted_text: p.pasted_text || '',
    video_transcript: p.video_transcript || '',
    source_url: p.source_url || '',
    images: [],
    status: 'done',
    evaluation: structuredClone(p.evaluation),
    error: null,
    rewriteStatus: 'idle',
    demo: true,
  }));
}

// The link the guided demo fills in for the viewer: the first sample Post's, or '' when it has none.
export function sampleLink(sample) {
  return (sample && sample.posts && sample.posts[0] && sample.posts[0].source_url) || '';
}

function sameValue(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => Object.hasOwn(b, k) && sameValue(a[k], b[k]));
}

// True when a Post (page state or a saved record) is one of the sample's Posts, unchanged: same
// link, text, transcript and Evaluation. A demo Review reopened from Saved Reviews keeps its notice.
export function isSamplePost(sample, post) {
  if (!sample || !post || post.status !== 'done' || !post.evaluation) return false;
  return sample.posts.some((p) => (p.source_url || '') === (post.source_url || '')
    && (p.pasted_text || '') === (post.pasted_text || '')
    && (p.video_transcript || '') === (post.video_transcript || '')
    && sameValue(p.evaluation, post.evaluation));
}
