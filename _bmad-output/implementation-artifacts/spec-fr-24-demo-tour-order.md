---
title: 'FR-24: guided demo starts with Home, Your profile and How it works'
type: 'feature'
created: '2026-10-29'
status: 'done'
route: 'dispatch'
baseline_commit: 'eaf4bb99f176913b0dc80315d5f4e4c3f0ace24e'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bennett (2026-10-29): "The flow now is too abrupt; It goes straight into the Review without telling me what Living Letter is. The walkthrough should start with the Overview (What it is, who it is made for) -> Profile page -> How it works -> Review."

**Approach:** Try the demo leaves the intro onto Home instead of the Review page. `tour.js` gets a new card order: Home → Your profile (pick a role) → How it works → the existing Review flow (link filled, Send replayed, Results, Mailbox, Saved Reviews, Open). It is trimmed to about 22 cards.

**Decisions (Bennett, 2026-10-29):**
- Before the Review page, Next moves to the next page itself, and the card says which masthead link leads there. Only real actions wait for a click: pick a role, Send for review, View saved reviews, Open.
- Trim to about 22 cards. Model and Profile link become one "Set up the review" card. Videos and Static posts become one "Add a Post" card. The standalone "This is the Review page" card goes, and there is no separate "More" card for How it works.

## Boundaries & Constraints

**Always:**
- Card order:
  - Home: (1) what Living Letter is (`.home-hero`); (2) who it is for (`.home-who`); (3) what you get (`.home-overview`).
  - Your profile: (4) your profile, private to your Claude account, with Saved Reviews at the bottom (`.profile-account`); (5) who you are, waiting for a role pick (`.role-cards`); (6) Creator preferences, creators only.
  - How it works: (7) the four steps, Overview tab (`.how-steps`); (8) Scoring tab; (9) Personas tab. Card 9 also names Mechanism, Sources and Privacy.
  - Review: (10) set up the review; (11) add a Post; (12) the sample link filled in; (13) Send, waiting for the click.
  - Results: overall, summary, scores, reactions, rewrite (skipped when absent), questions.
  - Then: Mailbox, waiting for View saved reviews; Saved Reviews, waiting for Open; the closing card.
- The role step stays, now at step 5, with its existing behaviour: it waits when the viewer can save, and offers Next otherwise. Saved Reviews at the end no longer repeats it.
- A tab card switches How it works to its tab. Moving between pages uses the masthead links (`#nav-profile`, `#nav-how`, `#nav-review`).
- When Try the demo is declined (own Posts, or a run busy), it stays plain Begin review.
- Replay, saving, the sample notice and the `ll:*` events are unchanged.

**Never:** a Claude or Supadata call in the demo; changes to scoring, `content/` or capabilities; commit, push or republish without Bennett's OK.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start | Try the demo | Intro exits onto Home; card 1 on the hero | N/A |
| Declined | Own Posts in the Review | Exits to the Review page; no tour | N/A |
| Not signed in | No `db` | Role and Saved Reviews steps offer Next | N/A |
| Individual | Picks individual | Creator preferences card skipped | N/A |
| End tour | Any step | Card gone, demo off | N/A |

</frozen-after-approval>

## Code Map

