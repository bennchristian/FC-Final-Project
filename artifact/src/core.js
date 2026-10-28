// Pure core of the Demo Artifact (ARCHITECTURE.md AD-3, AD-4, AD-5, AD-16).
// No I/O and no DOM: every function here is data in, data out, so the shared
// conformance vectors can run against it under `node --test`.

export const INTAKE_LIMITS = {
  maxPosts: 10,
  maxImagesPerPost: 4,
  maxPastedText: 4000,
  maxTranscript: 20000,
  maxSourceUrl: 2048,
  maxImageEdge: 1568,
};

const OFFENCE_SOURCES = ['claim', 'tone', 'jargon'];
const VALENCES = ['positive', 'negative', 'mixed'];
const STANDING_KEYS = ['done_differently', 'bible_says', 'jesus_responded', 'jesus_posted'];
const TALKING_POINT_KINDS = ['affirmation', 'concern'];

// ---------- Prompt rendering (AD-5, AD-16) ----------

// Canonical JSON: keys in source order, 2-space indent, LF.
export function canonicalJson(value) {
  return JSON.stringify(value, null, 2);
}

// Every `<` and `>` inside data is written as an entity so data can never close its tag.
export function escapeData(text) {
  return String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// User-derived data goes into a fixed tag as escaped canonical JSON.
export function tagData(tag, value) {
  return `<${tag}>\n${escapeData(canonicalJson(value))}\n</${tag}>`;
}

// Literal, single-pass substitution of {{name}} placeholders. Substituted text is
// never re-scanned, so data containing "{{...}}" stays inert.
export function renderPrompt(template, values, placeholders) {
  const found = new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
  for (const name of placeholders) {
    if (!found.has(name)) throw new Error(`template lacks {{${name}}}`);
    if (typeof values[name] !== 'string') throw new Error(`no value for {{${name}}}`);
  }
  for (const name of found) {
    if (!placeholders.includes(name)) throw new Error(`unknown placeholder {{${name}}}`);
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name]);
}

// ---------- Model output extraction (SCHEMA.md §4.7) ----------

// The JSON substring from the first `{` to the last `}`. Nothing else is stripped.
export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('no JSON object in reply');
  return JSON.parse(text.slice(start, end + 1));
}

// ---------- Validation helpers ----------

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Strict object: exactly these keys, no unknown and no missing ones.
function checkKeys(obj, keys, path, errors) {
  if (!isObject(obj)) {
    errors.push(`${path}: expected an object`);
    return false;
  }
  for (const k of Object.keys(obj)) if (!keys.includes(k)) errors.push(`${path}.${k}: unknown key`);
  for (const k of keys) if (!(k in obj)) errors.push(`${path}.${k}: missing`);
  return true;
}

function checkStringList(list, min, max, path, errors) {
  if (!Array.isArray(list) || list.length < min || list.length > max) {
    errors.push(`${path}: expected ${min}–${max} items`);
    return;
  }
  list.forEach((s, i) => {
    if (!isNonEmptyString(s)) errors.push(`${path}[${i}]: expected a non-empty string`);
  });
}

function result(errors, value) {
  return { ok: errors.length === 0, errors, value: errors.length === 0 ? value : undefined };
}

// ---------- Assess (SCHEMA.md §4.1, AD-3 order) ----------

// Shape only: strict keys, types, and Criterion coverage in rubric order.
export function validateAssessShape(out, rubric) {
  const errors = [];
  if (!checkKeys(out, ['post_transcript', 'scores', 'soundness_flag'], 'assess', errors)) return errors;
  if (typeof out.post_transcript !== 'string') errors.push('assess.post_transcript: expected a string');

  const keys = rubric.criteria.map((c) => c.key);
  if (!Array.isArray(out.scores) || out.scores.length !== keys.length) {
    errors.push(`assess.scores: expected exactly ${keys.length} entries`);
  } else {
    out.scores.forEach((s, i) => {
      const path = `assess.scores[${i}]`;
      if (!checkKeys(s, ['criterion', 'score', 'evidence', 'explanation', 'offence_sources'], path, errors)) return;
      if (s.criterion !== keys[i]) errors.push(`${path}.criterion: expected ${keys[i]}`);
      if (s.score !== null && !(Number.isInteger(s.score) && s.score >= rubric.scale.min && s.score <= rubric.scale.max)) {
        errors.push(`${path}.score: expected an integer ${rubric.scale.min}–${rubric.scale.max} or null`);
      }
      if (s.evidence !== null && typeof s.evidence !== 'string') errors.push(`${path}.evidence: expected a string or null`);
      if (typeof s.explanation !== 'string') errors.push(`${path}.explanation: expected a string`);
      if (!Array.isArray(s.offence_sources)) {
        errors.push(`${path}.offence_sources: expected an array`);
      } else {
        if (s.offence_sources.some((o) => !OFFENCE_SOURCES.includes(o))) errors.push(`${path}.offence_sources: unknown source`);
        if (new Set(s.offence_sources).size !== s.offence_sources.length) errors.push(`${path}.offence_sources: duplicate`);
      }
    });
  }

  const flag = out.soundness_flag;
  if (flag !== null && checkKeys(flag, ['line', 'why'], 'assess.soundness_flag', errors)) {
    if (!isNonEmptyString(flag.line) || !isNonEmptyString(flag.why)) errors.push('assess.soundness_flag: line and why must be non-empty');
  }
  return errors;
}

