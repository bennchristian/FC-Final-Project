// Mechanical checks for the Demo Artifact's "must hold" rules (AD-5, AD-12, AD-14):
// no network calls, nothing persisted, screenshots never rendered, text-only rendering.
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

test('every persona-bearing view in ui.js carries the simulated label', () => {
  const ui = sources.find(([f]) => f === 'ui.js')[1];
  for (const fn of ['renderReactions', 'renderQuestions', 'renderOutreach']) {
    const body = ui.slice(ui.indexOf(`function ${fn}`), ui.indexOf('\nfunction ', ui.indexOf(`function ${fn}`) + 1));
    assert.match(body, /simulatedTag\(\)/, fn);
  }
});

test('the fictional examples name no real handles', () => {
  const ui = sources.find(([f]) => f === 'ui.js')[1];
  const examples = ui.slice(ui.indexOf('const FICTIONAL_EXAMPLES'), ui.indexOf('];', ui.indexOf('const FICTIONAL_EXAMPLES')));
  assert.doesNotMatch(examples, /@\w/);
});

test('the intro hides instead of removing itself, so Go back can reopen it', () => {
  const intro = readFileSync(join(SRC, 'intro.js'), 'utf8');
  assert.doesNotMatch(intro, /root\.remove\(\)/);
  assert.match(intro, /getElementById\('go-back'\)/);
  const build = readFileSync(join(ROOT, 'artifact', 'build.mjs'), 'utf8');
  assert.match(build, /id="go-back"/);
});
