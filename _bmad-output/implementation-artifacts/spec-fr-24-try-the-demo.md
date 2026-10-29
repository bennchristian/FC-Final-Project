---
title: 'FR-24: Try the demo on the first screen of the Demo Artifact'
type: 'feature'
created: '2026-10-29'
status: 'done'
baseline_commit: '92598e069d31cdb77759ff4af6204ed66facac93'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Demo-day advisors open the live link (the Demo Artifact) to an empty Review. They only see what Living Letter does after adding Posts and running them on their own Claude usage. Demo-day checklist item 1 asks for one click into a signed-in app that already holds sample data. Artifact viewers are already signed in to claude.ai, so only the sample data is missing.

**Approach:** Add a "Try the demo" button beside "Start here" on the intro letter. One click plays the normal exit and lands on the Review tab, which already holds a fictional sample Review: the three built-in fictional Posts with full results and an Outreach Plan. Nothing runs live. Bennett produces the sample by running the three fictional examples once in the live Artifact and saving the Review. The saved file's JSON appendix becomes `artifact/sample-review.json`, which the build inlines. Approved by Bennett 2026-10-29: PRD FR-24 [F], an AD-12 line and a SCHEMA §6 note.

**Amended 2026-10-29 by Bennett:** "Add fictional example Posts" is removed. The sample is Post 1 of `Living Letter Response 2.md`, the public reel "Should a Christian attend a gay wedding?", with its link set to null. That makes it an exception to PRD §7.2. The Outreach Plan is optional, and the rule allowing only fictional texts is replaced by: no link, no screenshots, no @handle.

## Boundaries & Constraints

**Always:**
- The sample holds only the `FICTIONAL_EXAMPLES` texts, with no screenshots, no source URL and no profile URL (PRD §7.2). The build fails otherwise.
- The sample's versions must equal the locked labels (FR-7). The build fails otherwise, with a message to save a new sample.
- Every evaluation and the outreach pass the existing validators in `core.js`.
- A visible notice marks the Review as a fictional sample evaluated ahead of time. Clear Review removes it.
- The sample lives in page memory only (AD-12). There is no storage and no network call.
- If `artifact/sample-review.json` is absent, the build still passes and the button stays hidden.
- Tour hook: once the demo has landed, `document.documentElement.dataset.demo = 'started'` is set and `document` dispatches the `ll:demo-started` event. Clearing the sample removes the attribute.

**Never:** build the onboarding tour (checklist item 2); make a live Claude call; preload any real person's Post; republish or commit without Bennett's OK; replace a Review that holds the viewer's own Posts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Demo from intro | Fresh load, click Try the demo | Intro exits; Review tab shows 3 done Posts plus the Outreach Plan; the sample notice is scrolled into view; the hook fires | N/A |
| Own Review exists | Viewer added Posts, Go back, Try the demo | Their Review is kept; the button acts as Start here; no hook fires | N/A |
| Demo again | Sample loaded, Go back, Try the demo | Sample reloaded unchanged; the hook fires again | N/A |
| Clear | Sample loaded, Clear Review | Empty Review; notice hidden; `data-demo` removed | N/A |
| Bad sample | Wrong versions, a real post, or an invalid evaluation | Build fails, naming the problem | Build exits 1 |
| No sample file | `sample-review.json` missing | Build passes; Try the demo hidden | N/A |

</frozen-after-approval>

## Code Map

- `artifact/src/ui.js` -- `FICTIONAL_EXAMPLES` (l.53), `state` (l.67), `addPost` (l.152) post shape, `onClearReview` (l.257), `render` (l.636), `start` (l.715). Clear Review, Remove and export work on sample Posts unchanged.
- `artifact/src/intro.js` -- `exit(target)` returns a promise and `done(target)` opens the tab. `start` is the Start here button, faded in by the opening animation.
- `artifact/src/intro.html`, `intro.css` -- `.ll-start` sits in the letter; the compact rule is at l.126.
- `artifact/build.mjs` -- inlines `CONTENT`/`LABELS`/`COPY_EDITS` and the scripts in order. The Review tab markup is around l.200-215.
- `artifact/content.mjs` `loadCopyEdits` -- the pattern for an optional, checked JSON input.
- `artifact/src/core.js` -- `validateAssessShape`, `validateAssessRules`, `validateReact`, `validateDiscuss`, `validateRewrite`, `validateOutreach`.
- `artifact/src/export.js` -- the JSON appendix shape that `sample-review.json` reuses verbatim.
- `conformance/outputs.json` `bases` -- valid outputs for the test fixture.
- Do not change: pipeline, prompts, `content/`, capabilities, the copy editor.

