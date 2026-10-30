// The 2-minute video's cues, timed to the edited voice-over (docs/video/script-2min.md, draft 3 + 2.2).
// Times are audio seconds from assets/words-2min.json, passed through V() to get video time.
// HOLDS stop the VO while the screen does the talking: the hook's three lines, then the 3.4 and 3.5
// reading pauses. Every quote from the Review is word for word from artifact/sample-review.json; the hook
// lines are Bennett's paraphrases of the reel, so they are shown without quotation marks.

export const HOLDS = [
  { at: 5.4, dur: 1.8 }, //  1.1: the reel's three lines come up about half a second apart
  { at: 62.4, dur: 2 }, //   3.4: the Seeker's line
  { at: 65.98, dur: 5 }, //  3.5: the Emboldened Believer's line
];
const AUDIO_END = 104.86;
const TAIL = 3;

// Video time of audio time a.
export function V(a) {
  return a + HOLDS.filter((h) => h.at < a).reduce((s, h) => s + h.dur, 0);
}
const H = (i) => V(HOLDS[i].at);

const C = [960, 540];
const LINK = 'https://www.instagram.com/p/DcRYltnvb77/';
const ARTIFACT_URL = 'claude.ai/artifact/Mkc4qYCLCFXqMLq8Yf1Kdq';

