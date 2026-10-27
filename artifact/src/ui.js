// UI shell of the Demo Artifact (ARCHITECTURE.md AD-4, AD-5, AD-12, AD-14).
// Plain document, no styling work: visual design is deferred to the design partner.
// Everything renders as text nodes; screenshots appear only as file-name chips.
// `CONTENT` and `LABELS` are inlined by artifact/build.mjs.

import { INTAKE_LIMITS, checkPostIntake, checkSourceUrl, canAddPost, provenanceLabel, isInstagramPostLink } from './core.js';
import { transcribeReel } from './reel.js';
import { sendLetter, resetDesk } from './desk.js';
import { evaluatePost, requestRewrite, createOutreach } from './pipeline.js';
import { reviewToMarkdown } from './export.js';
import { PAST_REVIEWS_SHOWN, pastReviewsPath, reviewTally, pastReviewRecord, pastPostRecord, restorePost, sameVersions } from './past.js';

// ---------- Fixed UI copy (AD-14). Constants, never model output. Wording owned by bmad-ux. ----------

const COPY = {
  simulated: 'Simulated perspective',
  linkNotice: 'The profile link is only shown alongside the results. It is never opened.',
  savedHere: 'Each Review you send is saved to your Past Reviews, which only you can see. Screenshots are never saved.',
  savedNowhere: 'This page cannot save Reviews here: closing or reloading it clears the Review. Use Copy Review or Save Review as file to keep your results.',
  savedToPast: 'Saved to your Past Reviews.',
  pastSaveFailed: 'This Review could not be saved to your Past Reviews. Use Copy Review or Save Review as file to keep it.',
  pastFull: 'Past Reviews are full. Delete an old Review to save new ones.',
  pastUnavailable: 'Past Reviews are not available in this view. Use Copy Review or Save Review as file to keep a Review.',
  pastOtherVersions: 'Scored with other rubric or Persona versions, so it cannot be reopened here.',
  readingReel: 'Reading the reel…',
  soundnessNote: 'A prompt for discussion with a leader, not a ruling.',
  suggestion: 'Suggestion',
  landsAnywhere: 'A post can land on anyone’s page. Whoever you meant it for, people outside the faith may read it too.',
  landsWell: 'Likely to land well. No concerns to raise.',
  notAssessable: 'Nothing in this Post could be assessed.',
};

const ERROR_COPY = {
  invalid_model_output: 'Claude’s answer did not match the expected format. Try again.',
  refused: 'Claude declined to evaluate this Post. Trying again with the same content will give the same result.',
  rate_limited: 'Too many requests for now. Wait a little, then try again.',
  not_granted: 'This page is not allowed to use Claude in this view. Allow it in the artifact’s permissions to run Reviews.',
  image_rejected: 'A screenshot could not be used. Remove it and add a JPEG or PNG instead.',
  upstream_error: 'Claude could not be reached. Try again.',
  cancelled: 'Stopped.',
  conflict: 'That has already been done.',
  screenshots_not_saved: 'This Post’s screenshots were not saved with it. Remove it and add it again to send it.',
};

// Shown only when a reel link is the Post's sole content and could not be read.
const REEL_ERROR_COPY = {
  approval_required: 'This page needs your permission to read reels. Allow it in the artifact’s permissions, or paste the video transcript.',
  not_in_manifest: 'This page is not allowed to read reels in this view. Paste the video transcript instead.',
  server_unavailable: 'The reel could not be read just now. Try again, or paste the video transcript.',
  upstream_error: 'The reel could not be read just now. Try again, or paste the video transcript.',
  rate_limited: 'The reel could not be read just now. Wait a little and try again, or paste the video transcript.',
  empty: 'No spoken words were found at this link. Paste the post’s caption or add screenshots.',
};

function reelErrorText(code) {
  return REEL_ERROR_COPY[code] || 'This reel could not be read here. Paste its video transcript instead.';
}

const FICTIONAL_EXAMPLES = [
  {
    pasted_text: 'Sunday recap \u{1F64C} We were SO blessed in the Word this week. Pastor broke down Rom 8:28 and the altar was FULL! If you’re not plugged into a life group yet, what are you waiting for?? Get connected, get covered. #blessed #CedarHollowFam',
  },
  {
    pasted_text: 'Our nation is under judgment because it has turned its back on God. If you voted for the other side, you need to repent. Wake up, church. This culture HATES Christians and we will not stay silent!',
  },
  {
    pasted_text: 'Last Saturday, 30 of our neighbours (most of whom don’t come to church) helped us repaint the elementary school on Cedar Street. We don’t have all the answers about life, but we believe Jesus cares about our street. Got questions about faith, or want to help next time? Message us. No pressure, and the coffee’s on us.',
  },
];

// ---------- State (page memory only) ----------

const state = {
  sample: null,
  sampleChecked: false,
  downloads: null,
  mcp: null,
  readingReel: false,
  maxImages: 0,
  mediaTypes: [],
  modelId: CONTENT.models.default,
  reviewSourceUrl: '',
  posts: [],
  outreach: null,
  busy: false,
  nextId: 1,
  view: 'home',
  // Past Reviews (past.js): the viewer's private db subtree, when this view has one.
  db: null,
  viewerId: null,
  dbChecked: false,
  reviewId: null,
  savedPostCount: 0,
  saveError: '',
  past: null,
  pastError: '',
  confirmDelete: null,
};