## Tasks & Acceptance

**Execution:**
- [x] `artifact/src/sample.js` -- new pure module that owns `FICTIONAL_EXAMPLES` (moved from ui.js), `checkSampleReview(sample, content, labels)` returning errors, and `samplePosts(sample)` returning post state. -- One place for the sample rules, testable without a DOM.
- [x] `artifact/content.mjs` -- add `loadSampleReview()`, which is optional and returns `{ sample, errors }`. -- Same pattern as copy edits.
- [x] `artifact/build.mjs` -- inline `SAMPLE_REVIEW` (null when absent) and `sample.js` before ui.js; fail on errors; add `#sample-notice` above `#posts`; log the sample status.
- [x] `artifact/src/ui.js` -- import the examples from sample.js; listen for `ll:try-demo` to load the sample (unless own Posts exist or a run is busy); render the notice; clearing the sample drops `data-demo`.
- [x] `artifact/src/intro.html`, `intro.js`, `intro.css` -- add the `.ll-demo` button, hidden when `SAMPLE_REVIEW` is null. Click dispatches `ll:try-demo`, then `exit('review')`, then sets the hook and dispatches `ll:demo-started`. It fades in with Start here and has a compact layout.
- [x] `artifact/test/sample.test.mjs` -- covers the matrix's bad-sample cases plus `samplePosts` mapping, using a fixture built from conformance bases.
- [x] `PRD.md`, `ARCHITECTURE.md` AD-12, `SCHEMA.md` §6, `CLAUDE.md` -- record FR-24 and the sample's origin.

**Acceptance Criteria:**
- Given the built page with a sample, when the first screen shows, then "Try the demo" is visible beside "Start here" at desktop and phone widths.
- Given the sample Review loaded, when the viewer exports it, then the export is the same as for a live Review.

## Verification

**Commands:**
- `node --test artifact/test/ && node artifact/build.mjs` -- expected: all tests pass and the build reports the sample status.

**Manual checks:**
- Open `artifact/dist/witness-review.html` in the browser pane at desktop and at 375px. Click Try the demo, confirm the populated Review, the notice and `data-demo`, then run Clear Review.

## Implementation Notes

- 2026-10-29, implementer subagent: built every task (203/203 tests, 28 new). `samplePosts` marks Posts `demo: true`; `render()` drops `data-demo` once no sample Post remains; `ll:try-demo` passes `detail.loaded` back so the intro fires the hook only when the sample landed.
- Planner fix: the implementer had removed the Review form's "Add fictional example Posts" button and `onAddExamples`. That was out of scope, and Bennett needs the button to make the sample, so it is restored (it now imports `FICTIONAL_EXAMPLES` from `sample.js`).
- Matrix rows 1–4 are DOM behaviour with no DOM test harness. They were verified in the browser on a build with a temporary conformance-based fixture (since deleted), at desktop and at 375px. Rows 5–6 are covered by `sample.test.mjs`.
- Open: `artifact/sample-review.json` must come from Bennett's live run. Step 4 (review) has not run; per AGENTS.md, review runs only when Bennett asks.
- 2026-10-29, amendment (Bennett): removed the examples button and `FICTIONAL_EXAMPLES`; `checkSampleReview` now takes one or more Posts with no link, screenshots or @handle, and an optional Outreach Plan. `samplePosts` keeps the video transcript. `artifact/sample-review.json` is Post 1 of `Living Letter Response 2.md` with `source_url` null (same versions as the page). The browser shows 1 evaluated Post, the notice and no link; Clear Review drops the hook. 202/202 tests pass. Before any republish: confirm the poster is a public creator, not a private person (Artifact policy).
- 2026-10-29, ported to the `Alternative` branch (the source of the live Artifact) on branch `fr-24-try-the-demo`: a third intro choice opens Results, and the sample is never saved to Past Reviews. 205/205 tests pass. Published as Artifact version 36.
