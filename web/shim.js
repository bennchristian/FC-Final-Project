// Living Letter web demo: stands in for the Claude Artifact runtime (`window.claude.use`)
// so the unchanged Artifact page runs as an ordinary website. Everything stays in this
// browser: a demo sign-in, Saved Reviews and the profile in localStorage, file saves as
// downloads, and Reviews answered by the demo evaluator (web/demo-engine.js) instead of
// Claude. web/build.mjs fills the __PLACEHOLDERS__ and inlines this file into the page head.
(function () {
  'use strict';

  /*__ENGINE__*/

  const CONTENT = __CONTENT__;
  const SAMPLES = __SAMPLES__;
  const SAMPLE_LINKS = __SAMPLE_LINKS__;
  const ARTIFACT_URL = __ARTIFACT_URL__;
  const LOGO_RED = __LOGO_RED__;
  const LOGO_CREAM = __LOGO_CREAM__;

  const USER_KEY = 'll-demo-user';
  const DB_KEY = 'll-demo-db';
  const MODEL = 'living-letter-demo';

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch { /* private window: keep working in memory */ }
  }
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let seq = 0;
  const newId = () => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  function hash(text) {
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    return (h >>> 0).toString(36);
  }

  // ---------- db: a small document store over localStorage ----------

  const docs = load(DB_KEY, {});
  const persist = () => store(DB_KEY, docs);

  function snapshot(path) {
    const data = docs[path];
    return { id: path.split('/').pop(), exists: data !== undefined, data: () => clone(data) };
  }
  function docRef(path) {
    return {
      id: path.split('/').pop(),
      path,
      get: async () => snapshot(path),
      set: async (data) => { docs[path] = clone(data); persist(); },
      update: async (data) => { docs[path] = { ...(docs[path] || {}), ...clone(data) }; persist(); },
      delete: async () => { delete docs[path]; persist(); },
      collection: (name) => collectionRef(`${path}/${name}`),
    };
  }
  function collectionRef(path, order, max) {
    return {
      path,
      doc: (id) => docRef(`${path}/${id || newId()}`),
      orderBy: (field, dir = 'asc') => collectionRef(path, { field, dir }, max),
      limit: (n) => collectionRef(path, order, n),
      get: async () => {
        const prefix = `${path}/`;
        let list = Object.keys(docs)
          .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
          .map(snapshot);
        if (order) {
          // Like the platform store, a query ordered by a field skips documents without it.
          list = list.filter((d) => d.data()[order.field] !== undefined);
          list.sort((a, b) => {
            const x = a.data()[order.field];
            const y = b.data()[order.field];
            return (x < y ? -1 : x > y ? 1 : 0) * (order.dir === 'desc' ? -1 : 1);
          });
        }
        if (max) list = list.slice(0, max);
        return { docs: list, size: list.length, empty: list.length === 0 };
      },
    };
  }
  const db = { collection: (p) => collectionRef(p), doc: (p) => docRef(p) };

  // ---------- user: the demo account ----------

  let account = load(USER_KEY, null);
  let signedInResolve;
  const signedIn = new Promise((r) => { signedInResolve = r; });
  if (account) signedInResolve(account);

  const user = {
    id: async () => `demo-${hash(account.email.toLowerCase())}`,
    me: async () => ({ id: `demo-${hash(account.email.toLowerCase())}`, name: account.name || account.email }),
    isOwner: () => false,
    canEdit: () => false,
    can: () => false,
    profiles: async () => ({}),
  };

  // ---------- sample: the demo evaluator in place of Claude ----------

  async function sample(input, opts = {}) {
    const prompt = typeof input === 'string' ? input : input[input.length - 1].content;
    await wait(900 + Math.random() * 1400);
    if (opts.signal && opts.signal.aborted) throw { code: 'cancelled' };
    let text;
    try {
      text = JSON.stringify(answer(prompt, CONTENT, SAMPLES), null, 2);
    } catch {
      throw { code: 'upstream_error' };
    }
    if (opts.onText) opts.onText({ text, delta: text });
    return { text, truncated: false, modelApplied: MODEL, modelTierApplied: opts.modelTier || 'default' };
  }
  sample.limits = async () => ({ images: { maxCount: 4, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } });
  sample.json = async (input, opts) => JSON.parse((await sample(input, opts)).text);

  // ---------- mcp: the sample reel is the one link the demo can "read" ----------

  const canonicalLink = (url) => String(url || '').trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  const mcp = {
    callTool: async (server, tool, input) => {
      await wait(700);
      const hit = SAMPLE_LINKS.find((s) => canonicalLink(s.url) === canonicalLink(input && input.url));
      if (!hit) throw { code: 'tool_error', message: 'The demo can only read the sample reel.' };
      if (tool === 'supadata_metadata') return { payload: { description: hit.caption || '' } };
      if (tool === 'supadata_transcript') return { payload: { content: hit.transcript } };
      return { payload: { status: 'completed', content: hit.transcript } };
    },
  };

  // ---------- downloads: an ordinary file download ----------

  const downloads = {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { saved: true };
    },
  };

  window.claude = {
    use(name) {
      switch (name) {
        case 'db': return signedIn.then(() => db);
        case 'user': return signedIn.then(() => user);
        case 'sample': return Promise.resolve(sample);
        case 'mcp': return Promise.resolve(mcp);
        case 'downloads': return Promise.resolve(downloads);
        default: return Promise.resolve(null);
      }
    },
  };

  // ---------- Web wording: the account is a Living Letter account here ----------

  const SWAPS = [[/your Claude account/g, 'your Living Letter account'], [/not even this page’s owner/g, 'not even the Living Letter team']];
  function swapText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!SWAPS.some(([re]) => new RegExp(re.source).test(n.nodeValue))) continue;
      let v = n.nodeValue;
      for (const [re, to] of SWAPS) v = v.replace(re, to);
      if (v !== n.nodeValue) n.nodeValue = v;
    }
  }

  function addSignOut() {
    const line = document.getElementById('profile-signin');
    if (!line || document.getElementById('ll-signout')) return;
    const button = document.createElement('button');
    button.id = 'll-signout';
    button.type = 'button';
    button.textContent = 'Sign out';
    button.style.marginTop = '0.5rem';
    button.addEventListener('click', () => {
      store(USER_KEY, null);
      location.hash = '';
      location.reload();
    });
    line.insertAdjacentElement('afterend', button);
  }

  // ---------- The demo sign-in ----------

  const SIGNIN_CSS = `
    #ll-signin { position: fixed; inset: 0; z-index: 2147483000; overflow-y: auto; background: var(--bg, #FFFBF5); color: var(--fg, #210C09);
      display: grid; place-items: center; padding: 32px max(16px, env(safe-area-inset-left, 0px)); font-family: var(--sans, "Open Sans", Arial, sans-serif); }
    #ll-signin .card { width: min(100%, 26rem); }
    #ll-signin .logo { width: 132px; margin: 0 auto 1.75rem; display: block; }
    #ll-signin .logo-dark { display: none; }
    #ll-signin h1 { font-family: var(--serif, "Instrument Serif", serif); font-weight: 400; color: var(--heading, #8A201C); font-size: 2.75rem; line-height: 1; margin: 0 0 0.4rem; text-align: center; }
    #ll-signin .lead { color: var(--muted, #5D6378); text-align: center; margin: 0 0 1.75rem; }
    #ll-signin label { display: block; font-size: 0.875rem; font-weight: 600; margin: 1rem 0 0.35rem; }
    #ll-signin input { width: 100%; padding: 0.7rem 0.8rem; border: 1px solid var(--line, #D7DCE2); border-radius: var(--radius, 5px); background: var(--field, #fff); color: inherit; font: inherit; }
    #ll-signin input:focus { outline: 2px solid var(--accent, #8A201C); outline-offset: 1px; }
    #ll-signin .primary { width: 100%; margin-top: 1.5rem; padding: 0.8rem; border: 0; border-radius: var(--radius, 5px); background: var(--accent, #8A201C); color: var(--on-accent, #FFFBF5); font: 600 1rem var(--sans, sans-serif); cursor: pointer; }
    #ll-signin .primary:disabled { opacity: 0.7; cursor: progress; }
    #ll-signin .switch { margin-top: 1.1rem; text-align: center; font-size: 0.9375rem; }
    #ll-signin .switch button { background: none; border: 0; padding: 0; color: var(--accent, #8A201C); text-decoration: underline; font: inherit; cursor: pointer; }
    #ll-signin .error { color: var(--bad, #8A201C); font-size: 0.875rem; min-height: 1.2em; margin: 0.6rem 0 0; }
    #ll-signin .note { margin-top: 2rem; padding-top: 1.1rem; border-top: 1px solid var(--line, #D7DCE2); color: var(--muted, #5D6378); font-size: 0.8125rem; line-height: 1.55; }
    #ll-signin .note a { color: var(--accent, #8A201C); }
    :root[data-theme="dark"] #ll-signin .logo-light { display: none; }
    :root[data-theme="dark"] #ll-signin .logo-dark { display: block; }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) #ll-signin .logo-light { display: none; }
      :root:not([data-theme="light"]) #ll-signin .logo-dark { display: block; }
    }`;

  function showSignIn() {
    const style = document.createElement('style');
    style.textContent = SIGNIN_CSS;
    document.head.appendChild(style);
    const wrap = document.createElement('div');
    wrap.id = 'll-signin';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'll-signin-title');
    wrap.innerHTML = `
      <form class="card" novalidate>
        <img class="logo logo-light" src="${LOGO_RED}" alt="Living Letter">
        <img class="logo logo-dark" src="${LOGO_CREAM}" alt="Living Letter">
        <h1 id="ll-signin-title">Welcome back</h1>
        <p class="lead">Sign in to review your Posts and keep your saved Reviews.</p>
        <div class="name-row" hidden>
          <label for="ll-name">Your name</label>
          <input id="ll-name" name="name" autocomplete="name">
        </div>
        <label for="ll-email">Email</label>
        <input id="ll-email" name="email" type="email" autocomplete="email" required>
        <label for="ll-password">Password</label>
        <input id="ll-password" name="password" type="password" autocomplete="current-password" required>
        <p class="error" aria-live="polite"></p>
        <button class="primary" type="submit">Sign in</button>
        <p class="switch"><span class="switch-text">New to Living Letter?</span> <button type="button">Create an account</button></p>
        <p class="note">This is a demo of the Living Letter web app: your account and Reviews are kept only in this browser, and Reviews are worked out by a simple demo evaluator, not by Claude.
          We hope to turn Living Letter into a full web app, but that needs each person to bring their own Anthropic API key, at about $0.25 per Post.
          Until then, the full version runs <a href="${ARTIFACT_URL}" target="_blank" rel="noopener noreferrer">as a Claude Artifact</a> on your own Claude account, which keeps it free.</p>
      </form>`;
    document.body.appendChild(wrap);

    const form = wrap.querySelector('form');
    const title = wrap.querySelector('h1');
    const lead = wrap.querySelector('.lead');
    const nameRow = wrap.querySelector('.name-row');
    const submit = wrap.querySelector('.primary');
    const switchText = wrap.querySelector('.switch-text');
    const switchButton = wrap.querySelector('.switch button');
    const error = wrap.querySelector('.error');
    const password = wrap.querySelector('#ll-password');
    let creating = false;

    function setMode(create) {
      creating = create;
      nameRow.hidden = !create;
      title.textContent = create ? 'Create your account' : 'Welcome back';
      lead.textContent = create ? 'One account keeps your profile, preferences and saved Reviews together.' : 'Sign in to review your Posts and keep your saved Reviews.';
      submit.textContent = create ? 'Create account' : 'Sign in';
      switchText.textContent = create ? 'Already have an account?' : 'New to Living Letter?';
      switchButton.textContent = create ? 'Sign in' : 'Create an account';
      password.autocomplete = create ? 'new-password' : 'current-password';
      error.textContent = '';
    }
    switchButton.addEventListener('click', () => setMode(!creating));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const name = form.name.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Enter a valid email address.'; form.email.focus(); return; }
      if (password.value.length < 6) { error.textContent = 'Your password needs at least 6 characters.'; password.focus(); return; }
      if (creating && !name) { error.textContent = 'Tell us your name.'; form.name.focus(); return; }
      error.textContent = '';
      submit.disabled = true;
      submit.textContent = creating ? 'Creating your account…' : 'Signing in…';
      await wait(800);
      const known = load('ll-demo-names', {});
      if (creating) known[email.toLowerCase()] = name;
      store('ll-demo-names', known);
      account = { email, name: known[email.toLowerCase()] || name || email.split('@')[0] };
      store(USER_KEY, account);
      wrap.remove();
      signedInResolve(account);
    });
    setTimeout(() => form.email.focus(), 50);
  }

  function ready() {
    swapText(document.body);
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') swapText(m.target.parentNode || document.body);
        else for (const n of m.addedNodes) if (n.nodeType === 1 || n.nodeType === 3) swapText(n.nodeType === 3 ? n.parentNode : n);
      }
      addSignOut();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    addSignOut();
    if (!account) showSignIn();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
