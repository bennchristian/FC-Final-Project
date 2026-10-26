# Living Letter video

The 3-minute video from [`docs/video/script.md`](../docs/video/script.md), rendered from the real
Artifact (`artifact/dist/witness-review.html`) and timed to Bennett's voice-over.

**How it works.** `server.mjs` serves a recording-only copy of the built Artifact. The harness never
touches `artifact/`: it mocks the Claude connection, pauses the intro's animations so they can be
seeked, and exposes the page state so the saved Review is shown without a live run. `engine.js` draws
any moment of the video (camera, highlights, spotlights, text, cursor) as a function of time.
`timeline.js` holds every cue, timed to the words in `assets/words.json`. `render.mjs` steps
headless Chromium through the frames and pipes them to ffmpeg.

**Reading pauses.** `HOLDS` in `timeline.js` inserts silence into the VO while a quote stays on
screen (5.6, 5.7, 5.9). That takes 2:50 of audio to about 3:25. Set `HOLDS` to `[]` for a cut that
matches the recording.

## Inputs (not committed: `assets/` is git-ignored)

- `assets/vo.m4a`: the voice-over (`Living Letter 3 min video.m4a`).
- `assets/post1.json`: Post 1 from the saved Review export (`Living Letter Response 2.md`), with
  its evaluation word for word.
- `assets/words.json`: word timings, from `transcribe.py`.

## Commands

Requires an ffmpeg with libx264 (`FFMPEG`). Optional: `CHROMIUM`, when Playwright's own Chromium
is not installed.

```bash
npm install
python3 -I transcribe.py assets/vo.m4a assets/words.json   # needs faster-whisper
FFMPEG=ffmpeg node render.mjs --stills=8,45,95             # check frames → out/stills/
FFMPEG=ffmpeg node render.mjs --from=60 --to=80            # one section, with audio
FFMPEG=ffmpeg node render.mjs                              # the full video → out/living-letter.mp4
```

After a change to `transcribe.py`'s output or the recording, re-time the cues in `timeline.js`.