// On an Others' Review, every Criterion whose applies_to is own_content is forced to
// N/A with the rubric's na_reason_others. Identified by applies_to, never by key.
export function applyOverrides(out, rubric, kind) {
  if (kind !== 'others') return out;
  const scores = out.scores.map((s, i) => {
    const criterion = rubric.criteria[i];
    if (criterion.applies_to !== 'own_content') return s;
    return { criterion: s.criterion, score: null, evidence: null, explanation: criterion.na_reason_others, offence_sources: [] };
  });
  return { ...out, scores };
}

// Cross-field rules, run after the overrides.
export function validateAssessRules(out) {
  const errors = [];
  out.scores.forEach((s, i) => {
    const path = `assess.scores[${i}]`;
    if (s.score !== null && !isNonEmptyString(s.evidence)) errors.push(`${path}.evidence: required when scored`);
    if (s.score === null && isNonEmptyString(s.evidence)) errors.push(`${path}.evidence: must be empty for N/A`);
    if (!isNonEmptyString(s.explanation)) errors.push(`${path}.explanation: must be non-empty`);
    const sources = s.offence_sources;
    if (s.score === null && sources.length > 0) errors.push(`${path}.offence_sources: must be empty for N/A`);
    if (s.score !== null && s.score <= 3 && sources.length === 0) errors.push(`${path}.offence_sources: required at 3 or below`);
    if (s.score !== null && s.score < 3 && !sources.includes('tone') && !sources.includes('jargon')) {
      errors.push(`${path}.offence_sources: a score below 3 needs tone or jargon (claim alone never lowers a score)`);
    }
  });
  return errors;
}

// parse → shape-validate → overrides → cross-field validate (AD-3).
export function checkAssess(out, rubric, kind) {
  const shapeErrors = validateAssessShape(out, rubric);
  if (shapeErrors.length) return result(shapeErrors);
  const overridden = applyOverrides(out, rubric, kind);
  return result(validateAssessRules(overridden), overridden);
}

// ---------- Derivation (AD-3) ----------

// S = non-null scores after overrides. N/A never enters a comparison.
export function derive(assessment, rubric) {
  const S = assessment.scores.map((s) => s.score).filter((v) => v !== null);
  if (S.length === 0) return { lands_well: false, rewrite_mode: 'not_assessable' };
  const min = Math.min(...S);
  const t = rubric.thresholds;
  let rewrite_mode = 'none';
  if (min < t.auto_rewrite_below) rewrite_mode = 'auto';
  else if (min === t.offer_rewrite_at) rewrite_mode = 'offer';
  return { lands_well: min >= t.lands_well_min, rewrite_mode };
}

export function withoutSoundness(assessment) {
  const { soundness_flag, ...rest } = assessment;
  return rest;
}

// ---------- React, Discuss, Rewrite, Outreach (SCHEMA.md §4.2–§4.5) ----------

export function validateReact(out, personaKeys) {
  const errors = [];
  if (!checkKeys(out, ['reactions'], 'react', errors)) return result(errors);
  if (!Array.isArray(out.reactions)) return result(['react.reactions: expected an array']);
  const seen = new Set();
  out.reactions.forEach((r, i) => {
    const path = `react.reactions[${i}]`;
    if (!checkKeys(r, ['persona', 'felt_response', 'valence', 'reasons'], path, errors)) return;
    if (!personaKeys.includes(r.persona)) errors.push(`${path}.persona: unknown key`);
    if (seen.has(r.persona)) errors.push(`${path}.persona: duplicate`);
    seen.add(r.persona);
    if (!isNonEmptyString(r.felt_response)) errors.push(`${path}.felt_response: must be non-empty`);
    if (!VALENCES.includes(r.valence)) errors.push(`${path}.valence: unknown value`);
    checkStringList(r.reasons, 1, 3, `${path}.reasons`, errors);
  });
  for (const k of personaKeys) if (!seen.has(k)) errors.push(`react.reactions: missing persona ${k}`);
  return result(errors, out);
}