- `artifact/src/tour.js` -- `STEPS` (a list of `{ id, view, anchor, enter, title, body, wait, skip, last }`), `go`, `canGoBack` (only back to an explaining card on the same view), `done(kind)`, and the hooks `ll:view` (on `profile` it completes the Mailbox wait) and `ll:past-opened`. Reorder and rewrite `STEPS`; use `enter` to move pages (`pick('#nav-…')`) and tabs (click `input[name="how-tab"][value=…]`). The `ll:view` 'profile' handler must only complete a step that waits on `profile` (the Mailbox one), not the early profile cards. Update the header comment.
- `artifact/src/intro.js` (around l.188) -- `exit('review')` becomes `exit('home')` when `detail.loaded`, else `exit('review')`. Update the header comment.
- Anchors that exist: `.home-hero`, `.home-who`, `.home-overview`, `.profile-account`, `.role-cards`, `#creator-prefs`, `.how-steps`, `#how-panel-scoring`, `#how-panel-personas`, `.field-select`, `fieldset.either`, `#link-field`, `#evaluate-all`, `#overall`, `[data-tour=…]` (set through `evalPart` in `ui.js`), `#mailbox .next-card`, `#past-list .past-item:first-child`.
- Home motion (`home.js`) hides text until it is typed. Cards must still read correctly while the hero types.
- Docs: PRD FR-24 walkthrough bullet, ARCHITECTURE AD-12 sample line, `CLAUDE.md`.
- Do not change: `ui.js` replay and saving, `sample.js`, `home.js`, `page.css` (beyond what the tour already has).

## Tasks & Acceptance

**Execution:**
- [x] `artifact/src/intro.js` -- exit onto Home when the demo started.
- [x] `artifact/src/tour.js` -- the new step order, copy and page/tab moves.
- [x] `PRD.md`, `ARCHITECTURE.md`, `CLAUDE.md` -- record the new order.

**Acceptance Criteria:**
- Given the built page at desktop and at 375px, when the viewer clicks Try the demo and follows every card, then they see Home, Your profile (they pick a role) and How it works (three tabs) before the Review page, and reach the closing card with the demo Review saved and reopened, with no Claude call.

## Verification

**Commands:**
- `~/.bun/bin/bun test artifact/test/ && ~/.bun/bin/bun artifact/build.mjs` -- expected: all tests pass.

**Manual checks:**
- In the browser pane, with `window.claude` stubbed, run the tour at desktop and at 375px (creator and individual paths).

## Implementation Notes

- 2026-10-29, implementer subagent: built every task. `intro.js` exits with `exit(detail.loaded ? 'home' : 'review')` (guarded by a new assertion in `guard.test.mjs`; still 230 tests, all pass). `tour.js` has 22 steps in the spec's order; `visit(view)` clicks a masthead link only when that page is hidden, and `howTab(value)` opens How it works on a tab, so Back between tab cards switches the tab back. The role step now waits whenever an enabled role radio exists (no longer tied to the replay's `canSave`), and `layout()` re-shows a card whose wait state changed, so the role hint replaces Next once the profile finishes loading. `ui.js` changed only in the `onTryDemo` comment.
- Bug found and fixed in the browser: on the individual path the role step advances straight to How it works, and that page move ran inside the radio's click, so `render()` reset the radio before its change event and the role was never saved. `done()` now hides the card and moves on in a `setTimeout(0)` (guarded by index and token).
- Verified in the browser pane with `window.claude` stubbed (in-memory `db`, `user`, recording `sample`/`mcp`/`downloads`; a viewport meta added to the harness, since only the Artifact host adds one): 1280×860 creator path (preferences card shown, role saved), 375×812 individual path (preferences skipped, role saved, Back from Personas restores the Scoring tab), 375×812 with no `db` (role and Mailbox offer Next), and the declined path (a Post already in the Review: exits to the Review page, no tour). Each full run saved the demo Review with the reel link, reopened it with the sample notice, and made no Claude or Supadata call (only `sample.limits`); no horizontal scroll at 375px. End tour clears `data-demo` and `data-tour`.
- Not run: review layers (only when Bennett asks). Not committed, pushed or republished.
- 2026-10-29, planner: verified against the diff. Rebased the uncommitted work onto `origin/main` 8bd9a4d (versions 44–45: "Send another post", copy edits); the only conflict was two `CLAUDE.md` lines, both kept. 230/230 tests. Full tour in the browser pane: 1280×860 creator path (all 22 cards, role saved, Review saved and reopened) and 375×812 individual path (preferences skipped, no horizontal scroll); no Claude or Supadata call. The v42/v43 Results still carry the reactions and rewrite anchors (through `evalPart`), so no anchor fix was needed. Review layers not run (per `AGENTS.md`).