const rubric = CONTENT.rubric;
const personaByKey = Object.fromEntries(CONTENT.personaSet.personas.map((p) => [p.key, p]));
const criterionByKey = Object.fromEntries(rubric.criteria.map((c) => [c.key, c]));
const offenceByKey = Object.fromEntries(rubric.offence_sources.map((o) => [o.key, o]));

function pickedModel() {
  return CONTENT.models.artifact_picker.find((m) => m.id === state.modelId);
}

function ctx() {
  return { sample: state.sample, content: CONTENT, model: pickedModel() };
}

// ---------- DOM helpers ----------

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'onclick') node.addEventListener('click', v);
    else if (k === 'className') node.className = v;
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
  }
  return node;
}

function $(id) {
  return document.getElementById(id);
}

// A Source URL that passed the https?:// check may render as a link (AD-4).
function sourceLink(url) {
  if (!url || checkSourceUrl(url).length) return null;
  return el('a', { href: url, className: 'said', target: '_blank', rel: 'noopener noreferrer' }, url);
}

function simulatedTag() {
  return el('span', { className: 'simulated' }, COPY.simulated);
}

// Text Claude wrote or the viewer supplied, inside the Review results. The owner copy editor
// lets it be retyped on screen but never saves it (editor.js); everything else there is a label.
function said(text) {
  return el('span', { className: 'said' }, text);
}

function errorText(code) {
  return ERROR_COPY[code] || ERROR_COPY.upstream_error;
}

// ---------- Intake ----------

async function downscale(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, INTAKE_LIMITS.maxImageEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/jpeg', 0.85);
  });
}

function addPost(fields) {
  state.posts.push({
    id: state.nextId++,
    pasted_text: fields.pasted_text || '',
    video_transcript: fields.video_transcript || '',
    source_url: fields.source_url || '',
    images: fields.images || [],
    status: 'pending',
    evaluation: null,
    error: null,
    rewriteStatus: 'idle',
  });
  state.outreach = null;
}

// The reel's transcript, or '' when it cannot be read. A failure blocks the Post only
// when the reel link is all it has.
async function readReel(url, hasOtherContent) {
  state.readingReel = true;
  $('intake-errors').textContent = '';
  $('intake-status').textContent = COPY.readingReel;
  render();
  try {
    if (!state.mcp) throw { code: 'not_granted' };
    return await transcribeReel(state.mcp, url);
  } catch (e) {
    if (!hasOtherContent) throw e;
    return '';
  } finally {
    state.readingReel = false;
    $('intake-status').textContent = '';
    render();
  }
}

