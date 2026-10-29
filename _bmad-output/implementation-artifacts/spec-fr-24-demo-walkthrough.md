---
title: 'FR-24: Try the demo as a guided walkthrough of the real flow'
type: 'feature'
created: '2026-10-29'
status: 'done'
route: 'dispatch'
baseline_commit: '0558fa39e6df07818bfde3a641e6922ef5883feb'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Try the demo (Artifact version 36) jumps straight to a pre-evaluated sample on Results. Bennett (2026-10-29): the demo should open "a page identical to the review page", walk the viewer through each option, put the pre-loaded reel link in for them to click Evaluate, show the output, "then go through the whole process of saving the review, reviewing it in your profile", including "the profile page and how you choose who you are".

**Approach:** Try the demo opens the real, empty Review page and starts a coach-card walkthrough (`tour.js`). Cards explain each option, the tour fills the reel link, the viewer clicks Send for review, and the saved sample results are replayed. The Review saves to Saved Reviews as usual. The tour then covers the Mailbox, Your profile (the viewer picks a role), and reopening the Review from Saved Reviews.

**Decisions (Bennett, 2026-10-29):** replay the saved results on Send, with no Supadata or Claude call. Keep the demo Review in Saved Reviews. Ship the reel's real link (`https://www.instagram.com/p/DcRYltnvb77/`, no handle) in the sample and save it with the Review. This widens the PRD §7.2 exception.

## Boundaries & Constraints

**Always:**
- The replay runs only when the demo is active, the Review has no Posts, and the form holds exactly the sample link and nothing else. Anything else is a normal Send.
- The replay plays the normal envelope flight, shows the Post as "Reviewing…" briefly, then shows the saved evaluation. It then calls `saveReview()` like a live run.
- The sample notice shows while sample Posts are on screen. It says the results were evaluated ahead of time and used none of the viewer's Claude usage.
- Steps that need a viewer click (Send for review, View saved reviews, a role card, Open) wait for that action. When the action is impossible (no `db` or no signed-in viewer), the step offers Next instead.
- Every card has Back (where it makes sense), Next or a waiting hint, and End tour. At 375px the card docks to the bottom of the screen. The target is scrolled into view and outlined.
- `checkSampleReview` accepts a Post `source_url` that is null or an Instagram post link (`isInstagramPostLink`), still with no @handle.

**Never:** make a live Claude or Supadata call for the demo; replace a Review holding the viewer's own Posts; change scoring, prompts, `content/` or capabilities; commit or republish without Bennett's OK.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Demo start | Fresh load, Try the demo | Empty Review page; tour card 1 shows | N/A |
| Own Posts exist | Own Posts in the Review, Try the demo | Acts as Begin review; no tour | N/A |
| Replay | Tour filled link, Send for review | Flight, then Results with sample, notice; saved to Saved Reviews | Save failure shows the existing save error; tour continues |
| Link edited | Viewer changes the link, Send | Normal live Send (needs Claude) | Existing errors |
| No db | Not signed in | Wait steps on profile offer Next | N/A |
| End tour / Clear Review | Any step | Card and outline removed, `data-demo` removed | N/A |

</frozen-after-approval>

## Code Map

- `artifact/src/intro.js` -- the `.ll-demo` handler dispatches `ll:try-demo`, then `exit('review')`, then sets `data-demo` and fires `ll:demo-started`. Keep it; update the header comment.
- `artifact/src/ui.js` -- `onTryDemo` (l.300) currently loads done Posts: change it to set `state.demo = true` on an empty Review. `onEvaluateAll` (l.368): add the replay branch before the `!state.sample` guard. `saveReview` (l.463): drop the demo guard. `render` (l.1170): the notice follows `p.demo`, and `data-demo` is no longer removed there. `onClearReview` clears `state.demo`. Add `data-tour` attributes to the summary, scores, reactions, rewrite and questions sections in `renderEvaluation` and the helpers it calls, so the tour can anchor to them.
- `artifact/src/sample.js` -- `checkSampleReview`'s `source_url` rule. `samplePosts` keeps `p.source_url`.
- `artifact/sample-review.json` -- Post 1 `source_url` set to the reel link.
- `artifact/build.mjs` -- inline `tour.js` after `ui.js` (an IIFE like `intro.js`; one shared script scope, so no top-level names).
- `artifact/src/page.css` -- tour card and outline styles with existing tokens (`--bg`, `--fg`, `--accent`, `--line`, `--radius`, `--fs-*`, `--serif`). Dark mode comes from the tokens.
- Anchors: `.field-select` (Model), `#review-url` field, the two `fieldset.either`, `#link-field`, `#evaluate-all`, `#overall`, `[data-tour=…]`, `#mailbox .next-card`, `.role-cards`, `#creator-prefs`, `#past-list .past-item:first-child`.
- Do not change: `desk.js`, `past.js` shapes, the pipeline, the editor.