export function validateDiscuss(out, personaKeys) {
  const errors = [];
  if (!checkKeys(out, ['questions'], 'discuss', errors)) return result(errors);
  const qs = out.questions;
  if (!Array.isArray(qs) || qs.length < 4 || qs.length > 6) return result(['discuss.questions: expected 4–6 items']);
  const counts = Object.fromEntries(STANDING_KEYS.map((k) => [k, 0]));
  qs.forEach((q, i) => {
    const path = `discuss.questions[${i}]`;
    if (!checkKeys(q, ['text', 'standing', 'persona'], path, errors)) return;
    if (!isNonEmptyString(q.text)) errors.push(`${path}.text: must be non-empty`);
    if (q.standing !== null && !STANDING_KEYS.includes(q.standing)) errors.push(`${path}.standing: unknown key`);
    if (q.standing !== null && counts[q.standing] !== undefined) counts[q.standing] += 1;
    if (q.persona !== null && !personaKeys.includes(q.persona)) errors.push(`${path}.persona: unknown key`);
  });
  for (const k of STANDING_KEYS) if (counts[k] !== 1) errors.push(`discuss.questions: standing ${k} must appear exactly once`);
  return result(errors, out);
}

export function validateRewrite(out) {
  const errors = [];
  if (!checkKeys(out, ['rewrite', 'changes'], 'rewrite', errors)) return result(errors);
  if (!isNonEmptyString(out.rewrite)) errors.push('rewrite.rewrite: must be non-empty');
  checkStringList(out.changes, 1, 5, 'rewrite.changes', errors);
  return result(errors, out);
}

export function validateOutreach(out, criterionKeys, personaKeys, donePositions) {
  const errors = [];
  if (!checkKeys(out, ['outreach_message', 'talking_points'], 'outreach', errors)) return result(errors);
  if (!isNonEmptyString(out.outreach_message)) errors.push('outreach.outreach_message: must be non-empty');
  const tps = out.talking_points;
  if (!Array.isArray(tps) || tps.length < 3 || tps.length > 5) return result([...errors, 'outreach.talking_points: expected 3–5 items']);
  let concerns = 0;
  tps.forEach((tp, i) => {
    const path = `outreach.talking_points[${i}]`;
    if (!checkKeys(tp, ['post_position', 'criterion', 'kind', 'text', 'change', 'persona'], path, errors)) return;
    if (!donePositions.includes(tp.post_position)) errors.push(`${path}.post_position: not an evaluated Post`);
    if (!criterionKeys.includes(tp.criterion)) errors.push(`${path}.criterion: unknown key`);
    if (!TALKING_POINT_KINDS.includes(tp.kind)) errors.push(`${path}.kind: unknown value`);
    if (!isNonEmptyString(tp.text)) errors.push(`${path}.text: must be non-empty`);
    if (tp.kind === 'concern') {
      concerns += 1;
      if (!isNonEmptyString(tp.change)) errors.push(`${path}.change: required for a concern`);
    } else if (tp.change !== null && typeof tp.change !== 'string') {
      errors.push(`${path}.change: expected a string or null`);
    }
    if (tp.persona !== null && !personaKeys.includes(tp.persona)) errors.push(`${path}.persona: unknown key`);
  });
  if (concerns > 3) errors.push('outreach.talking_points: at most 3 concerns');
  return result(errors, out);
}

// ---------- Third-party privacy (AD-5) ----------

const RESERVED_PATH_SEGMENTS = new Set([
  'p', 'reel', 'reels', 'tv', 'stories', 'explore', 'video', 'videos', 'watch', 'status', 'share',
  'hashtag', 'channel', 'c', 'user', 'groups', 'pages', 'permalink.php', 'profile.php', 'i', 'home', 'search',
]);

// The poster's handle, parsed from the first path segment of a Source URL, or null.
export function posterHandleFromUrl(url) {
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const first = parsed.pathname.split('/').filter(Boolean)[0];
  if (!first) return null;
  const handle = decodeURIComponent(first).replace(/^@/, '');
  if (RESERVED_PATH_SEGMENTS.has(handle.toLowerCase())) return null;
  return /^[A-Za-z0-9_.]{1,30}$/.test(handle) ? handle.toLowerCase() : null;
}

