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

// A PNG from artifact/src/img/ as a data: URI (the Artifact's CSP blocks other image hosts).
function imgData(file) {
  return `data:image/png;base64,${readFileSync(join(SRC, 'img', file)).toString('base64')}`;
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
  toScript('past.js'),
  toScript('desk.js'),
  toScript('ui.js'),
  toScript('theme.js'),
  toScript('intro.js'),
  // After intro.js and ui.js, so the intro markup and start()'s copy exist when edits apply.
  toScript('copy-edits.js'),
  toScript('editor.js'),
].join('\n');

// Living Letter first-screen intro: markup goes before <main>, styles join the page <style>.
const INTRO_CSS = readFileSync(join(SRC, 'intro.css'), 'utf8');
// The intro's logo is the design partner's file, filled in here (the intro is always cream, so always the red one).
const INTRO_HTML = readFileSync(join(SRC, 'intro.html'), 'utf8').replace('{{LOGO_RED}}', imgData('logo-red.png'));
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

// The charset comes first: the Artifact host adds one on publish, but a local copy has only this.
const html = `<meta charset="utf-8">
<title>Living Letter</title>
<meta name="claude:viewport-fit-sides" content="cover">
${FONTS}
<style>
${PAGE_CSS}
${INTRO_CSS}
${EDITOR_CSS}</style>
${INTRO_HTML}
<main>
  <header class="masthead">
    <button type="button" class="brand" id="nav-home" data-nav="home" aria-label="Living Letter: home">
      <img class="logo-light" src="${imgData('logo-red.png')}" width="360" height="210" alt="">
      <img class="logo-dark" src="${imgData('logo-cream.png')}" width="360" height="210" alt="">
    </button>
    <nav class="tabs" aria-label="Living Letter">
      <button type="button" id="nav-review" data-nav="review">Review</button>
      <button type="button" id="nav-how" data-nav="how">How it works</button>
      <button type="button" id="nav-profile" class="nav-icon" data-nav="profile" aria-label="Your profile">
        <svg viewBox="0 0 40 44" aria-hidden="true"><circle cx="20" cy="12" r="9.5"/><path d="M2 42.5v-3.5c0-8 6.5-14 14.5-14h7c8 0 14.5 6 14.5 14v3.5z"/></svg>
      </button>
      <button type="button" id="theme-toggle" class="nav-icon theme-toggle" aria-pressed="false" aria-label="Dark mode" title="Dark mode">
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>
      </button>
    </nav>
  </header>

  <section id="view-home" class="view home" hidden>
    <div class="home-hero">
      <svg class="home-seal" viewBox="0 0 54 40" aria-hidden="true">
        <rect x="1.5" y="1.5" width="51" height="37" rx="1.5"/>
        <path d="M1.5 3 L27 23 L52.5 3 M2 38 L21 19 M52 38 L33 19"/>
        <path class="home-seal-cross" d="M27 5.5 V14.5 M23.5 8.5 H30.5"/>
      </svg>
      <h1 class="home-tagline">Learning to witness well in a world where our lives may be <span class="home-underline">the only gospel people know.</span></h1>
      <p class="home-what">Living Letter is a review system made for believers to sharpen their witness online.</p>
      <p class="home-lede">Paste in public social-media Posts and see how they might land with people who do not share the Christian faith: rubric scores with evidence, simulated Persona reactions, a gentler rewrite, and discussion questions.</p>
    </div>

    <section class="home-band home-why" aria-labelledby="home-why-title">
      <div class="home-why-text">
        <h2 id="home-why-title">Social media ministry is growing fast.</h2>
        <p>Social media has become one of the main places faith is shared. Already in 2014, one in five Americans (20%) had shared their faith on social media in the past week, and nearly half (46%) had seen someone else do it.<sup><a href="#source-1">1</a></sup> By 2018, 28% of US Christians said they use social media to share their faith, and 58% of non-Christians said someone had shared their faith with them on Facebook.<sup><a href="#source-2">2</a></sup></p>
        <p>But the results sometimes backfire and harm how people see Christians and the faith. One in six US adults (17%) has unfollowed, blocked or muted someone because of the religious content they posted.<sup><a href="#source-3">3</a></sup> Among young adults outside the church, 87% called Christians judgmental and 85% called them hypocritical.<sup><a href="#source-4">4</a></sup></p>
        <p class="home-resolve">In our endeavour to sharpen one another and our witness, we’ve created this tool so we can learn to <span class="home-underline">represent Jesus better.</span></p>
      </div>
      <div class="home-why-side">
        <img class="home-art" src="${imgData('home-devices.png')}" width="880" height="591" alt="">
        <ol class="footnotes">
          <li id="source-1">Pew Research Center, <a href="https://www.pewresearch.org/religion/2014/11/06/religion-and-electronic-media/" target="_blank" rel="noopener noreferrer">survey of 3,217 US adults</a>, May–June 2014.</li>
          <li id="source-2">Barna Group, <em>Spiritual Conversations in the Digital Age</em> (2018), reported in <a href="https://www.christianitytoday.com/news/2018/june/go-tell-it-iphone-technology-spiritual-conversation-barna.html" target="_blank" rel="noopener noreferrer">Christianity Today</a>.</li>
          <li id="source-3">Pew Research Center, <a href="https://www.pewresearch.org/short-reads/2023/06/21/one-in-six-americans-have-taken-steps-to-see-less-of-someone-on-social-media-due-to-religious-content/" target="_blank" rel="noopener noreferrer">survey of 11,377 US adults</a>, November 2022.</li>
          <li id="source-4">Barna Group for Kinnaman and Lyons, <em>unChristian</em> (2007): non-Christians aged 16 to 29, reported in <a href="https://content.time.com/time/nation/article/0,8599,1667639,00.html" target="_blank" rel="noopener noreferrer">TIME</a>.</li>
        </ol>
      </div>
    </section>

    <section class="home-band home-who" aria-labelledby="home-who-title">
      <h2 id="home-who-title" class="home-sans-title">Who is it for?</h2>
      <ul class="who-list">
        <li><img class="home-art who-face" src="${imgData('home-creator.png')}" width="250" height="320" alt=""><div><h3>Christian Content Creators</h3><p>who want to review their drafts before posting.</p></div></li>
        <li><img class="home-art who-face" src="${imgData('home-individual.png')}" width="250" height="320" alt=""><div><h3>Individuals</h3><p>who find contentious posts online and are unsure how to evaluate them.</p></div></li>
        <li><img class="home-art who-face" src="${imgData('home-leader.png')}" width="250" height="320" alt=""><div><h3>Leaders of youth and young adults</h3><p>who want a teaching tool: how we should and should not present ourselves online, and why we should be intentional about how we represent Christ.</p></div></li>
      </ul>
    </section>

    <section class="home-band home-overview" aria-labelledby="home-overview-title">
      <h2 id="home-overview-title">Overview</h2>
      <p class="home-what">Add up to 10 public Posts from one church, ministry or Christian creator.<br>Upload a Post, and Living Letter gives you:</p>
      <ul class="overview-cards">
        <li><h3>Rubric Scores</h3><p>Ten Criteria of good witness, each scored 1 to 5 with a quote from the Post as Evidence and a short explanation. The Criteria come from Scripture, from Paul’s speech in Athens, and from research on how people outside the faith see Christians.</p></li>
        <li><h3>Persona Reactions</h3><p>How seven simulated people might feel reading the Post: six outside the faith, and one Christian who might copy its tone.</p></li>
        <li><h3>A gentler rewrite</h3><p>When the Post has room to improve: the same message and convictions, said more clearly and kindly.</p></li>
        <li><h3>Discussion questions</h3><p>For a small group, including “How might Jesus have posted this?”</p></li>
      </ul>
    </section>

    <section class="home-band home-name" aria-labelledby="home-name-title">
      <h2 id="home-name-title" class="home-name-title"><span>Why…</span><span class="sr-only"> Living Letter</span>
        <svg viewBox="0 0 340 214" aria-hidden="true">
          <text x="6" y="104">Living</text>
          <text x="6" y="200">Letter</text>
          <path d="M152 22 H332 V206 H232 M332 22 L252 68" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
        </svg>
      </h2>
      <div class="home-name-text">
        <blockquote class="home-verse">
          <p>You yourselves are our letter of recommendation, written on our hearts, to be known and read by all. And you show that you are a letter from Christ delivered by us, written not with ink but with the Spirit of the living God, not on tablets of stone but on tablets of human hearts.</p>
          <cite>2 Corinthians 3:2–3 (ESV)</cite>
        </blockquote>
        <p>Paul told the church in Corinth that they were a letter from Christ, read by everyone around them. Today much of that letter is read online, one Post at a time.</p>
      </div>
    </section>

    <p class="cta"><button type="button" id="start-reviewing" data-nav="review">Start reviewing</button></p>
  </section>

  <!-- The envelope gradients, outside the desk so the Send feedback popup can use them too. -->
  <svg class="env-defs" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="ld-g-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9B898"/><stop offset="1" stop-color="#D8C9B0"/></linearGradient>
      <linearGradient id="ld-g-left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E4D9C7"/><stop offset="1" stop-color="#D3C5AD"/></linearGradient>
      <linearGradient id="ld-g-right" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#E2D8C8"/><stop offset="1" stop-color="#D0C2AB"/></linearGradient>
      <linearGradient id="ld-g-bottom" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E9DFCE"/><stop offset="1" stop-color="#DACDB7"/></linearGradient>
      <linearGradient id="ld-g-flap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8DCC8"/><stop offset="1" stop-color="#D6C4A6"/></linearGradient>
      <filter id="ld-f-lift" x="-10%" y="-20%" width="120%" height="140%"><feDropShadow dx="0" dy="-5" stdDeviation="9" flood-color="#5A4020" flood-opacity="0.16"/></filter>
    </defs>
  </svg>
  <div class="desk" id="desk" hidden>
  <div class="desk-main">
  <section id="view-review" class="view" hidden>
    <h1 class="desk-title">Submit a letter for review</h1>
    <div class="stage" id="stage">
      <div class="scene" id="scene">
        <svg class="env-part env-flap-open" viewBox="0 0 1350 435" preserveAspectRatio="none" aria-hidden="true"><path d="M0 435 Q60 140 260 75 L675 5 L1090 75 Q1290 140 1350 435 Z" fill="url(#ld-g-flap)"/></svg>
        <svg class="env-part env-back" viewBox="0 0 1350 1065" preserveAspectRatio="none" aria-hidden="true"><rect width="1350" height="1065" fill="url(#ld-g-back)"/></svg>
        <div class="letter" id="letter" role="region" aria-label="Your letter" tabindex="0">
          <div class="letter-body">
            <p class="letter-lede">Paste in public social-media Posts and see how they might land with people who do not share the Christian faith: rubric scores with evidence, simulated Persona reactions, a gentler rewrite, and discussion questions.</p>
            <p class="hint" id="lands-anywhere"></p>
            <p id="availability" class="error" aria-live="polite"></p>

            <h2>1. Set up the review</h2>
            <div class="field field-select">
              <label for="model">Model</label>
              <select id="model"></select>
            </div>
            <p class="hint">The model is fixed once the Review has Posts. Runs use your own Claude usage.</p>
            <div class="field">
              <label for="review-url" class="sr-only">Profile link (optional)</label>
              <input type="url" id="review-url" placeholder="Profile link (optional)" maxlength="2048">
            </div>
            <p class="hint" id="link-notice"></p>
            <p id="review-url-errors" class="error"></p>

            <h2>2. Add posts</h2>
            <form id="post-form">
              <fieldset class="either">
                <legend>Videos</legend>
                <div class="choices" role="radiogroup" aria-label="Videos">
                  <label class="choice"><input type="radio" name="video-mode" value="link" checked> Link to post</label>
                  <label class="choice"><input type="radio" name="video-mode" value="transcript"> Paste the transcript</label>
                </div>
                <div id="link-field" class="field">
                  <label for="post-url" class="sr-only">Link to post</label>
                  <input type="url" id="post-url" maxlength="2048" placeholder="Link to post">
                  <p class="hint">Instagram reels are read from the link: their spoken words are transcribed for you. For any other video, paste its transcript. Other links are only shown with the results.</p>
                </div>
                <div id="transcript-field" class="field" hidden>
                  <label for="post-transcript" class="sr-only">Video transcript</label>
                  <textarea id="post-transcript" rows="4" maxlength="20000" placeholder="Paste what is said in the video"></textarea>
                </div>
              </fieldset>
              <fieldset class="either">
                <legend id="content-legend">Static posts</legend>
                <div class="choices" id="content-choices" role="radiogroup" aria-label="Static posts">
                  <label class="choice"><input type="radio" name="content-mode" value="images" checked> Screenshots</label>
                  <label class="choice"><input type="radio" name="content-mode" value="text"> Paste the text</label>
                </div>
                <div id="images-field" class="field">
                  <label for="post-images" class="sr-only">Screenshots</label>
                  <input type="file" id="post-images" multiple>
                  <p class="hint" id="images-hint"></p>
                </div>
                <div id="text-field" class="field" hidden>
                  <label for="post-text" class="sr-only">Post text or caption</label>
                  <textarea id="post-text" rows="5" maxlength="4000" placeholder="Paste the Post’s text or caption"></textarea>
                </div>
              </fieldset>
              <p class="hint">A Post needs only one of these: a link, a transcript, screenshots or text.</p>
              <p id="intake-status" class="muted" aria-live="polite"></p>
              <p id="intake-errors" class="error" aria-live="polite"></p>
              <div class="row letter-actions">
                <button type="submit" id="add-post">Add Post</button>
                <button type="button" id="add-examples">Add fictional example Posts</button>
                <span id="post-count" class="muted"></span>
              </div>
            </form>
            <div id="post-list"></div>

            <p class="send-row"><button type="button" id="evaluate-all" class="send">Send for review</button></p>
            <p class="send-row"><button type="button" id="clear-review" class="link-button quiet">Clear Review</button></p>
            <p class="hint">Posts are reviewed one at a time. Persona Reactions are simulated perspectives, not real people’s opinions. <span id="save-note"></span></p>
          </div>
        </div>
        <svg class="env-part env-pocket env-open" viewBox="0 0 1350 1065" preserveAspectRatio="none" aria-hidden="true">
          <g filter="url(#ld-f-lift)">
            <path d="M0 35 L560 560 L0 1065 Z" fill="url(#ld-g-left)"/>
            <path d="M1350 15 L790 560 L1350 1065 Z" fill="url(#ld-g-right)"/>
            <path d="M0 1065 L395 568 Q415 542 448 542 H902 Q935 542 955 568 L1350 1065 Z" fill="url(#ld-g-bottom)"/>
          </g>
        </svg>
        <svg class="env-part env-pocket env-deep" viewBox="0 0 1350 1065" preserveAspectRatio="none" aria-hidden="true">
          <g filter="url(#ld-f-lift)">
            <path d="M0 0 L675 520 L0 1065 Z" fill="url(#ld-g-left)"/>
            <path d="M1350 0 L675 520 L1350 1065 Z" fill="url(#ld-g-right)"/>
            <path d="M0 1065 L675 500 L1350 1065 Z" fill="url(#ld-g-bottom)"/>
          </g>
        </svg>
        <svg class="env-part env-flap" viewBox="0 0 1350 520" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H1350 L712 498 Q675 524 638 498 Z" fill="url(#ld-g-flap)"/></svg>
      </div>
    </div>
  </section>

  <section id="view-results" class="view" hidden>
    <h1 class="desk-title">Your letter, read</h1>
    <div id="overall"></div>
    <div id="posts"></div>
  </section>
  </div>

  <div class="desk-side" id="desk-side">
  <aside class="mailbox" id="mailbox" aria-label="Mailbox">
    <h2 class="mailbox-title">Mailbox</h2>
    <div class="mail-slot" id="mail-slot" aria-hidden="true"></div>
    <div class="next-card">
      <h3>Next…</h3>
      <ul class="next-list">
        <li id="next-post-item" hidden><button type="button" id="next-post">Next post</button></li>
        <li><button type="button" id="save-review" hidden>Save Review as file</button></li>
        <li><button type="button" id="copy-review">Copy review</button></li>
        <li><button type="button" data-nav="profile">View past reviews</button></li>
        <li class="has-tip">
          <button type="button" id="send-feedback" aria-describedby="feedback-tip" aria-disabled="true">Send feedback</button>
          <span class="tip" id="feedback-tip" role="tooltip">Drafts a loving message you could send the account behind these Posts, with Talking Points tied to each Post. You send it yourself: Living Letter never sends anything. Ready once a Post has been reviewed.</span>
        </li>
      </ul>
      <p id="export-status" class="mail-status" aria-live="polite"></p>
    </div>
    <textarea id="export-fallback" rows="8" readonly hidden aria-label="Review as text"></textarea>
  </aside>
  </div>
  </div>

  <!-- Send feedback: the Ministry Outreach Plan as a letter in an open envelope (design partner's mockup). -->
  <dialog class="feedback" id="feedback" aria-labelledby="feedback-title">
    <div class="feedback-stage">
      <svg class="fb-part fb-flap" viewBox="0 0 1470 755" preserveAspectRatio="none" aria-hidden="true"><path d="M0 755 Q20 700 60 660 L690 35 Q735 -5 780 35 L1410 660 Q1450 700 1470 755 Z" fill="url(#ld-g-flap)"/></svg>
      <svg class="fb-part fb-back" viewBox="0 0 1470 844" preserveAspectRatio="none" aria-hidden="true"><rect width="1470" height="844" fill="url(#ld-g-back)"/></svg>
      <div class="feedback-letter">
        <p class="feedback-top"><button type="button" class="link-button" id="feedback-close">Close</button></p>
        <h2 class="feedback-title" id="feedback-title">A loving message you could send to the account behind the posts</h2>
        <p class="feedback-note">You send it yourself: Living Letter never sends or posts anything.</p>
        <div id="feedback-body"></div>
      </div>
      <svg class="fb-part fb-pocket" viewBox="0 0 1470 844" preserveAspectRatio="none" aria-hidden="true">
        <g filter="url(#ld-f-lift)">
          <path d="M0 0 L735 580 L0 844 Z" fill="url(#ld-g-left)"/>
          <path d="M1470 0 L735 580 L1470 844 Z" fill="url(#ld-g-right)"/>
          <path d="M0 844 L735 520 L1470 844 Z" fill="url(#ld-g-bottom)"/>
        </g>
      </svg>
    </div>
  </dialog>

  <section id="view-profile" class="view" hidden>
    <h1 class="view-title">Your profile</h1>
    <h2>Past Reviews</h2>
    <p>Each Review you send is saved here for you alone. Nobody else can see it, not even this page’s owner. Screenshots are never saved, only their file names.</p>
    <p id="past-state" class="muted" aria-live="polite"></p>
    <div id="past-list"></div>
    <h2>Coming to your profile</h2>
    <p>Planned for the web app, not yet in this demo:</p>
    <ul>
      <li><strong>Ranked target audiences.</strong> Record who you most want to reach, in your order. Your own Reviews then show the closest Personas first.</li>
      <li><strong>Overall feedback.</strong> A summary across all your Posts: average scores, recurring patterns, your strongest and weakest Posts, and the changes that would help most.</li>
    </ul>
  </section>

  <section id="view-how" class="view" hidden>
    <h1 class="view-title">How it works</h1>
    <div class="choices how-tabs" id="how-tabs" role="radiogroup" aria-label="How it works topics">
      <label class="choice"><input type="radio" name="how-tab" value="overview" checked> Overview</label>
      <label class="choice"><input type="radio" name="how-tab" value="scoring"> Scoring</label>
      <label class="choice"><input type="radio" name="how-tab" value="personas"> Personas</label>
      <label class="choice"><input type="radio" name="how-tab" value="mechanism"> Mechanism</label>
      <label class="choice"><input type="radio" name="how-tab" value="sources"> Sources</label>
      <label class="choice"><input type="radio" name="how-tab" value="privacy"> Privacy</label>
    </div>

    <div id="how-panel-overview" class="how-panel how-overview">
      <h2 class="sr-only">What happens when you send a Post</h2>
      <ol class="how-steps">
        <li><img class="how-art" src="${imgData('how-add.png')}" width="240" height="240" alt=""><h3>Add posts</h3><p>A link, a video transcript, screenshots or the text. One of these is enough.</p></li>
        <li><img class="how-art" src="${imgData('how-score.png')}" width="240" height="240" alt=""><h3>Receive scoring</h3><p>Ten Criteria, each with a score and the Evidence that earned it.</p></li>
        <li><img class="how-art" src="${imgData('how-react.png')}" width="240" height="240" alt=""><h3>The Personas react</h3><p>Simulated people outside the faith say how the Post lands with them.</p></li>
        <li><img class="how-art" src="${imgData('how-next.png')}" width="240" height="240" alt=""><h3>Next steps</h3><p>Discussion Questions for every Post, and a Gentler Rewrite when a score shows a concern. If the Post is someone else’s, the Outreach Plan helps you raise it with them.</p></li>
      </ol>
      <p class="how-more">The other tabs explain each part: what the scores mean, who the Personas are, how the results are produced, where the rubric comes from, and what is kept.</p>
    </div>

    <div id="how-panel-scoring" class="how-panel" hidden>
      <h2>How a Post is scored</h2>
      <div id="how-scoring"></div>
      <h2>Sources of offence</h2>
      <p>When a Post might offend, the score names where the offence comes from. This keeps apart offence at the message and offence caused by the messenger.</p>
      <div id="how-offence"></div>
      <h2>The ten Criteria</h2>
      <div id="how-criteria"></div>
    </div>

    <div id="how-panel-personas" class="how-panel" hidden>
      <h2>The Personas</h2>
      <p>Each Persona is a simulated person with a believable background and reasons for their views, not a caricature. They are built along four lines that change how a Post lands: how familiar the person is with Christianity (Engel scale), how open they are (Rainer scale), their history with church (none, drifted or hurt), and their worldview (secular, spiritual, or another faith).</p>
      <p>The political lean of the set is deliberately one-sided: there is no secular-conservative Persona.</p>
      <p class="notice">Language models can flatten or stereotype groups of people, so every Persona Reaction is labelled simulated: treat it as a hypothesis to test with real people, not as data. The Personas will be revised after interviews with real people outside the faith.</p>
      <div id="how-personas"></div>
    </div>

    <div id="how-panel-mechanism" class="how-panel" hidden>
      <h2>How the results are produced</h2>
      <ol>
        <li><strong>Scoring and reactions, separately.</strong> Claude reads the Post (text, screenshots, or a video transcript) twice, in two separate requests. One scores it against the rubric. The other voices the Personas. Neither sees the other’s answer, so a Persona’s reaction can never change a score.</li>
        <li><strong>Code applies the thresholds.</strong> Whether a Post is likely to land well, and whether it gets a rewrite, is worked out by code from the scores, not by the model, so the same scores always give the same result.</li>
        <li><strong>Questions and rewrite.</strong> A third request writes Discussion Questions from the Post, its scores and the reactions. When a rewrite is needed, a fourth writes it. The rewrite never changes the Post’s beliefs.</li>
        <li><strong>Checks.</strong> Every answer is checked against a fixed format before it is shown. Comment sections are ignored, and any @handle other than the poster’s is removed.</li>
      </ol>
      <p>Every result shows the versions that produced it: the rubric, the Persona set, the prompts and the model. When the rubric or Personas are revised, they get a new version number, so old and new scores are never mixed.</p>
    </div>

    <div id="how-panel-sources" class="how-panel" hidden>
      <h2>Where the rubric and Personas come from</h2>
      <ul>
        <li><strong>Scripture.</strong> The fruit of the Spirit (Galatians 5:22–23); love in 1 Corinthians 13; Jesus eating with tax collectors and sinners (Matthew 9:9–13); “not ours to judge those outside” (1 Corinthians 5:12–13); “gentleness and respect” (1 Peter 3:15–16); speech “seasoned with salt” toward outsiders (Colossians 4:5–6).</li>
        <li><strong>Paul in Athens (Acts 17).</strong> Five marks from <em>Culture and Ministry Design</em> (p. 28, adapted from Flemming): know the audience’s culture; do not compromise truth claims, where the only acceptable offence is the offence of the gospel; do not condemn; invite dialogue and questions; give a clear answer. The comparison of Paul’s audiences in Acts 13, 14 and 17 also shaped the Personas.</li>
        <li><strong>Research on how outsiders see Christians.</strong> Kinnaman and Lyons, <em>unChristian</em> (2007) and <em>Good Faith</em> (2016); Barna studies from 2018 to 2024; Pew Research Center and PRRI surveys of the religiously unaffiliated. The same gap shows up from 2007 to today: most people view Jesus positively but distrust Christians, mainly over hypocrisy, judgment and politics.</li>
        <li><strong>Writers on witness.</strong> Tim Keller, <em>Center Church</em> (contextualisation); Lesslie Newbigin, <em>The Gospel in a Pluralist Society</em>; Dietrich Bonhoeffer, <em>Discipleship</em> and <em>Letters and Papers from Prison</em>; Elmer Thiessen, <em>The Ethics of Evangelism</em>; and <em>Christian Witness in a Multi-Religious World</em> (2011).</li>
        <li><strong>The Outreach Plan.</strong> Its tone follows Jethro advising Moses (Exodus 18): ask first, treat the person as a person, name the problem and why it matters, offer one concrete idea.</li>
      </ul>
      <p class="notice">No published, tested rubric for Christian social-media witness exists, so this one is a new synthesis. The rubric will be revised after interviews with real people outside the faith.</p>
    </div>

    <div id="how-panel-privacy" class="how-panel" hidden>
      <h2>What is kept</h2>
      <ul>
        <li><strong>Your Reviews.</strong> Each Review you send is saved to your own Past Reviews, which only you can see.</li>
        <li><strong>Screenshots.</strong> Never shown again or stored.</li>
        <li><strong>Links.</strong> Shown but never opened, except an Instagram reel link, which is used only to transcribe the reel’s spoken words.</li>
      </ul>
    </div>
  </section>

  <section id="view-roadmap" class="view" hidden>
    <h1 class="view-title">Roadmap</h1>
    <p>Planned but not yet built in this demo:</p>
    <ul>
${ROADMAP.map(([name, text]) => `      <li><strong>${name}.</strong> ${text}</li>`).join('\n')}
    </ul>
  </section>

  <footer class="page-foot" id="page-foot">
    <button type="button" class="link-button" data-nav="roadmap">Roadmap</button>
    <span class="muted">Versions: <span id="versions"></span></span>
  </footer>
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
