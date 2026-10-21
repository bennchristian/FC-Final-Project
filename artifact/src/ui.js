// UI shell of the Demo Artifact (ARCHITECTURE.md AD-4, AD-5, AD-12, AD-14).
// Plain document, no styling work: visual design is deferred to the design partner.
// Everything renders as text nodes; screenshots appear only as file-name chips.
// `CONTENT` and `LABELS` are inlined by artifact/build.mjs.

import { INTAKE_LIMITS, checkPostIntake, checkSourceUrl, canAddPost, provenanceLabel } from './core.js';
import { evaluatePost, requestRewrite, createOutreach } from './pipeline.js';

// ---------- Fixed UI copy (AD-14). Constants, never model output. Wording owned by bmad-ux. ----------

const COPY = {
  simulated: 'Simulated perspective',
  linkNotice: 'This tool cannot read posts from a link. Paste the post text, add screenshots, or paste a video transcript. A link you add is only shown alongside the results.',
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
};

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
  maxImages: 0,
  mediaTypes: [],
  modelId: CONTENT.models.default,
  reviewSourceUrl: '',
  posts: [],
  outreach: null,
  busy: false,
  nextId: 1,
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
  return el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, url);
}

function simulatedTag() {
  return el('span', { className: 'simulated' }, COPY.simulated);
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

async function onAddPost(event) {
  event.preventDefault();
  const files = state.maxImages ? [...$('post-images').files] : [];
  const fields = {
    pasted_text: $('post-text').value,
    video_transcript: $('post-transcript').value,
    source_url: $('post-url').value.trim(),
  };
  const errors = checkPostIntake({ ...fields, image_count: files.length }, state.maxImages);
  if (!canAddPost(state.posts.length)) errors.push(`A Review holds at most ${INTAKE_LIMITS.maxPosts} Posts.`);
  if (errors.length) {
    $('intake-errors').textContent = errors.join(' ');
    return;
  }
  $('intake-errors').textContent = '';
  try {
    fields.images = await Promise.all(files.map(async (f) => ({ name: f.name, blob: await downscale(f) })));
  } catch {
    $('intake-errors').textContent = 'A screenshot could not be read. Try a JPEG or PNG.';
    return;
  }
  addPost(fields);
  $('post-form').reset();
  render();
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
  $('review-url').value = '';
  render();
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
async function onEvaluateAll() {
  if (state.busy || !state.sample) return;
  state.busy = true;
  state.outreach = null;
  render();
  for (const post of state.posts) {
    if (post.status === 'pending') await runPost(post, true);
  }
  state.busy = false;
  render();
}

async function onTryAgain(post) {
  if (state.busy || !state.sample) return;
  state.busy = true;
  state.outreach = null;
  await runPost(post, false);
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
  } catch (e) {
    state.outreach = { status: 'failed', error: (e && e.code) || 'upstream_error' };
  }
  state.busy = false;
  render();
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
      s.evidence ? el('p', {}, el('span', { className: 'label' }, 'Evidence: '), el('q', {}, s.evidence)) : null,
      el('p', {}, el('span', { className: 'label' }, s.score === null ? 'Why N/A: ' : 'Why: '), s.explanation),
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
    el('ul', {}, concerns.map((s) => el('li', {}, `${criterionByKey[s.criterion].name}: ${s.explanation}`))),
  );
}