export async function build(api) {
  const page = api.frames.page;
  const intro = api.frames.intro;
  const ll = page.ll;
  const saved = ll.SAMPLE_REVIEW.posts[0];
  if (!saved || saved.source_url !== LINK) throw new Error('timeline: the built Artifact has a different sample Review');

  // Both copies start where the Review page will be: the intro's own page shows through its exit.
  for (const f of [page, intro]) {
    f.ll.state.modelId = saved.evaluation.models.assess;
    f.ll.showView('review');
    f.ll.render();
  }
  const blurStyle = page.doc.createElement('style');
  blurStyle.textContent = '.vid-blur { filter: blur(7px); }';
  page.doc.head.appendChild(blurStyle);

  // ----- Shorthands -----
  const I = (text, scope) => () => api.phrase('intro', text, scope);
  const P = (text, scope) => () => api.phrase('page', text, scope);
  const q = (sel, i = 0) => () => api.q('page', sel, i);
  const heading = (text) => () => api.byText('page', 'h4', text, '#posts');
  const union = (...ts) => () => api.union(...ts);
  const row = (i) => q('#posts table.overview tbody tr', i);
  const reaction = () => api.q('page', '#posts .reaction-shown .reaction');
  const felt = () => reaction() && [...reaction().children].find((c) => c.textContent.startsWith('Felt response'));
  const reason = (j) => () => reaction()?.querySelectorAll('ul > li')[j];
  const questions = heading('Discussion Questions');
  const rewrite = heading('Gentler Rewrite');
  const persona = heading('Persona Reactions');
  const rubric = heading('Rubric Scores');
  const roadmapItem = (text) => () => [...page.doc.querySelectorAll('#view-roadmap li')].find((li) => li.textContent.startsWith(text));

  const tBegin = V(34.5); // Begin review: the envelope closes and flies off
  const tExitDone = tBegin + 2.34;
  const tAdd = V(42.6); // Add Post
  const tSend = V(44.05); // Send for review
  const tResults = V(47.15); // hard cut to the results, once the envelope is in the Mailbox
  const tRoadmap = V(92.05);

  const camera = {
    intro: [
      { t: 0, c: C, z: 1 },
      // 2.1 Paul: the letter's opening line
      { t: V(13.85), dur: 0.5, target: '.ll-head', pad: [260, 300, 260, 300], zmax: 1.3 },
      // 2.2 back out for the hook's lines
      { t: V(17.4), dur: 0.5, c: C, z: 1 },
      // 2.3 out, so "mocked" and "belittled" sit either side
      { t: V(20.9), dur: 0.5, c: [960, 545], z: 0.72 },
      // 2.4 slow push in on the letter
      { t: V(25.3), dur: 7.4, c: [960, 520], z: 1.1 },
      // 2.5 back to the open framing for Begin review
      { t: V(33.3), dur: 0.5, c: C, z: 1 },
    ],
    page: [
      { t: 0, c: C, z: 1 },
      // 3.1 the Add Posts form, Add Post and Send for review
      { t: V(38.95), dur: 0.5, target: union('#post-form', '#evaluate-all'), pad: [110, 160, 90, 160], zmax: 1.45 },
      // 3.1 Send: the whole desk, so the flight into the Mailbox shows
      { t: tSend, dur: 0.5, target: union('#stage', '#desk-side'), pad: [30, 60, 30, 60], zmax: 1 },
      // 3.2 cut to the Rubric Scores, then a quick pan down the table, done by "research"
      { t: tResults, dur: 0, target: union(rubric, row(4), q('#posts .criterion-detail')), pad: [110, 120, 110, 120], zmax: 1.6 },
      { t: V(49.4), dur: 1.8, target: union(row(5), row(9), () => api.q('page', '#posts .criterion-detail h5')), pad: [200, 120, 200, 120], zmax: 1.6 },
      // 3.3 the table and the Evidence beside it
      { t: V(53.86), dur: 0.5, target: q('#posts .scores-split'), pad: [110, 120, 90, 120], zmax: 1.6 },
      // 3.4 cut to Persona Reactions on "seven", then the Seeker's line
      { t: V(58.76), dur: 0, target: union(persona, felt), pad: [150, 300, 150, 300], zmax: 1.6 },
      { t: V(61.8), dur: 0.5, target: reason(0), pad: [300, 260, 300, 260], zmax: 1.9 },
      // 3.5 back up for "Read a Persona", then the Emboldened Believer's line
      { t: V(62.78), dur: 0.5, target: union('#posts .persona-bar', felt), pad: [200, 330, 200, 330], zmax: 1.7 },
      { t: V(65.3), dur: 0.5, target: reason(0), pad: [300, 260, 300, 260], zmax: 1.9 },
      // 3.6 cut to the Gentler Rewrite on "gentler", then in on the Suggestion's first lines
      { t: V(66.88), dur: 0, target: union(rewrite, q('#posts .pair')), fit: 'width', pad: [130, 260, 40, 260], zmax: 1.3 },
      { t: V(68.1), dur: 0.5, target: P('Should a Christian attend a same-sex wedding? My answer is no, and I want to explain why as honestly as I can, whether you share my faith or not.', '#posts .pair'), pad: [260, 420, 260, 420], zmax: 1.9 },
      // 3.7 cut to Discussion Questions on "discussion", then in on question 4
      { t: V(71.08), dur: 0, target: union(questions, () => questions()?.nextElementSibling), fit: 'width', pad: [130, 260, 40, 260], zmax: 1.35 },
      { t: V(71.9), dur: 0.5, target: () => questions()?.nextElementSibling?.children[3], pad: [260, 260, 260, 260], zmax: 1.9 },
      // 5.1 cut to the Roadmap
      { t: tRoadmap, dur: 0, target: '#view-roadmap', pad: [120, 200, 120, 200], zmax: 1.45 },
      { t: V(93.2), dur: 0.5, target: roadmapItem('New Rubric and Persona Versions'), pad: [300, 230, 300, 230], zmax: 1.8 },
    ],
  };

  const highlights = [
    // 2.1 on the letter
    { frame: 'intro', t: V(15.34), dur: 1.0, until: V(17.35), target: I('known and read by everyone.', '.ll-head') },
    { frame: 'intro', t: V(16.62), dur: 0.5, until: V(17.35), target: I('2 Corinthians 3:2-3', '.ll-head') },
    // 3.3 the three 1s, one on each word, and the Evidence beside them
    { frame: 'page', t: V(55.68), dur: 0.35, until: V(58.6), target: row(2) },
    { frame: 'page', t: V(56.58), dur: 0.35, until: V(58.6), target: row(3) },
    { frame: 'page', t: V(57.38), dur: 0.35, until: V(58.6), target: row(6) },
    { frame: 'page', t: V(56.1), dur: 1.0, until: V(58.6), target: P("If you're a dude, why do you want to watch two guys kissing? That's very gay. Why are you gay?", '#posts .criterion-detail') },
    // 3.4 the Seeker
    { frame: 'page', t: V(61.44), dur: 0.4, until: V(62.7), target: () => api.phrase('page', 'pushed away', felt()) },
    { frame: 'page', t: V(62.0), dur: 1.0, until: V(62.6), bold: true, target: () => api.phrase('page', "he doesn't see people like me or my friends at all", reason(0)()) },
    // 3.5 the Emboldened Believer
    { frame: 'page', t: V(64.74), dur: 0.5, until: V(65.4), target: () => api.phrase('page', 'licensed to mock', felt()) },
    { frame: 'page', t: V(65.6), dur: 1.1, until: V(66.15), bold: true, target: () => api.phrase('page', 'shows me that mocking people is a fair way to make a point', reason(0)()) },
    // 3.6 and 3.7
    { frame: 'page', t: V(68.38), dur: 1.4, until: V(70.9), target: P('My answer is no, and I want to explain why as honestly as I can, whether you share my faith or not.', '#posts .pair') },
    { frame: 'page', t: V(72.04), dur: 1.4, until: V(74.0), target: P("Imagine Jesus making a short video that answers 'Should a Christian attend a gay wedding?'", '#posts') },
    // 5.1 the Roadmap
    { frame: 'page', t: V(93.24), dur: 1.2, until: V(99.0), target: P('revised after interviews with real people outside the faith', '#view-roadmap') },
    { frame: 'page', t: V(96.0), dur: 0.8, until: V(99.0), target: P('New Rubric and Persona Versions.', '#view-roadmap') },
  ];

  const spotlights = [
    { frame: 'page', t: V(61.95), until: V(62.65), target: reason(0) },
    { frame: 'page', t: V(65.5), until: V(66.15), target: reason(0) },
  ];

  const red = '#8A201C';
  const slate = '#5D6378';
  const serif = (size, extra = {}) => ({ fontFamily: '"Instrument Serif", serif', fontSize: `${size}px`, lineHeight: 1.08, textAlign: 'center', ...extra });
  const sans = (size, extra = {}) => ({ fontFamily: '"Open Sans", sans-serif', fontSize: `${size}px`, lineHeight: 1.3, textAlign: 'center', ...extra });
  const tHear = V(10.18);
  const lines = ['Of course not.', 'If you’re a man attending, you’re gay. Why are you gay?', 'You should be throwing Bibles at them.'];
  const veil = (t, until, extra = {}) => ({ t, until, dur: 0.4, x: 960, y: 0, w: 1920, text: '', rise: 0,
    style: { height: '1080px', background: '#FFFBF5', ...extra } });
  const card = (i) => 420 + i * 540;
  const cardTop = 330;

  const overlays = [
    // 1.1 the question, then the reel's lines one after another
    { t: 3.44, until: tHear, cut: true, dur: 1.2, write: true, x: 960, y: 250, w: 1800, text: 'Should a Christian attend a gay wedding?',
      style: serif(104, { fontStyle: 'italic' }) },
    ...lines.map((text, i) => ({ t: H(0) + 0.05 + i * 0.5, until: tHear, cut: true, dur: 0.35, pop: true, blurAt: V(9.56), x: 960, y: 470 + i * 92, w: 1700,
      text, style: serif(60, { color: '#210C09' }) })),
    // 1.2 bold
    { t: V(8.32), until: V(9.0), dur: 0.3, pop: true, x: 960, y: 790, w: 600, text: 'bold', style: serif(120, { fontStyle: 'italic', color: red }) },
    // 2.2 the lines flash back over the letter; backfires
    ...lines.map((text, i) => ({ t: V(18.34) + i * 0.08, until: V(19.7), cut: true, dur: 0.25, pop: true, x: 960, y: 330 + i * 110, w: 1600, cls: 'band',
      text, style: serif(58, { color: '#210C09' }) })),
    { t: V(19.76), until: V(20.75), dur: 0.3, pop: true, x: 960, y: 700, w: 900, cls: 'band', text: 'backfires', style: serif(130, { fontStyle: 'italic', color: red }) },
    // 2.3 mocked, belittled
    { t: V(22.56), until: V(24.4), dur: 0.3, pop: true, x: 290, y: 470, w: 520, text: 'mocked', style: serif(112, { fontStyle: 'italic', color: red }) },
    { t: V(23.36), until: V(24.4), dur: 0.3, pop: true, x: 1630, y: 470, w: 560, text: 'belittled', style: serif(112, { fontStyle: 'italic', color: red }) },
    // 2.4 every day, then more and more
    { t: V(28.46), until: V(32.1), dur: 0.3, pop: true, x: 960, y: 950, w: 900, cls: 'band', text: 'every day', style: serif(84, { fontStyle: 'italic', color: red }) },
    { t: V(32.22), until: V(33.3), dur: 0.3, pop: true, x: 960, y: 950, w: 900, cls: 'band', text: 'more and more', style: serif(84, { fontStyle: 'italic', color: red }) },
    // 3.2 where the Criteria come from
    ...[['Scripture', V(49.2), 560], ['Paul in Athens', V(50.24), 960], ['Research', V(51.2), 1360]].map(([text, t, x]) => (
      { t, until: V(53.6), dur: 0.35, pop: true, x, y: 44, w: 440, text, cls: 'band', style: serif(64, { color: red }) })),
    // 4 We assumed · They said · We changed
    veil(V(74.1), V(92.05), { opacity: 0.9 }),
    ...[0, 1, 2].map((i) => ({ t: V(74.15) + i * 0.15, until: V(92.05), dur: 0.35, x: card(i), y: cardTop, w: 470, text: '',
      style: { height: '400px', background: '#FFFFFF', border: `2px solid ${red}`, borderRadius: '8px', boxShadow: '0 10px 30px rgba(33, 12, 9, 0.08)' } })),
    ...['We assumed', 'They said', 'We changed'].map((text, i) => ({ t: V(74.2) + i * 0.15, until: V(92.05), dur: 0.35, x: card(i), y: cardTop + 34, w: 420,
      text: text.toUpperCase(), style: sans(22, { fontWeight: 600, letterSpacing: '0.14em', color: red }) })),
    { t: V(75.88), until: V(92.05), dur: 0.9, write: true, x: card(0), y: cardTop + 110, w: 400, text: 'Our personas sounded like real people.', style: serif(50) },
    { t: V(84.88), until: V(92.05), dur: 0.6, write: true, x: card(1), y: cardTop + 110, w: 400, text: 'Like editors.', style: serif(50) },
    { t: V(87.24), until: V(92.05), dur: 0.7, write: true, x: card(1), y: cardTop + 200, w: 400, text: 'Scores too generous.', style: serif(50) },
    { t: V(89.5), until: V(92.05), dur: 0.7, write: true, x: card(2), y: cardTop + 110, w: 400, text: 'Personas only react.', style: serif(50) },
    { t: V(90.62), until: V(92.05), dur: 0.7, write: true, x: card(2), y: cardTop + 200, w: 400, text: 'Scoring got stricter.', style: serif(50) },
    // 5.2 the logo on its own, see Christ in you, the link
    veil(V(99.04), Infinity),
    { t: V(99.3), until: Infinity, dur: 0.6, x: 960, y: 260, w: 430, img: '/assets/logo-red.png', text: '' },
    { t: V(103.04), until: Infinity, dur: 1.2, write: true, x: 960, y: 600, w: 1200, text: 'see Christ in you', style: serif(96, { fontStyle: 'italic', color: red }) },
    { t: V(104.5), until: Infinity, dur: 0.6, x: 960, y: 790, w: 1200, text: ARTIFACT_URL, style: sans(30, { color: slate }) },
  ];

  const cursor = [
    // 2.5 Begin review
    { from: V(33.55), to: V(35.1), start: [1520, 980], moves: [{ t: V(33.75), frame: 'intro', target: '.ll-begin', dur: 0.6 }] },
    // 3.1 the link field, Add Post, Send for review
    { from: V(39.3), to: V(44.6), start: [1560, 1000], moves: [
      { t: V(39.45), frame: 'page', target: '#post-url', dur: 0.45, at: [0.25, 0.5] },
      { t: V(42.05), frame: 'page', target: '#add-post', dur: 0.45 },
      { t: V(43.5), frame: 'page', target: '#evaluate-all', dur: 0.5 },
    ] },
    // 3.3 Gentleness & Respect
    { from: V(54.95), to: V(56.4), start: [1500, 980], moves: [{ t: V(55.15), frame: 'page', target: () => row(2)()?.querySelector('button'), dur: 0.45 }] },
    // 3.5 Read a Persona
    { from: V(62.7), to: V(63.9), start: [1450, 960], moves: [{ t: V(62.85), frame: 'page', target: '#posts .persona-pick', dur: 0.4 }] },
  ].map((seg) => ({ ...seg, moves: seg.moves.map((m) => ({ ...m, target: typeof m.target === 'string' ? (() => api.q(m.frame, m.target)) : m.target })) }));

  // The reel link never shows once the Post is added.
  const blurLinks = () => {
    const walker = page.doc.createTreeWalker(page.doc.querySelector('main'), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeValue.includes('instagram.com')) n.parentElement.classList.add('vid-blur');
    }
  };
  const post = () => ll.state.posts[0];
  const scrollTo = { from: 330, to: 330 };

  const events = [
    // 2.5 Begin review: the envelope closes and flies off
    { t: tBegin, run: () => { intro.win.__group = 'exit'; intro.doc.querySelector('.ll-begin').click(); } },
    { t: tExitDone, run: () => { intro.win.__anims.filter((a) => a.__group === 'exit').forEach((a) => a.finish()); } },
    // 3.1 Add Post (the link was typed in by the track below)
    { t: tAdd, run: () => {
      ll.addPost({ source_url: saved.source_url, video_transcript: saved.video_transcript });
      page.doc.getElementById('post-form').reset();
      ll.render();
      blurLinks();
      // The new Post pushes Send for review below the fold of the letter: scroll on to it.
      const letter = page.doc.getElementById('letter');
      const send = page.doc.getElementById('evaluate-all').getBoundingClientRect();
      scrollTo.from = letter.scrollTop;
      scrollTo.to = letter.scrollTop + Math.max(0, send.bottom - letter.getBoundingClientRect().bottom + 90);
    } },
    // 3.1 Send for review: the letter goes into the envelope and flies to the Mailbox (on video time)
    { t: tSend, run: () => {
      page.win.__group = 'clock';
      ll.state.busy = true;
      post().status = 'evaluating';
      ll.render();
      ll.sendLetter();
    } },
    // 3.2 the saved Review, shown as if it had just run
    { t: tResults, run: () => {
      ll.resetDesk();
      page.win.__group = 'open';
      post().evaluation = structuredClone(saved.evaluation);
      post().status = 'done';
      ll.state.busy = false;
      ll.showView('results');
      ll.render();
      page.win.scrollTo(0, 0);
      blurLinks();
    } },
    // 3.3 Gentleness & Respect opens its Evidence beside the table
    { t: V(55.62), run: () => { row(2)()?.querySelector('button').click(); } },
    // 3.5 Read a Persona → the Emboldened Believer
    { t: V(63.3), run: () => {
      const pick = page.doc.querySelector('#posts .persona-pick');
      pick.value = '6';
      pick.dispatchEvent(new page.win.Event('change', { bubbles: true }));
    } },
    // 5.1 the Roadmap, behind the cards
    { t: tRoadmap - 0.3, run: () => {
      page.doc.querySelector('[data-nav="roadmap"]').click();
      page.win.scrollTo(0, 0);
    } },
  ];

  const tracks = [
    // The Artifact re-renders the Post on every change, so the link is blurred again each frame.
    (t) => { if (t >= tAdd) blurLinks(); },
    // 3.1 the letter scrolls down to the Add Posts form
    (t) => {
      if (t < V(38.8) || t > tAdd) return;
      const p = Math.max(0, Math.min(1, (t - V(38.8)) / 0.6));
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      page.doc.getElementById('letter').scrollTop = 330 * e;
    },
    // 3.1 after Add Post, on to Send for review
    (t) => {
      if (t < tAdd || t > tSend) return;
      const p = Math.max(0, Math.min(1, (t - tAdd - 0.1) / 0.5));
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      page.doc.getElementById('letter').scrollTop = scrollTo.from + (scrollTo.to - scrollTo.from) * e;
    },
    // 3.1 the link is typed in
    (t) => {
      if (t < V(39.95) || t >= tAdd) return;
      const n = Math.round(LINK.length * Math.max(0, Math.min(1, (t - V(39.95)) / 1.2)));
      page.doc.getElementById('post-url').value = LINK.slice(0, n);
    },
  ];

  const anims = [
    // 2.1 the envelope is already open when the hook cuts to it
    { group: 'open', keys: [[tHear, 2750]] },
    { group: 'exit', keys: [[tBegin, 0], [tExitDone, 2340]] },
  ];

  const introOpacity = [{ t: tExitDone + 0.02, v: 0, dur: 0 }];

  const duration = V(AUDIO_END) + TAIL;
  return {
    camera, highlights, spotlights, overlays, cursor, events, tracks, anims, introOpacity,
    fadeOut: { t: duration + 1, dur: 1 },
    duration,
    holds: HOLDS.map((h, i) => ({ ...h, video: H(i) })),
    audio: 'assets/vo-2min.m4a',
    out: 'living-letter-2min.mp4',
  };
}
