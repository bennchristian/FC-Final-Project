// UI shell of the Demo Artifact (ARCHITECTURE.md AD-4, AD-5, AD-12, AD-14).
// Plain document, no styling work: visual design is deferred to the design partner.
// Everything renders as text nodes; screenshots appear only as file-name chips.
// `CONTENT` and `LABELS` are inlined by artifact/build.mjs.

import { INTAKE_LIMITS, checkPostIntake, checkSourceUrl, canAddPost, provenanceLabel, isReadablePostLink } from './core.js';
import { readCaption, transcribeReel } from './reel.js';
import { sendLetter, resetDesk } from './desk.js';
import { evaluatePost, requestRewrite, createOutreach } from './pipeline.js';
import { reviewToMarkdown } from './export.js';
import { samplePosts } from './sample.js';
import { PAST_REVIEWS_SHOWN, pastReviewsPath, reviewTally, pastReviewRecord, pastPostRecord, restorePost, sameVersions } from './past.js';
import { samplePosts, sampleLink, isSamplePost } from './sample.js';
import { PROFILE_DOC, profileRecord, personaOrder, profileSummary } from './profile.js';
import { prepareHomeMotion, playHomeMotion } from './home.js';

// ---------- Fixed UI copy (AD-14). Constants, never model output. Wording owned by bmad-ux. ----------