function renderReactions(evaluation) {
  return el('section', {},
    el('h4', {}, 'Persona Reactions ', simulatedTag()),
    el('ul', { className: 'reactions' }, evaluation.reactions.reactions.map((r) =>
      el('li', {},
        el('strong', {}, personaByKey[r.persona].name), ' ', simulatedTag(),
        el('div', { className: 'muted' }, personaByKey[r.persona].summary),
        el('div', {}, `Felt response: ${r.felt_response} (${r.valence})`),
        el('ul', {}, r.reasons.map((reason) => el('li', {}, reason))),
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
        el('div', {}, el('p', { className: 'label' }, 'Original'), el('p', { className: 'pre' }, originalText(post, evaluation))),
        el('div', {}, el('p', { className: 'label' }, COPY.suggestion), el('p', { className: 'pre' }, rw.rewrite)),
      ),
      el('p', {}, 'What changed:'),
      el('ul', {}, rw.changes.map((c) => el('li', {}, c))),
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
      el('li', {}, q.text, q.persona ? [' ', simulatedTag(), ` (${personaByKey[q.persona].name})`] : null),
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
      el('strong', {}, 'Soundness Flag: '), el('q', {}, flag.line), ` ${flag.why}`,
      el('p', { className: 'muted' }, COPY.soundnessNote)) : null,
    el('h4', {}, 'Rubric Scores'),
    renderScores(ev),
    renderReactions(ev),
    renderRewrite(post, ev),
    renderQuestions(ev),
  );
}

function renderPost(post, index) {
  const statusText = { pending: 'Not yet evaluated', evaluating: 'Evaluating…', done: 'Evaluated', failed: 'Failed', refused: 'Declined' }[post.status];
  const canRetry = (post.status === 'failed' || post.status === 'refused') && !state.busy && state.sample;
  return el('article', { className: 'post' },
    el('h3', {}, `Post ${index + 1}`, el('span', { className: 'muted' }, ` · ${statusText}`)),
    post.source_url ? el('p', {}, 'Source: ', sourceLink(post.source_url)) : null,
    post.pasted_text ? el('p', { className: 'pre' }, post.pasted_text) : null,
    post.video_transcript ? el('details', {}, el('summary', {}, 'Video transcript'), el('p', { className: 'pre' }, post.video_transcript)) : null,
    post.images.length ? el('p', {}, 'Screenshots: ', post.images.map((img) => el('span', { className: 'chip' }, img.name))) : null,
    post.error ? el('p', { className: 'error' }, errorText(post.error)) : null,
    el('div', { className: 'row' },
      canRetry ? el('button', { type: 'button', onclick: () => onTryAgain(post) }, 'Try again') : null,
      post.status !== 'evaluating' && !state.busy
        ? el('button', { type: 'button', onclick: () => { state.posts.splice(index, 1); state.outreach = null; render(); } }, 'Remove')
        : null,
    ),
    renderEvaluation(post),
  );
}

function renderOutreach() {
  const done = donePosts();
  const o = state.outreach;
  const children = [
    el('h2', {}, 'Ministry Outreach Plan'),
    el('p', {}, 'A draft message you can send yourself, plus Talking Points tied to specific Posts. This tool never sends or posts anything.'),
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
      el('ul', {}, o.output.talking_points.map((tp) => {
        const source = state.posts[tp.post_position - 1] && state.posts[tp.post_position - 1].source_url;
        return el('li', {},
          el('strong', {}, `${tp.kind === 'concern' ? 'Concern' : 'Affirmation'} · Post ${tp.post_position} · ${criterionByKey[tp.criterion].name}: `),
          tp.text,
          tp.change ? el('div', {}, `Change: ${tp.change}`) : null,
          tp.persona ? el('div', {}, simulatedTag(), ` (${personaByKey[tp.persona].name})`) : null,
          source ? el('div', {}, 'Source: ', sourceLink(source)) : null,
        );
      })),
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
  $('images-field').hidden = state.maxImages === 0;
  $('post-images').setAttribute('accept', state.mediaTypes.join(','));
  $('images-hint').textContent = `Up to ${state.maxImages} screenshots. They are sent to Claude only while this Post is evaluated and are never shown or kept.`;
  $('post-count').textContent = `${state.posts.length} of ${INTAKE_LIMITS.maxPosts} Posts`;
  $('add-post').disabled = !canAddPost(state.posts.length);

  const pending = state.posts.some((p) => p.status === 'pending');
  $('evaluate-all').disabled = state.busy || !state.sample || !pending;
  $('clear-review').disabled = state.busy || state.posts.length === 0;

  $('posts').replaceChildren(...state.posts.map(renderPost));
  $('outreach-slot').replaceChildren(state.posts.length ? renderOutreach() : '');
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
      el('li', {}, 'These thresholds are applied by code, not by the model, so the same scores always give the same result.'),
    ),
  );
  $('how-offence').replaceChildren(el('ul', {}, rubric.offence_sources.map((o) =>
    el('li', {}, el('strong', {}, `${o.name}. `), o.meaning, ' ', el('em', {}, o.effect)))));
  $('how-criteria').replaceChildren(...rubric.criteria.map((c) =>
    el('section', { className: 'criterion' },
      el('h4', {}, `${c.number}. ${c.name}`),
      el('p', {}, `Scores whether ${c.scores_whether}`),
      c.applies_to === 'own_content' ? el('p', { className: 'muted' }, `Not used in this demo: ${c.na_reason_others}`) : null,
      el('p', { className: 'label' }, 'What each score means'),
      renderGuidance(c, null),
      el('p', { className: 'label' }, 'Sources'),
      renderSources(c.sources),
    )));
  $('how-personas').replaceChildren(...CONTENT.personaSet.personas.map((p) =>
    el('section', { className: 'criterion' },
      el('h4', {}, p.name, ' ', simulatedTag()),
      el('p', {}, el('em', {}, p.summary)),
      renderPersona(p),
    )));
}

function showTab(name) {
  for (const tab of ['review', 'how', 'roadmap']) {
    $(`tab-${tab}`).hidden = tab !== name;
    $(`tab-button-${tab}`).setAttribute('aria-selected', String(tab === name));
  }
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
  $('add-examples').addEventListener('click', onAddExamples);
  $('evaluate-all').addEventListener('click', onEvaluateAll);
  $('clear-review').addEventListener('click', onClearReview);
  $('review-url').addEventListener('change', onReviewUrl);
  $('tab-button-review').addEventListener('click', () => showTab('review'));
  $('tab-button-how').addEventListener('click', () => showTab('how'));
  $('open-how').addEventListener('click', () => showTab('how'));
  $('tab-button-roadmap').addEventListener('click', () => showTab('roadmap'));
  const hashTab = location.hash.slice(1);
  showTab(['how', 'roadmap'].includes(hashTab) ? hashTab : 'review');
  renderHowItWorks();
  render();

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
