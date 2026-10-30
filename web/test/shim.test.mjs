// The demo account in web/shim.js: an email account and a guest both get a stable user id.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../shim.js', import.meta.url), 'utf8')
  .replace('/*__ENGINE__*/', 'function answer() {}')
  .replace(/__(CONTENT|SAMPLES|SAMPLE_LINKS|ARTIFACT_URL|LOGO_RED|LOGO_CREAM)__/g, 'null');

// Runs the shim with a signed-in account already in localStorage, so no sign-in screen shows.
function signedInAs(account) {
  const items = { 'll-demo-user': JSON.stringify(account) };
  const window = {};
  const context = {
    window,
    localStorage: { getItem: (k) => items[k] ?? null, setItem: (k, v) => { items[k] = v; }, removeItem: (k) => { delete items[k]; } },
    document: { readyState: 'complete', body: {}, createTreeWalker: () => ({ nextNode: () => null }), getElementById: () => null },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { observe() {} },
    Element: class { animate() {} },
  };
  vm.runInNewContext(source, context);
  return window.claude.use('user');
}

test('an email account is named by its email', async () => {
  const user = await signedInAs({ email: 'Pat@Example.org', name: 'Pat' });
  const id = await user.id();
  assert.match(id, /^demo-/);
  assert.equal(id, await (await signedInAs({ email: 'pat@example.org' })).id());
  assert.equal((await user.me()).name, 'Pat');
});

test('a guest has no email but a stable id and the name Guest', async () => {
  const user = await signedInAs({ guest: true, id: 'abc123', name: 'Guest' });
  assert.equal(await user.id(), 'guest-abc123');
  assert.deepEqual({ ...(await user.me()) }, { id: 'guest-abc123', name: 'Guest' });
});
