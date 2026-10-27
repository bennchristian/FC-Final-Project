// Renders the Living Letter video: drives the stage in headless Chromium frame by frame,
// pipes the frames to ffmpeg, then adds the voice-over with the reading pauses inserted.
//
//   FFMPEG=/path/to/ffmpeg node render.mjs                       full video → out/living-letter.mp4
//   FFMPEG=... node render.mjs --from=60 --to=80                 a section, with audio
//   FFMPEG=... node render.mjs --stills=8,13.5,45                still frames → out/stills/
//
// CHROMIUM may point at a Chromium executable when Playwright's own build is not installed.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const fps = Number(args.fps || 30);

function run(cmd, argv, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`))));
    if (input) input(p.stdin);
  });
}

// The voice-over with silence inserted at each hold, padded to the video's length.
async function heldAudio(holds, duration, file) {
  const parts = [];
  const filters = [];
  let from = 0;
  holds.forEach((h, i) => {
    filters.push(`[0:a]atrim=start=${from}:end=${h.at},asetpts=PTS-STARTPTS[a${i}]`, `aevalsrc=0:c=mono:s=44100:d=${h.dur}[s${i}]`);
    parts.push(`[a${i}]`, `[s${i}]`);
    from = h.at;
  });
  filters.push(`[0:a]atrim=start=${from},asetpts=PTS-STARTPTS[last]`);
  parts.push('[last]');
  filters.push(`${parts.join('')}concat=n=${parts.length}:v=0:a=1,apad=whole_dur=${duration}[out]`);
  await run(FFMPEG, ['-y', '-i', join(HERE, 'assets', 'vo.m4a'), '-filter_complex', filters.join(';'), '-map', '[out]', '-ar', '44100', file]);
}

const server = await serve();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/stage.html`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
const error = await page.evaluate(() => window.__error);
if (error) throw new Error(error);
const duration = await page.evaluate(() => window.__duration);
const holds = await page.evaluate(() => window.__holds);
console.log(`Stage ready: ${duration.toFixed(2)}s (${Math.floor(duration / 60)}:${String(Math.round(duration % 60)).padStart(2, '0')})`);

mkdirSync(OUT, { recursive: true });
// A plain clip of the stage: element screenshots wait for "stable" layout, which can stall mid-move.
const CLIP = { x: 0, y: 0, width: 1920, height: 1080 };
async function shot() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await page.screenshot({ type: 'png', clip: CLIP, timeout: 60000 });
    } catch (e) {
      if (attempt >= 3) throw e;
    }
  }
}

if (args.stills) {
  const dir = join(OUT, 'stills');
  mkdirSync(dir, { recursive: true });
  for (const t of args.stills.split(',').map(Number).sort((a, b) => a - b)) {
    await page.evaluate((x) => window.renderAt(x), t);
    const file = join(dir, `t${t.toFixed(2).padStart(7, '0')}.png`);
    writeFileSync(file, await shot());
    console.log(file);
  }
} else {
  const from = Number(args.from || 0);
  const to = Math.min(Number(args.to || duration), duration);
  const name = args.out || (args.from || args.to ? `section-${from}-${to}.mp4` : 'living-letter.mp4');
  const silent = join(OUT, 'video-only.mp4');
  const total = Math.round((to - from) * fps);
  // Events must run in order, so a section render first steps up to its start.
  for (let t = 0; t < from; t += 0.5) await page.evaluate((x) => window.renderAt(x), t);
  const t0 = Date.now();
  await run(FFMPEG, ['-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', silent], async (stdin) => {
    for (let i = 0; i < total; i++) {
      await page.evaluate((x) => window.renderAt(x), from + i / fps);
      const png = await shot();
      if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r));
      if (i % (fps * 5) === 0) console.log(`frame ${i}/${total}  t=${(from + i / fps).toFixed(1)}s  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
    }
    stdin.end();
  });
  const audio = join(OUT, 'vo-held.wav');
  await heldAudio(holds, duration, audio);
  const file = join(OUT, name);
  await run(FFMPEG, ['-y', '-i', silent, '-ss', String(from), '-t', String(to - from), '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file]);
  console.log(`Wrote ${file}`);
}

await browser.close();
server.close();