// Each pair on the form is one choice: only the chosen field is read.
function formMode(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function contentMode() {
  return state.maxImages ? formMode('content-mode') : 'text';
}

function syncFormModes() {
  const video = formMode('video-mode');
  $('link-field').hidden = video !== 'link';
  $('transcript-field').hidden = video !== 'transcript';
  const content = contentMode();
  $('content-choices').hidden = state.maxImages === 0;
  $('content-legend').textContent = state.maxImages ? 'Static posts' : 'Text';
  $('images-field').hidden = content !== 'images';
  $('text-field').hidden = content !== 'text';
}

// True when the form holds anything a Post could be made from.
function formHasContent() {
  const video = formMode('video-mode');
  const content = contentMode();
  return Boolean(
    (video === 'link' ? $('post-url').value.trim() : $('post-transcript').value.trim())
    || (content === 'images' ? $('post-images').files.length : $('post-text').value.trim()),
  );
}

async function onAddPost(event) {
  event.preventDefault();
  await addFromForm();
}

// Adds the form as a Post. False when it could not (the reason is shown under the form).
async function addFromForm() {
  if (state.readingReel) return false;
  const video = formMode('video-mode');
  const content = contentMode();
  const files = content === 'images' ? [...$('post-images').files] : [];
  const fields = {
    pasted_text: content === 'text' ? $('post-text').value : '',
    video_transcript: video === 'transcript' ? $('post-transcript').value : '',
    source_url: video === 'link' ? $('post-url').value.trim() : '',
  };
  if (!fields.video_transcript.trim() && isInstagramPostLink(fields.source_url) && canAddPost(state.posts.length)) {
    try {
      fields.video_transcript = await readReel(fields.source_url, Boolean(fields.pasted_text.trim() || files.length));
    } catch (e) {
      $('intake-errors').textContent = reelErrorText(e && e.code);
      return false;
    }
  }
  const errors = checkPostIntake({ ...fields, image_count: files.length }, state.maxImages);
  if (!canAddPost(state.posts.length)) errors.push(`A Review holds at most ${INTAKE_LIMITS.maxPosts} Posts.`);
  if (errors.length) {
    $('intake-errors').textContent = errors.join(' ');
    return false;
  }
  $('intake-errors').textContent = '';
  try {
    fields.images = await Promise.all(files.map(async (f) => ({ name: f.name, blob: await downscale(f) })));
  } catch {
    $('intake-errors').textContent = 'A screenshot could not be read. Try a JPEG or PNG.';
    return false;
  }
  addPost(fields);
  $('post-form').reset();
  syncFormModes();
  render();
  return true;
}

function onAddExamples() {
  for (const example of FICTIONAL_EXAMPLES) {
    if (canAddPost(state.posts.length)) addPost(example);
  }
  render();
}

function onClearReview() {
  if (state.busy) return;
  state.posts = [];
  state.outreach = null;
  state.reviewSourceUrl = '';
  state.reviewId = null;
  state.savedPostCount = 0;
  state.saveError = '';
  $('review-url').value = '';
  render();
}

function hasSent() {
  return state.posts.some((p) => p.status !== 'pending');
}

// A Post reopened from Past Reviews has screenshot names only, so it cannot be sent again.
function canSend(post) {
  return post.images.every((img) => img.blob);
}

function onReviewUrl() {
  const value = $('review-url').value.trim();
  const errors = checkSourceUrl(value);
  $('review-url-errors').textContent = errors.join(' ');
  state.reviewSourceUrl = errors.length ? '' : value;
  render();
}

// ---------- Running ----------

async function runPost(post, cache) {
  if (!canSend(post)) {
    post.status = 'failed';
    post.error = 'screenshots_not_saved';
    render();
    return;
  }
  post.status = 'evaluating';
  post.error = null;
  post.evaluation = null;
  render();
  try {
    post.evaluation = await evaluatePost(ctx(), post, {
      reviewSourceUrl: state.reviewSourceUrl,
      cache,
      onRound: (partial) => {
        post.evaluation = partial;
        render();
      },
    });
    post.status = 'done';
  } catch (e) {
    post.status = e && e.code === 'refused' ? 'refused' : 'failed';
    post.error = (e && e.code) || 'upstream_error';
    if (e && e.details && e.details.length) console.warn(`Post ${post.id} ${e.step}:`, e.details);
  }
  render();
}

// One Post in flight at a time (AD-10), on an explicit click.
// Send for review: whatever is on the form joins the Review first, then the letter goes into
// the envelope and the Mailbox (desk.js) while the Posts are already being reviewed.
async function onEvaluateAll() {
  if (state.busy || !state.sample) return;
  if (formHasContent() && !(await addFromForm())) return;
  if (!state.posts.some((p) => p.status === 'pending')) {
    $('intake-errors').textContent = 'Add a link, a transcript, screenshots or text first.';
    return;
  }
  state.busy = true;
  state.outreach = null;
  render();
  const flight = sendLetter();
  const run = (async () => {
    for (const post of state.posts) {
      if (post.status === 'pending') await runPost(post, true);
    }
  })();
  await flight;
  showView('results');
  resetDesk();
  await run;
  await saveReview();
  state.busy = false;
  render();
}

// Send feedback: the Ministry Outreach Plan, drafted on this click when there is none yet.
function onSendFeedback() {
  if (!state.posts.some((p) => p.status === 'done')) return;
  showView('results');
  $('outreach-slot').scrollIntoView({ block: 'start' });
  if (!state.outreach && !state.busy) onOutreach(true);
}

async function onTryAgain(post) {
  if (state.busy || !state.sample) return;
  state.busy = true;
  state.outreach = null;
  await runPost(post, false);
  await saveReview();
  state.busy = false;
  render();
}

async function onSuggestRewrite(post) {
  if (state.busy || !state.sample) return;
  state.busy = true;
  post.rewriteStatus = 'running';
  render();
  try {
    const { output, model } = await requestRewrite(ctx(), post, post.evaluation, { reviewSourceUrl: state.reviewSourceUrl, cache: true });
    post.evaluation.gentler_rewrite = output;
    post.evaluation.models.rewrite = model;
    post.rewriteStatus = 'idle';
    await saveReview();
  } catch (e) {
    post.rewriteStatus = (e && e.code) || 'upstream_error';
  }
  state.busy = false;
  render();
}

function donePosts() {
  return state.posts
    .map((post, i) => ({ position: i + 1, post, evaluation: post.evaluation }))
    .filter((d) => d.post.status === 'done');
}

async function onOutreach(cache) {
  if (state.busy || !state.sample || donePosts().length === 0) return;
  state.busy = true;
  state.outreach = { status: 'running' };
  render();
  try {
    const { output, model } = await createOutreach(ctx(), donePosts(), { reviewSourceUrl: state.reviewSourceUrl, cache });
    state.outreach = { status: 'done', output, model };
    await saveReview();
  } catch (e) {
    state.outreach = { status: 'failed', error: (e && e.code) || 'upstream_error' };
  }
  state.busy = false;
  render();
}

// ---------- Past Reviews (the viewer's private db subtree; past.js has the shapes) ----------

function pastCollection() {
  return state.db.collection(pastReviewsPath(state.viewerId));
}

// Called inside a busy section, so writes to one document never overlap.
async function saveReview() {
  if (!state.db || !state.viewerId || !hasSent()) return;
  const ref = state.reviewId ? pastCollection().doc(state.reviewId) : pastCollection().doc();
  try {
    await ref.set(pastReviewRecord(state, LABELS, new Date().toISOString()));
    state.reviewId = ref.id;
    for (const [i, post] of state.posts.entries()) {
      await ref.collection('posts').doc(String(i + 1)).set(pastPostRecord(post, i + 1));
    }
    for (let n = state.posts.length + 1; n <= state.savedPostCount; n++) {
      await ref.collection('posts').doc(String(n)).delete();
    }
    state.savedPostCount = state.posts.length;
    state.saveError = '';
  } catch (e) {
    state.saveError = e && e.code === 'quota_exceeded' ? COPY.pastFull : COPY.pastSaveFailed;
  }
}

async function loadPast() {
  if (!state.db || !state.viewerId) return;
  state.past = { status: 'loading', items: [] };
  render();
  try {
    const snap = await pastCollection().orderBy('savedAt', 'desc').limit(PAST_REVIEWS_SHOWN).get();
    state.past = { status: 'done', items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  } catch {
    state.past = { status: 'failed', items: [] };
  }
  render();
}

// Reopening makes the saved Review the current one: later runs save back to it.
async function onOpenPast(item) {
  if (state.busy) return;
  state.busy = true;
  state.pastError = '';
  render();
  try {
    const snap = await pastCollection().doc(item.id).collection('posts').get();
    const records = snap.docs.map((d) => d.data()).sort((a, b) => a.position - b.position);
    state.posts = records.map((record) => restorePost(record, state.nextId++));
    state.reviewId = item.id;
    state.savedPostCount = records.length;
    state.saveError = '';
    state.reviewSourceUrl = item.reviewSourceUrl || '';
    $('review-url').value = state.reviewSourceUrl;
    if (CONTENT.models.artifact_picker.some((m) => m.id === item.modelId)) state.modelId = item.modelId;
    state.outreach = item.outreach || null;
    state.busy = false;
    showView('results');
  } catch {
    state.busy = false;
    state.pastError = 'That Review could not be opened. Try again later.';
    render();
  }
}

// Two clicks: the first asks, the second deletes the Review and its Posts for good.
async function onDeletePast(item) {
  if (state.busy) return;
  if (state.confirmDelete !== item.id) {
    state.confirmDelete = item.id;
    render();
    return;
  }
  state.confirmDelete = null;
  state.busy = true;
  state.pastError = '';
  const ref = pastCollection().doc(item.id);
  try {
    for (let n = 1; n <= item.postCount; n++) await ref.collection('posts').doc(String(n)).delete();
    await ref.delete();
    if (state.reviewId === item.id) {
      state.reviewId = null;
      state.savedPostCount = 0;
    }
  } catch {
    state.pastError = 'That Review could not be deleted. Try again later.';
  }
  state.busy = false;
  await loadPast();
}

// ---------- Export (the viewer copies or saves; the page keeps nothing) ----------

function exportMarkdown(includeJson) {
  const posts = state.posts.map((post, i) => ({ position: i + 1, post, evaluation: post.evaluation, status: post.status }));
  return reviewToMarkdown({ posts, reviewSourceUrl: state.reviewSourceUrl, outreach: state.outreach }, CONTENT, LABELS, {
    exportedAt: new Date().toISOString(),
    includeJson,
  });
}

async function onCopyReview() {
  const text = exportMarkdown(false);
  const box = $('export-fallback');
  try {
    await navigator.clipboard.writeText(text);
    box.hidden = true;
    $('export-status').textContent = 'Review copied. Paste it into a document to keep it.';
  } catch {
    box.value = text;
    box.hidden = false;
    box.focus();
    box.select();
    $('export-status').textContent = 'Copying is blocked here. The Review is selected below: press Ctrl+C or \u2318C.';
  }
}

async function onSaveReview() {
  if (!state.downloads) return;
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  try {
    await state.downloads.save({ filename: `witness-review-${stamp}.md`, data: exportMarkdown(true) });
    $('export-status').textContent = 'Review saved.';
  } catch (e) {
    const code = e && e.code;
    if (code === 'declined') $('export-status').textContent = 'Not saved.';
    else if (code === 'rate_limited') $('export-status').textContent = 'A save is already waiting for your answer.';
    else {
      state.downloads = null;
      $('export-status').textContent = 'Saving files is not available here. Use Copy Review instead.';
      render();
    }
  }
}

async function onCopy(text, fallbackId) {
  try {
    await navigator.clipboard.writeText(text);
    $('copy-status').textContent = 'Copied.';
  } catch {
    const box = $(fallbackId);
    box.focus();
    box.select();
    $('copy-status').textContent = 'Selected. Press Ctrl+C or ⌘C to copy.';
  }
}

// ---------- Rendering ----------

// Persona cards are a small Markdown subset: paragraphs, "- " list items and **bold**.
function inlineBold(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? el('strong', {}, part) : part));
}

