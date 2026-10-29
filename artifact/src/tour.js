// The guided demo (PRD FR-24): coach cards over the real pages, started by Try the demo on the intro.
// The intro exits onto Home and fires `ll:demo-started`. The cards go Home (what it is, who it is for, what you
// get) → Your profile (the viewer picks a role; creators see Creator preferences) → How it works (Overview,
// Scoring and Personas tabs) → the Review page, where they fill in the sample reel's link and wait for Send for
// review, which ui.js replays from the saved sample (no Claude or Supadata call) and saves to Saved Reviews.
// Then the Results, the Mailbox, reopening the Review from Saved Reviews, and a closing card on the Results.
// Before the Review page, Next moves to the next page itself (through the masthead links) and each page's first
// card names its link. A step that needs the viewer's click waits for it; when this view cannot save (no db or
// no signed-in viewer) it offers Next instead. End tour, the last card, or Clear Review ends it.
// Hooks from ui.js: ll:demo-replaying, ll:demo-replayed, ll:demo-ended, ll:view, ll:past-opened. It answers
// with ll:tour-ended. Text nodes only; no storage, no network. One IIFE: the build shares one script scope.
(function () {
  'use strict';
  if (typeof SAMPLE_REVIEW === 'undefined' || !SAMPLE_REVIEW || !SAMPLE_REVIEW.posts[0].source_url) return;
  const LINK = SAMPLE_REVIEW.posts[0].source_url;
  const html = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const docked = window.matchMedia('(max-width: 640px)');
  const PATIENCE = 1500; // how long a step waits for its anchor to render (Saved Reviews load after the view opens)

  function q(selector) {
    return document.querySelector(selector);
  }
  function shown(node) {
    return Boolean(node) && node.isConnected && node.getClientRects().length > 0;
  }
  function pick(selector) {
    const node = q(selector);
    if (node) node.click();
  }
  // Opens a page through its masthead link, unless it is already showing.
  function visit(view) {
    const page = q(`#view-${view}`);
    if (page && page.hidden) pick(`#nav-${view}`);
  }
  // Opens How it works on one of its tabs.
  function howTab(value) {
    visit('how');
    const input = q(`input[name="how-tab"][value="${value}"]`);
    if (input && !input.checked) input.click();
  }
  function modelLabel() {
    const select = q('#model');
    return select && select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : 'the model shown';
  }
  function personaCount() {
    return CONTENT.personaSet.personas.length;
  }

  // The tour puts the sample reel's link in for the viewer: Videos set to the link, nothing else on the form.
  function fillLink() {
    q('#post-form').reset();
    const linkMode = q('input[name="video-mode"][value="link"]');
    linkMode.checked = true;
    linkMode.dispatchEvent(new Event('change', { bubbles: true }));
    const url = q('#post-url');
    url.value = LINK;
    url.dispatchEvent(new Event('input', { bubbles: true }));
    const profile = q('#review-url');
    if (profile.value) {
      profile.value = '';
      profile.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ---------- The steps ----------
  // anchor: selectors tried in order (the first shown one is outlined); fallback: used once PATIENCE runs out.
  // wait: { on, can(), hint, otherwise, next() }. While can() is true the step waits for `on`; otherwise it shows
  // `otherwise` and offers Next, which runs next(). skip(): leave the step out when moving forward.
  let tour = null;

  const STEPS = [
    // Home: what Living Letter is, who it is for, what you get. The hero may still be typing in, so the card says it all.
    { id: 'what', view: 'home', anchor: ['.home-hero'], enter: () => visit('home'), title: 'What Living Letter is',
      body: () => 'Living Letter reviews public social-media Posts from churches, ministries and Christian creators through the eyes of people who do not share the faith, so believers can sharpen their witness online. This is Home; the logo at the top of the page brings you back.' },
    { id: 'who', view: 'home', anchor: ['.home-who'], enter: () => visit('home'), title: 'Who it is for',
      body: () => 'Christian content creators checking their drafts before they post, individuals weighing up Posts they come across, and leaders teaching young people how we present ourselves online.' },
    { id: 'get', view: 'home', anchor: ['.home-overview'], enter: () => visit('home'), title: 'What you get',
      body: () => 'For each Post: Rubric Scores with Evidence, simulated Persona Reactions, a Gentler Rewrite when it has room to improve, and Discussion Questions. Next opens Your profile.' },
    // Your profile: the masthead's person icon.
    { id: 'profile', view: 'profile', anchor: ['.profile-account'], enter: () => visit('profile'), title: 'Your profile',
      body: () => 'The person icon at the top of the page opens it. It belongs to your Claude account and is private: nobody else can see it, not even this page’s owner. Your Saved Reviews are listed at the bottom.' },
    { id: 'role', view: 'profile', anchor: ['.role-cards'], enter: () => visit('profile'), title: 'Who you are',
      body: () => 'Your profile starts with how you use Living Letter: as a creator, a leader or an individual. Your choice saves at once, and you can change it any time.',
      wait: { on: 'role', can: () => Boolean(q('input[name="profile-role"]:not(:disabled)')), hint: 'Pick the card that fits you.',
        otherwise: 'You are not signed in here, so a role cannot be saved.' } },
    { id: 'prefs', view: 'profile', anchor: ['#creator-prefs'], enter: () => visit('profile'), title: 'Creator preferences', skip: () => tour.role !== 'creator',
      body: () => 'As a creator you can say how you want to come across, your theology and tradition, and which audiences matter most. Your Reviews then list first the Personas who lead your top audiences. Scores never change.' },
    // How it works: three of its six tabs.
    { id: 'how', view: 'how', anchor: ['.how-steps'], enter: () => howTab('overview'), title: 'How it works',
      body: () => 'How it works, at the top of the page, explains what happens when you send a Post: you add it, it is scored, the Personas react, and you get next steps. Its tabs explain each part.' },
    { id: 'scoring', view: 'how', anchor: ['#how-panel-scoring'], enter: () => howTab('scoring'), title: 'Scoring',
      body: () => 'Each Post is scored 1 to 5 on ten Criteria of good witness, with the Evidence that earned each score. When a Post might offend, the score says whether the offence is at the message or at the messenger. The ten Criteria are listed here too.' },
    { id: 'personas', view: 'how', anchor: ['#how-panel-personas'], enter: () => howTab('personas'), title: 'Personas',
      body: () => `${personaCount()} simulated people, most of them outside the faith, each with a believable background. They react to every Post but never change its scores. The last three tabs, Mechanism, Sources and Privacy, explain how the results are produced, where the rubric comes from, and what is kept.` },
    // The Review page: the masthead's Review link.
    { id: 'setup', view: 'review', anchor: ['.field-select'], enter: () => visit('review'), title: 'Set up the review',
      body: () => `Review, at the top of the page, opens your letter. First, which Claude model reads your Posts: it is fixed once the Review has Posts, and live Reviews use your own Claude usage. The sample was reviewed with ${modelLabel()}. Below it, an optional profile link is only shown beside the results and never opened. Leave it empty for the demo.` },
    { id: 'add', view: 'review', anchor: () => q('#post-form fieldset.either'), enter: () => visit('review'), title: 'Add a Post',
      body: () => 'Add a video by its link, or paste what is said in it: an Instagram reel’s spoken words are transcribed from its link. For a photo or text Post, use Static posts below: screenshots or its text. A Post needs only one of these.' },
    { id: 'link', view: 'review', anchor: ['#link-field'], enter: () => { visit('review'); fillLink(); }, title: 'A sample Post',
      body: () => 'We have put in the link to a public Instagram reel. Its results were worked out ahead of time, so sending it uses none of your Claude usage.' },
    { id: 'send', view: 'review', anchor: ['#evaluate-all'], title: 'Send it for review',
      body: () => 'The letter goes into its envelope and the Mailbox, and the results open. If you change the link first, Send runs a live Review on your own Claude usage.',
      wait: { on: 'replayed', can: () => true, hint: 'Click Send for review.' } },
    { id: 'overall', view: 'results', anchor: ['#overall'], title: 'Your letter, read',
      body: () => `The note at the top marks this as the sample. The overall summary is worked out by code from the scores, never by Claude.${tour.saved ? ' The Review is already saved to your profile.' : ''}` },
    { id: 'summary', view: 'results', anchor: ['[data-tour="summary"]'], title: 'This Post’s summary', skip: () => !q('[data-tour="summary"]'),
      body: () => 'A Post that is likely to land well says so first. Concerns are marked in the Rubric Scores below.' },
    { id: 'scores', view: 'results', anchor: ['[data-tour="scores"]'], title: 'Rubric Scores',
      body: () => 'Ten Criteria of good witness, each scored 1 to 5; the ones that raise concerns are marked. Choose a Criterion to see, beside the table, the Evidence it quotes from the Post and why it scored as it did. Open “How this Criterion is judged” for the guidance and its sources.' },
    { id: 'reactions', view: 'results', anchor: ['[data-tour="reactions"]'], title: 'Persona Reactions',
      body: () => `How ${personaCount()} simulated people might feel reading the Post, and why. Choose a Persona from the list, or read them one after another with Read next persona. They are simulated perspectives, not real people’s opinions.` },
    { id: 'rewrite', view: 'results', anchor: ['[data-tour="rewrite"]'], title: 'Gentler Rewrite', skip: () => !q('[data-tour="rewrite"]'),
      body: () => 'When a Post has room to improve, a gentler version keeps its message and convictions and says them more clearly and kindly, beside the original.' },
    { id: 'questions', view: 'results', anchor: ['[data-tour="questions"]'], title: 'Discussion Questions',
      body: () => 'Questions for a small group or a leader to talk through, drawn from the Post, its scores and the reactions.' },
    { id: 'mailbox', view: 'results', anchor: ['#mailbox .next-card'], title: 'The Mailbox',
      body: () => 'What comes next: copy the Review, save it as a file, or Send feedback, which drafts a loving message to the account behind the Posts. Each Review you send is saved to your profile.',
      wait: { on: 'profile', can: () => tour.canSave, hint: 'Click View saved reviews.',
        otherwise: 'This view cannot save Reviews. Open the page as a Claude artifact while signed in to keep them.',
        next: () => pick('#mailbox [data-nav="profile"]') } },
    { id: 'saved', view: 'profile', anchor: ['#past-list .past-item:first-child'], fallback: '#past-state', title: 'Saved Reviews',
      body: () => 'The Review you just sent is saved here, at the bottom of your profile, where only you can see it.',
      wait: { on: 'opened', can: () => tour.anchored, hint: 'Click Open to read it again.',
        otherwise: 'Nothing was saved in this view, so there is nothing to reopen.',
        next: () => pick('#nav-review') } },
    { id: 'done', view: 'results', anchor: ['#overall'], last: true, enter: () => { if (q('#view-results').hidden) pick('#nav-review'); },
      title: 'That is the whole flow',
      body: () => {
        const did = ['saw what Living Letter is'];
        if (tour.role) did.push('chose who you are');
        did.push('sent a Post', 'read its results');
        if (tour.reopened) did.push('reopened the saved Review');
        return `You ${did.slice(0, -1).join(', ')} and ${did[did.length - 1]}. To review your own Posts, choose Send another post in the Mailbox, then Clear Review.`;
      } },
  ];

  // ---------- Card and outline ----------
  let card = null;
  let ring = null;
  let parts = null;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function build() {
    card = make('section', 'tour-card');
    card.id = 'tour-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', 'tour-title');
    card.tabIndex = -1;
    card.hidden = true;
    const kicker = make('p', 'tour-kicker', 'Guided demo');
    const title = make('h2', 'tour-title');
    title.id = 'tour-title';
    const body = make('p', 'tour-body');
    const hint = make('p', 'tour-hint');
    const actions = make('div', 'tour-actions');
    const back = make('button', 'tour-back', 'Back');
    const next = make('button', 'tour-next', 'Next');
    const endButton = make('button', 'link-button tour-end', 'End tour');
    for (const b of [back, next, endButton]) b.type = 'button';
    back.addEventListener('click', onBack);
    next.addEventListener('click', onNext);
    endButton.addEventListener('click', () => end());
    actions.append(back, next, endButton);
    card.append(kicker, title, body, hint, actions);
    ring = make('div', 'tour-ring');
    ring.setAttribute('aria-hidden', 'true');
    ring.hidden = true;
    document.body.append(ring, card);
    parts = { title, body, hint, back, next, endButton };
  }

  // The first shown element of the step's anchors, else (once `allowFallback`) its fallback.
  function find(step, allowFallback) {
    const candidates = typeof step.anchor === 'function' ? [step.anchor()] : step.anchor.map((s) => q(s));
    const node = candidates.find(shown);
    if (node) return { node, primary: true };
    const fb = allowFallback && step.fallback ? q(step.fallback) : null;
    return { node: shown(fb) ? fb : null, primary: false };
  }

  function locate(step) {
    const started = Date.now();
    return new Promise((resolve) => {
      (function poll() {
        const hit = find(step, false);
        if (hit.node || Date.now() - started > PATIENCE) resolve(hit.node ? hit : find(step, true));
        else setTimeout(poll, 120);
      })();
    });
  }

  // The outlined box: the target, cut to the letter when the letter scrolls inside the envelope.
  function targetBox() {
    if (!shown(tour.target)) return null;
    let r = tour.target.getBoundingClientRect();
    const letter = tour.target.closest('.letter');
    if (letter && letter !== tour.target) {
      const c = letter.getBoundingClientRect();
      r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
    }
    if (r.right <= r.left || r.bottom <= r.top || r.bottom < 0 || r.top > window.innerHeight) return null;
    const pad = 6;
    return { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
  }

  function layout() {
    if (!tour || card.hidden) return;
    const step = STEPS[tour.index];
    // The role step can turn waitable once the profile has loaded: show its hint instead of Next then.
    if (waiting(step) !== tour.waited) show(step);
    if (!shown(tour.target)) tour.target = find(step, true).node; // re-rendered, or back on the step's page
    const box = targetBox();
    ring.hidden = !box;
    if (box) Object.assign(ring.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.right - box.left}px`, height: `${box.bottom - box.top}px` });
    if (docked.matches) {
      card.style.left = '';
      card.style.top = '';
      return;
    }
    const m = 16;
    const gap = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let x = vw - cw - m;
    let y = vh - ch - m;
    if (box) {
      if (vh - box.bottom - gap - m >= ch) [x, y] = [box.left, box.bottom + gap];
      else if (box.top - gap - m >= ch) [x, y] = [box.left, box.top - gap - ch];
      else if (vw - box.right - gap - m >= cw) [x, y] = [box.right + gap, box.top];
      else if (box.left - gap - m >= cw) [x, y] = [box.left - gap - cw, box.top];
    }
    card.style.left = `${clamp(x, m, vw - cw - m)}px`;
    card.style.top = `${clamp(y, m, vh - ch - m)}px`;
  }

  let frame = 0;
  function schedule() {
    if (!tour || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      layout();
    });
  }

  // ---------- Moving through the steps ----------
  function waiting(step) {
    return Boolean(step.wait && step.wait.can());
  }

  function canGoBack(step) {
    const prev = tour.history[tour.history.length - 1];
    // Only back to an explaining step on the same page: a step that waited for a click is done.
    return prev !== undefined && !STEPS[prev].wait && STEPS[prev].view === step.view;
  }

  function go(i, back) {
    while (!back && i < STEPS.length && STEPS[i].skip && STEPS[i].skip()) i++;
    if (i >= STEPS.length) {
      end();
      return;
    }
    if (!back && tour.index >= 0) tour.history.push(tour.index);
    tour.index = i;
    const step = STEPS[i];
    const token = ++tour.token;
    card.hidden = true;
    ring.hidden = true;
    tour.target = null;
    if (step.enter) step.enter();
    locate(step).then(({ node, primary }) => {
      if (!tour || token !== tour.token) return;
      tour.target = node;
      tour.anchored = primary;
      show(step);
      if (node) node.scrollIntoView({ block: docked.matches || node.offsetHeight > window.innerHeight * 0.6 ? 'start' : 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      layout();
    });
  }

  function show(step) {
    const wait = waiting(step);
    tour.waited = wait;
    parts.title.textContent = step.title;
    parts.body.textContent = step.body();
    parts.hint.textContent = wait ? step.wait.hint : step.wait ? step.wait.otherwise : '';
    parts.hint.hidden = !parts.hint.textContent;
    parts.hint.classList.toggle('is-waiting', wait);
    parts.back.hidden = !canGoBack(step);
    parts.next.hidden = wait;
    parts.next.textContent = step.last ? 'Finish' : 'Next';
    parts.endButton.hidden = Boolean(step.last);
    card.hidden = false;
    (wait ? card : parts.next).focus({ preventScroll: true });
  }

  function onNext() {
    const step = STEPS[tour.index];
    if (step.last) {
      end();
      return;
    }
    if (step.wait && step.wait.next) step.wait.next();
    go(tour.index + 1, false);
  }

  function onBack() {
    const prev = tour.history.pop();
    if (prev !== undefined) go(prev, true);
  }

  // A viewer action a waiting step asked for.
  function done(kind, detail) {
    if (!tour) return;
    const step = STEPS[tour.index];
    if (!step || !step.wait || step.wait.on !== kind || !waiting(step)) return;
    if (kind === 'role') tour.role = detail;
    if (kind === 'opened') tour.reopened = true;
    // Move on once the viewer's click has finished: a page move inside a role card's click re-renders the
    // radios before their change event, and the role would never save.
    const index = tour.index;
    const token = ++tour.token;
    card.hidden = true;
    ring.hidden = true;
    setTimeout(() => {
      if (tour && tour.index === index && tour.token === token) go(index + 1, false);
    }, 0);
  }

  function start() {
    if (tour) return;
    if (!card) build();
    tour = { index: -1, history: [], token: 0, target: null, anchored: false, canSave: false, saved: false, role: '', reopened: false };
    html.dataset.tour = 'on';
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    tour.timer = setInterval(layout, 400);
    go(0, false);
  }

  function end() {
    if (!tour) return;
    clearInterval(tour.timer);
    tour.token++;
    tour = null;
    card.hidden = true;
    ring.hidden = true;
    window.removeEventListener('scroll', schedule, { capture: true });
    window.removeEventListener('resize', schedule);
    delete html.dataset.tour;
    delete html.dataset.demo;
    document.dispatchEvent(new CustomEvent('ll:tour-ended'));
  }

  // ---------- Hooks ----------
  document.addEventListener('ll:demo-started', start);
  document.addEventListener('ll:demo-ended', () => end());
  document.addEventListener('ll:demo-replaying', () => {
    if (!tour) return;
    tour.replaying = true;
    tour.token++;
    card.hidden = true;
    ring.hidden = true;
  });
  document.addEventListener('ll:demo-replayed', (event) => {
    if (!tour) return;
    tour.replaying = false;
    tour.canSave = Boolean(event.detail && event.detail.canSave);
    tour.saved = Boolean(event.detail && event.detail.saved);
    go(STEPS.findIndex((s) => s.id === 'overall'), false);
  });
  document.addEventListener('ll:view', (event) => {
    // Only the Mailbox step waits on 'profile' (done() checks); the early profile cards open it themselves.
    if (event.detail && event.detail.name === 'profile') done('profile');
    // A live Send (the viewer changed the link) opens the Results without a replay: carry on from there.
    if (event.detail && event.detail.name === 'results' && tour && !tour.replaying && STEPS[tour.index].id === 'send') {
      go(STEPS.findIndex((s) => s.id === 'overall'), false);
    }
  });
  document.addEventListener('ll:past-opened', () => done('opened'));
  // A role card's label click reaches its radio, so picking the role already chosen counts too.
  document.addEventListener('click', (event) => {
    const input = event.target.closest && event.target.closest('input[name="profile-role"]');
    if (input && !input.disabled) done('role', input.value);
  });
})();
