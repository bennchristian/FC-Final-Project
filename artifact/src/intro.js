// Living Letter first-screen intro (design: _bmad-output/planning-artifacts/ux-designs/ux-FC-Final-Project-2026-10-21/).
// Opening: the closed envelope fades in, the flap swings up, the letter rises while the view settles on slide 2.
// Start here: the letter slides back in, the flap closes, the envelope flies up off the screen and the page underneath shows.
// "Review" and "How it works" do the same exit, then open that tab. Escape skips straight to the exit.
// Try the demo (FR-24) asks ui.js to load the fictional sample Review, then does the Start here exit.
// When the sample landed it sets <html data-demo="started"> and fires `ll:demo-started` (the tour hook).
// "Go back" on the page shows the intro again and replays the opening. The Review stays in page memory.
(function () {
  'use strict';
  const root = document.getElementById('ll-intro');
  if (!root) return;

  const page = document.querySelector('main');
  const scene = root.querySelector('.ll-scene');
  const flap = root.querySelector('.ll-flap');
  const letter = root.querySelector('.ll-letter');
  const start = root.querySelector('.ll-start');
  const demo = root.querySelector('.ll-demo');
  // SAMPLE_REVIEW is inlined by build.mjs; null when the build has no sample.
  if (demo) demo.hidden = typeof SAMPLE_REVIEW === 'undefined' || !SAMPLE_REVIEW;
  const actions = demo ? [start, demo] : [start];
  const chrome = Array.from(root.querySelectorAll('.ll-top'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FLAP_SHUT = 'perspective(3200px) rotateX(0deg)';
  const FLAP_EDGE = 'perspective(3200px) rotateX(90deg)';
  const FLAP_OPEN = 'perspective(3200px) rotateX(180deg)';
  const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
  const EASE_IN = 'cubic-bezier(0.55, 0, 0.8, 0.2)';

  let state = 'closed'; // closed -> opening -> open -> closing -> done
  let running = [];

  // ---------- Layout ----------
  function isCompact() {
    return window.innerWidth < 720 || window.innerWidth / window.innerHeight < 0.9;
  }
  function fit() {
    const compact = isCompact();
    root.classList.toggle('ll-compact', compact);
    const s = compact ? 0.42 : Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    root.style.setProperty('--s', String(s));
  }
  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  // ---------- Animation helpers ----------
  function play(el, keyframes, options) {
    const a = el.animate(keyframes, Object.assign({ fill: 'both' }, options));
    running.push(a);
    return a;
  }
  function settle(list) {
    return Promise.all(list.map((a) => a.finished.catch(() => undefined)));
  }

  // ---------- Opening ----------
  function open() {
    state = 'opening';
    const closed = cssVar('--ll-closed');
    const letterIn = cssVar('--ll-letter-in');

    if (reduceMotion || isCompact()) {
      const list = [
        play(scene, [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: 'none' }], { duration: reduceMotion ? 1 : 450, easing: 'ease-out' }),
        play(letter, [{ transform: 'none' }, { transform: 'none' }], { duration: 1 }),
        play(flap, [{ transform: FLAP_OPEN, zIndex: 2 }, { transform: FLAP_OPEN, zIndex: 2 }], { duration: 1 }),
        ...actions.map((el) => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: reduceMotion ? 1 : 300, delay: reduceMotion ? 0 : 250 })),
        ...chrome.map((el) => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: reduceMotion ? 1 : 450 })),
      ];
      return settle(list).then(opened);
    }

    const list = [
      // Closed envelope appears.
      play(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' }),
      ...chrome.map((el) => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 150, easing: 'ease-out' })),
      // Flap swings up toward the viewer and drops behind the letter halfway through.
      play(flap, [
        { offset: 0, transform: FLAP_SHUT, zIndex: 5 },
        { offset: 0.5, transform: FLAP_EDGE, zIndex: 5 },
        { offset: 0.5, transform: FLAP_EDGE, zIndex: 2 },
        { offset: 1, transform: FLAP_OPEN, zIndex: 2 },
      ], { delay: 700, duration: 760, easing: EASE_IN_OUT }),
      // Letter rises out while the view moves in to the open framing.
      play(letter, [{ transform: letterIn }, { transform: 'none' }], { delay: 1180, duration: 1050, easing: EASE_OUT }),
      play(scene, [{ transform: closed }, { transform: 'none' }], { delay: 1180, duration: 1150, easing: EASE_IN_OUT }),
      // Start here and Try the demo arrive last.
      ...actions.map((el) => play(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { delay: 2250, duration: 500, easing: 'ease-out' })),
    ];
    return settle(list).then(opened);
  }

  function opened() {
    if (state !== 'opening') return;
    state = 'open';
    // No auto-focus: a programmatic focus on load draws a focus ring in the recording. Tab reaches Start here.
  }

  // ---------- Closing and exit ----------
  function exit(target) {
    if (state === 'closing' || state === 'done') return;
    const notStarted = state === 'closed';
    // If the opening is still running, jump it to the end first.
    running.forEach((a) => { try { a.finish(); } catch (e) { /* already finished */ } });
    running = [];
    state = 'closing';

    if (notStarted || reduceMotion || isCompact()) {
      const fade = play(root, [{ opacity: 1 }, { opacity: 0 }], { duration: reduceMotion ? 200 : 350, easing: 'ease-out' });
      return settle([fade]).then(() => done(target));
    }

    const closed = cssVar('--ll-closed');
    const letterIn = cssVar('--ll-letter-in');
    const flyUp = 'translateY(-1500px) ' + closed;

    const list = [
      ...actions.map((el) => play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out' })),
      // Letter slides back into the envelope as the view pulls back.
      play(letter, [{ transform: 'none' }, { transform: letterIn }], { duration: 820, easing: EASE_IN_OUT }),
      play(scene, [{ transform: 'none', opacity: 1 }, { transform: closed, opacity: 1 }], { duration: 900, easing: EASE_IN_OUT }),
      // Flap swings shut and comes back in front halfway through.
      play(flap, [
        { offset: 0, transform: FLAP_OPEN, zIndex: 2 },
        { offset: 0.5, transform: FLAP_EDGE, zIndex: 2 },
        { offset: 0.5, transform: FLAP_EDGE, zIndex: 5 },
        { offset: 1, transform: FLAP_SHUT, zIndex: 5 },
      ], { delay: 680, duration: 620, easing: EASE_IN_OUT }),
      // The sealed envelope lifts off the top of the screen.
      // fill 'forwards' only: a backwards fill would hold `closed` during the delay and cut the pull-back short.
      play(scene, [{ transform: closed }, { transform: flyUp }], { delay: 1380, duration: 650, easing: EASE_IN, fill: 'forwards' }),
      ...chrome.map((el) => play(el, [{ opacity: 1 }, { opacity: 0 }], { delay: 1300, duration: 350, easing: 'ease-out' })),
      // The cream page fades away to show the Artifact.
      play(root, [{ opacity: 1 }, { opacity: 0 }], { delay: 1820, duration: 420, easing: 'ease-out' }),
    ];
    if (page) {
      list.push(play(page, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { delay: 1820, duration: 520, easing: EASE_OUT, fill: 'backwards' }));
    }
    return settle(list).then(() => done(target));
  }

  function done(target) {
    state = 'done';
    running.forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
    running = [];
    // Hidden, not removed, so Go back can show it again.
    root.hidden = true;
    document.documentElement.style.removeProperty('overflow');
    if (page) page.inert = false;
    const tab = document.getElementById(target === 'how' ? 'tab-button-how' : 'tab-button-review');
    if (tab) {
      tab.click();
      tab.focus({ preventScroll: true });
    }
    window.removeEventListener('resize', fit);
    document.removeEventListener('keydown', onKey);
  }

  // ---------- Try the demo (FR-24) ----------
  // ui.js declines (detail.loaded stays false) when the viewer already has Posts of their own or a
  // run is busy: then this is plain Start here and no hook fires.
  function tryDemo() {
    if (state === 'closing' || state === 'done') return;
    const detail = { loaded: false };
    document.dispatchEvent(new CustomEvent('ll:try-demo', { detail }));
    const exiting = exit('review');
    if (!detail.loaded) return;
    Promise.resolve(exiting).then(() => {
      document.documentElement.dataset.demo = 'started';
      document.dispatchEvent(new CustomEvent('ll:demo-started'));
    });
  }

  // ---------- Wiring ----------
  function onKey(event) {
    if (event.key === 'Escape') exit('review');
  }

  function cover() {
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    if (page) page.inert = true;
  }

  // Go back: show the intro again from the closed envelope. Nothing on the page is cleared.
  function reopen() {
    if (state !== 'done') return;
    state = 'closed';
    root.hidden = false;
    cover();
    open();
  }

  cover();
  const goBack = document.getElementById('go-back');
  if (goBack) goBack.addEventListener('click', reopen);

  start.addEventListener('click', () => exit('review'));
  if (demo) demo.addEventListener('click', tryDemo);
  root.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => exit(button.getAttribute('data-go')));
  });

  // Wait briefly for the brand fonts so text does not reflow mid-animation.
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
        document.fonts.load('400 82px "Instrument Serif"'),
        document.fonts.load('italic 400 82px "Instrument Serif"'),
        document.fonts.load('400 26px "Open Sans"'),
        document.fonts.load('500 40px "Open Sans"'),
      ])
    : Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 1500));

  Promise.race([fontsReady, timeout]).then(open);
})();