function renderCard(markdown) {
  const blocks = [];
  let list = null;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('- ')) {
      if (!list) blocks.push((list = el('ul', {})));
      list.append(el('li', {}, inlineBold(line.slice(2))));
    } else {
      list = null;
      if (line.trim()) blocks.push(el('p', {}, inlineBold(line)));
    }
  }
  return el('div', { className: 'card' }, blocks);
}

function renderSources(sources) {
  return el('ul', { className: 'sources' }, sources.map((s) => el('li', {}, el('strong', {}, `${s.source}. `), s.principle)));
}

function renderGuidance(criterion, highlight) {
  return el('ol', { className: 'guidance' }, Object.entries(criterion.guidance).map(([n, text]) =>
    el('li', { value: n, className: Number(n) === highlight ? 'current' : '' }, text, Number(n) === highlight ? ' (this Post)' : ''),
  ));
}

function criterionDetails(criterion, score) {
  return el('details', {},
    el('summary', {}, 'How this Criterion is judged, and where it comes from'),
    el('p', {}, `Scores whether ${criterion.scores_whether}`),
    renderGuidance(criterion, score),
    el('p', { className: 'label' }, 'Sources'),
    renderSources(criterion.sources),
  );
}

function renderOffence(keys) {
  if (!keys.length) return null;
  return el('div', {},
    el('span', { className: 'label' }, 'Offence source: '),
    el('ul', {}, keys.map((k) => {
      const o = offenceByKey[k];
      return el('li', {}, el('strong', {}, `${o.name}. `), o.effect);
    })),
  );
}

