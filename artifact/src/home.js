// Home page motion (design partner, 2026-10-28). Each part plays only once the one before it has
// finished, and (below the hero) once half of it is on screen:
//   1. the hero: the envelope mark draws itself, the text is typed in place, then "the only gospel
//      people know" is underlined;
//   2. "Social media ministry is growing fast." is typed, then "fast" is underlined;
//   3. the devices beside the statistics drop in from above, then hover;
//   4. "Why…" and the Living Letter logo are typed, then the logo's envelope lines draw themselves.
// Anything not yet played is hidden, so nothing shows and then vanishes to be typed. A part the
// viewer has already scrolled past counts as seen. With reduced motion none of it runs.
// Decoration only: the text is in the page from the start.

const SVG_NS = 'http://www.w3.org/2000/svg';
const UNDERLINE_MS = 900; // matches the .home-underline transition in page.css
const DEVICES_MS = 1300; // the last device's drop (page.css: 420ms delay + 0.9s)
const IN_VIEW = 0.5;
const DRAW = { duration: 450, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' };

let homeMotion = 'off'; // off -> waiting -> played
const seen = new Map(); // element -> { seen, wake }

export function prepareHomeMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const view = document.getElementById('view-home');
  for (const el of view.querySelectorAll('.home-hero > *, #home-why-title, #home-name-title')) el.classList.add('type-pending');
  for (const el of view.querySelectorAll('.home-hero .home-underline, #home-why-title .home-underline')) el.classList.add('underline-pending');
  // The strokes that draw themselves start undrawn.
  for (const stroke of view.querySelectorAll('.home-seal > *, .home-name-title svg path')) {
    Object.assign(stroke.style, { strokeDasharray: '1', strokeDashoffset: '1' });
  }
  view.querySelector('.home-devices').classList.add('devices-wait');
  for (const selector of ['#home-why-title', '.home-devices', '#home-name-title']) watch(view.querySelector(selector));
  homeMotion = 'waiting';
}

// Plays once, the first time Home is shown with the intro gone.
export async function playHomeMotion() {
  const intro = document.getElementById('ll-intro');
  if (homeMotion !== 'waiting' || (intro && !intro.hidden)) return;
  homeMotion = 'played';
  const view = document.getElementById('view-home');
  const $ = (selector) => view.querySelector(selector);

  // 1. The hero.
  const seal = $('.home-seal');
  seal.classList.remove('type-pending');
  await draw([...seal.children]);
  for (const [selector, msPerChar] of [['.home-tagline', 22], ['.home-hero .home-what', 9], ['.home-lede', 3]]) {
    await typeInPlace($(selector), msPerChar);
  }
  await underline($('.home-tagline .home-underline'));

  // 2. "Social media ministry is growing fast."
  await whenSeen($('#home-why-title'));
  await typeInPlace($('#home-why-title'), 28);
  await underline($('#home-why-title .home-underline'));

  // 3. The devices.
  await whenSeen($('.home-devices'));
  $('.home-devices').classList.replace('devices-wait', 'devices-in');
  await pause(DEVICES_MS);

  // 4. "Why…" and the logo.
  await whenSeen($('#home-name-title'));
  await typeInPlace($('#home-name-title'), 70);
  await draw([...$('.home-name-title svg').querySelectorAll('path')]);
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function draw(strokes) {
  return Promise.all(strokes.map((stroke, i) => stroke.animate(
    [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { ...DRAW, delay: i * 150 },
  ).finished.catch(() => undefined)));
}

function underline(el) {
  el.classList.remove('underline-pending');
  return pause(UNDERLINE_MS);
}

// "Seen" once half of the element has been on screen, or once the viewer has scrolled past it.
function watch(el) {
  const state = { seen: false, wake: null };
  seen.set(el, state);
  if (!('IntersectionObserver' in window)) {
    state.seen = true;
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    const top = entry.rootBounds ? entry.rootBounds.top : 0;
    const above = !entry.isIntersecting && entry.boundingClientRect.bottom <= top && entry.boundingClientRect.height > 0;
    if ((entry.isIntersecting && entry.intersectionRatio >= IN_VIEW) || above) {
      observer.disconnect();
      state.seen = true;
      if (state.wake) state.wake();
    }
  }, { threshold: [0, IN_VIEW] });
  observer.observe(el);
}

function whenSeen(el) {
  const state = seen.get(el);
  if (!state || state.seen) return Promise.resolve();
  return new Promise((resolve) => { state.wake = resolve; });
}

// Types an element's text where it stands: each text node becomes a shown part and a hidden
// remainder that keeps its space, so nothing reflows while it types. SVG text (the logo) gets
// tspans. A caret follows the last character of HTML text. Screen-reader-only text is left as
// it is. The original text nodes are put back at the end.
function typeInPlace(el, msPerChar) {
  return new Promise((resolve) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.data.trim() && !node.parentElement.closest('.sr-only') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node);
    const parts = nodes.map((node) => {
      const svg = node.parentNode.namespaceURI === SVG_NS;
      const make = () => (svg ? document.createElementNS(SVG_NS, 'tspan') : document.createElement('span'));
      const shown = make();
      const rest = make();
      rest.setAttribute('class', 'type-rest');
      rest.textContent = node.data;
      node.replaceWith(shown, rest);
      return { node, shown, rest, svg, text: node.data };
    });
    // Its text is now all in hidden remainders, so the block can show without a flash.
    el.classList.remove('type-pending');
    const caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    const total = parts.reduce((sum, part) => sum + part.text.length, 0);
    const start = performance.now();
    function frame(now) {
      let left = Math.min(total, Math.floor((now - start) / msPerChar));
      const done = left >= total;
      for (const part of parts) {
        const count = Math.min(part.text.length, left);
        left -= count;
        if (part.shown.textContent.length !== count) {
          part.shown.textContent = part.text.slice(0, count);
          part.rest.textContent = part.text.slice(count);
        }
      }
      if (done) {
        caret.remove();
        for (const part of parts) {
          part.shown.replaceWith(part.node);
          part.rest.remove();
        }
        resolve();
        return;
      }
      const typing = parts.find((part) => part.rest.textContent) || parts[parts.length - 1];
      if (typing.svg) caret.remove();
      else if (caret.nextSibling !== typing.rest) typing.rest.before(caret);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
