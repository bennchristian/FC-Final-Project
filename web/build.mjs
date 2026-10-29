// Builds the Living Letter web demo: the unchanged Artifact page (artifact/build.mjs) wrapped
// in an ordinary HTML document, with web/shim.js in the head standing in for the Claude
// Artifact runtime. Output: web/dist/index.html (+ favicon), served by Vercel (vercel.json).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, loadSampleReview } from '../artifact/content.mjs';

const WEB = join(ROOT, 'web');
const DIST = join(WEB, 'dist');
const ARTIFACT_URL = 'https://claude.ai/artifact/Mkc4qYCLCFXqMLq8Yf1Kdq';

execFileSync(process.execPath, [join(ROOT, 'artifact', 'build.mjs')], { stdio: 'inherit' });
let page = readFileSync(join(ROOT, 'artifact', 'dist', 'witness-review.html'), 'utf8');
// The Artifact page starts with its own charset and title for the Artifact host; the web
// document head below carries them instead.
page = page.replace(/^<meta charset="utf-8">\s*<title>[^<]*<\/title>\s*/, '');

const { content, labels } = loadContent();
const { sample } = loadSampleReview(content, labels);
const samplePosts = sample ? sample.posts.filter((p) => p.status === 'done' && p.evaluation) : [];

// JSON inside a <script>: no "</script>" or "<!--" can appear.
const js = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const png = (file) => `data:image/png;base64,${readFileSync(join(ROOT, 'artifact', 'src', 'img', file)).toString('base64')}`;

const engine = readFileSync(join(WEB, 'demo-engine.js'), 'utf8').replace(/^export /gm, '');
const shim = readFileSync(join(WEB, 'shim.js'), 'utf8')
  .replace('/*__ENGINE__*/', () => engine)
  .replace('__CONTENT__', () => js({ rubric: content.rubric, personaSet: content.personaSet }))
  .replace('__SAMPLES__', () => js(samplePosts.map((p) => ({ text: p.video_transcript || p.pasted_text, evaluation: p.evaluation }))))
  .replace('__SAMPLE_LINKS__', () => js(samplePosts.filter((p) => p.source_url).map((p) => ({ url: p.source_url, caption: p.pasted_text || '', transcript: p.video_transcript || '' }))))
  .replace('__ARTIFACT_URL__', () => js(ARTIFACT_URL))
  .replace('__LOGO_RED__', () => js(png('logo-red.png')))
  .replace('__LOGO_CREAM__', () => js(png('logo-cream.png')));
for (const name of ['CONTENT', 'SAMPLES', 'SAMPLE_LINKS', 'ARTIFACT_URL', 'LOGO_RED', 'LOGO_CREAM']) {
  if (shim.includes(`= __${name}__;`)) throw new Error(`web/shim.js: __${name}__ not filled`);
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Living Letter</title>
<meta name="description" content="See how your social-media Posts might land with people who don't share your faith.">
<link rel="icon" type="image/png" href="/favicon.png">
<style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0}</style>
<script>${shim}</script>
</head>
<body>
${page}
</body>
</html>
`;

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, 'index.html'), html);
copyFileSync(join(ROOT, 'artifact', 'src', 'img', 'icon-pen.png'), join(DIST, 'favicon.png'));
console.log(`Built web/dist/index.html (${(html.length / 1024).toFixed(1)} KB) from the Artifact page + web demo shim`);
