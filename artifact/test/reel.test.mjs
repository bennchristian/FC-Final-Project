// Instagram and TikTok post links, captions and transcripts through a fake `mcp` (AD-13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isInstagramPostLink, isTikTokPostLink, isReadablePostLink, INTAKE_LIMITS } from '../src/core.js';
import { readPostDetails, needsSlides, transcribeReel } from '../src/reel.js';

function fakeMcp(payloads) {
  const calls = [];
  const mcp = {
    callTool: async (server, tool, input, options) => {
      calls.push({ server, tool, input, options });
      const payload = payloads.shift();
      if (payload instanceof Error || (payload && payload.code)) throw payload;
      return { content: [], payload };
    },
  };
  return { mcp, calls };
}

const reel = 'https://www.instagram.com/reel/ABC123/';
const noSleep = async () => {};

test('isInstagramPostLink accepts single post and reel links only', () => {
  for (const url of [reel, 'https://www.instagram.com/p/ABC/', 'https://instagram.com/reels/ABC-1_2', 'https://m.instagram.com/tv/XYZ/', 'https://www.instagram.com/cedarhollow.example/reel/ABC/?igsh=1', 'https://www.instagram.com/share/reel/ABC/']) {
    assert.equal(isInstagramPostLink(url), true, url);
  }
  for (const url of ['', 'https://www.instagram.com/cedarhollow.example/', 'https://www.instagram.com/p/', 'https://www.instagram.com/reels/', 'https://evil.com/reel/ABC/', 'https://instagram.com.evil.com/reel/ABC/', 'ftp://www.instagram.com/reel/ABC/']) {
    assert.equal(isInstagramPostLink(url), false, url);
  }
});

test('transcribeReel asks Supadata for plain text and returns it', async () => {
  const { mcp, calls } = fakeMcp([{ lang: 'en', content: '  Welcome to church.  ' }]);
  assert.equal(await transcribeReel(mcp, reel), 'Welcome to church.');
  assert.deepEqual(calls.map((c) => [c.server, c.tool, c.input]), [['Supadata', 'supadata_transcript', { url: reel, text: true }]]);
});

test('transcribeReel joins timestamped segments and caps the length', async () => {
  const { mcp } = fakeMcp([{ content: [{ text: 'Hello' }, { text: 'x'.repeat(INTAKE_LIMITS.maxTranscript) }] }]);
  const text = await transcribeReel(mcp, reel);
  assert.equal(text.length, INTAKE_LIMITS.maxTranscript);
  assert.ok(text.startsWith('Hello x'));
});

test('transcribeReel polls a job until it completes', async () => {
  const { mcp, calls } = fakeMcp([{ jobId: 'j1' }, { status: 'active' }, { status: 'completed', content: 'Done.' }]);
  assert.equal(await transcribeReel(mcp, reel, { sleep: noSleep }), 'Done.');
  assert.deepEqual(calls.slice(1).map((c) => [c.tool, c.input, c.options]), [
    ['supadata_check_transcript_status', { id: 'j1' }, { cache: false }],
    ['supadata_check_transcript_status', { id: 'j1' }, { cache: false }],
  ]);
});

test('transcribeReel rejects a failed job, an empty transcript, and a job that never finishes', async () => {
  await assert.rejects(transcribeReel(fakeMcp([{ jobId: 'j1' }, { status: 'failed' }]).mcp, reel, { sleep: noSleep }), { code: 'failed' });
  await assert.rejects(transcribeReel(fakeMcp([{ content: '  ' }]).mcp, reel), { code: 'empty' });
  const { mcp, calls } = fakeMcp([{ jobId: 'j1' }, ...Array(30).fill({ status: 'queued' })]);
  await assert.rejects(transcribeReel(mcp, reel, { sleep: noSleep }), { code: 'empty' });
  assert.equal(calls.length, 21);
});

test('transcribeReel passes connector errors through', async () => {
  await assert.rejects(transcribeReel(fakeMcp([{ code: 'server_not_connected' }]).mcp, reel), { code: 'server_not_connected' });
});