## Tasks & Acceptance

**Execution:**
- [x] `artifact/src/sample.js`, `artifact/sample-review.json`, `artifact/test/sample.test.mjs` -- allow the Instagram link, keep it in `samplePosts`, test both cases plus a non-Instagram link that is rejected.
- [x] `artifact/src/ui.js` -- the demo state, the replay, saving, the notice copy, the `data-tour` anchors.
- [x] `artifact/src/tour.js` + `artifact/build.mjs` + `artifact/src/page.css` -- the walkthrough. Steps: Review page, Model, Profile link, Videos, Static posts, link filled (wait for Send) → Results summary, scores, Persona Reactions, rewrite, questions → Mailbox (wait for View saved reviews) → role cards (wait for a pick; creator adds a preferences card) → Saved Reviews (wait for Open) → closing card on Results.
- [x] `PRD.md` FR-24 and §7.2, `ARCHITECTURE.md` AD-12, `SCHEMA.md` §6, `CLAUDE.md` -- record the walkthrough, replay, saving and the link.

**Acceptance Criteria:**
- Given the built page at desktop and at 375px, when the viewer clicks Try the demo and follows every card, then they reach the closing card with the demo Review saved and reopened, and no Claude call was made.

## Verification

**Commands:**
- `~/.bun/bin/bun test artifact/test/ && ~/.bun/bin/bun artifact/build.mjs` -- expected: all tests pass; the build logs the sample.

**Manual checks:**
- In the browser pane, with `window.claude` stubbed for `db`/`user`, run the full tour at desktop and at 375px.

## Implementation Notes

- 2026-10-29, implementer subagent: built every task (225/225 tests). Choices beyond the spec: the replay also needs an empty profile link (the tour clears it); Back only returns to an explaining card on the same page; Try the demo shows only when the sample's first Post has a link; re-picking the current role also advances the tour; the reopened demo Review is recognised by its saved text (`isSamplePost`) and keeps the notice. `ui.js` ↔ `tour.js` talk only through `ll:*` events.
- 2026-10-29, planner: two fixes in `tour.js`. A live Send (link edited) now moves the tour on to the Results, but only outside a replay (`tour.replaying`); the first version jumped to the Results card while the replay still showed "Reviewing…". "The note above" became "The note at the top", since on a phone the notice is scrolled out of view.
- Verified in the browser pane with `window.claude` stubbed (in-memory `db`, `user`, recording `sample`/`mcp`): the full tour at 1280×860 (creator path, preferences card shown) and at 375×812 (individual path, preferences card skipped). Each run saved the demo Review with the reel link and the role, reopened it with the notice, and made no Claude or Supadata call; no horizontal scroll at 375px.
- Step 4 (review layers) not run: per `AGENTS.md`, review runs only when Bennett asks. Not committed: commits only when Bennett asks.
- 2026-10-29, planner (Bennett: "Port from live page"): the live Artifact had changes from source not on this Mac, built on pre-v34 code. Ported its new work from the live HTML: the Creator preferences layout and audiences icon, the theology label and placeholder, and Home motion parts 2–4 (`home.js` replaced whole, plus its CSS and two markup tweaks). The new build now matches the live page's images and `home.js` exactly; every other difference is v34, v35, v36 or this walkthrough. 225/225 tests pass; Home motion, the preferences layout and the full tour were checked again in the browser pane, with no Claude call.
