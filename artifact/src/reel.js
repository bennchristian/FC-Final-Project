// Instagram reel transcripts through the viewer's Supadata connector (`mcp` capability,
// ARCHITECTURE.md AD-13). Only the reel's link goes to Supadata. Claude gets the result as
// the Post's video transcript, exactly as if the User had pasted it.

import { INTAKE_LIMITS } from './core.js';

const TRANSCRIPT_SERVER = 'Supadata';
const POLL_MS = 3000;
const MAX_POLLS = 20;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Supadata answers `{ content }`: plain text, or timestamped segments of `{ text }`.
function transcriptText(payload) {
  const content = payload && typeof payload === 'object' ? payload.content : payload;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((s) => (s && s.text) || '').join(' ');
  return '';
}

// The reel's spoken words, or a rejection `{ code }`: an `mcp` error code, `failed`
// (Supadata could not transcribe it) or `empty` (nothing was said).
// A long video answers `{ jobId }` first; that job is polled a bounded number of times.
export async function transcribeReel(mcp, url, { sleep = wait } = {}) {
  let { payload } = await mcp.callTool(TRANSCRIPT_SERVER, 'supadata_transcript', { url, text: true });
  const jobId = payload && payload.jobId;
  for (let i = 0; jobId && i < MAX_POLLS; i++) {
    await sleep(POLL_MS);
    ({ payload } = await mcp.callTool(TRANSCRIPT_SERVER, 'supadata_check_transcript_status', { id: jobId }, { cache: false }));
    if (payload && payload.status === 'failed') throw { code: 'failed' };
    if (payload && payload.status === 'completed') break;
  }
  const text = transcriptText(payload).trim();
  if (!text) throw { code: 'empty' };
  return text.slice(0, INTAKE_LIMITS.maxTranscript);
}
