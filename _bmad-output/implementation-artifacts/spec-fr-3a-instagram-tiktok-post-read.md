---
title: 'FR-3a: read Instagram and TikTok post links (caption, transcript, ask for slides)'
type: 'feature'
created: '2026-10-27'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/PRD.md', '{project-root}/ARCHITECTURE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Demo Artifact reads only Instagram reel links, and only for spoken words. TikTok links are never read, captions are never read, and a carousel link gives Claude nothing, though the post's message is often printed on the slides.

**Approach:** Implement the amended PRD FR-3a and ARCHITECTURE AD-13 (2026-10-27, Bennett). For a link to a single Instagram or TikTok post, call Supadata `supadata_metadata` first. Its caption becomes the Post's text when none was pasted. A video gets its transcript as before. A carousel or image post with no screenshots is blocked with a request for slide screenshots, because the page cannot download the slide images. A metadata failure falls back to the transcript alone.

</frozen-after-approval>

## Implementation Notes

- Files: `artifact/src/core.js` (TikTok link check, `isReadablePostLink`), `artifact/src/reel.js` (`readPostDetails`), `artifact/src/ui.js` (`onAddPost`, copy), `artifact/build.mjs` (hint and How it works copy), `artifact/test/reel.test.mjs`.
- The `mcp` manifest is passed at publish time, not in code. The next republish must declare `supadata_metadata` too (AD-12). Recorded in `CLAUDE.md`.
- Existing limit kept: at most `min(4, limits.images.maxCount)` screenshots per Post, so a long carousel can't be fully covered. Out of scope for this change; raised with Bennett.
- When the view can't send images (`maxImages === 0`), a carousel asks for the slide text to be pasted instead.
- No republish (Bennett's instruction).
- After review: `readPostDetails` counts only an explicit `image`/`carousel` type as not video; permission answers from the metadata call stop the read instead of falling back; typed-out slide text satisfies the slide request (`needsSlides`, tested); error copy no longer assumes a video; the always-true transcript guard was removed. PRD FR-3a and AD-13 amended to match.
- Not committed: Bennett commits only when he asks (CLAUDE.md §4), which overrides this workflow's commit step.

## Review Triage Log

- medium (patched): unknown or missing Supadata `type` treated as not video, so a reel could be refused as a carousel. Now only `image`/`carousel` are not video.
- medium (patched): every metadata error swallowed, including permission and manifest codes. Permission codes now stop the read.
- medium (deferred): no mechanical check that the publish manifest lists `supadata_metadata`. Needs a build-emitted capabilities file; logged in deferred-work.md.
- medium (patched): typed-out slide text refused when screenshots were available. `needsSlides` now accepts pasted text; PRD and AD-13 updated.
- medium (patched): the carousel decision was untested. Extracted `needsSlides` into `reel.js` and tested it.
- low (patched): error copy said "paste the video transcript" for any post, and `failed` had no copy of its own.
- low (rejected): the static link hint mentions screenshots when the view can't send images. Rare (`maxImages === 0`), the runtime error already gives the right advice, and the fix moves copy into `render()`.
- low (rejected): the rename to "post" is incomplete (`reel.js`, `transcribeReel`). Cosmetic; renaming files churns imports and tests for no behaviour change.
- low (patched): `!fields.video_transcript.trim()` guard was always true, because link and transcript are exclusive. Removed.
- medium (deferred): the caption is added without being shown. Documented in PRD FR-3a; a preview step is logged in deferred-work.md.

## Verification

**Commands:**
- `node --test artifact/test/ && node artifact/build.mjs` -- expected: all tests pass, build writes `artifact/dist/witness-review.html`
