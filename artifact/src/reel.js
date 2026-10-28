// Instagram and TikTok posts through the viewer's Supadata connector (`mcp` capability,
// ARCHITECTURE.md AD-13). Only the post's link goes to Supadata. Claude gets the caption as
// the Post's text and a video's spoken words as its transcript, exactly as if the User had
// pasted them.

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

// The post's caption and whether it is a video. Supadata answers `{ type, description, ... }`
// with `type` 'video', 'image' or 'carousel'. The words on an image or carousel's slides
// are not in it, and the page cannot download the images (AD-13). Only an explicit image
// or carousel counts as not a video, so an unknown type still gets its transcript.
export async function readPostDetails(mcp, url) {
  const { payload } = await mcp.callTool(SUPADATA, 'supadata_metadata', { url });
  const caption = payload && typeof payload.description === 'string' ? payload.description.trim() : '';
  const isVideo = !(payload && ['image', 'carousel'].includes(payload.type));
  return { caption: caption.slice(0, INTAKE_LIMITS.maxPastedText), isVideo };
}

// A carousel or image post needs the words on its slides from the User: screenshots or
// typed-out text. Its caption alone is not enough (PRD FR-3a).
export function needsSlides(details, pastedText, imageCount) {
  return Boolean(details && !details.isVideo && !imageCount && !pastedText.trim());
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
