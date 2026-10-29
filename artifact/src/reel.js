// Instagram reels and TikTok videos through the viewer's Supadata connector (`mcp` capability,
// ARCHITECTURE.md AD-13). Only the video's link goes to Supadata. Claude gets the caption as
// the Post's text and the spoken words as its transcript, exactly as if the User had pasted
// them.

import { INTAKE_LIMITS } from './core.js';

const SUPADATA = 'Supadata';
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

// The video's caption, or '' when it has none. Supadata answers `{ description, ... }`.
export async function readCaption(mcp, url) {
  const { payload } = await mcp.callTool(SUPADATA, 'supadata_metadata', { url });
  const caption = payload && typeof payload.description === 'string' ? payload.description.trim() : '';
  return caption.slice(0, INTAKE_LIMITS.maxPastedText);
}

// The video's spoken words, or a rejection `{ code }`: an `mcp` error code, `failed`
// (Supadata could not transcribe it) or `empty` (nothing was said).
// A long video answers `{ jobId }` first; that job is polled a bounded number of times.
export async function transcribeReel(mcp, url, { sleep = wait } = {}) {
  let { payload } = await mcp.callTool(SUPADATA, 'supadata_transcript', { url, text: true });
  const jobId = payload && payload.jobId;
  for (let i = 0; jobId && i < MAX_POLLS; i++) {
    await sleep(POLL_MS);
    ({ payload } = await mcp.callTool(SUPADATA, 'supadata_check_transcript_status', { id: jobId }, { cache: false }));
    if (payload && payload.status === 'failed') throw { code: 'failed' };
    if (payload && payload.status === 'completed') break;
  }
  const text = transcriptText(payload).trim();
  if (!text) throw { code: 'empty' };
  return text.slice(0, INTAKE_LIMITS.maxTranscript);
}