test('isTikTokPostLink accepts single video and photo links only', () => {
  for (const url of ['https://www.tiktok.com/@se.church/video/7332956108555930922', 'https://www.tiktok.com/@some_one.x/photo/7332956108555930922?lang=en', 'https://tiktok.com/@a/video/1', 'https://m.tiktok.com/v/7332956108555930922.html', 'https://www.tiktok.com/t/ZTabc123/', 'https://vm.tiktok.com/ZMabc123/', 'https://vt.tiktok.com/ZSabc123']) {
    assert.equal(isTikTokPostLink(url), true, url);
  }
  for (const url of ['', 'https://www.tiktok.com/@se.church', 'https://www.tiktok.com/@se.church/video/', 'https://www.tiktok.com/@se.church/video/abc', 'https://www.tiktok.com/discover/church', 'https://vm.tiktok.com/', 'https://tiktok.com.evil.com/@a/video/1', 'https://evil.com/@a/video/1', 'ftp://www.tiktok.com/@a/video/1']) {
    assert.equal(isTikTokPostLink(url), false, url);
  }
});

test('isReadablePostLink accepts Instagram and TikTok post links only', () => {
  assert.equal(isReadablePostLink(reel), true);
  assert.equal(isReadablePostLink('https://www.tiktok.com/@a/video/1'), true);
  assert.equal(isReadablePostLink('https://www.youtube.com/watch?v=abc'), false);
  assert.equal(isReadablePostLink('https://www.instagram.com/cedarhollow.example/'), false);
});

test('readPostDetails asks Supadata for metadata and returns the caption and video flag', async () => {
  const { mcp, calls } = fakeMcp([{ platform: 'tiktok', type: 'video', description: '  Letting it cook #bible ' }]);
  assert.deepEqual(await readPostDetails(mcp, reel), { caption: 'Letting it cook #bible', isVideo: true });
  assert.deepEqual(calls.map((c) => [c.server, c.tool, c.input]), [['Supadata', 'supadata_metadata', { url: reel }]]);
});

test('readPostDetails reports carousels and images as not video', async () => {
  const carousel = { type: 'carousel', description: 'Run the race.', additionalData: { isVideo: false, isCarousel: true } };
  assert.deepEqual(await readPostDetails(fakeMcp([carousel]).mcp, reel), { caption: 'Run the race.', isVideo: false });
  assert.deepEqual(await readPostDetails(fakeMcp([{ type: 'image' }]).mcp, reel), { caption: '', isVideo: false });
});

test('readPostDetails treats any type but image or carousel as a video', async () => {
  for (const payload of [{ type: 'video' }, { type: 'reel' }, {}, null]) {
    assert.equal((await readPostDetails(fakeMcp([payload]).mcp, reel)).isVideo, true, JSON.stringify(payload));
  }
});

test('needsSlides asks for slides only for an image or carousel with nothing but its caption', () => {
  const carousel = { caption: 'Run the race.', isVideo: false };
  assert.equal(needsSlides(carousel, '', 0), true);
  assert.equal(needsSlides(carousel, '  ', 0), true);
  assert.equal(needsSlides(carousel, '', 3), false);
  assert.equal(needsSlides(carousel, 'The world keeps telling us to run faster.', 0), false);
  assert.equal(needsSlides({ caption: '', isVideo: true }, '', 0), false);
  assert.equal(needsSlides(null, '', 0), false);
});

test('readPostDetails caps the caption and passes connector errors through', async () => {
  const { caption } = await readPostDetails(fakeMcp([{ type: 'image', description: 'x'.repeat(INTAKE_LIMITS.maxPastedText + 5) }]).mcp, reel);
  assert.equal(caption.length, INTAKE_LIMITS.maxPastedText);
  await assert.rejects(readPostDetails(fakeMcp([{ code: 'approval_required' }]).mcp, reel), { code: 'approval_required' });
});
