// Mechanical checks for the Demo Artifact's "must hold" rules (AD-5, AD-12, AD-14):
// no network calls, no browser storage (Past Reviews live only in the viewer's private db subtree),
// screenshots never rendered, text-only rendering.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../content.mjs';

const SRC = join(ROOT, 'artifact', 'src');
const sources = readdirSync(SRC).filter((f) => f.endsWith('.js')).map((f) => [f, readFileSync(join(SRC, f), 'utf8')]);

const BANNED = [
  [/\bfetch\s*\(/, 'network: fetch'],
  [/XMLHttpRequest|WebSocket|EventSource|sendBeacon/, 'network'],
  [/localStorage|sessionStorage|indexedDB|document\.cookie/, 'persistence'],
  [/innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'markup injection'],
  [/<img|['"]img['"]|new Image\s*\(|createObjectURL|readAsDataURL/, 'rendering an image'],
  [/\beval\s*\(|new Function\s*\(/, 'dynamic code'],
  [/sample\.json\s*\(/, 'sample.json hides modelApplied (AD-7)'],
  [/\btools\s*:/, 'no tools on any call (AD-7)'],
];

const MARKUP = /innerHTML|outerHTML|insertAdjacentHTML|document\.write/;

for (const [file, text] of sources) {
  test(`${file} avoids banned APIs`, () => {
    for (const [pattern, why] of BANNED) {
      // The owner copy editor parses its edit HTML in one inert <template>; checked below.
      if (file === 'editor.js' && pattern.source === MARKUP.source) continue;
      assert.doesNotMatch(text, pattern, `${file}: ${why}`);
    }
  });
}

test('editor.js parses markup only into an inert template, and never renders model output', () => {
  const editor = sources.find(([f]) => f === 'editor.js')[1];
  assert.doesNotMatch(editor, /outerHTML|insertAdjacentHTML|document\.write|DOMParser|createContextualFragment/);
  const assignments = [...editor.matchAll(/([\w.]+)\.innerHTML\s*=(?!=)/g)].map((m) => m[1]);
  assert.deepEqual(assignments, ['tpl'], 'the only innerHTML assignment is tpl.innerHTML in cleanTemplate');
  assert.doesNotMatch(editor, /evaluatePost|requestRewrite|createOutreach|\.evaluation\b/);
});

test('Persona Reactions carry the one-line simulated note (FR-9)', () => {
  const ui = sources.find(([f]) => f === 'ui.js')[1];
  const body = ui.slice(ui.indexOf('function renderReactions'), ui.indexOf('\nfunction ', ui.indexOf('function renderReactions') + 1));
  assert.match(body, /COPY\.simulated/);
  assert.match(ui, /simulated: 'Simulated perspectives, not real people’s opinions\.'/);
});

test('no two functions share a name once the sources are inlined into one script', () => {
  // build.mjs joins every source into one script, where a second declaration silently replaces the first.
  const names = sources.flatMap(([f, text]) => [...text.matchAll(/^(?:export )?(?:async )?function (\w+)/gm)].map((m) => `${m[1]} (${f})`));
  const seen = new Map();
  for (const entry of names) {
    const name = entry.split(' ')[0];
    assert.ok(!seen.has(name), `${entry} repeats ${seen.get(name)}`);
    seen.set(name, entry);
  }
});

test('Send feedback opens the Outreach Plan in a popup; the results have no Outreach section', () => {
  const build = readFileSync(join(ROOT, 'artifact', 'build.mjs'), 'utf8');
  assert.match(build, /<dialog class="feedback" id="feedback"/);
  assert.doesNotMatch(build, /id="outreach-slot"/);
  const ui = sources.find(([f]) => f === 'ui.js')[1];
  assert.match(ui, /\$\('feedback'\)\.showModal\(\)/);
  assert.match(ui, /\$\('feedback-body'\)\.replaceChildren/);
});

test('the intro hides instead of removing itself, and the page has no Go back', () => {
  const intro = readFileSync(join(SRC, 'intro.js'), 'utf8');
  assert.doesNotMatch(intro, /root\.remove\(\)/);
  assert.doesNotMatch(intro, /go-back/);
  const build = readFileSync(join(ROOT, 'artifact', 'build.mjs'), 'utf8');
  assert.doesNotMatch(build, /id="go-back"/);
});

test('Past Reviews write only under the viewer’s private subtree', () => {
  const ui = sources.find(([f]) => f === 'ui.js')[1];
  const collections = [...ui.matchAll(/\.collection\(([^)]*\)?)\)/g)].map((m) => m[1]);
  assert.ok(collections.length > 0);
  for (const arg of collections) assert.match(arg, /^(pastReviewsPath\(state\.viewerId|'posts')/, arg);
  assert.doesNotMatch(ui, /\bdb\.doc\(/);
  const past = sources.find(([f]) => f === 'past.js')[1];
  assert.match(past, /return `data\/users\/\$\{viewerId\}`;/);
});

test('every page view has a nav target and the intro lands on Home', () => {
  const build = readFileSync(join(ROOT, 'artifact', 'build.mjs'), 'utf8');
  for (const view of ['home', 'review', 'results', 'profile', 'how', 'roadmap']) assert.match(build, new RegExp(`id="view-${view}"`), view);
  const intro = readFileSync(join(SRC, 'intro.js'), 'utf8');
  const html = readFileSync(join(SRC, 'intro.html'), 'utf8');
  assert.match(html, /data-go="home">Learn more</);
  assert.match(html, /data-go="review">Begin review</);
  assert.match(intro, /if \(event\.key === 'Escape'\) exit\('home'\)/);
});
