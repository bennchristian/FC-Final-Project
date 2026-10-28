// Home page motion (design partner, 2026-10-28). The first time Home is on screen, the envelope mark
// draws itself and the hero text is typed in place, then "the only gospel people know" is underlined.
// Then the devices beside the statistics drop in from above, once they are also in view, and float.
// With reduced motion none of it runs: everything is simply there. Decoration only: the text is in
// the page from the start, so nothing depends on this running.

const TYPING = [['.home-tagline', 32], ['.home-hero .home-what', 14], ['.home-lede', 5]];

let homeMotion = 'off'; // off -> waiting -> played
let heroTyped = false;
let devicesInView = false;

export function prepareHomeMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Hidden until it plays, so the text does not show and then vanish to be typed.
  document.getElementById('view-home').classList.add('home-hero-wait');
  homeMotion = 'waiting';
  watchDevices();
}

// Plays once, the first time Home is shown with the intro gone.
export async function playHomeMotion() {
  const intro = document.getElementById('ll-intro');
  if (homeMotion !== 'waiting' || (intro && !intro.hidden)) return;
  homeMotion = 'played';
  const view = document.getElementById('view-home');
  const seal = view.querySelector('.home-seal');
  const strokes = [...seal.children];
  for (const stroke of strokes) Object.assign(stroke.style, { strokeDasharray: '1', strokeDashoffset: '1' });
  view.classList.replace('home-hero-wait', 'home-hero-typing');
  await Promise.all(strokes.map((stroke, i) => stroke.animate(
    [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
    { duration: 650, delay: i * 220, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  ).finished.catch(() => undefined)));
  for (const [selector, msPerChar] of TYPING) await typeInPlace(view.querySelector(selector), msPerChar);
  // CSS draws the underline across "the only gospel people know" once the typing class goes.
  view.classList.replace('home-hero-typing', 'home-hero-typed');
  heroTyped = true;
  showDevices();
}

// Types an element's text where it stands: each text node becomes a shown part and a hidden
// remainder that keeps its space, so nothing reflows while it types. A caret follows the last
// character. The original text nodes are put back at the end.
function typeInPlace(el, msPerChar) {
  return new Promise((resolve) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.data) nodes.push(node);
    const parts = nodes.map((node) => {
      const shown = document.createElement('span');
      const rest = document.createElement('span');
      rest.className = 'type-rest';
      rest.textContent = node.data;
      node.replaceWith(shown, rest);
      return { node, shown, rest, text: node.data };
    });
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
      if (caret.nextSibling !== typing.rest) typing.rest.before(caret);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

// The devices wait, hidden, until the hero is typed and about a third of them is in view.
function watchDevices() {
  const box = document.querySelector('.home-devices');
  if (!box) return;
  box.classList.add('devices-wait');
  if (!('IntersectionObserver' in window)) {
    devicesInView = true;
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      devicesInView = true;
      showDevices();
    }
  }, { threshold: 0.3 });
  observer.observe(box);
}

function showDevices() {
  if (heroTyped && devicesInView) document.querySelector('.home-devices').classList.replace('devices-wait', 'devices-in');
}
