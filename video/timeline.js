// The video's cues, timed to the recorded voice-over (docs/video/script.md).
// Times are audio seconds from assets/words.json, passed through V() to get video time.
// HOLDS are the reading pauses (Bennett, 2026-10-26): the VO stops while a quote stays on screen.

export const HOLDS = [
  { at: 92.95, dur: 5 }, //  5.6: two Evidence quotes, ~2.5s each plus the VO
  { at: 99.4, dur: 6 }, //   5.7: the Seeker's bolded phrase
  { at: 109.5, dur: 5 }, //  5.9: the Emboldened Believer's bolded phrase
];
const AUDIO_END = 170.02;
const TAIL = 3;

// Video time of audio time a.
export function V(a) {
  return a + HOLDS.filter((h) => h.at < a).reduce((s, h) => s + h.dur, 0);
}
// Video time at which hold i starts.
const H = (i) => V(HOLDS[i].at);

const C = [960, 540];

export async function build(api) {
  const saved = await fetch('/assets/post1.json').then((r) => r.json());
  const page = api.frames.page;
  const intro = api.frames.intro;

  // Same model as the saved Review, so the page and the results agree.
  if ([...page.doc.querySelectorAll('#model option')].some((o) => o.value === 'claude-opus-5-5')) {
    page.ll.state.modelId = 'claude-opus-5-5';
    page.ll.render();
  }

  // ----- Shorthands -----
  const I = (text, scope) => () => api.phrase('intro', text, scope);
  const P = (text, scope) => () => api.phrase('page', text, scope);
  const q = (sel, i = 0) => () => api.q('page', sel, i);
  const heading = (sel, text, scope) => () => api.byText('page', sel, text, scope);
  const crit = (i) => () => api.q('page', '#posts .criterion', i);
  const evidence = (i) => () => crit(i)()?.querySelector('p');
  const evidenceBlock = (i) => () => api.union(crit(i)()?.querySelector('h5'), evidence(i)());
  const persona = (i) => () => api.q('page', '#posts .reactions > li', i);
  const reason = (i, j) => () => persona(i)()?.querySelectorAll(':scope > ul > li')[j];
  const felt = (i) => () => persona(i)() && [...persona(i)().children].find((c) => c.textContent.startsWith('Felt response'));
  const name = (i) => () => persona(i)()?.querySelector('strong');
  const union = (...ts) => () => api.union(...ts);
  const next = (t) => () => t()?.nextElementSibling;
  const rubric = heading('h4', 'Rubric Scores', '#posts');
  const questions = heading('h4', 'Discussion Questions', '#posts');
  const rewrite = heading('h4', 'Gentler Rewrite', '#posts');
  const changed = heading('p', 'What changed:', '#posts');
  const who = heading('h2', 'Who this is for');

  const tClick = { roadmap: V(145.85) };

  const camera = {
    intro: [
      { t: 0, c: C, z: 1 },
      // 2.2 sharpen our witness online
      { t: 12.4, dur: 1.5, target: I('honest, loving feedback on how to make your witness even clearer.', '.ll-letter'), pad: [300, 330, 300, 330], zmax: 1.8 },
      // 3.1 zoom out; the letter sits small in the centre
      { t: 16.4, dur: 1.6, c: [960, 545], z: 0.86 },
      // 3.2 further out, so "mocked" and "unwelcome" sit either side
      { t: 26.4, dur: 1.0, c: [960, 545], z: 0.6 },
      { t: 30.5, dur: 1.4, c: [960, 545], z: 0.86 },
      // 3.4 the letter's opening line
      { t: 35.5, dur: 1.5, target: '.ll-head', pad: [200, 200, 200, 200], zmax: 1.75 },
      // 4.1 back out for Start here
      { t: 41.0, dur: 0.9, c: C, z: 1 },
    ],
    page: [
      { t: 0, c: C, z: 1 },
      // 4.1 down to Who this is for
      { t: 44.8, dur: 1.2, target: union(who, next(who)), pad: [90, 150, 90, 150], zmax: 1.8 },
      // 5.1 Add Posts, with room above for the question
      { t: 58.9, dur: 1.3, target: union(heading('h2', '2. Add Posts'), '#post-form'), pad: [170, 160, 60, 160], zmax: 1.6 },
      // 5.3 Evaluate
      { t: 71.5, dur: 1.0, target: union('#add-post', heading('h2', '3. Evaluate'), q('#posts article.post > h3')), pad: [150, 200, 120, 200], zmax: 1.6 },
      // 5.4 the scores
      { t: 75.0, dur: 1.3, target: union(rubric, q('#posts table.overview')), pad: [170, 160, 60, 160], zmax: 1.5 },
      // 5.6 Evidence 1 (Gentleness & Respect), then Evidence 2 (Welcome over Judgment)
      { t: 92.4, dur: 1.0, target: evidenceBlock(2), pad: [200, 200, 300, 200], zmax: 1.9 },
      { t: H(0) + 2.5, dur: 0.8, target: evidenceBlock(3), pad: [200, 200, 300, 200], zmax: 1.9 },
      // 5.7 Persona Reactions, then the Seeker
      { t: V(93.8), dur: 1.3, target: union(heading('h4', 'Persona Reactions', '#posts'), felt(0)), pad: [140, 160, 140, 160], zmax: 1.6 },
      { t: V(97.2), dur: 0.9, target: union(name(0), felt(0)), pad: [260, 260, 260, 260], zmax: 2.0 },
      { t: V(99.0), dur: 0.9, target: P("he doesn't see people like me or my friends at all", reason(0, 0)), pad: [380, 300, 380, 300], zmax: 2.3 },
      // 5.8 the Drifter
      { t: V(99.7), dur: 1.1, target: union(name(1), reason(1, 1)), pad: [170, 200, 170, 200], zmax: 1.8 },
      // 5.9 the Emboldened Believer
      { t: V(105.1), dur: 1.1, target: union(name(6), felt(6)), pad: [260, 260, 260, 260], zmax: 2.0 },
      { t: V(108.6), dur: 0.9, target: P('shows me that mocking people is a fair way to make a point', reason(6, 0)), pad: [380, 300, 380, 300], zmax: 2.3 },
      // 6.1–6.2 the Gentler Rewrite
      { t: V(110.5), dur: 1.5, target: union(rewrite, q('#posts .pair')), fit: 'width', pad: [170, 220, 40, 220], zmax: 1.2 },
      { t: V(118.9), dur: 1.0, target: q('#posts .pair > div', 1), fit: 'width', pad: [170, 560, 60, 560], zmax: 1.7 },
      { t: V(121.6), dur: 1.0, target: union(changed, next(changed)), pad: [170, 160, 60, 160], zmax: 1.6 },
      // 6.3 the Ministry Outreach Plan
      { t: V(124.8), dur: 1.2, target: q('#outreach'), pad: [200, 200, 140, 200], zmax: 1.7 },
      // 6.4–6.5 Discussion Questions
      { t: V(132.54), dur: 1.3, target: union(questions, next(questions)), fit: 'width', pad: [170, 220, 40, 220], zmax: 1.4 },
      { t: V(137.4), dur: 1.0, target: () => next(questions)()?.children[3], pad: [240, 220, 220, 220], zmax: 1.8 },
      // 7.1 the Roadmap tab
      { t: V(144.9), dur: 1.0, target: '.masthead', pad: [220, 200, 220, 200], zmax: 1.5 },
      { t: V(146.2), dur: 1.2, target: '#tab-roadmap', pad: [110, 160, 70, 160], zmax: 1.5 },
      // 7.4 Go back
      { t: V(163.5), dur: 1.0, c: C, z: 1 },
    ],
  };

  const highlights = [
    // Part A, on the letter
    { frame: 'intro', t: 13.82, dur: 1.4, until: 16.3, target: I('honest, loving feedback on how to make your witness even clearer.', '.ll-letter') },
    { frame: 'intro', t: 37.2, dur: 2.3, until: 41.0, target: I('you who are living letters, known and read by everyone.', '.ll-head') },
    { frame: 'intro', t: 39.74, dur: 0.8, until: 41.0, target: I('2 Corinthians 3:2-3', '.ll-head') },
    // 4.2–4.4 Who this is for
    { frame: 'page', t: 45.6, dur: 0.8, until: 58.7, target: P('Christian content creators.') },
    { frame: 'page', t: 48.96, dur: 0.8, until: 58.7, target: P('You, when a Post gives you pause.') },
    { frame: 'page', t: 52.52, dur: 0.8, until: 58.7, target: P('Leaders of youth and young adults.') },
    // 5.2
    { frame: 'page', t: 69.6, dur: 1.4, until: 72.2, target: P('For an Instagram reel, the link is all you need: its spoken words are read for you.', '#post-form') },
    // 5.6 the 1s
    ...[[2, 88.48], [3, 89.52], [5, 90.44], [6, 91.54]].map(([row, t]) => (
      { frame: 'page', t, dur: 0.45, until: 92.5, target: q('#posts table.overview tbody tr', row) })),
    { frame: 'page', t: 92.6, dur: 1.2, until: H(0) + 2.5, target: P("If you're a dude, why do you want to watch two guys kissing? That's very gay. Why are you gay?", crit(2)) },
    { frame: 'page', t: H(0) + 2.8, dur: 1.2, until: V(93.8) - 0.2, target: P("start throwing Bibles at them and start saying this is a mockery of my God's design of marriage", crit(3)) },
    // 5.7–5.9
    { frame: 'page', t: V(98.14), dur: 0.5, until: V(99.2), target: P('pushed away', felt(0)) },
    { frame: 'page', t: V(99.25), dur: 1.2, until: V(99.7) - 0.3, bold: true, target: P("he doesn't see people like me or my friends at all", reason(0, 0)) },
    { frame: 'page', t: V(102.0), dur: 1.8, until: V(105.0), target: P('This makes church sound like a place that asks me to stop being a good friend.', reason(1, 1)) },
    { frame: 'page', t: V(107.04), dur: 0.6, until: V(108.6), target: P('licensed to mock', felt(6)) },
    { frame: 'page', t: V(108.95), dur: 1.2, until: V(110.2), bold: true, target: P('shows me that mocking people is a fair way to make a point', reason(6, 0)) },
    // 6.2–6.5
    { frame: 'page', t: V(119.6), dur: 2.0, until: V(124.6), target: P('My answer is no, and I want to explain why as honestly as I can, whether you share my faith or not.', q('#posts .pair > div', 1)) },
    { frame: 'page', t: V(122.6), dur: 1.0, until: V(124.6), target: P("Removed the 'Why are you gay?' taunt", '#posts') },
    { frame: 'page', t: V(129.12), dur: 1.4, until: V(132.4), target: P('A draft message you can send yourself, plus Talking Points tied to specific Posts.', '#outreach') },
    { frame: 'page', t: V(130.9), dur: 0.9, until: V(132.4), target: P('This tool never sends or posts anything.', '#outreach') },
    { frame: 'page', t: V(138.3), dur: 2.0, until: V(144.8), target: P("Imagine Jesus making a short video that answers 'Should a Christian attend a gay wedding?'", '#posts') },
    // 7.1–7.3
    { frame: 'page', t: V(147.0), dur: 0.8, until: V(163.4), target: P('Web App with private accounts.', '#tab-roadmap') },
    { frame: 'page', t: V(152.9), dur: 0.9, until: V(163.4), target: P('Own-Content Review and Draft Checkpoint.', '#tab-roadmap') },
    { frame: 'page', t: V(155.04), dur: 0.7, until: V(163.4), target: P('Profile Summary.', '#tab-roadmap') },
    { frame: 'page', t: V(158.44), dur: 1.0, until: V(163.4), target: P('New Rubric and Persona Versions.', '#tab-roadmap') },
  ];

  const spotlights = [
    { frame: 'page', t: 92.5, until: H(0) + 2.5, target: evidenceBlock(2) },
    { frame: 'page', t: H(0) + 2.5, until: V(93.8) - 0.2, target: evidenceBlock(3) },
    { frame: 'page', t: V(99.05), until: V(99.7) - 0.2, target: reason(0, 0) },
    { frame: 'page', t: V(108.7), until: V(110.3), target: reason(6, 0) },
  ];

  const serif = (size, extra = {}) => ({ fontFamily: '"Instrument Serif", serif', fontSize: `${size}px`, lineHeight: 1.05, textAlign: 'center', ...extra });
  const red = '#8A201C';
  const overlays = [
    // 1.1 the hook
    { t: 0.3, until: 7.4, dur: 0.9, x: 960, y: 400, w: 1700, text: 'Have you ever come across a post online and thought,',
      cls: 'sans', style: { fontSize: '46px', color: '#5D6378', textAlign: 'center' } },
    { t: 3.85, until: 7.4, dur: 1.7, write: true, x: 960, y: 480, w: 1800, text: '“Huh… this person’s a Christian?”',
      style: serif(124, { fontStyle: 'italic' }) },
    // 3.2–3.3
    { t: 27.3, until: 30.4, dur: 0.9, write: true, x: 310, y: 480, w: 520, text: 'mocked', style: serif(116, { fontStyle: 'italic', color: red }) },
    { t: 28.1, until: 30.4, dur: 1.0, write: true, x: 1620, y: 480, w: 560, text: 'unwelcome', style: serif(116, { fontStyle: 'italic', color: red }) },
    { t: 33.35, until: 35.4, dur: 1.2, write: true, x: 960, y: 952, w: 1400, text: 'represent Jesus better', cls: 'band',
      style: serif(76, { fontStyle: 'italic', color: red }) },
    // 5.1
    { t: 63.8, until: 72.0, dur: 1.6, write: true, x: 960, y: 46, w: 1700, text: '“Should a Christian attend a gay wedding?”', cls: 'band',
      style: serif(70, { fontStyle: 'italic' }) },
    // 5.4
    ...[['Scripture', 79.32, 560], ['Paul in Athens', 80.76, 960], ['Research', 81.98, 1360]].map(([text, t, x]) => (
      { t, until: 85.5, dur: 0.7, write: true, x, y: 52, w: 420, text, cls: 'band', style: serif(64, { color: red }) })),
    // 5.6 Bennett's notes on the two Evidence quotes
    { t: 92.75, until: H(0) + 2.5, dur: 1.0, write: true, x: 960, y: 900, w: 1500, text: '→  using ‘gay’ as a taunt and mock gay people', cls: 'band',
      style: serif(62, { fontStyle: 'italic', color: red }) },
    { t: H(0) + 3.0, until: V(93.8) - 0.2, dur: 1.0, write: true, x: 960, y: 900, w: 1500, text: '→  extremely hostile and makes people feel unsafe', cls: 'band',
      style: serif(62, { fontStyle: 'italic', color: red }) },
    // 6.1 who you are
    ...[['Creators', 690, V(115.82), V(124.7)], ['Anyone', 960, V(124.8), V(132.45)], ['Youth leaders', 1250, V(132.54), V(144.8)]].map(([text, x, a, b], i) => (
      { t: V(113.42) + i * 0.25, until: V(144.8), dur: 0.6, x, y: 44, text, cls: 'pill', on: [a, b] })),
    // 7.4
    { t: V(168.55), until: Infinity, dur: 1.4, write: true, x: 960, y: 958, w: 760, text: 'see Christ in you', cls: 'band',
      style: serif(84, { fontStyle: 'italic', color: red }) },
  ];

  const cursor = [
    { from: 41.3, to: 42.7, start: [1500, 960], moves: [{ t: 41.5, frame: 'intro', target: '.ll-start', dur: 0.75 }] },
    { from: 67.3, to: 71.6, start: [1500, 1000], moves: [
      { t: 67.45, frame: 'page', target: '#post-url', dur: 0.75, at: [0.3, 0.5] },
      { t: 70.25, frame: 'page', target: '#add-post', dur: 0.7 },
    ] },
    { from: 72.3, to: 74.1, start: [1450, 980], moves: [{ t: 72.45, frame: 'page', target: '#evaluate-all', dur: 0.85 }] },
    { from: V(144.95), to: V(146.4), start: [1500, 900], moves: [{ t: V(145.1), frame: 'page', target: '#tab-button-roadmap', dur: 0.7 }] },
    { from: V(163.6), to: V(164.9), start: [1300, 760], moves: [{ t: V(163.8), frame: 'page', target: '#go-back', dur: 0.7 }] },
  ].map((seg) => ({ ...seg, moves: seg.moves.map((m) => ({ ...m, target: typeof m.target === 'string' ? (() => api.q(m.frame, m.target)) : m.target })) }));

  const ll = page.ll;
  const post = () => ll.state.posts[0];
  const events = [
    // 4.1 Start here: the envelope closes and flies off
    { t: 42.3, run: () => { intro.win.__group = 'exit'; intro.doc.querySelector('.ll-start').click(); } },
    { t: 44.66, run: () => { intro.win.__anims.filter((a) => a.__group === 'exit').forEach((a) => a.finish()); } },
    // 5.2 paste the link, Add Post, reading the reel
    { t: 68.25, run: () => { page.doc.getElementById('post-url').value = saved.source_url; } },
    { t: 70.98, run: () => { ll.state.readingReel = true; ll.$('intake-status').textContent = ll.COPY.readingReel; ll.render(); } },
    { t: 72.0, run: () => {
      ll.state.readingReel = false;
      ll.$('intake-status').textContent = '';
      ll.addPost({ source_url: saved.source_url, video_transcript: saved.video_transcript });
      page.doc.getElementById('post-form').reset();
      ll.render();
    } },
    // 5.3 Evaluate: the saved Review, shown as if it had just run
    { t: 73.33, run: () => { ll.state.busy = true; post().status = 'evaluating'; ll.render(); } },
    { t: 74.9, run: () => {
      post().evaluation = structuredClone(saved.evaluation);
      post().status = 'done';
      ll.state.busy = false;
      ll.render();
    } },
    // 7.1 the Roadmap tab (the intro frame follows, for the Go back crossfade)
    { t: tClick.roadmap, run: () => {
      page.doc.getElementById('tab-button-roadmap').click();
      intro.doc.getElementById('tab-button-roadmap').click();
    } },
    // 7.4 Go back: the envelope returns
    { t: V(164.52), run: () => { intro.win.__group = 'reopen'; intro.doc.getElementById('go-back').click(); } },
  ];

  const tracks = [
    // Roadmap items tick in one by one.
    (t) => {
      if (t < tClick.roadmap) return;
      page.doc.querySelectorAll('#tab-roadmap li').forEach((li, i) => {
        const p = Math.max(0, Math.min(1, (t - tClick.roadmap - 0.5 - i * 0.28) / 0.35));
        li.style.opacity = String(p);
        li.style.transform = `translateY(${(1 - p) * 10}px)`;
      });
    },
  ];

  const anims = [
    { group: 'open', keys: [[7.92, 0], [8.62, 700], [9.86, 700], [11.91, 2750]] },
    { group: 'exit', keys: [[42.3, 0], [44.64, 2340]] },
    // Stops before "Start here" fades back in.
    { group: 'reopen', keys: [[V(164.52), 0], [V(164.52) + 2.2, 2200]] },
  ];

  const introOpacity = [
    { t: 44.66, v: 0, dur: 0 },
    { t: V(164.55), v: 1, dur: 0.35 },
  ];

  const duration = V(AUDIO_END) + TAIL;
  return {
    camera, highlights, spotlights, overlays, cursor, events, tracks, anims, introOpacity,
    fadeOut: { t: duration - 1.2, dur: 1.2 },
    duration,
    holds: HOLDS.map((h, i) => ({ ...h, video: H(i) })),
  };
}