const COPY = {
  simulated: 'Simulated perspectives, not real people’s opinions.',
  linkNotice: 'The profile link is only shown alongside the results. It is never opened.',
  savedHere: 'Each Review you send is saved to your profile’s Saved Reviews, which only you can see. Screenshots are never saved.',
  sampleNotice: 'This is a sample Review of a public Instagram reel. Its results were evaluated ahead of time, so it used none of your Claude usage.',
  savedNowhere: 'This page cannot save Reviews here: closing or reloading it clears the Review. Use Copy Review or Save Review as file to keep your results.',
  savedToPast: 'Saved to your profile.',
  pastSaveFailed: 'This Review could not be saved to your profile. Use Copy Review or Save Review as file to keep it.',
  pastFull: 'Your Saved Reviews are full. Delete an old Review to save new ones.',
  pastUnavailable: 'Saved Reviews are not available in this view. Use Copy Review or Save Review as file to keep a Review.',
  pastOtherVersions: 'Scored with other rubric or Persona versions, so it cannot be reopened here.',
  profileUnavailable: 'Your profile needs your Claude account and this page’s private store, which this view does not have. Open the page as a Claude artifact while signed in.',
  profileFailed: 'Your profile could not be loaded. Try again later.',
  readingPost: 'Reading the post…',
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

// Shown only when a post link is the Post's sole content and could not be read.
const REEL_ERROR_COPY = {
  approval_required: 'This page needs your permission to read posts. Allow it in the artifact’s permissions, or add the post’s text, transcript or screenshots.',
  not_in_manifest: 'This page is not allowed to read posts in this view. Add the post’s text, transcript or screenshots instead.',
  server_unavailable: 'The post could not be read just now. Try again, or add the post’s text, transcript or screenshots.',
  upstream_error: 'The post could not be read just now. Try again, or add the post’s text, transcript or screenshots.',
  rate_limited: 'The post could not be read just now. Wait a little and try again, or add the post’s text, transcript or screenshots.',
  failed: 'The post could not be read just now. Try again, or add the post’s text, transcript or screenshots.',
  empty: 'No caption or spoken words were found at this link. Add the post’s text, transcript or screenshots.',
};

// A connector answer that no other call will get past: the read stops instead of falling back.
const PERMISSION_CODES = ['approval_required', 'not_in_manifest', 'not_granted'];

function reelErrorText(code) {
  return REEL_ERROR_COPY[code] || 'This post could not be read here. Add its text, transcript or screenshots instead.';
}

// ---------- State (page memory only) ----------

const state = {
  sample: null,
  sampleChecked: false,
  downloads: null,
  mcp: null,
  readingPost: false,
  maxImages: 0,
  mediaTypes: [],
  modelId: CONTENT.models.default,
  reviewSourceUrl: '',
  posts: [],
  outreach: null,
  busy: false,
  nextId: 1,
  view: 'home',
  // The guided demo (FR-24, tour.js): on while the tour runs, from Try the demo to End tour or Clear Review.
  demo: false,
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
  // Your profile (profile.js): the stored record, the form being edited, the Posts behind the summary.
  me: null,
  profile: null,
  profileForm: null,
  profileStatus: '',
  statusFor: '',        // which control the status belongs to: 'role', 'audiences' or a text field's key
  editing: {},          // text fields reopened with Edit, by key
  summaryPosts: null,
};

const rubric = CONTENT.rubric;
const personaByKey = Object.fromEntries(CONTENT.personaSet.personas.map((p) => [p.key, p]));
const criterionByKey = Object.fromEntries(rubric.criteria.map((c) => [c.key, c]));
const offenceByKey = Object.fromEntries(rubric.offence_sources.map((o) => [o.key, o]));
const AUDIENCES = CONTENT.personaSet.target_audiences;
const AUDIENCE_KEYS = AUDIENCES.map((a) => a.key);
const PERSONA_KEYS = CONTENT.personaSet.personas.map((p) => p.key);
// The Creator preferences written as text: each has its own Save, Edit and last-edited time.
const PREF_FIELDS = { come_across: 'pref-come-across', theology: 'pref-theology' };

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

// Reads a linked video into `fields` (AD-13): its caption as the text when none was pasted,
// and its spoken words as the transcript. A caption that cannot be read is skipped. A failure
// to read blocks the Post only when the link is all it has.
async function readLinkedPost(fields, imageCount) {
  state.readingPost = true;
  $('intake-errors').textContent = '';
  $('intake-status').textContent = COPY.readingPost;
  render();
  try {
    if (!state.mcp) throw { code: 'not_granted' };
    const caption = await readCaption(state.mcp, fields.source_url).catch((e) => {
      if (e && PERMISSION_CODES.includes(e.code)) throw e;
      return '';
    });
    if (!fields.pasted_text.trim()) fields.pasted_text = caption;
    fields.video_transcript = await transcribeReel(state.mcp, fields.source_url);
  } catch (e) {
    if (!(fields.pasted_text.trim() || fields.video_transcript.trim() || imageCount)) throw e;
  } finally {
    state.readingPost = false;
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
  if (state.readingPost) return false;
  const video = formMode('video-mode');
  const content = contentMode();
  const files = content === 'images' ? [...$('post-images').files] : [];
  const fields = {
    pasted_text: content === 'text' ? $('post-text').value : '',
    video_transcript: video === 'transcript' ? $('post-transcript').value : '',
    source_url: video === 'link' ? $('post-url').value.trim() : '',
  };
  if (isReadablePostLink(fields.source_url) && canAddPost(state.posts.length)) {
    try {
      await readLinkedPost(fields, files.length);
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

function onClearReview() {
  if (state.busy) return;
  if (state.demo) {
    endDemo();
    document.dispatchEvent(new CustomEvent('ll:demo-ended'));
  }
  state.posts = [];
  state.outreach = null;
  state.reviewSourceUrl = '';
  state.reviewId = null;
  state.savedPostCount = 0;
  state.saveError = '';
  $('review-url').value = '';
  render();
}

// "Try the demo" on the intro (FR-24): opens the real, empty Review page with the guided demo on
// (tour.js walks through it). Never over a Review that already holds Posts, and never while a run is busy.
// `detail.loaded` tells the intro whether the demo started, so it fires the tour hook only then.
function onTryDemo(event) {
  if (!sampleLink(SAMPLE_REVIEW) || state.busy || state.readingPost || state.posts.length) return;
  state.demo = true;
  const model = SAMPLE_REVIEW.posts[0].evaluation.models.assess;
  if (CONTENT.models.artifact_picker.some((m) => m.id === model)) state.modelId = model;
  render();
  if (event.detail) event.detail.loaded = true;
}

// End tour, the tour's last card, or Clear Review: the demo is over, and Send runs live again.
function endDemo() {
  state.demo = false;
  delete document.documentElement.dataset.demo;
}

// The demo's Send replays the saved sample instead of calling Claude or Supadata: only while the demo
// is on, the Review is empty, and the form holds exactly the sample's link and nothing else.
function isDemoReplay() {
  const link = sampleLink(SAMPLE_REVIEW);
  return Boolean(state.demo && link && state.posts.length === 0 && !state.reviewSourceUrl && !$('review-url').value.trim()
    && formMode('video-mode') === 'link' && $('post-url').value.trim() === link
    && !$('post-transcript').value.trim() && !$('post-text').value.trim() && $('post-images').files.length === 0);
}

const REPLAY_REVIEWING_MS = 1200;

// Plays a live Send with the saved sample: the envelope flight, the Post "Reviewing…" for a moment,
// then the saved Evaluation. The Review saves to Saved Reviews like any other.
async function replayDemo() {
  state.busy = true;
  document.dispatchEvent(new CustomEvent('ll:demo-replaying'));
  const posts = samplePosts(SAMPLE_REVIEW, state.nextId);
  state.nextId += posts.length;
  const evaluations = posts.map((p) => p.evaluation);
  for (const post of posts) Object.assign(post, { status: 'evaluating', evaluation: null });
  state.posts = posts;
  state.outreach = null;
  state.reviewId = null;
  state.savedPostCount = 0;
  state.saveError = '';
  const model = SAMPLE_REVIEW.posts[0].evaluation.models.assess;
  if (CONTENT.models.artifact_picker.some((m) => m.id === model)) state.modelId = model;
  $('intake-errors').textContent = '';
  $('post-form').reset();
  render();
  await sendLetter();
  showView('results');
  resetDesk();
  await new Promise((resolve) => setTimeout(resolve, REPLAY_REVIEWING_MS));
  posts.forEach((post, i) => Object.assign(post, { status: 'done', evaluation: evaluations[i] }));
  state.outreach = SAMPLE_REVIEW.outreach ? structuredClone(SAMPLE_REVIEW.outreach) : null;
  render();
  await saveReview();
  state.busy = false;
  render();
  document.dispatchEvent(new CustomEvent('ll:demo-replayed', { detail: { canSave: Boolean(state.db && state.viewerId), saved: Boolean(state.reviewId) } }));
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
  if (state.busy) return;
  if (isDemoReplay()) {
    await replayDemo();
    return;
  }
  if (!state.sample) return;
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

// Send feedback: the Ministry Outreach Plan in a popup letter, drafted on this click when there is none yet.
function onSendFeedback() {
  // Matches its aria-disabled: nothing until a Post is reviewed, and not while a run is going.
  if (state.busy || !state.posts.some((p) => p.status === 'done')) return;
  $('feedback').showModal();
  if (!state.outreach && !state.busy) onOutreach(true);
}

// The popup closes with Close, Escape (the dialog's own) or a click outside the letter.
function onFeedbackClick(event) {
  if (event.target.id === 'feedback-close' || !event.target.closest('.feedback-letter')) $('feedback').close();
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
    await ref.set(pastReviewRecord({ ...state, foundation: state.profile }, LABELS, new Date().toISOString()));
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
    // The profile document shares the collection; it is not a Review.
    state.past = { status: 'done', items: snap.docs.filter((d) => d.id !== PROFILE_DOC).map((d) => ({ id: d.id, ...d.data() })) };
  } catch {
    state.past = { status: 'failed', items: [] };
  }
  state.summaryPosts = null;
  render();
  loadSummaryPosts();
}

// ---------- Your profile (one private document beside the Reviews; profile.js has the shapes) ----------

function isCreator() {
  return Boolean(state.profile && state.profile.role === 'creator');
}

function blankProfile() {
  return profileRecord({}, AUDIENCE_KEYS, '');
}

async function loadProfile() {
  if (!state.db || !state.viewerId) return;
  state.profileStatus = 'loading';
  try {
    const snap = await pastCollection().doc(PROFILE_DOC).get();
    state.profile = snap.exists ? profileRecord(snap.data(), AUDIENCE_KEYS, snap.data().updatedAt || '') : null;
    state.profileStatus = '';
  } catch {
    state.profileStatus = 'failed';
  }
  state.profileForm = { ...(state.profile || blankProfile()) };
  for (const [key, id] of Object.entries(PREF_FIELDS)) $(id).value = state.profileForm[key];
  render();
}

// One write at a time, of the whole record: the role saves at once, each text field and the
// audience order on their own Save. Resolves whether it was saved.
async function saveProfile(statusFor) {
  if (!state.db || !state.viewerId || state.profileStatus === 'saving') return false;
  const record = profileRecord(state.profileForm, AUDIENCE_KEYS, new Date().toISOString());
  state.statusFor = statusFor;
  state.profileStatus = 'saving';
  render();
  let saved = false;
  try {
    await pastCollection().doc(PROFILE_DOC).set(record);
    state.profile = record;
    state.profileStatus = 'saved';
    saved = true;
  } catch {
    state.profileStatus = 'failed';
  }
  render();
  if (isCreator()) loadSummaryPosts();
  return saved;
}

function onRoleChange(event) {
  if (event.target.name !== 'profile-role' || !state.profileForm) return;
  state.profileForm.role = event.target.value;
  saveProfile('role');
}

function onPrefsSubmit(event) {
  event.preventDefault();
  saveProfile('audiences');
}

// Edit, Save and Cancel on a text field. Once saved, the field shows as text with when it was last edited.
async function onPrefFieldClick(event) {
  const button = event.target.closest('[data-edit], [data-save], [data-cancel]');
  if (!button || !state.profileForm) return;
  const key = button.dataset.edit || button.dataset.save || button.dataset.cancel;
  const box = $(PREF_FIELDS[key]);
  if (button.dataset.edit) {
    state.editing[key] = true;
    box.value = state.profile ? state.profile[key] : '';
    render();
    box.focus();
  } else if (button.dataset.cancel) {
    state.editing[key] = false;
    box.value = state.profile ? state.profile[key] : '';
    if (state.statusFor === key) state.profileStatus = '';
    render();
    focusPrefField(key);
  } else {
    const before = { [key]: state.profileForm[key], [`${key}_at`]: state.profileForm[`${key}_at`] };
    Object.assign(state.profileForm, { [key]: box.value, [`${key}_at`]: new Date().toISOString() });
    if (await saveProfile(key)) {
      state.editing[key] = false;
      render();
      focusPrefField(key);
    } else {
      // Not saved: the draft stays in the box, and other saves keep the stored text.
      Object.assign(state.profileForm, before);
    }
  }
}

function focusPrefField(key) {
  const field = document.querySelector(`.pref-field[data-field="${key}"]`);
  const target = field.querySelector('.pref-view:not([hidden]) [data-edit]') || $(PREF_FIELDS[key]);
  target.focus();
}

function moveAudience(index, step) {
  const list = state.profileForm.audiences;
  const to = index + step;
  if (to < 0 || to >= list.length) return;
  [list[index], list[to]] = [list[to], list[index]];
  if (state.statusFor === 'audiences') state.profileStatus = '';
  render();
  // Keep focus on the moved audience's button, which render() recreated.
  const button = $('pref-audiences').children[to].querySelector(step < 0 ? '.move-up' : '.move-down');
  (button && !button.disabled ? button : $('pref-audiences').children[to].querySelector('button:not(:disabled)')).focus();
}

// The Posts behind the Profile Summary: every saved Post at this page's versions.
async function loadSummaryPosts() {
  if (!isCreator() || !state.past || state.past.status !== 'done' || state.summaryPosts) return;
  state.summaryPosts = { status: 'loading', posts: [] };
  render();
  try {
    const items = state.past.items.filter((item) => sameVersions(item.labels, LABELS));
    const snaps = await Promise.all(items.map((item) => pastCollection().doc(item.id).collection('posts').get()));
    const posts = snaps.flatMap((snap, i) => snap.docs.map((d) => d.data())
      .filter((record) => record.status === 'done' && record.evaluation)
      .map((record) => ({ evaluation: record.evaluation, savedAt: items[i].savedAt, excerpt: postExcerpt(record) })));
    state.summaryPosts = { status: 'done', posts };
  } catch {
    state.summaryPosts = { status: 'failed', posts: [] };
  }
  render();
}

function postExcerpt(record) {
  const text = (record.pasted_text || record.video_transcript || (record.evaluation && record.evaluation.post_transcript) || '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
  return record.source_url || (record.image_names || []).join(', ') || 'A Post';
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
    state.posts = records.map((record) => ({ ...restorePost(record, state.nextId++), demo: isSamplePost(SAMPLE_REVIEW, record) }));
    state.reviewId = item.id;
    state.savedPostCount = records.length;
    state.saveError = '';
    state.reviewSourceUrl = item.reviewSourceUrl || '';
    $('review-url').value = state.reviewSourceUrl;
    if (CONTENT.models.artifact_picker.some((m) => m.id === item.modelId)) state.modelId = item.modelId;
    state.outreach = item.outreach || null;
    state.busy = false;
    showView('results');
    document.dispatchEvent(new CustomEvent('ll:past-opened'));
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

// One part of a Post's results (Rubric Scores, Persona Reactions, rewrite, questions): a rule above,
// and the part's icon from How it works beside its heading. `tour` names it for the guided demo (tour.js).
function evalPart(icon, title, tour, ...children) {
  return el('section', { className: 'eval-part', 'data-tour': tour },
    title ? el('h4', { className: 'eval-head' }, el('span', { className: `eval-icon icon-${icon}`, 'aria-hidden': 'true' }), title) : null,
    ...children,
  );
}

function scoreLabel(s) {
  return s.score === null ? 'N/A' : `${s.score} / 5`;
}

function isConcern(s) {
  return s.score !== null && s.score < 3;
}

// One Criterion's Evidence, explanation and sources: the column beside the scores table.
function renderCriterion(s) {
  const criterion = criterionByKey[s.criterion];
  return el('div', { className: `criterion${isConcern(s) ? ' concern' : ''}` },
    el('h5', {}, `${criterion.number}. ${criterion.name}: ${scoreLabel(s)}`),
    s.evidence ? el('p', {}, el('span', { className: 'label' }, 'Evidence: '), el('q', { className: 'said' }, s.evidence)) : null,
    el('p', {}, el('span', { className: 'label' }, s.score === null ? 'Why N/A: ' : 'Why: '), said(s.explanation)),
    renderOffence(s.offence_sources),
    criterionDetails(criterion, s.score),
  );
}

// The scores table, where each Criterion opens its explanation in the column beside it (below on
// narrow screens). The choice is kept on the Post, so a re-render shows the same Criterion.
function renderScores(post, evaluation) {
  const scores = evaluation.assessment.scores;
  const detailId = `criterion-detail-${post.id}`;
  const detail = el('div', { className: 'criterion-detail', id: detailId, 'aria-live': 'polite' });
  const rows = scores.map((s) => {
    const criterion = criterionByKey[s.criterion];
    const pick = el('button', { type: 'button', className: 'link-button criterion-pick', 'aria-controls': detailId, onclick: () => choose(s) },
      `${criterion.number}. ${criterion.name}`);
    return { s, pick, row: el('tr', { className: isConcern(s) ? 'concern' : '' }, el('td', {}, pick), el('td', { className: 'num' }, scoreLabel(s))) };
  });
  // Updated in place rather than by render(), so the button keeps focus.
  function choose(chosen) {
    post.openCriterion = chosen.criterion;
    for (const { s, pick, row } of rows) {
      pick.setAttribute('aria-pressed', String(s === chosen));
      row.classList.toggle('open', s === chosen);
    }
    detail.replaceChildren(renderCriterion(chosen));
  }
  choose(scores.find((s) => s.criterion === post.openCriterion) || scores[0]);
  return evalPart('checklist', 'Rubric Scores', null,
    el('p', { className: 'muted' }, 'Choose a Criterion to see its Evidence and why it scored as it did.'),
    el('div', { className: 'scores-split', 'data-tour': 'scores' },
      el('div', { className: 'table-wrap' },
        el('table', { className: 'overview' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Criterion'), el('th', {}, 'Score'))),
          el('tbody', {}, rows.map((r) => r.row)),
        ),
      ),
      detail,
    ),
  );
}

function renderSummary(evaluation) {
  if (evaluation.rewrite_mode === 'not_assessable') return el('p', { className: 'summary', 'data-tour': 'summary' }, COPY.notAssessable);
  if (evaluation.lands_well) return el('p', { className: 'summary good', 'data-tour': 'summary' }, COPY.landsWell);
  const concerns = evaluation.assessment.scores.filter((s) => s.score !== null && s.score < 3);
  return el('div', { className: 'summary', 'data-tour': 'summary' },
    el('p', {}, `Concerns (${concerns.length}):`),
    el('ul', {}, concerns.map((s) => el('li', {}, `${criterionByKey[s.criterion].name}: `, said(s.explanation)))),
  );
}

// On a creator's Reviews, the Personas who lead their top audiences come first. Scores never change.
function orderedReactions(evaluation) {
  const reactions = evaluation.reactions.reactions;
  if (!isCreator()) return reactions;
  const order = personaOrder(state.profile.audiences, AUDIENCES, PERSONA_KEYS);
  return [...reactions].sort((a, b) => order.indexOf(a.persona) - order.indexOf(b.persona));
}

function renderReaction(r) {
  const persona = personaByKey[r.persona];
  return el('div', { className: 'reaction' },
    el('strong', {}, persona.name),
    el('div', { className: 'muted' }, persona.summary),
    el('div', {}, 'Felt response: ', said(r.felt_response), ` (${r.valence})`),
    el('ul', {}, r.reasons.map((reason) => el('li', { className: 'said' }, reason))),
    el('details', {}, el('summary', {}, `Who is the ${persona.name}?`), renderPersona(persona)),
  );
}

// One Persona at a time: chosen from the list under the heading, or in turn with Read next persona.
// The choice is kept on the Post, so a re-render shows the same Persona.
function renderReactions(post, evaluation) {
  const reactions = orderedReactions(evaluation);
  const pickId = `persona-pick-${post.id}`;
  const picker = el('select', { id: pickId, className: 'persona-pick' },
    reactions.map((r, i) => el('option', { value: String(i) }, `${personaByKey[r.persona].name} (${r.valence})`)));
  const count = el('span', { className: 'muted' });
  const shown = el('div', { className: 'reaction-shown', 'aria-live': 'polite' });
  const next = el('button', { type: 'button', className: 'persona-next' });
  let current = 0;
  // Updated in place rather than by render(), so the list and the button keep focus.
  function show(i) {
    current = i;
    post.openPersona = reactions[i].persona;
    picker.value = String(i);
    count.textContent = `${i + 1} of ${reactions.length}`;
    shown.replaceChildren(renderReaction(reactions[i]));
    next.textContent = i === reactions.length - 1 ? 'Back to the first persona' : 'Read next persona';
  }
  picker.addEventListener('change', () => show(Number(picker.value)));
  next.addEventListener('click', () => {
    show((current + 1) % reactions.length);
    if (picker.getBoundingClientRect().top < 0) picker.scrollIntoView({ block: 'start' });
  });
  show(Math.max(0, reactions.findIndex((r) => r.persona === post.openPersona)));
  return evalPart('person', 'Persona Reactions', 'reactions',
    el('p', { className: 'muted' }, COPY.simulated),
    isCreator() ? el('p', { className: 'muted' }, 'Listed with the Personas who lead your top audiences first.') : null,
    el('div', { className: 'persona-bar' }, el('label', { for: pickId, className: 'label' }, 'Read a Persona'), picker, count),
    shown,
    reactions.length > 1 ? el('div', { className: 'row' }, next) : null,
  );
}

function originalText(post, evaluation) {
  return post.pasted_text || evaluation.post_transcript || '';
}

function renderRewrite(post, evaluation) {
  if (evaluation.gentler_rewrite) {
    const rw = evaluation.gentler_rewrite;
    return evalPart('pen', 'Gentler Rewrite', 'rewrite',
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
    return evalPart('pen', null, 'rewrite',
      el('button', { type: 'button', onclick: () => onSuggestRewrite(post), disabled: state.busy || !state.sample }, running ? 'Writing a gentler version…' : 'Suggest a gentler version'),
      failed ? el('p', { className: 'error' }, errorText(post.rewriteStatus)) : null,
    );
  }
  return null;
}

function renderQuestions(evaluation) {
  if (!evaluation.discussion_questions) return el('p', { className: 'muted', 'data-tour': 'questions' }, 'Writing Discussion Questions…');
  return evalPart('bubbles', 'Discussion Questions', 'questions',
    el('ol', {}, evaluation.discussion_questions.questions.map((q) =>
      el('li', {}, said(q.text), q.persona ? ` (${personaByKey[q.persona].name})` : null),
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
    renderScores(post, ev),
    renderReactions(post, ev),
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
    ? 'Looking for your saved Reviews…'
    : !state.db
      ? COPY.pastUnavailable
      : !p || p.status === 'loading'
        ? 'Loading your saved Reviews…'
        : p.status === 'failed'
          ? 'Your saved Reviews could not be loaded. Try again later.'
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
      openable ? null : el('p', { className: 'muted' }, COPY.pastOtherVersions),
      el('div', { className: 'row' },
        el('button', { type: 'button', onclick: () => onOpenPast(item), disabled: state.busy || !openable }, 'Open'),
        el('button', { type: 'button', onclick: () => onDeletePast(item), disabled: state.busy }, confirming ? 'Delete for good' : 'Delete'),
        confirming ? el('button', { type: 'button', onclick: () => { state.confirmDelete = null; render(); } }, 'Keep it') : null,
      ),
    );
  });
}

// The Send feedback popup's letter: the Outreach Message to copy, then the Talking Points,
// affirmations and concerns side by side.
function renderOutreach() {
  const done = donePosts();
  const o = state.outreach;
  const children = [];
  if (state.reviewSourceUrl) children.push(el('p', { className: 'muted' }, 'Profile: ', sourceLink(state.reviewSourceUrl)));
  if (!o || o.status === 'failed') {
    children.push(el('button', { type: 'button', onclick: () => onOutreach(!o), disabled: state.busy || !state.sample || done.length === 0 },
      o ? 'Try again' : 'Write the message'));
    if (o) children.push(el('p', { className: 'error' }, errorText(o.error)));
  } else if (o.status === 'running') {
    children.push(el('p', { className: 'feedback-wait' }, 'Writing the message…'));
  } else {
    const message = o.output.outreach_message;
    const point = (tp) => el('li', {},
      `${tp.kind === 'concern' ? 'Concern' : 'Affirmation'} · Post ${tp.post_position} · ${criterionByKey[tp.criterion].name}: `,
      said(tp.text),
      tp.change ? el('span', {}, ' Change: ', said(tp.change)) : null,
      tp.persona ? el('span', {}, ` (${personaByKey[tp.persona].name})`) : null,
    );
    const lists = ['affirmation', 'concern']
      .map((kind) => o.output.talking_points.filter((tp) => (tp.kind === 'concern') === (kind === 'concern')))
      .filter((points) => points.length)
      .map((points) => el('ul', { className: `talking-points ${points[0].kind === 'concern' ? 'is-concern' : 'is-affirmation'}` }, points.map(point)));
    children.push(
      el('textarea', { id: 'outreach-message', readonly: true, rows: 6, 'aria-label': 'Outreach Message' }, message),
      el('div', { className: 'row' },
        el('button', { type: 'button', className: 'copy-message', onclick: () => onCopy(message, 'outreach-message') }, 'Copy message'),
        el('span', { id: 'copy-status', className: 'muted', 'aria-live': 'polite' }),
      ),
      el('h3', { className: 'feedback-points-title' }, 'Talking points'),
      el('div', { className: 'talking-columns' }, lists),
      el('p', { className: 'muted feedback-foot' }, `Written by ${o.model}. `,
        el('button', { type: 'button', className: 'link-button', onclick: () => onOutreach(false), disabled: state.busy }, 'Write a new message')),
    );
  }
  return children;
}

// ---------- Your profile view ----------

const PROFILE_STATUS = { saving: 'Saving…', saved: 'Saved.', failed: 'That could not be saved. Try again.' };

function renderProfile() {
  const signedIn = Boolean(state.db && state.viewerId);
  const form = state.profileForm;
  $('profile-signin').textContent = !state.dbChecked
    ? 'Checking your Claude account…'
    : !signedIn
      ? 'Not signed in here'
      : state.me && state.me.name ? `Signed in as ${state.me.name}, with your Claude account` : 'Signed in with your Claude account';
  $('profile-state').textContent = !state.dbChecked ? '' : !signedIn ? COPY.profileUnavailable : state.profileStatus === 'failed' && !state.profile && !form ? COPY.profileFailed : '';

  const saving = state.profileStatus === 'saving';
  for (const input of document.querySelectorAll('input[name="profile-role"]')) {
    input.checked = Boolean(form) && form.role === input.value;
    input.disabled = !form || saving;
  }
  $('creator-prefs').hidden = !(form && form.role === 'creator');
  $('prefs-save').disabled = !form || saving;
  const status = PROFILE_STATUS[state.profileStatus] || '';
  $('prefs-status').textContent = state.statusFor === 'audiences' ? status : '';
  if (state.statusFor === 'role' && state.profileStatus === 'failed') $('profile-state').textContent = PROFILE_STATUS.failed;
  // A saved text field shows as text with when it was last edited, until Edit reopens it.
  for (const [key, id] of Object.entries(PREF_FIELDS)) {
    const stored = state.profile ? state.profile[key] : '';
    const editing = !stored || Boolean(state.editing[key]);
    const field = document.querySelector(`.pref-field[data-field="${key}"]`);
    field.querySelector('.pref-view').hidden = editing;
    field.querySelector('.pref-edit').hidden = !editing;
    field.querySelector('[data-cancel]').hidden = !stored;
    field.querySelector('[data-save]').disabled = !form || saving;
    $(`${id}-text`).textContent = stored;
    const at = state.profile && state.profile[`${key}_at`];
    $(`${id}-when`).textContent = at ? `Last edited ${new Date(at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : '';
    // "Saved." would only flash before the field turns back into text, so only saving and failures show.
    $(`${id}-status`).textContent = state.statusFor === key && state.profileStatus !== 'saved' ? status : '';
  }
  $('pref-audiences').replaceChildren(...(form ? form.audiences : []).map((key, i, all) => {
    const label = AUDIENCES.find((a) => a.key === key).label;
    return el('li', {}, el('div', { className: 'audience-row' },
      el('span', { className: 'audience-label' }, label),
      el('span', { className: 'audience-moves' },
        el('button', { type: 'button', className: 'move-up', 'aria-label': `Move up: ${label}`, disabled: i === 0, onclick: () => moveAudience(i, -1) }, '↑'),
        el('button', { type: 'button', className: 'move-down', 'aria-label': `Move down: ${label}`, disabled: i === all.length - 1, onclick: () => moveAudience(i, 1) }, '↓'))));
  }));

  $('summary-block').hidden = !isCreator();
  $('profile-summary').replaceChildren(...(isCreator() ? renderProfileSummary() : []));
}

// The Profile Summary (FR-14), from profileSummary() over the saved Posts. Each part has the design partner's icon.
function renderProfileSummary() {
  const sp = state.summaryPosts;
  if (!sp || sp.status === 'loading') return [el('p', { className: 'muted' }, 'Working out your summary…')];
  if (sp.status === 'failed') return [el('p', { className: 'error' }, 'Your summary could not be worked out. Try again later.')];
  const sum = profileSummary(sp.posts, rubric, PERSONA_KEYS);
  if (sum.postCount === 0) return [el('p', {}, 'Send a Review of your own Posts, and your summary appears here.')];

  const below = rubric.thresholds.auto_rewrite_below;
  const name = (key) => criterionByKey[key].name;
  const part = (icon, title, ...body) => el('section', { className: 'summary-part' },
    el('span', { className: `summary-icon icon-${icon}`, 'aria-hidden': 'true' }),
    el('div', { className: 'summary-body' }, el('h3', {}, title), ...body));
  const none = (text) => el('p', { className: 'muted' }, text);
  const personaLine = (p, count, word) => el('li', {}, el('strong', {}, personaByKey[p.key].name), ` ${count} of ${sum.postCount} Posts ${word}`);

  const postLine = (p) => el('li', {}, el('span', { className: 'said' }, p.excerpt), el('span', { className: 'muted' }, ` · average ${p.average} / 5`));

  return [
    el('p', {}, `Across ${plural(sum.postCount, 'saved Post', 'saved Posts')}${sum.notAssessable ? `, leaving out ${sum.notAssessable} that could not be assessed` : ''}.`),
    el('div', { className: 'summary-parts' },
      part('checklist', 'Criterion averages',
        el('div', { className: 'table-wrap' }, el('table', { className: 'overview' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Criterion'), el('th', { className: 'num' }, 'Average'))),
          el('tbody', {}, sum.averages.map((a) => el('tr', { className: a.average !== null && a.average < below ? 'concern' : '' },
            el('td', {}, `${criterionByKey[a.criterion].number}. ${name(a.criterion)}`),
            el('td', { className: 'num' }, a.average === null ? 'N/A' : `${a.average} / 5`))))))),
      part('person', 'How the Personas react',
        el('p', { className: 'label' }, 'React well'),
        sum.reactWell.length ? el('ul', {}, sum.reactWell.map((p) => personaLine(p, p.positive, 'positive.'))) : none('None yet.'),
        el('p', { className: 'label' }, 'React badly'),
        sum.reactBadly.length ? el('ul', {}, sum.reactBadly.map((p) => personaLine(p, p.negative, 'negative.'))) : none('None yet.')),
      part('mailbox', 'Strongest and weakest Posts',
        el('p', { className: 'label' }, 'Strongest'), el('ul', {}, sum.strongest.map(postLine)),
        el('p', { className: 'label' }, 'Weakest'), sum.weakest.length ? el('ul', {}, sum.weakest.map(postLine)) : none('Save a few more Posts to compare.')),
      part('pen', 'Top changes',
        sum.topChanges.length
          ? el('ol', {}, sum.topChanges.map((c) => el('li', {},
            el('strong', {}, name(c.criterion)), ` (${c.concerns} of ${c.of} Posts score below ${below}). `,
            el('span', { className: 'muted' }, `What a 4 looks like: ${criterionByKey[c.criterion].guidance['4']}`))))
          : none('No concerns across your saved Posts.')),
    ),
  ];
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
  $('add-post').disabled = state.readingPost || !canAddPost(state.posts.length);

  const anyDone = state.posts.some((p) => p.status === 'done');
  // The demo's Send replays the sample, so it needs no Claude here.
  $('evaluate-all').disabled = state.busy || (!state.sample && !state.demo);
  $('clear-review').disabled = state.busy || state.posts.length === 0;
  // aria-disabled, not disabled, so its explanation still shows on hover before there are results.
  $('send-feedback').setAttribute('aria-disabled', String(!anyDone || state.busy));
  $('copy-review').disabled = !anyDone;
  $('save-review').disabled = !anyDone;
  $('save-review').hidden = !state.downloads;
  $('next-post').disabled = state.busy;
  $('save-note').textContent = state.db ? COPY.savedHere : COPY.savedNowhere;

  // The sample notice shows while sample Posts are on screen (the demo's, or the demo Review reopened).
  $('sample-notice').hidden = !state.posts.some((p) => p.demo);

  $('post-list').replaceChildren(...state.posts.map(renderPostInput));
  $('overall').replaceChildren(...renderOverall());
  $('posts').replaceChildren(...state.posts.map((post, i) => (post.status === 'pending' ? null : renderPost(post, i))).filter(Boolean));
  $('feedback-body').replaceChildren(...renderOutreach());
  renderProfile();
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
      el('summary', {}, p.name),
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
  if (name === 'home') playHomeMotion();
  render();
  window.scrollTo(0, 0);
  document.dispatchEvent(new CustomEvent('ll:view', { detail: { name } }));
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
  const picker = $('model');
  picker.replaceChildren(...CONTENT.models.artifact_picker.map((m) => el('option', { value: m.id }, m.label)));
  picker.addEventListener('change', () => { state.modelId = picker.value; });

  $('post-form').addEventListener('submit', onAddPost);
  $('post-form').addEventListener('change', (e) => { if (e.target.type === 'radio') syncFormModes(); });
  $('evaluate-all').addEventListener('click', onEvaluateAll);
  $('clear-review').addEventListener('click', onClearReview);
  $('copy-review').addEventListener('click', onCopyReview);
  $('save-review').addEventListener('click', onSaveReview);
  $('review-url').addEventListener('change', onReviewUrl);
  $('next-post').addEventListener('click', onNextPost);
  $('sample-notice').textContent = COPY.sampleNotice;
  document.addEventListener('ll:try-demo', onTryDemo);
  document.addEventListener('ll:tour-ended', endDemo);
  $('send-feedback').addEventListener('click', onSendFeedback);
  $('feedback').addEventListener('click', onFeedbackClick);
  document.querySelector('.role-cards').addEventListener('change', onRoleChange);
  $('prefs-form').addEventListener('submit', onPrefsSubmit);
  $('prefs-form').addEventListener('click', onPrefFieldClick);
  document.querySelector('main').addEventListener('click', onNav);
  renderHowItWorks();
  prepareHomeMotion();
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
      if (user) state.me = await user.me();
      if (db && id) {
        state.db = db;
        state.viewerId = id;
        await loadProfile();
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
