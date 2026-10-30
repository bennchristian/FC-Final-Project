// Local server for the video render. Serves the stage and a recording-only copy of the
// built Artifact. The harness lives here, never in artifact/: it mocks the Claude
// connection, pauses the intro's animations so the stage can seek them frame by frame,
// and exposes the page's state so the saved Review can be shown without a live run.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'artifact', 'dist', 'witness-review.html');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

const HEAD = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>
  html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }
  *:focus, *:focus-visible { outline: none !important; }
  #vid-layer { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none; }
  #vid-layer > div { position: absolute; }
  .vid-hl { background: rgba(138, 32, 28, 0.17); mix-blend-mode: multiply; border-bottom: 3px solid #8A201C; }
  .vid-spot { border-radius: 10px; box-shadow: 0 0 0 6000px rgba(255, 251, 245, 0.84); }
  strong.vid-bold { font-weight: 700; color: #8A201C; }
</style>
<script>
  // Every animation starts paused; the stage seeks it by group.
  window.__anims = [];
  window.__group = 'open';
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    const a = animate.call(this, keyframes, options);
    a.pause();
    a.currentTime = 0;
    a.__group = window.__group;
    a.__born = window.__vt || 0;
    window.__anims.push(a);
    return a;
  };
  // Claude connection stand-in: Reviews are never run here, only replayed.
  window.claude = {
    use: (name) => name === 'sample'
      ? Promise.resolve({ limits: () => Promise.resolve({ images: { maxCount: 5, mediaTypes: ['image/png', 'image/jpeg', 'image/webp'] } }) })
      : Promise.reject(new Error('not available in the video harness')),
  };
</script>
`;

function artifactPage(mode) {
  let html = readFileSync(DIST, 'utf8');
  const at = html.lastIndexOf('<script>');
  const pre = mode === 'page' ? '<script>document.getElementById("ll-intro").remove();</script>\n' : '';
  html = html.slice(0, at) + pre + html.slice(at);
  // Whatever of these the built Artifact still has (the page has changed since the 3-minute video).
  const names = ['state', 'render', 'addPost', 'showTab', 'showView', 'COPY', '$', 'sendLetter', 'resetDesk', 'samplePosts', 'SAMPLE_REVIEW'];
  const expose = names.map((n) => `${JSON.stringify(n)}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ');
  html = html.replace(/\nstart\(\);\n/, `\nstart();\nwindow.__ll = { ${expose} };\n`);
  if (!html.includes('window.__ll')) throw new Error('harness: start() hook not found in the built Artifact');
  // The built page starts with head content (title, fonts, styles); the parser opens <body> itself.
  return `${HEAD}${html}\n</html>`;
}

export function serve(port = 0) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/artifact.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(artifactPage(url.searchParams.get('mode')));
        return;
      }
      const file = join(HERE, url.pathname.replace(/^\/+/, ''));
      if (!file.startsWith(HERE)) throw new Error('outside');
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
