// Builds the Demo Artifact (ARCHITECTURE.md AD-12): inlines the latest content ids,
// config/models.json and artifact/src/ into artifact/dist/witness-review.html.
//
//   node artifact/build.mjs          build; fails on any lock, prompt or content error
//   node artifact/build.mjs --lock   first lock the latest ids, then build (run before publishing)
//
// The optional artifact/copy-edits.json (owner copy editor, AD-12) is checked and inlined
// as COPY_EDITS; without it COPY_EDITS is null and the page copy is unchanged.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, checkLock, lockLatest, checkPrompts, checkContentShapes, loadCopyEdits } from './content.mjs';

const SRC = join(ROOT, 'artifact', 'src');
const OUT = join(ROOT, 'artifact', 'dist', 'witness-review.html');

function fail(errors) {
  console.error(`Build failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

// Turn an ES module into plain script text: drop import statements and `export `.
function toScript(file) {
  const text = readFileSync(join(SRC, file), 'utf8');
  if (/<\/script/i.test(text)) fail([`${file}: contains "</script"`]);
  return text.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '').replace(/^export\s+/gm, '');
}

// JSON safe to place inside a <script> element.
function inlineJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

if (process.argv.includes('--lock')) {
  const lock = lockLatest();
  console.log(`Locked: ${Object.keys(lock).join(', ')}`);
}

const lockErrors = checkLock();
if (lockErrors.length) fail(lockErrors);
const { content, labels } = loadContent();
const contentErrors = [...checkPrompts(content.prompts), ...checkContentShapes(content)];
if (contentErrors.length) fail(contentErrors);
const copyEdits = loadCopyEdits();
if (copyEdits.errors.length) fail(copyEdits.errors);

const script = [
  `const CONTENT = ${inlineJson(content)};`,
  `const LABELS = ${inlineJson(labels)};`,
  `const COPY_EDITS = ${inlineJson(copyEdits.edits)};`,
  toScript('core.js'),
  toScript('reel.js'),
  toScript('pipeline.js'),
  toScript('export.js'),
  toScript('ui.js'),
  toScript('intro.js'),
  // After intro.js and ui.js, so the intro markup and start()'s copy exist when edits apply.
  toScript('copy-edits.js'),
  toScript('editor.js'),
].join('\n');

// Living Letter first-screen intro: markup goes before <main>, styles join the page <style>.
const INTRO_CSS = readFileSync(join(SRC, 'intro.css'), 'utf8');
const INTRO_HTML = readFileSync(join(SRC, 'intro.html'), 'utf8');
if (/<\/style/i.test(INTRO_CSS)) fail(['intro.css: contains "</style"']);
const EDITOR_CSS = readFileSync(join(SRC, 'editor.css'), 'utf8');
if (/<\/style/i.test(EDITOR_CSS)) fail(['editor.css: contains "</style"']);
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Open+Sans:ital,wght@0,400;0,500;1,400&display=swap">';

const ROADMAP = [
  ['Web App with private accounts', 'Sign in to a private account and save Reviews to reopen later, unchanged, with their recorded versions.'],
  ['Creator Foundation', 'Creators record how they want to come across and rank the audiences they want to reach.'],
  ['Own-Content Review and Draft Checkpoint', 'Creators review their own posts, or a draft before publishing, including Criterion 10, Self-Presentation Alignment.'],
  ['Persona order by audience', 'On a Creator’s own Review, the Personas closest to their top audience are shown first. Scores do not change.'],
  ['Profile Summary', 'A roll-up across a profile’s Posts: Criterion averages, recurring patterns, which Personas react well or badly, the strongest and weakest Posts, and the top changes.'],
  ['New Rubric and Persona Versions', 'Personas and the rubric are revised after interviews with real people outside the faith and with creators. Old Reviews keep the versions that produced them.'],
  ['Usage caps', 'Daily and monthly limits on Claude usage for the hosted Web App.'],
];

const html = `<title>Living Letter</title>
<meta name="claude:viewport-fit-sides" content="cover">
${FONTS}
<style>
/* Plain document layout: one readable column, default type. Visual design is deferred. */
:root { --bg: #ffffff; --fg: #1d1f21; --muted: #5d6166; --line: #d4d7db; --soft: #f3f4f6; --accent: #1f5fa8; --bad: #a3271f; --good: #2d6a3a; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #16181b; --fg: #e6e7e9; --muted: #a2a7ad; --line: #3a3e44; --soft: #22252a; --accent: #7fb0ee; --bad: #f08c84; --good: #8fcf9c; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #16181b; --fg: #e6e7e9; --muted: #a2a7ad; --line: #3a3e44; --soft: #22252a; --accent: #7fb0ee; --bad: #f08c84; --good: #8fcf9c; color-scheme: dark; }
body { background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 60rem; margin: 0 auto; padding-block: 16px 48px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
a { color: var(--accent); overflow-wrap: anywhere; }
h1, h2, h3 { text-wrap: balance; }
textarea, input[type="url"], select { width: 100%; box-sizing: border-box; font: inherit; color: var(--fg); background: var(--bg); border: 1px solid var(--line); padding: 6px; }
button { font: inherit; padding: 6px 12px; }
button:focus-visible, a:focus-visible, textarea:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
label { display: block; font-weight: 600; margin-top: 12px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
.muted { color: var(--muted); }
.error { color: var(--bad); }
.notice { background: var(--soft); padding: 8px 12px; border-left: 3px solid var(--line); }
.tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
.tabs button[aria-selected="true"] { font-weight: 700; }
.post { border-top: 1px solid var(--line); padding-top: 8px; margin-top: 24px; }
.pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.chip { display: inline-block; background: var(--soft); border: 1px solid var(--line); padding: 0 6px; margin-right: 4px; }
.simulated { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); border: 1px solid var(--line); padding: 0 4px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 0.95em; }
th, td { border: 1px solid var(--line); padding: 4px 6px; text-align: left; vertical-align: top; }
td.num { white-space: nowrap; font-variant-numeric: tabular-nums; }
tr.concern td { background: var(--soft); }
tr.concern td.num { color: var(--bad); font-weight: 700; }
.summary.good { color: var(--good); font-weight: 600; }
.flag { border: 1px solid var(--line); padding: 8px 12px; margin: 8px 0; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 12px; }
.pair > div { min-width: 0; background: var(--soft); padding: 0 12px; }
.label { font-weight: 600; margin-bottom: 0; }
.reactions > li { margin-bottom: 8px; }
.criterion { border-left: 3px solid var(--line); padding-left: 12px; margin: 16px 0; }
.criterion.concern { border-left-color: var(--bad); }
.criterion h4, .criterion h5 { margin: 0 0 4px; font-size: 1em; }
.criterion p { margin: 4px 0; }
table.overview { width: auto; min-width: 16rem; }
.guidance li.current { font-weight: 600; }
.sources { font-size: 0.95em; }
.card { background: var(--soft); padding: 4px 12px; }
details { margin: 6px 0; }
summary { cursor: pointer; color: var(--accent); }
${INTRO_CSS}
${EDITOR_CSS}</style>
${INTRO_HTML}
<main>
  <h1>Living Letter</h1>
  <p>Paste in public social-media Posts and see how they might land with people who do not share the Christian faith: rubric scores with evidence, simulated Persona reactions, a gentler rewrite, and discussion questions.</p>
  <p class="notice" id="lands-anywhere"></p>
  <nav class="tabs" role="tablist">
    <button type="button" role="tab" id="tab-button-review" aria-controls="tab-review">Review</button>
    <button type="button" role="tab" id="tab-button-how" aria-controls="tab-how">How it works</button>
    <button type="button" role="tab" id="tab-button-roadmap" aria-controls="tab-roadmap">Roadmap</button>
  </nav>

  <section id="tab-review" role="tabpanel" aria-labelledby="tab-button-review">
    <h2>Overview</h2>
    <p>Add up to 10 public Posts from one church, ministry or Christian creator. For each Post, Living Letter gives you:</p>
    <ul>
      <li><strong>Rubric Scores.</strong> Ten Criteria of good witness, each scored 1 to 5 with a quote from the Post as Evidence and a short explanation. The Criteria come from Scripture, from Paul’s speech in Athens, and from research on how people outside the faith see Christians.</li>
      <li><strong>Persona Reactions.</strong> How seven simulated people might feel reading the Post: six outside the faith, and one Christian who might copy its tone.</li>
      <li><strong>A Gentler Rewrite.</strong> When the Post has room to improve: the same message and convictions, said more clearly and kindly.</li>
      <li><strong>Discussion Questions.</strong> For a small group, including “How might Jesus have posted this?”</li>
    </ul>
    <p>For the whole Review you can also draft a <strong>Ministry Outreach Plan</strong>: a kind message you could send the poster yourself, with Talking Points.</p>
    <p><button type="button" id="open-how">Read how scoring works, what each Criterion and Persona means, and where they come from</button></p>
    <p id="availability" class="error" aria-live="polite"></p>
    <p class="muted">Versions: <span id="versions"></span></p>

    <h2>1. Set up the Review</h2>
    <label for="model">Model</label>
    <select id="model"></select>
    <p class="muted">The model is fixed once the Review has Posts. Runs use your own Claude usage.</p>
    <label for="review-url">Profile link (optional)</label>
    <input type="url" id="review-url" placeholder="https://www.instagram.com/profile-name/" maxlength="2048">
    <p id="review-url-errors" class="error"></p>
    <p class="notice" id="link-notice"></p>

    <h2>2. Add Posts</h2>
    <form id="post-form">
      <label for="post-text">Post text or caption</label>
      <textarea id="post-text" rows="5" maxlength="4000"></textarea>
      <div id="images-field" hidden>
        <label for="post-images">Screenshots</label>
        <input type="file" id="post-images" multiple>
        <p class="muted" id="images-hint"></p>
      </div>
      <label for="post-transcript">Video transcript (for a video Post)</label>
      <textarea id="post-transcript" rows="3" maxlength="20000"></textarea>
      <label for="post-url">Link to this Post (optional)</label>
      <input type="url" id="post-url" maxlength="2048">
      <p id="intake-status" class="muted" aria-live="polite"></p>
      <p id="intake-errors" class="error" aria-live="polite"></p>
      <div class="row">
        <button type="submit" id="add-post">Add Post</button>
        <button type="button" id="add-examples">Add fictional example Posts</button>
        <span id="post-count" class="muted"></span>
      </div>
    </form>

    <h2>3. Evaluate</h2>
    <div class="row">
      <button type="button" id="evaluate-all">Evaluate Posts</button>
      <button type="button" id="clear-review">Clear Review</button>
      <button type="button" id="copy-review">Copy Review</button>
      <button type="button" id="save-review" hidden>Save Review as file</button>
    </div>
    <p class="muted">Posts are evaluated one at a time. Persona Reactions are simulated perspectives, not real people’s opinions. <strong>This page saves nothing: closing or reloading it clears the Review.</strong> Use Copy Review or Save Review as file to keep your results.</p>
    <p id="export-status" class="muted" aria-live="polite"></p>
    <textarea id="export-fallback" rows="8" readonly hidden aria-label="Review as text"></textarea>
    <div id="posts"></div>
    <div id="outreach-slot"></div>
  </section>

  <section id="tab-how" role="tabpanel" aria-labelledby="tab-button-how" hidden>
    <h2>How it works</h2>
    <h3>What happens to each Post</h3>
    <ol>
      <li><strong>Scoring and reactions, separately.</strong> Claude reads the Post (text, screenshots, or a video transcript) twice, in two separate requests. One scores it against the rubric. The other voices the Personas. Neither sees the other’s answer, so a Persona’s reaction can never change a score.</li>
      <li><strong>Code applies the thresholds.</strong> Whether a Post is likely to land well, and whether it gets a rewrite, is worked out by code from the scores, not by the model.</li>
      <li><strong>Questions and rewrite.</strong> A third request writes Discussion Questions from the Post, its scores and the reactions. When a rewrite is needed, a fourth writes it. The rewrite never changes the Post’s beliefs.</li>
      <li><strong>Checks.</strong> Every answer is checked against a fixed format before it is shown. Comment sections are ignored, and any @handle other than the poster’s is removed.</li>
      <li><strong>Nothing is kept.</strong> Posts and screenshots stay in this page only. Screenshots are never shown again or stored. Links are shown but never opened, except an Instagram reel link, which is used only to transcribe the reel’s spoken words.</li>
    </ol>
    <p>Every result shows the versions that produced it: the rubric, the Persona set, the prompts and the model. When the rubric or Personas are revised, they get a new version number, so old and new scores are never mixed.</p>

    <h3>How a Post is scored</h3>
    <div id="how-scoring"></div>

    <h3>Offence sources</h3>
    <p>When a Post might offend, the score names where the offence comes from. This keeps apart offence at the message and offence caused by the messenger.</p>
    <div id="how-offence"></div>

    <h3>Where the rubric and Personas come from</h3>
    <ul>
      <li><strong>Scripture.</strong> The fruit of the Spirit (Galatians 5:22–23); love in 1 Corinthians 13; Jesus eating with tax collectors and sinners (Matthew 9:9–13); “not ours to judge those outside” (1 Corinthians 5:12–13); “gentleness and respect” (1 Peter 3:15–16); speech “seasoned with salt” toward outsiders (Colossians 4:5–6).</li>
      <li><strong>Paul in Athens (Acts 17).</strong> Five marks from <em>Culture and Ministry Design</em> (p. 28, adapted from Flemming): know the audience’s culture; do not compromise truth claims, where the only acceptable offence is the offence of the gospel; do not condemn; invite dialogue and questions; give a clear answer. The comparison of Paul’s audiences in Acts 13, 14 and 17 also shaped the Personas.</li>
      <li><strong>Research on how outsiders see Christians.</strong> Kinnaman and Lyons, <em>unChristian</em> (2007) and <em>Good Faith</em> (2016); Barna studies from 2018 to 2024; Pew Research Center and PRRI surveys of the religiously unaffiliated. The same gap shows up from 2007 to today: most people view Jesus positively but distrust Christians, mainly over hypocrisy, judgment and politics.</li>
      <li><strong>Writers on witness.</strong> Tim Keller, <em>Center Church</em> (contextualisation); Lesslie Newbigin, <em>The Gospel in a Pluralist Society</em>; Dietrich Bonhoeffer, <em>Discipleship</em> and <em>Letters and Papers from Prison</em>; Elmer Thiessen, <em>The Ethics of Evangelism</em>; and <em>Christian Witness in a Multi-Religious World</em> (2011).</li>
      <li><strong>The Personas.</strong> Built along four lines that change how a Post lands: how familiar the person is with Christianity (Engel scale), how open they are (Rainer scale), their history with church (none, drifted or hurt), and their worldview (secular, spiritual, or another faith).</li>
      <li><strong>The Outreach Plan.</strong> Its tone follows Jethro advising Moses (Exodus 18): ask first, treat the person as a person, name the problem and why it matters, offer one concrete idea.</li>
    </ul>
    <p class="notice">No published, tested rubric for Christian social-media witness exists, so this one is a new synthesis. Language models can flatten or stereotype groups of people, so every Persona Reaction is labelled simulated: treat it as a hypothesis to test with real people, not as data. The rubric and Personas will be revised after interviews with real people outside the faith.</p>

    <h3>The ten Criteria</h3>
    <div id="how-criteria"></div>

    <h3>The Personas</h3>
    <p>Each Persona is a simulated person with a believable background and reasons for their views, not a caricature. The political lean of the set is deliberately one-sided: there is no secular-conservative Persona.</p>
    <div id="how-personas"></div>
  </section>

  <section id="tab-roadmap" role="tabpanel" aria-labelledby="tab-button-roadmap" hidden>
    <h2>Roadmap</h2>
    <p>Planned but not yet built in this demo:</p>
    <ul>
${ROADMAP.map(([name, text]) => `      <li><strong>${name}.</strong> ${text}</li>`).join('\n')}
    </ul>
  </section>
</main>
<script>
(function () {
'use strict';
${script}
})();
</script>
`;

mkdirSync(join(ROOT, 'artifact', 'dist'), { recursive: true });
writeFileSync(OUT, html);
const editCount = copyEdits.edits ? copyEdits.edits.edits.length : 0;
console.log(`Built ${OUT.replace(`${ROOT}/`, '')} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB) with ${labels.rubric} · ${labels.personas} · ${labels.prompts}`);
console.log(copyEdits.edits ? `Copy edits: ${editCount} from artifact/copy-edits.json` : 'Copy edits: none (no artifact/copy-edits.json)');
