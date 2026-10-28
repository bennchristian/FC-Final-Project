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
  toScript('theme.js'),
  toScript('intro.js'),
  // After intro.js and ui.js, so the intro markup and start()'s copy exist when edits apply.
  toScript('copy-edits.js'),
  toScript('editor.js'),
].join('\n');

// Living Letter first-screen intro: markup goes before <main>, styles join the page <style>.
const INTRO_CSS = readFileSync(join(SRC, 'intro.css'), 'utf8');
const INTRO_HTML = readFileSync(join(SRC, 'intro.html'), 'utf8');
if (/<\/style/i.test(INTRO_CSS)) fail(['intro.css: contains "</style"']);
const PAGE_CSS = readFileSync(join(SRC, 'page.css'), 'utf8');
if (/<\/style/i.test(PAGE_CSS)) fail(['page.css: contains "</style"']);
const EDITOR_CSS = readFileSync(join(SRC, 'editor.css'), 'utf8');
if (/<\/style/i.test(EDITOR_CSS)) fail(['editor.css: contains "</style"']);
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Open+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">';

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
${PAGE_CSS}
${INTRO_CSS}
${EDITOR_CSS}</style>
${INTRO_HTML}
<main>
  <div class="back-row"><button type="button" id="go-back" class="go-back"><span aria-hidden="true">←</span> Go back</button><button type="button" id="theme-toggle" class="theme-toggle" aria-pressed="false">Dark mode</button></div>
  <header class="masthead">
    <div class="brand" role="img" aria-label="Living Letter">
      <svg viewBox="0 0 340 214" aria-hidden="true">
        <text x="6" y="104">Living</text>
        <text x="6" y="200">Letter</text>
        <path d="M152 22 H332 V206 H232 M332 22 L252 68" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
      </svg>
    </div>
    <nav class="tabs" role="tablist">
      <button type="button" role="tab" id="tab-button-review" aria-controls="tab-review">Review</button>
      <button type="button" role="tab" id="tab-button-how" aria-controls="tab-how">How it works</button>
      <button type="button" role="tab" id="tab-button-roadmap" aria-controls="tab-roadmap">Roadmap</button>
    </nav>
  </header>
  <div class="title-block">
  <h1>Living Letter</h1>
  <p class="tagline">Learning to witness well in a world where our lives are the only gospel people know.</p>
  <p>Paste in public social-media Posts and see how they might land with people who do not share the Christian faith: rubric scores with evidence, simulated Persona reactions, a gentler rewrite, and discussion questions.</p>
  <p class="notice" id="lands-anywhere"></p>
  </div>

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

    <h2>Why “Living Letter”</h2>
    <blockquote>
      <p>“You yourselves are our letter… known and read by all… written not with ink but with the Spirit of the living God, not on tablets of stone but on tablets of human hearts.”</p>
      <p class="muted">2 Corinthians 3:2–3</p>
    </blockquote>
    <p>Some teachers had come to Corinth carrying letters of recommendation to prove they could be trusted. Paul brought none. He pointed to the church itself: <em>you</em> are our letter. The changed lives of the Corinthians were his credentials, and anyone could read them.</p>
    <p>Paul also says who wrote the letter. It is “a letter from Christ,” written by the Spirit on human hearts, as the prophets promised for the new covenant (Jeremiah 31:33, Ezekiel 36:26). Paul only delivered it.</p>
    <p>Three things follow:</p>
    <ul>
      <li><strong>People read us before they read the Bible.</strong> For many people outside the church, Christians are the only gospel they will ever read. Today a large part of that letter is what we post.</li>
      <li><strong>The letter should sound like its Author.</strong> If Christ is writing through us, a Post should carry his truth along with his gentleness, patience and welcome. A harsh Post misrepresents him as well as the person who wrote it.</li>
      <li><strong>Our part is to be faithful and readable.</strong> The Spirit does the writing. Living Letter helps us see how that letter reads to people who don’t yet know its Author.</li>
    </ul>

    <h2>Who this is for</h2>
    <ul>
      <li><strong>Christian content creators.</strong> Review your own Posts before or after you publish them. Living Letter gives you an honest, outside evaluation: how each Post scores against Scripture-based Criteria of good witness, how people outside the faith might react, and a gentler version when there is room to grow. Over time you learn your own patterns, what makes your message clear and kind, and how to represent Jesus better in everything you post.</li>
      <li><strong>You, when a Post gives you pause.</strong> You’ve come across a Christian Post that seems off, or one that others are arguing about, and you can’t tell whether it’s faithful, unkind or just badly put. Living Letter helps you slow down and look at it through the eyes of someone outside the faith before you react, share it or reply.</li>
      <li><strong>Leaders of youth and young adults.</strong> Use real or fictional Posts as a teaching tool. Walk your group through what helps and what hurts a witness online, using the scores, the Persona Reactions and the Discussion Questions. Help them learn to represent Christ on purpose, because every Post is part of the letter.</li>
    </ul>

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
      <p class="muted">A Post needs only one thing: a link, a transcript, screenshots or text. Choose whichever you have.</p>
      <fieldset class="either">
        <legend>Link or video transcript</legend>
        <div class="choices" role="radiogroup" aria-label="Link or video transcript">
          <label class="choice"><input type="radio" name="video-mode" value="link" checked> Link to the Post</label>
          <label class="choice"><input type="radio" name="video-mode" value="transcript"> Paste the transcript</label>
        </div>
        <div id="link-field">
          <label for="post-url" class="sr-only">Link to the Post</label>
          <input type="url" id="post-url" maxlength="2048" placeholder="Instagram or TikTok post link">
          <p class="muted">For an Instagram or TikTok post, the caption is read for you, and so are a video’s spoken words. For a carousel or image post, also add screenshots of the slides: the words on them can’t be read from the link. Any other link is only shown with the results.</p>
        </div>
        <div id="transcript-field" hidden>
          <label for="post-transcript" class="sr-only">Video transcript</label>
          <textarea id="post-transcript" rows="4" maxlength="20000"></textarea>
          <p class="muted">Paste what is said in the video.</p>
        </div>
      </fieldset>
      <fieldset class="either">
        <legend id="content-legend">Screenshots or text</legend>
        <div class="choices" id="content-choices" role="radiogroup" aria-label="Screenshots or text">
          <label class="choice"><input type="radio" name="content-mode" value="images" checked> Add screenshots</label>
          <label class="choice"><input type="radio" name="content-mode" value="text"> Paste the text</label>
        </div>
        <div id="images-field">
          <label for="post-images" class="sr-only">Screenshots</label>
          <input type="file" id="post-images" multiple>
          <p class="muted" id="images-hint"></p>
        </div>
        <div id="text-field" hidden>
          <label for="post-text" class="sr-only">Post text or caption</label>
          <textarea id="post-text" rows="5" maxlength="4000"></textarea>
          <p class="muted">Paste the Post’s text or caption.</p>
        </div>
      </fieldset>
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
      <li><strong>Nothing is kept.</strong> Posts and screenshots stay in this page only. Screenshots are never shown again or stored. Links are shown but never opened, except a link to one Instagram or TikTok post, which is used only to read its caption and a video’s spoken words.</li>
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
