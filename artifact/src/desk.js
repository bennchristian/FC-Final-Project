// Send-for-review motion on the Review page (the desk: the letter in its envelope, the Mailbox beside it).
// The front of the envelope rises, the letter slides in, the flap closes, the view pulls back, and the
// sealed envelope flies into the Mailbox slot. Decoration only: ui.js starts the Review at once and
// waits for this (about 2.5 s) only before showing the results. On narrow screens, or with reduced
// motion, the letter just fades.

const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const EASE_IN = 'cubic-bezier(0.55, 0, 0.8, 0.2)';
const EASE_FLY = 'cubic-bezier(0.3, 0, 0.2, 1)';
const FLAP_UP = 'perspective(2400px) rotateX(90deg)';
const FLAP_SHUT = 'perspective(2400px) rotateX(0deg)';

let running = [];

function play(node, keyframes, options) {
  const animation = node.animate(keyframes, { fill: 'forwards', ...options });
  running.push(animation);
  return animation;
}

function settle(list) {
  return Promise.all(list.map((a) => a.finished.catch(() => undefined)));
}

function fullMotion() {
  return window.matchMedia('(min-width: 1000px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Resolves once the letter has gone; the desk stays in its sent state until resetDesk().
export async function sendLetter() {
  const stage = document.getElementById('stage');
  const scene = document.getElementById('scene');
  const letter = document.getElementById('letter');
  const slot = document.getElementById('mail-slot');
  resetDesk();
  if (!fullMotion()) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    await settle([play(letter, [{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 1 : 260, easing: 'ease-out' })]);
    return;
  }
  const back = scene.querySelector('.env-back');
  const open = scene.querySelector('.env-open');
  const deep = scene.querySelector('.env-deep');
  const flap = scene.querySelector('.env-flap');
  letter.scrollTop = 0;

  // 1. The front of the envelope rises and the letter slides in, its top just below the fold.
  const backBox = back.getBoundingClientRect();
  const drop = backBox.top - letter.getBoundingClientRect().top + backBox.height * 0.06;
  play(open, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' });
  play(deep, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  await settle([play(letter, [{ transform: 'none' }, { transform: `translateY(${drop}px)` }], { delay: 160, duration: 640, easing: EASE_IN_OUT })]);

  // 2. The flap swings down over it.
  await settle([play(flap, [
    { offset: 0, transform: FLAP_UP, opacity: 0 },
    { offset: 0.2, opacity: 1 },
    { offset: 1, transform: FLAP_SHUT, opacity: 1 },
  ], { duration: 480, easing: EASE_IN_OUT })]);

  // 3. The view pulls back until the whole sealed envelope fits in the stage.
  const stageBox = stage.getBoundingClientRect();
  const envTop = backBox.top - stageBox.top;
  const scale = Math.min(0.6, (stageBox.height * 0.8) / backBox.height);
  const lift = (stageBox.height - backBox.height * scale) / 2 - envTop;
  scene.style.transformOrigin = `${backBox.left - stageBox.left + backBox.width / 2}px ${envTop}px`;
  await settle([play(scene, [{ transform: 'none' }, { transform: `translateY(${lift}px) scale(${scale})` }], { duration: 520, easing: EASE_IN_OUT })]);

  // 4. A copy of the sealed envelope flies to the Mailbox. It lives outside the stage, which clips.
  const from = back.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'env-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  for (const part of [back, deep, flap]) ghost.append(part.cloneNode(true));
  document.body.append(ghost);
  play(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 1 });

  const target = slot.getBoundingClientRect();
  const k = (target.width * 0.8) / from.width;
  const height = from.height * k;
  const dx = target.left + (target.width - from.width * k) / 2 - from.left;
  const dy = target.top + target.height / 2 - height - from.top;
  const above = `translate(${dx}px, ${dy}px) scale(${k})`;
  try {
    await settle([play(ghost, [{ transform: 'none' }, { transform: above }], { duration: 720, easing: EASE_FLY })]);
    // 5. Into the slot: whatever passes its middle line is inside the box.
    await settle([play(ghost, [
      { transform: above, clipPath: 'inset(0 0 0 0)' },
      { transform: `translate(${dx}px, ${dy + height}px) scale(${k})`, clipPath: 'inset(0 0 100% 0)' },
    ], { duration: 420, easing: EASE_IN })]);
  } finally {
    ghost.remove();
  }
}

// Puts the desk back as it was: open envelope, letter out. Called once the results are showing.
export function resetDesk() {
  for (const animation of running) {
    try { animation.cancel(); } catch { /* already gone */ }
  }
  running = [];
  const scene = document.getElementById('scene');
  if (scene) scene.style.transformOrigin = '';
}
