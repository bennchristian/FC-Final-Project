// Builds .working/motion-intro-preview.html: the Living Letter intro layered over a copy of the
// current built Artifact. Reads artifact/dist/witness-review.html; never writes inside artifact/.
//
//   node _bmad-output/planning-artifacts/ux-designs/ux-FC-Final-Project-2026-10-21/.working/intro/assemble-preview.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../../../..');
const OUT = join(HERE, '..', 'motion-intro-preview.html');

const artifact = readFileSync(join(ROOT, 'artifact', 'dist', 'witness-review.html'), 'utf8');
const css = readFileSync(join(HERE, 'intro.css'), 'utf8');
const markup = readFileSync(join(HERE, 'intro.html'), 'utf8');
const script = readFileSync(join(HERE, 'intro.js'), 'utf8');

if (!artifact.includes('<main>') || !artifact.trimEnd().endsWith('</script>')) {
  throw new Error('artifact/dist/witness-review.html no longer has the expected <main> ... </script> shape');
}

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
  + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Open+Sans:ital,wght@0,400;0,500;1,400&display=swap">';

const body = artifact
  .replace('<title>Witness Review</title>', '<title>Living Letter (intro preview)</title>')
  .replace('<main>', `${markup}\n<main>`);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${fonts}
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${script}
</script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`Wrote ${OUT}`);