function renderScores(evaluation) {
  const overview = evaluation.assessment.scores.map((s) => {
    const criterion = criterionByKey[s.criterion];
    return el('tr', { className: s.score !== null && s.score < 3 ? 'concern' : '' },
      el('td', {}, `${criterion.number}. ${criterion.name}`),
      el('td', { className: 'num' }, s.score === null ? 'N/A' : `${s.score} / 5`),
    );
  });
  const details = evaluation.assessment.scores.map((s) => {
    const criterion = criterionByKey[s.criterion];
    return el('div', { className: `criterion${s.score !== null && s.score < 3 ? ' concern' : ''}` },
      el('h5', {}, `${criterion.number}. ${criterion.name}: ${s.score === null ? 'N/A' : `${s.score} / 5`}`),
      s.evidence ? el('p', {}, el('span', { className: 'label' }, 'Evidence: '), el('q', { className: 'said' }, s.evidence)) : null,
      el('p', {}, el('span', { className: 'label' }, s.score === null ? 'Why N/A: ' : 'Why: '), said(s.explanation)),
      renderOffence(s.offence_sources),
      criterionDetails(criterion, s.score),
    );
  });
  return el('div', {},
    el('div', { className: 'table-wrap' },
      el('table', { className: 'overview' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Criterion'), el('th', {}, 'Score'))),
        el('tbody', {}, overview),
      ),
    ),
    details,
  );
}

function renderSummary(evaluation) {
  if (evaluation.rewrite_mode === 'not_assessable') return el('p', { className: 'summary' }, COPY.notAssessable);
  if (evaluation.lands_well) return el('p', { className: 'summary good' }, COPY.landsWell);
  const concerns = evaluation.assessment.scores.filter((s) => s.score !== null && s.score < 3);
  return el('div', { className: 'summary' },
    el('p', {}, `Concerns (${concerns.length}):`),
    el('ul', {}, concerns.map((s) => el('li', {}, `${criterionByKey[s.criterion].name}: `, said(s.explanation)))),
  );
}

function renderReactions(evaluation) {
  return el('section', {},
    el('h4', {}, 'Persona Reactions ', simulatedTag()),
    el('ul', { className: 'reactions' }, evaluation.reactions.reactions.map((r) =>
      el('li', {},
        el('strong', {}, personaByKey[r.persona].name), ' ', simulatedTag(),
        el('div', { className: 'muted' }, personaByKey[r.persona].summary),
        el('div', {}, 'Felt response: ', said(r.felt_response), ` (${r.valence})`),
        el('ul', {}, r.reasons.map((reason) => el('li', { className: 'said' }, reason))),
        el('details', {}, el('summary', {}, `Who is the ${personaByKey[r.persona].name}?`), renderPersona(personaByKey[r.persona])),
      ),
    )),
  );
}

function originalText(post, evaluation) {
  return post.pasted_text || evaluation.post_transcript || '';
}

function renderRewrite(post, evaluation) {
  if (evaluation.gentler_rewrite) {
    const rw = evaluation.gentler_rewrite;
    return el('section', {},
      el('h4', {}, 'Gentler Rewrite'),
      el('div', { className: 'pair' },
        el('div', {}, el('p', { className: 'label' }, 'Original'), el('p', { className: 'pre said' }, originalText(post, evaluation))),
        el('div', {}, el('p', { className: 'label' }, COPY.suggestion), el('p', { className: 'pre said' }, rw.rewrite)),
      ),
      el('p', {}, 'What changed:'),
      el('ul', {}, rw.changes.map((c) => el('li', { className: 'said' }, c))),
    );
  }
  if (evaluation.rewrite_mode === 'offer' && post.status === 'done') {
    const running = post.rewriteStatus === 'running';
    const failed = post.rewriteStatus !== 'idle' && !running;
    return el('section', {},
      el('button', { type: 'button', onclick: () => onSuggestRewrite(post), disabled: state.busy || !state.sample }, running ? 'Writing a gentler version…' : 'Suggest a gentler version'),
      failed ? el('p', { className: 'error' }, errorText(post.rewriteStatus)) : null,
    );
  }
  return null;
}

function renderQuestions(evaluation) {
  if (!evaluation.discussion_questions) return el('p', { className: 'muted' }, 'Writing Discussion Questions…');
  return el('section', {},
    el('h4', {}, 'Discussion Questions'),
    el('ol', {}, evaluation.discussion_questions.questions.map((q) =>
      el('li', {}, said(q.text), q.persona ? [' ', simulatedTag(), ` (${personaByKey[q.persona].name})`] : null),
    )),
  );
}

function renderEvaluation(post) {
  const ev = post.evaluation;
  if (!ev) return null;
  const flag = ev.assessment.soundness_flag;
  return el('div', { className: 'evaluation' },
    el('p', { className: 'muted' }, provenanceLabel(LABELS, ev.models)),
    renderSummary(ev),
    flag ? el('div', { className: 'flag' },
      el('strong', {}, 'Soundness Flag: '), el('q', { className: 'said' }, flag.line), said(` ${flag.why}`),
      el('p', { className: 'muted' }, COPY.soundnessNote)) : null,
    el('h4', {}, 'Rubric Scores'),
    renderScores(ev),
    renderReactions(ev),
    renderRewrite(post, ev),
    renderQuestions(ev),
  );
}

function renderPostContent(post) {
  return [
    post.source_url ? el('p', {}, 'Source: ', sourceLink(post.source_url)) : null,
    post.pasted_text ? el('p', { className: 'pre said' }, post.pasted_text) : null,
    post.video_transcript ? el('details', {}, el('summary', {}, 'Video transcript'), el('p', { className: 'pre said' }, post.video_transcript)) : null,
    post.images.length ? el('p', {}, 'Screenshots: ', post.images.map((img) => el('span', { className: 'chip said' }, img.name))) : null,
  ];
}

// Step 2 of the send page: the Posts in the Review so far.
function renderPostInput(post, index) {
  return el('article', { className: 'post post-input' },
    el('h3', {}, `Post ${index + 1}`, el('span', { className: 'muted' }, post.status === 'pending' ? ' · Ready to send' : ' · Sent')),
    renderPostContent(post),
    !state.busy
      ? el('div', { className: 'row' }, el('button', { type: 'button', onclick: () => { state.posts.splice(index, 1); state.outreach = null; render(); } }, 'Remove'))
      : null,
  );
}

// The results page: one Post and its Evaluation.
function renderPost(post, index) {
  const statusText = { pending: 'Not yet sent', evaluating: 'Reviewing…', done: 'Reviewed', failed: 'Failed', refused: 'Declined' }[post.status];
  const canRetry = (post.status === 'failed' || post.status === 'refused') && !state.busy && state.sample;
  return el('article', { className: 'post' },
    el('h3', {}, `Post ${index + 1}`, el('span', { className: 'muted' }, ` · ${statusText}`)),
    renderPostContent(post),
    post.error ? el('p', { className: 'error' }, errorText(post.error)) : null,
    canRetry ? el('div', { className: 'row' }, el('button', { type: 'button', onclick: () => onTryAgain(post) }, 'Try again')) : null,
    renderEvaluation(post),
  );
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// The overall summary at the top of the results, from code (past.js), never from the model.
function renderOverall() {
  const sent = state.posts.filter((p) => p.status !== 'pending');
  const t = reviewTally(sent);
  const running = sent.some((p) => p.status === 'evaluating');
  const children = [];
  if (t.done === 0) {
    children.push(el('p', { className: 'summary' }, running ? 'Reviewing your Posts…' : 'No Post has been reviewed yet.'));
  } else {
    const headline = t.concerns > 0
      ? (t.done === 1 ? 'This Post has concerns to look at.' : `${plural(t.concerns, 'Post has', 'Posts have')} concerns to look at.`)
      : t.landsWell > 0 ? 'Likely to land well.' : COPY.notAssessable;
    const parts = [`${t.landsWell} likely to land well`, `${t.concerns} with concerns`];
    if (t.notAssessable) parts.push(`${t.notAssessable} could not be assessed`);
    if (t.failed) parts.push(`${t.failed} not reviewed`);
    children.push(
      el('p', { className: `summary overall${t.concerns === 0 && t.landsWell > 0 ? ' good' : ''}` }, headline),
      el('p', { className: 'muted' }, `${plural(t.done, 'Post', 'Posts')} reviewed${running ? ' so far' : ''}: ${parts.join(', ')}.`),
    );
  }
  if (state.saveError) children.push(el('p', { className: 'error' }, state.saveError));
  else if (state.reviewId && !running) children.push(el('p', { className: 'muted' }, COPY.savedToPast));
  return children;
}

function renderPast() {
  const p = state.past;
  $('past-state').textContent = !state.dbChecked
    ? 'Looking for your past Reviews…'
    : !state.db
      ? COPY.pastUnavailable
      : !p || p.status === 'loading'
        ? 'Loading your past Reviews…'
        : p.status === 'failed'
          ? 'Your past Reviews could not be loaded. Try again later.'
          : p.items.length === 0 ? 'No saved Reviews yet. Each Review you send appears here.' : state.pastError;
  if (!p || p.status !== 'done') return [];
  return p.items.map((item) => {
    const t = item.tally || {};
    const openable = sameVersions(item.labels, LABELS);
    const confirming = state.confirmDelete === item.id;
    return el('article', { className: 'past-item' },
      el('h3', {}, new Date(item.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        state.reviewId === item.id ? el('span', { className: 'muted' }, ' · Open now') : null),
      el('p', {}, `${plural(item.postCount, 'Post', 'Posts')}: ${t.landsWell || 0} likely to land well, ${t.concerns || 0} with concerns.`),
      item.reviewSourceUrl ? el('p', {}, 'Profile: ', sourceLink(item.reviewSourceUrl)) : null,
      el('p', { className: 'muted' }, `Versions: ${item.labels ? `${item.labels.rubric} · ${item.labels.personas} · ${item.labels.prompts}` : 'unknown'}`),
      openable ? null : el('p', { className: 'muted' }, COPY.pastOtherVersions),
      el('div', { className: 'row' },
        el('button', { type: 'button', onclick: () => onOpenPast(item), disabled: state.busy || !openable }, 'Open'),
        el('button', { type: 'button', onclick: () => onDeletePast(item), disabled: state.busy }, confirming ? 'Delete for good' : 'Delete'),
        confirming ? el('button', { type: 'button', onclick: () => { state.confirmDelete = null; render(); } }, 'Keep it') : null,
      ),
    );
  });
}

function renderOutreach() {
  const done = donePosts();
  const o = state.outreach;
  const children = [
    el('h2', {}, 'Ministry Outreach Plan'),
    el('p', {}, 'Optional. If you want to raise concerns with the poster: a draft message you can send yourself, plus Talking Points tied to specific Posts. This tool never sends or posts anything.'),
  ];
  if (state.reviewSourceUrl) children.push(el('p', {}, 'Profile: ', sourceLink(state.reviewSourceUrl)));
  if (!o || o.status === 'failed') {
    children.push(el('button', { type: 'button', onclick: () => onOutreach(!o), disabled: state.busy || !state.sample || done.length === 0 },
      o ? 'Try again' : 'Create Ministry Outreach Plan'));
    if (done.length === 0) children.push(el('p', { className: 'muted' }, 'Evaluate at least one Post first.'));
    if (o) children.push(el('p', { className: 'error' }, errorText(o.error)));
  } else if (o.status === 'running') {
    children.push(el('p', {}, 'Writing the plan…'));
  } else {
    const message = o.output.outreach_message;
    children.push(
      el('p', { className: 'muted' }, `Written by ${o.model}`),
      el('h3', {}, 'Outreach Message'),
      el('textarea', { id: 'outreach-message', readonly: true, rows: 10 }, message),
      el('div', { className: 'row' },
        el('button', { type: 'button', onclick: () => onCopy(message, 'outreach-message') }, 'Copy message'),
        el('span', { id: 'copy-status', className: 'muted', 'aria-live': 'polite' }),
      ),
      el('h3', {}, 'Talking Points'),
      el('ul', {}, o.output.talking_points.map((tp) => el('li', {},
        el('strong', {}, `${tp.kind === 'concern' ? 'Concern' : 'Affirmation'} · Post ${tp.post_position} · ${criterionByKey[tp.criterion].name}: `),
        said(tp.text),
        tp.change ? el('div', {}, 'Change: ', said(tp.change)) : null,
        tp.persona ? el('div', {}, simulatedTag(), ` (${personaByKey[tp.persona].name})`) : null,
      ))),
      el('button', { type: 'button', onclick: () => onOutreach(false), disabled: state.busy }, 'Write a new plan'),
    );
  }
  return el('section', { id: 'outreach' }, children);
}

function render() {
  const picker = $('model');
  picker.disabled = state.posts.length > 0; // locked once the Review has Posts (AD-6)
  picker.value = state.modelId;

  $('availability').textContent = !state.sampleChecked
    ? 'Connecting to Claude…'
    : state.sample
      ? ''
      : 'Claude is not available in this view, so Reviews cannot run here. Open this page as a Claude artifact to use it.';
  syncFormModes();
  $('post-images').setAttribute('accept', state.mediaTypes.join(','));
  $('images-hint').textContent = `Up to ${state.maxImages} screenshots. They are sent to Claude only while this Post is evaluated and are never shown or kept.`;
  $('post-count').textContent = `${state.posts.length} of ${INTAKE_LIMITS.maxPosts} Posts`;
  $('add-post').disabled = state.readingReel || !canAddPost(state.posts.length);

  const anyDone = state.posts.some((p) => p.status === 'done');
  $('evaluate-all').disabled = state.busy || !state.sample;
  $('clear-review').disabled = state.busy || state.posts.length === 0;
  // aria-disabled, not disabled, so its explanation still shows on hover before there are results.
  $('send-feedback').setAttribute('aria-disabled', String(!anyDone || state.busy));
  $('copy-review').disabled = !anyDone;
  $('save-review').disabled = !anyDone;
  $('save-review').hidden = !state.downloads;
  $('next-post').disabled = state.busy;
  $('save-note').textContent = state.db ? COPY.savedHere : COPY.savedNowhere;

  $('post-list').replaceChildren(...state.posts.map(renderPostInput));
  $('overall').replaceChildren(...renderOverall());
  $('posts').replaceChildren(...state.posts.map((post, i) => (post.status === 'pending' ? null : renderPost(post, i))).filter(Boolean));
  $('outreach-slot').replaceChildren(anyDone ? renderOutreach() : '');
  $('past-list').replaceChildren(...renderPast());
}

function renderPersona(p) {
  return el('div', {},
    renderCard(p.card),
    el('p', { className: 'label' }, 'Drawn from'),
    el('ul', { className: 'sources' }, p.grounded_in.map((g) => el('li', {}, g))),
  );
}

// The "How it works" tab, built from the inlined content so it always matches the
// versions that score the Posts.
function renderHowItWorks() {
  const t = rubric.thresholds;
  $('how-scoring').replaceChildren(
    el('ul', {},
      el('li', {}, `Each Criterion gets a score from ${rubric.scale.min} (poor) to ${rubric.scale.max} (exemplary), or N/A when the Post has nothing that Criterion can assess. N/A never counts against a Post.`),
      el('li', {}, 'Every score quotes the Evidence that earned it and explains why in two or three sentences.'),
      el('li', {}, `Any score below ${t.auto_rewrite_below} is a concern. The Post gets a Gentler Rewrite automatically.`),
      el('li', {}, `If the lowest score is ${t.offer_rewrite_at}, the Post is likely to land well. Scores of ${t.offer_rewrite_at} are shown but not treated as problems, and you can ask for a gentler version.`),
      el('li', {}, `If every score is ${t.offer_rewrite_at + 1} or above, the Post is likely to land well and gets no rewrite.`),
    ),
  );
  $('how-offence').replaceChildren(el('ul', {}, rubric.offence_sources.map((o) =>
    el('li', {}, el('strong', {}, `${o.name}. `), o.meaning, ' ', el('em', {}, o.effect)))));
  $('how-criteria').replaceChildren(...rubric.criteria.map((c) =>
    el('details', { className: 'criterion' },
      el('summary', {}, `${c.number}. ${c.name}`),
      el('p', {}, `Scores whether ${c.scores_whether}`),
      c.applies_to === 'own_content' ? el('p', { className: 'muted' }, `Not used in this demo: ${c.na_reason_others}`) : null,
      el('p', { className: 'label' }, 'What each score means'),
      renderGuidance(c, null),
      el('p', { className: 'label' }, 'Sources'),
      renderSources(c.sources),
    )));
  $('how-personas').replaceChildren(...CONTENT.personaSet.personas.map((p) =>
    el('details', { className: 'criterion' },
      el('summary', {}, p.name, ' ', simulatedTag()),
      el('p', {}, el('em', {}, p.summary)),
      renderPersona(p),
    )));
}

// How it works shows one topic at a time, chosen by the toggle at its top.
function syncHowTab() {
  const tab = formMode('how-tab');
  for (const panel of document.querySelectorAll('.how-panel')) panel.hidden = panel.id !== `how-panel-${tab}`;
}

// One view at a time. The masthead marks Review on the send page and the results. Those two sit
// on the desk beside the Mailbox; Next post shows there only on the results.
const VIEWS = ['home', 'review', 'results', 'profile', 'how', 'roadmap'];
const NAV_FOR = { review: 'review', results: 'review', how: 'how', profile: 'profile' };

function showView(name) {
  state.view = name;
  for (const view of VIEWS) $(`view-${view}`).hidden = view !== name;
  const onDesk = name === 'review' || name === 'results';
  $('desk').hidden = !onDesk;
  // On the desk the footer (Roadmap, versions) sits under the Mailbox, so the page ends with the envelope.
  (onDesk ? $('desk-side') : document.querySelector('main')).append($('page-foot'));
  $('next-post-item').hidden = name !== 'results';
  for (const button of document.querySelectorAll('.tabs [data-nav]')) {
    button.setAttribute('aria-current', button.dataset.nav === NAV_FOR[name] ? 'page' : 'false');
  }
  if (name === 'profile') loadPast();
  render();
  window.scrollTo(0, 0);
}

// Every [data-nav] control (masthead, logo, profile icon, Start reviewing, View past reviews, Roadmap).
// Once a Review has been sent, Review opens its results; Next post goes back to Add Posts.
function onNav(event) {
  const button = event.target.closest('[data-nav]');
  if (!button) return;
  const target = button.dataset.nav;
  showView(target === 'review' && hasSent() ? 'results' : target);
}

function onNextPost() {
  showView('review');
  $('post-url').focus({ preventScroll: true });
  $('post-form').scrollIntoView({ block: 'nearest' });
}

// ---------- Start ----------

function start() {
  $('lands-anywhere').textContent = COPY.landsAnywhere;
  $('link-notice').textContent = COPY.linkNotice;
  $('versions').textContent = `${LABELS.rubric} · ${LABELS.personas} · ${LABELS.prompts}`;
  const picker = $('model');
  picker.replaceChildren(...CONTENT.models.artifact_picker.map((m) => el('option', { value: m.id }, m.label)));
  picker.addEventListener('change', () => { state.modelId = picker.value; });

  $('post-form').addEventListener('submit', onAddPost);
  $('post-form').addEventListener('change', (e) => { if (e.target.type === 'radio') syncFormModes(); });
  $('add-examples').addEventListener('click', onAddExamples);
  $('evaluate-all').addEventListener('click', onEvaluateAll);
  $('clear-review').addEventListener('click', onClearReview);
  $('copy-review').addEventListener('click', onCopyReview);
  $('save-review').addEventListener('click', onSaveReview);
  $('review-url').addEventListener('change', onReviewUrl);
  $('next-post').addEventListener('click', onNextPost);
  $('send-feedback').addEventListener('click', onSendFeedback);
  document.querySelector('main').addEventListener('click', onNav);
  renderHowItWorks();
  $('how-tabs').addEventListener('change', syncHowTab);
  syncHowTab();
  const hashView = location.hash.slice(1);
  showView(['review', 'how', 'roadmap'].includes(hashView) ? hashView : 'home');

  if (window.claude && window.claude.use) {
    window.claude.use('downloads').then((downloads) => {
      state.downloads = downloads;
      render();
    }).catch(() => {});
    window.claude.use('mcp').then((mcp) => {
      state.mcp = mcp;
    }).catch(() => {});
    // Past Reviews need both: db for the store, user for the viewer's private subtree id.
    Promise.all([window.claude.use('db'), window.claude.use('user')]).then(async ([db, user]) => {
      const id = user ? await user.id() : null;
      if (db && id) {
        state.db = db;
        state.viewerId = id;
      }
    }).catch(() => {}).finally(() => {
      state.dbChecked = true;
      if (state.view === 'profile') loadPast();
      else render();
    });
  } else {
    state.dbChecked = true;
  }
  const use = window.claude && window.claude.use ? window.claude.use('sample') : Promise.resolve(null);
  use.then(async (sample) => {
    state.sample = sample;
    if (sample) {
      const limits = await sample.limits().catch(() => null);
      if (limits && limits.images) {
        state.maxImages = Math.min(INTAKE_LIMITS.maxImagesPerPost, limits.images.maxCount);
        state.mediaTypes = limits.images.mediaTypes;
      }
    }
  }).catch(() => {
    state.sample = null;
  }).finally(() => {
    state.sampleChecked = true;
    render();
  });
}

start();