// Each @handle other than the poster's becomes @[name removed]. An @ preceded by a
// word character (an email address) is left alone.
export function redactHandles(text, posterHandle) {
  return text.replace(/(^|[^\w@.])@([A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?)/g, (match, pre, handle) => {
    if (posterHandle && handle.toLowerCase() === posterHandle) return match;
    return `${pre}@[name removed]`;
  });
}

// redactHandles over every string inside a model output.
export function redactAll(value, posterHandle) {
  if (typeof value === 'string') return redactHandles(value, posterHandle);
  if (Array.isArray(value)) return value.map((v) => redactAll(v, posterHandle));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactAll(v, posterHandle)]));
  return value;
}

// ---------- Intake limits (AD-5) ----------

export function checkSourceUrl(url) {
  if (url === '' || url === null || url === undefined) return [];
  if (typeof url !== 'string' || url.length > INTAKE_LIMITS.maxSourceUrl) return ['source_url: too long'];
  if (!/^https?:\/\//i.test(url)) return ['source_url: must start with http:// or https://'];
  try {
    new URL(url);
  } catch {
    return ['source_url: not a valid link'];
  }
  return [];
}

// True for a link to one Instagram post or reel (/p/<id>, /reel/<id>, /reels/<id>, /tv/<id>,
// also after a /<handle>/ or /share/ prefix). Reels are often shared as /p/ links.
export function isInstagramPostLink(url) {
  if (!url || checkSourceUrl(url).length) return false;
  const parsed = new URL(url);
  if (!/^(www\.|m\.)?instagram\.com$/i.test(parsed.hostname)) return false;
  const segments = parsed.pathname.split('/').filter(Boolean);
  const at = segments.findIndex((s) => ['p', 'reel', 'reels', 'tv'].includes(s.toLowerCase()));
  return at !== -1 && at <= 1 && /^[A-Za-z0-9_-]+$/.test(segments[at + 1] || '');
}

// True for a link to one TikTok video or photo post (/@<handle>/video/<id>, /@<handle>/photo/<id>,
// /v/<id>.html, /t/<code>, or a vm./vt. short link).
export function isTikTokPostLink(url) {
  if (!url || checkSourceUrl(url).length) return false;
  const { hostname, pathname } = new URL(url);
  const segments = pathname.split('/').filter(Boolean);
  if (/^(vm|vt)\.tiktok\.com$/i.test(hostname)) return segments.length === 1 && /^[A-Za-z0-9]+$/.test(segments[0]);
  if (!/^(www\.|m\.)?tiktok\.com$/i.test(hostname)) return false;
  if (segments[0] === 't' || segments[0] === 'v') return segments.length === 2 && /^[A-Za-z0-9]+(\.html)?$/.test(segments[1]);
  return segments.length === 3 && /^@[A-Za-z0-9_.]+$/.test(segments[0]) && ['video', 'photo'].includes(segments[1]) && /^\d+$/.test(segments[2]);
}

// Only these links are ever read (AD-13).
export function isReadablePostLink(url) {
  return isInstagramPostLink(url) || isTikTokPostLink(url);
}

// A Post as entered: { pasted_text, video_transcript, image_count, source_url }.
export function checkPostIntake(post, maxImages) {
  const errors = [];
  const text = post.pasted_text || '';
  const transcript = post.video_transcript || '';
  if (!text.trim() && !transcript.trim() && post.image_count === 0) errors.push('post: add text, a transcript or a screenshot');
  if (text.length > INTAKE_LIMITS.maxPastedText) errors.push(`pasted_text: at most ${INTAKE_LIMITS.maxPastedText} characters`);
  if (transcript.length > INTAKE_LIMITS.maxTranscript) errors.push(`video_transcript: at most ${INTAKE_LIMITS.maxTranscript} characters`);
  if (post.image_count > Math.min(INTAKE_LIMITS.maxImagesPerPost, maxImages)) errors.push('images: too many screenshots');
  return [...errors, ...checkSourceUrl(post.source_url)];
}

export function canAddPost(postCount) {
  return postCount < INTAKE_LIMITS.maxPosts;
}

// ---------- Provenance label (AD-6) ----------

// `witness-rubric@n · persona-set@n · prompts@n · <model>`; the Assess model, plus
// "(mixed)" when the calls were answered by different models.
export function provenanceLabel(versionLabels, models) {
  const answered = Object.values(models).filter(Boolean);
  const mixed = new Set(answered).size > 1 ? ' (mixed)' : '';
  return `${versionLabels.rubric} · ${versionLabels.personas} · ${versionLabels.prompts} · ${models.assess}${mixed}`;
}
