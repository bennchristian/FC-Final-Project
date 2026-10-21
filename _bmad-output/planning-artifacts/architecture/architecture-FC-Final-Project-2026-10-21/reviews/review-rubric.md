# Rubric review: Architecture Spine, Witness Review

Reviewed: `ARCHITECTURE-SPINE.md` (draft, 2026-10-21) and its companion `SCHEMA-draft.md`. I checked them against `PRD.md` (final), `RULES.md`, the architecture `.memlog.md`, and the parallel UX run's `.memlog.md` for decisions that touch architecture. Altitude: initiative, with two surfaces (the Demo Artifact, built Thu 2026-10-22, and the Web App, built the week of 2026-10-26) and features built by separate agents.

## Verdict: adequate

The core invariants are well chosen, and most of them have a real enforcement point:
- AD-1: content is versioned data, guarded by a database trigger and a hash-checked publish script.
- AD-2: the pipeline is two steps and step 1 is blind.
- AD-6: provenance is enforced by a composite foreign key.
- AD-7: an ESLint import rule and the `server-only` import guard the model boundary.
- AD-8: spend control has an ordered set of checks, an append-only ledger and a backstop.
- AD-9: data access has a clear posture.

The Capability map covers all 23 FRs, and the stack matches the PRD.

The spine falls short of strong for three reasons:
1. The divergence it most wants to prevent, where the Artifact and the Web App disagree, is not mechanically blocked. Thresholds, validators and prompt assembly are each implemented twice, with no shared check. The AD-3 wording also lets a plain-JS implementation treat N/A as a low score.
2. The contract between browser and server for `evaluate` is not defined.
3. The operating envelope is thin in places: local dev and preview environments, retry and resume, the Artifact publish path, and the session mechanics.

None of this blocks the Thursday Artifact build if H1–H3 are fixed first.

**Counts:** critical 0 · high 8 · medium 15 · low 13

## Checklist walk

| # | Check | Result |
|---|---|---|
| 1 | Fixes the real divergence points | **Partial.** Content, pipeline, thresholds, spend and data posture are covered. Missing: the evaluate request/response contract (H4), the prompt-assembly contract (H3), checks that keep the two surfaces in step (H2), retry and resume (H7), and environments (H6). |
| 2 | Rules are enforceable and match what they claim to prevent | **Mostly.** Weak spots: AD-3's Prevents names a disagreement between surfaces that its Rule cannot stop (H1, H2). AD-1's "never edited" has no enforcement on the file side (M1). AD-9 contradicts AD-8 on reads (H5). AD-5's "displayed" has no rule (H8). AD-8's agent rule is prose only (L10). |
| 3 | Nothing deferred lets units diverge | **Two items.** The progressive-streaming revisit is triggered inside the Artifact build (M14). The persona order is now decided by UX but not folded in (M15). |
| 4 | Named tech is consistent | **Mostly.** The versions match the memlog. Inconsistencies: cost is priced from `CLAUDE_MODEL` while a fallback model may answer, and `fallbacks: "default"` is missing from the memlog's verified facts (M4). The $30 workspace limit is "Console UI to confirm" in the memlog but stated as fact in AD-8 (M6). |
| 5 | Greenfield, no contradiction with the PRD stack | **Pass.** Next.js, Vercel, Supabase and the Claude API as in the PRD. Supabase secret and publishable keys are the successors to the PRD's "service-role key". AD-13 follows FR-3's own drop rule. |
| 6 | Capability map complete and accurate | **Complete** (FR-1 to FR-23 and OQ-5). Accuracy gaps are in L11 and M12. |
| 7 | Every owned dimension is decided, deferred or open | See below. |
| 8 | Hygiene | Two contradictory diagrams, risky mermaid edge labels, a broken cross-reference, rationale inside rules, an `[ASSUMPTION]` in the conventions, and four ADs without a status tag (L4–L8). |

**Dimension coverage (check 7):**

| Dimension | Status |
|---|---|
| Deployment and environments | Partial: production from `main`, no staging. Local dev DB, Vercel Preview and deploy order are silent (H6). |
| Infrastructure and provider strategy | Decided: Vercel Hobby, Supabase Free, a dedicated Anthropic workspace. |
| Secrets | Decided for production. Where local and script secrets live is silent (H6, L10). |
| Operations: monitoring, backups, incidents, cost | Partial. The backstop is unconfirmed (M6). The off-switch needs a redeploy, Supabase Free pauses idle projects, and no alerts are defined (M7). |
| Testing strategy | Partial: pure code only, and the check command is tagged `[ASSUMPTION]` (M9). |
| Auth and session | Partial: the sign-in method is decided, but session refresh, server-side verification and password reset are silent (M8). |
| Error handling | Mostly decided. Retry semantics (H7) and SDK retries and edge codes (L1) are open. |
| Observability and logging | Decided. Log retention is thin (L2). |
| Data lifecycle, retention and deletion | Partial: delete cascades are decided; retention, account deletion and backups are unstated (L3). |
| Migrations | Decided in SCHEMA §7. The order of migration and deploy is silent (H6). |
| Demo Artifact build and publish path | Partial: the build is decided; URL continuity, contract pin, which versions are inlined and external loads are silent (M10). |

---

## Critical

None.

## High

### H1. AD-3 thresholds do not scope every rule to non-N/A scores; in plain JS, N/A counts as "below 3"
- **Location:** AD-3 Rule; SCHEMA §4.1.
- **Problem:**
  - Only "Lands well" says "non-N/A". "Auto-Rewrite: any score is below 3" and "No rewrite: all scores are 4 or above" do not. N/A is stored as `null`, and in JavaScript `null < 3` is `true` and `null >= 4` is `false`.
  - Criterion 10 is forced to N/A on every Others' Review, which covers every Post in the Friday Artifact. A literal implementation in `artifact/src/core.js` (plain JS, so no type checker) would therefore mark every Post as both "lands well" and "auto-rewrite", and would never reach "no rewrite". That breaks FR-5 and FR-11 on the recorded video.
  - The Web App's strict TypeScript would flag the comparison, so the two surfaces would diverge in exactly the way AD-3 claims to prevent.
  - The case where every Criterion is N/A is also undefined. Today it means vacuously "lands well", which would show an unreadable Post as fine.
- **Fix (replace the bullets in AD-3):**
  > Let *scored* be the non-N/A Rubric Scores after the Criterion 10 override. N/A never counts toward any threshold.
  > - **Lands well:** *scored* is non-empty and min(*scored*) ≥ 3.
  > - **Auto-Rewrite:** min(*scored*) < 3.
  > - **"Suggest a gentler version" offered:** min(*scored*) = 3.
  > - **No rewrite:** min(*scored*) ≥ 4, or *scored* is empty.
  > - **Nothing to assess:** *scored* is empty. The Evaluation says so instead of "lands well". [Bennett to confirm]

### H2. Thresholds and validators exist twice, and no shared check keeps them aligned
- **Location:** AD-3 Prevents ("the two surfaces disagreeing on whether a Post lands well"); AD-4 Rule ("an equivalent hand-checked validator in `artifact/src/core.js`"); Paradigm ("share data and contracts, never code").
- **Problem:**
  - Both the threshold logic and the contract validation are written twice: in `src/domain/` (TS and Zod) and in `artifact/src/core.js` (hand-written JS).
  - Nothing tests that the two agree, so the Prevents clause is not backed by the Rule.
  - The fake adapter's canned fixtures are also never checked against the contracts, so they can drift too.
- **Fix (add to AD-3 or AD-4, and to Conventions → Check command):**
  > `fixtures/` (repo root, outside `content/`) holds golden cases:
  > - `thresholds.json`: score arrays mapped to `{lands_well, auto_rewrite, offer_rewrite, no_rewrite, nothing_to_assess}`;
  > - `contracts/<call>.valid.json` and `contracts/<call>.invalid.json` for each of Assess, React, Discuss, Rewrite, Outreach and Profile Summary narrative.
  >
  > `src/domain` (Vitest) and `artifact/src/core.js` (`node --test artifact/test/`) both run these cases. `core.js` is a pure ES module with no DOM access. The fake adapter returns the `*.valid.json` files. Both runners are part of the check command.

### H3. The prompt-assembly contract is not fixed across the two surfaces
- **Location:** Conventions → Prompt assembly; AD-2; AD-5 Prompts; SCHEMA §3 prompts.
- **Problem:**
  - Both surfaces build prompts from the same `prompts@n/*.md` files, but nothing fixes:
    - the placeholder or template syntax;
    - which version JSON each step receives (rubric, personas, or both);
    - how step-1 outputs are framed for step 2;
    - whether instructions go in a system prompt or the user turn. The Artifact's `sample` has no page-controlled system prompt (memlog), so the Web App's choice changes the input.
  - The Artifact has no schema enforcement, so the prompt files must also state the output JSON shape. Nothing says they do.
  - If the Thursday Artifact builder and a later Web App agent each invent a template, the "same prompts@1" produces different model inputs. SM-2 repeatability and the provenance label both lose their meaning.
- **Fix (replace the Prompt assembly convention):**
  > **Prompt assembly (both surfaces):** one user turn and no system prompt. Sections appear in this order, separated by a blank line:
  > 1. The step's prompt file, verbatim. It contains no placeholders and states the output JSON shape.
  > 2. `<rubric>` (Assess, Discuss, Rewrite) and/or `<personas>` (React, Discuss, Rewrite): the pinned version's JSON.
  > 3. `<creator_foundation>`: Own-Content Assess only.
  > 4. Step 2 only: `<assessment>` and `<reactions>`, holding the validated step-1 JSON.
  > 5. `<post>`, with `<pasted_text>`, `<video_transcript>` and, in step 2, `<post_transcript>` as children. Image blocks follow in the same turn.
  >
  > `src/domain/prompt.ts` and `artifact/src/core.js` must produce byte-identical text for `fixtures/prompt-assembly/`. The Web App puts its cache breakpoint after section 2.

### H4. The `evaluate` request/response contract and its transport are undefined
- **Location:** AD-5 Image downscaling; AD-10 Orchestration; Structural Seed (`src/app`: "routes, server actions, route handlers"); SCHEMA `post.image_count` (`between 0 and 4 [ASSUMPTION]`).
- **Problem:**
  - The browser-intake agent and the server-pipeline agent must meet on a contract that does not exist. The spine defines the error shape but not:
    - the route;
    - whether `evaluate` is a Server Action or a Route Handler;
    - the image encoding;
    - the response body.
  - Next.js Server Actions default to a 1 MB body limit, so a multi-screenshot Post would fail well below Vercel's 4.5 MB.
  - Base64 JSON inflates the payload by about a third.
  - The per-Post image limit is only an `[ASSUMPTION]` in SCHEMA. The UX run also lets "extra carousel images [be] dropped onto the same Post", and the Artifact's limit comes from `limits()`.
- **Fix (add to AD-10 or a new convention row):**
  > Every endpoint that calls Claude is a Route Handler under `src/app/api/`, never a Server Action:
  > - `POST /api/posts/[postId]/evaluate`
  > - `POST /api/evaluations/[id]/rewrite`
  > - `POST /api/reviews/[id]/outreach`
  > - `POST /api/reviews/[id]/profile-summary`
  >
  > Server Actions are used only for creating a Review, saving the Foundation and deleting a Review.
  >
  > `evaluate` takes `multipart/form-data` with at most `MAX_IMAGES_PER_POST = 4` JPEG parts. Each part is at most 1 MB after downscaling, and the whole body is at most 4 MB. It returns the persisted Evaluation row as JSON, or the server error shape. Each route sets `export const maxDuration = 300`. The Artifact enforces the same image limit, or `limits().maxCount` if that is lower.
  >
  > Move `MAX_IMAGES_PER_POST` into AD-5 as a decision. [Bennett to confirm 4, given carousel Posts.]

### H5. AD-9's read rule contradicts the reads AD-8 depends on
- **Location:** AD-9 Reads ("run in server code through the user-scoped client") and `usage_event` ("RLS enabled and no policies"); AD-8 (monthly sum and daily count over `usage_event`).
- **Problem:**
  - Followed literally, AD-9 routes the caps reads through the user-scoped client.
  - With RLS and no policies, that query returns zero rows without an error. Month-to-date spend reads as $0 and the daily count as 0, so neither cap ever trips.
  - SCHEMA §5's `revoke all` would turn that into a permission error, but the spine does not say what happens on a caps read error, and it could fail open.
- **Fix:**
  - AD-9 Reads: "…except `usage_event`, which only `src/server/caps/` reads, with the secret-key client."
  - AD-8: "If any caps query errors, the call is refused (`upstream_error`). Caps never fail open."
  - Add a test that seeds the ledger past each cap and asserts the refusal.

### H6. Environments other than production are silent: local dev, Vercel Preview, and who may touch the cloud project
- **Location:** Structural Seed (production from `main`); Deferred (staging); Conventions → Config; SCHEMA §7.
- **Problem:**
  - There is one Supabase project, and nothing says which database local dev and tests use. As written, agents running `npm run dev` with the fake adapter would write Reviews and `review_created` rows into production, which also uses up the test account's daily cap.
  - The local `.env` for `publish:content` would hold the production secret key, which agents can read.
  - Vercel builds Preview deployments for non-production branches by default. Nothing says whether they get production secrets and the production database.
  - Nothing orders `supabase db push` against the auto-deploy from `main`, so code can reach production before its migration.
  - AD-8's agent rule covers live Claude calls but not commands that change the cloud database.
- **Fix (new AD or a Conventions row "Environments"):**
  > - **Local and test:** the local Supabase stack (`supabase start`). `supabase db reset` applies the migrations, and `publish:content` targets the local stack. `.env.local` holds only local keys and `CLAUDE_ADAPTER=fake`, with no `ANTHROPIC_API_KEY`.
  > - **Production:** Vercel Production from `main` plus the one cloud project.
  > - **Vercel Preview:** disabled (ignored build step for non-`main` branches) and given no secrets.
  > - Only Bennett runs `supabase db push`, `publish:content` or SQL against the cloud project. Coding agents need his OK in chat, as with live calls.
  > - A migration is pushed before the commit that needs it reaches `main`.
  >
  > Alternative, if Docker is unavailable: a second free Supabase project as the dev environment. [Bennett to choose]

### H7. Retry and resume conflict with transient screenshots, and AD-10's status machine forbids AD-4's "Try again"
- **Location:** AD-4 ("a per-Post error with a manual 'Try again'"); AD-10 Post status (`pending → evaluating → done | failed | refused`); AD-5 (screenshots discarded); Capability map FR-19 ("reopened read-only").
- **Problem:**
  - The status machine has no `failed → evaluating` transition.
  - The browser orchestrates, so closing the tab leaves Posts `evaluating` or `pending` forever.
  - After a reload, or in a reopened Review, the server holds no screenshots and the browser no longer has them. "Try again" on an image-only Post cannot work.
  - Nothing says whether a retry re-runs every call. AD-4 forbids partial persistence, so it must, and it is charged again.
  - Nothing says whether `refused` can be retried.
  - Nothing says what a reopened Review does with unfinished Posts.
- **Fix (AD-10 Post status):**
  > `pending → evaluating → done | failed | refused`, plus `failed → evaluating` on Try again. `refused` is terminal. A row left in `evaluating` longer than `maxDuration` is shown and treated as `failed`.
  >
  > Try again re-sends the whole Post from browser memory and re-runs every call, which is charged again. If the browser no longer holds an image Post's screenshots, Try again asks the user to add them again.
  >
  > A reopened Review is read-only for `done` Posts. Its `pending` and `failed` Posts can be run.

### H8. AD-5 does not say whether surfaces display uploaded screenshots, which PRD §7.2 forbids
- **Location:** AD-5 Prevents ("commenters' names or handles being … displayed") and Rule; PRD §7.2 ("does not store or display the names, handles, or comments of followers or commenters, even when they appear in screenshots"); UX memlog (bulk screenshot intake; real profile entered on video).
- **Problem:**
  - AD-5 covers transcripts and contracts but not the page rendering the screenshot itself.
  - A thumbnail at intake, or beside Evidence, shows the comment section. On Friday that would be a real profile on a recorded video.
- **Fix (add to AD-5, jointly with `bmad-ux`):**
  > Neither surface renders an uploaded screenshot as an image after it is selected. Intake shows each one as a file-name chip, and Evidence from an image is described in words.
  >
  > If Bennett wants thumbnails, record the exception in PRD §7.2.

## Medium

### M1. FR-20 ("never edited") has no enforcement on the file side, and the prompt-set hash is undefined
- **Location:** AD-1 ("A published file is never edited"); SCHEMA `content_sha256` ("canonical file bytes").
- **Problem:**
  - The database trigger guards only the tables. Nothing stops someone editing `witness-rubric@1.json` after the Friday Artifact inlined it, and FR-20 is an [F] requirement.
  - A prompt set is a directory, so "the canonical file bytes" has no single meaning.
- **Fix:**
  > `content/published.lock.json` maps each published id to its hash. `artifact/build.mjs` and `publish:content` add the ids they ship, and `npm run test` fails when a locked id's hash changes.
  >
  > For all three tables, `content_sha256` is the SHA-256 of the canonical JSON of `content` (keys sorted, no whitespace, UTF-8). One function in `scripts/` computes it.

### M2. Multi-row writes are not atomic
- **Location:** AD-8 (insert Review, then append `review_created`); AD-10 (insert the Evaluation); SCHEMA `post` (`status`, `post_transcript`).
- **Problem:** supabase-js has no client-side transactions. A crash between writes leaves states that cannot be explained: an Evaluation whose Post is still `evaluating`, or a Review with no ledger row, which resets the cap.
- **Fix (AD-9 Writes):**
  > Writes that touch several rows are single Postgres functions, called by RPC with the secret key:
  > - `create_review(...)`: the Review, its Posts and the `review_created` row, with the daily-cap check inside the function;
  > - `complete_evaluation(...)`: the Evaluation, `post.post_transcript` and `post.status = 'done'`.

### M3. Child rows can carry a `user_id` or `review_id` that does not match their parent
- **Location:** SCHEMA §2 (`post`, `evaluation`, `outreach_plan`, `profile_summary`); AD-9.
- **Problem:**
  - The server writes with the secret key, which bypasses RLS. A bug that writes the wrong `user_id` on a child row would show that row to another user, because RLS reads filter on the child's own `user_id`.
  - Nothing ties `evaluation.review_id` to `post.review_id`.
- **Fix (SCHEMA):**
  - Add `review: unique (id, user_id)`. Every child row gets an FK `(review_id, user_id) → review(id, user_id)`.
  - Add `post: unique (id, review_id)`, and an FK on `evaluation` `(post_id, review_id) → post(id, review_id)`.

### M4. Cost is priced from `CLAUDE_MODEL`, but another model may answer
- **Location:** Conventions → IDs, time, money ("token usage × the prices beside `CLAUDE_MODEL`"); AD-7 (`fallbacks: "default"`); AD-6 (records "the `model_id` that answered").
- **Problem:**
  - The spine expects a different model may answer, which is why AD-6 records the answering model, yet it prices every call at Opus rates. The ledger would then be wrong, and so would the monthly cap.
  - `fallbacks: "default"` is not among the platform facts verified in the memlog (the version reviewer should confirm it).
- **Fix:**
  > `cost_usd` is computed from the price row for the response's `model` field. `model.ts` holds `PRICES` keyed by model id, and an unknown id is priced at the highest row.
  >
  > Tag the `fallbacks` clause [VERIFY] until it is confirmed.

### M5. Review creation skips the off-switch and monthly-cap checks
- **Location:** AD-8 "At Review creation"; PRD FR-23 ("A global monthly spend cap stops new Reviews when reached").
- **Problem:**
  - While paused or capped, a user can still create Reviews. Each one writes a `review_created` row, which uses up their daily cap, and every Post then fails.
  - Nothing says whether Posts can be added after creation, which would bypass `MAX_POSTS_PER_REVIEW`.
- **Fix:**
  > At Review creation, run checks 1–2 (off-switch, monthly cap) before the daily cap and the Post count. A refused creation writes no ledger row. A Review's Posts are inserted with it and never added later.

### M6. The $30 workspace backstop is unconfirmed but stated as fact
- **Location:** AD-8 Backstop; Deferred → Atomic cap reservation ("The workspace limit is the hard stop"); memlog ("Admin API early access; Console UI to confirm").
- **Fix (AD-8):**
  > Precondition for setting `REVIEWS_ENABLED=true`: Bennett has confirmed the $30 workspace limit in the Console. If workspace limits are unavailable, lower the organisation's monthly limit instead. If neither is possible, promote atomic cap reservation out of Deferred.

### M7. Incident and operations gaps
- **Location:** AD-8 (off-switch); Deferred (backups, observability); Stack (Supabase Free).
- **Problem:**
  - Vercel applies environment-variable changes only to new deployments, so flipping `REVIEWS_ENABLED` does nothing until a redeploy.
  - Supabase Free pauses a project after a week without activity. The Web App is unshared, so it will usually be paused when Bennett wants to demo it.
  - Nothing alerts Bennett when spend approaches a cap.
- **Fix (AD-8 and the Deferred bullet):**
  > - **Off-switch:** pausing means setting `REVIEWS_ENABLED=false` and redeploying the current production deployment.
  > - **Supabase pause:** Bennett restores the project from the dashboard before any demo; no keep-alive is built.
  > - **Alerts:** Anthropic Console spend notifications, if offered, go to Bennett at $15 and $25.

### M8. Auth and session mechanics are unspecified
- **Location:** AD-9 Browser (`@supabase/ssr` cookies; "after the session user is verified"); AD-11.
- **Problem:** Nothing fixes:
  - where cookies are refreshed. Next 16 renames `middleware.ts` to `proxy.ts`, so an agent could write either;
  - how the server verifies the user. `getSession()` does not revalidate the token;
  - how a password is reset when no email is sent;
  - sign-out.
- **Fix (AD-11):**
  > Session cookies are refreshed in `src/proxy.ts` (Next 16's replacement for `middleware.ts`) via `@supabase/ssr`. Server code identifies the user only with `supabase.auth.getUser()` (or `getClaims()`), never `getSession()`. Bennett resets passwords in the dashboard. Sign-out clears the session cookies.

### M9. The testing strategy covers pure code only
- **Location:** Conventions → Check command (`[ASSUMPTION]`).
- **Problem:** The two invariants the database enforces have no tests:
  - FR-20 immutability, enforced by triggers;
  - the privacy guarantee, enforced by RLS and `user_id`.

  The Artifact is not in the check at all.
- **Fix:**
  > Check: `npm run lint && npm run typecheck && npm run test && npm run test:db && node --test artifact/test/ && npm run build`.
  >
  > `test:db` runs `supabase test db` (pgTAP) on the local stack. It covers the three version triggers, `forbid_ledger_change` and `evaluation_rewrite_once`, and RLS per table: own rows only, `anon` sees nothing, and `usage_event` is unreadable.
  >
  > Live prompt evaluations (SM-2 reruns) are outside the check and need Bennett's OK.
  >
  > Drop the `[ASSUMPTION]` tag.

### M10. The Demo Artifact's build and publish path is incomplete
- **Location:** AD-12; Stack (runtime contract 0.2.88); UX memlog (Google Fonts allowed for the Artifact).
- **Problem:** Nothing says:
  - which content versions are inlined;
  - whether `artifact/dist/` is committed;
  - that later publishes must reuse the same URL. A new session would otherwise create a new link and break the one shared with IFI;
  - that the contract is pinned.

  AD-12's "no fetch of any URL" also conflicts with the UX run's Google Fonts loads.
- **Fix (AD-12):**
  > - The Artifact inlines only the latest `<n>` of each content name.
  > - `artifact/dist/` is git-ignored.
  > - The first publish pins `contract: "0.2.88"`. Its URL is recorded in `CLAUDE.md` §2, and every later publish passes that `url`.
  > - **Network:** page code makes no `fetch` or XHR. The only external loads are Google Fonts stylesheets and pinned CDN scripts that the `artifact-design` contract allows.

### M11. AD-2 omits two inputs: `foundation_snapshot` and `video_transcript`
- **Location:** AD-2 ("Images in step 2: step-2 calls receive `post_transcript` and the pasted text"); AD-6 (`foundation_snapshot`); SCHEMA `post.video_transcript`.
- **Problem:**
  - Criterion 10 cannot be scored unless Assess receives the Foundation, and the spine never says it does.
  - Step 2 drops the video transcript, so the Rewrite of a video Post loses its content.
- **Fix (AD-2):**
  > Assess and React receive `pasted_text`, `video_transcript` and images. On an Own-Content Review, Assess also receives `foundation_snapshot` as delimited data. Step-2 calls receive `pasted_text`, `video_transcript` and `post_transcript`, never images.

### M12. Profile Summary: no gate, no trigger, and missing statistics
- **Location:** Capability map FR-14; AD-3 (Profile Summary arithmetic); SCHEMA §4.6.
- **Problem:**
  - Nothing defines a "profile Review" in the data.
  - Nothing says whether the summary is generated automatically or on request.
  - PRD FR-14's example, "7 of 10 posts use unexplained church terms", needs per-Post counts, but `offence_source_counts` is per Criterion and double-counts. The model would have to count for itself, which breaks AD-3.
  - "Strongest" and "weakest" are undefined.
- **Fix:**
  > A profile Review has `review.source_url` set. The Profile Summary is generated [on request / automatically once every Post is in a terminal status (Bennett to choose)] over `done` Posts only, with at least 2.
  >
  > `stats` adds `posts_with_offence_source {claim, tone, jargon}` and `posts_below_3 {criterion: count}`.
  >
  > Strongest and weakest are the highest and lowest mean of non-N/A scores; a tie goes to the lower position.

### M13. Output contracts are not versioned alongside prompt sets
- **Location:** AD-1 (prompts are versioned data in the DB); AD-4 (contracts are Zod in code; "A field not listed here is rejected").
- **Problem:**
  - A `prompts@2` that asks for a new field would be rejected by the strict Zod in deployed code.
  - Retrying a Review pinned to `prompts@1` after a contract change would validate against the wrong shape.
  - Reopened Reviews must still render the old shapes.
- **Fix (AD-4):**
  > Contract changes are additive: new optional fields go at the end, per RULES.md. A breaking change ships with a new `prompts@n`. `contracts.ts` keeps the schema for every prompt set that a saved Review pins.

### M14. The deferred streaming decision would be made inside the Artifact build
- **Location:** Deferred → Within-Post progressive streaming ("Revisit if … in Thursday's Artifact runs").
- **Problem:** The memlog's own mitigation was to render each call as it lands. Under Thursday time pressure, the Artifact builder could adopt it alone, leaving the Web App on per-Post rendering, which AD-10's insert-when-complete rule assumes.
- **Fix (Deferred):**
  > If Thursday's runs exceed 60 s, AD-10 is amended for both surfaces by the planner with Bennett, not inside the Artifact build. Until then, neither surface renders a partial Evaluation.

### M15. FR-10 persona order: the UX decision is not folded in, and the audience keys can go stale
- **Location:** Deferred → Persona order; SCHEMA §3 (`target_audiences[].persona_order`, example key `evangelise-non-believers`); SCHEMA `creator_foundation.target_audiences` ("from the current Persona Version").
- **Problem:**
  - `bmad-ux` approved the rule: each audience has lead Personas; the ranked audiences' leads are concatenated and de-duplicated, then the rest follow in default order. It also approved five audiences, none of them matching the example key.
  - The Foundation stores keys from the *current* Persona Version, while a Review pins its own version.
- **Fix:**
  - Rename `persona_order` to `lead_personas` and use the five UX audience keys.
  - Add to AD-3's list of things computed in code:
    > **Persona display order:** the Foundation's ranked audiences' `lead_personas`, concatenated and de-duplicated, then the remaining Personas in `personas[]` order. It is resolved against the Review's pinned Persona Version, and unknown keys are skipped.
  - Replace the Deferred line with "Resolved by `bmad-ux`".

## Low

- **L1. Error-handling edge cases.**
  - *Location:* AD-4; Conventions → Server error shape.
  - *Problem:*
    - `@anthropic-ai/sdk` retries twice by default, which contradicts "No surface retries automatically".
    - A `max_tokens` stop (thinking is always on) is not mapped to any error code.
    - The Artifact's `sample` errors (`rate_limited`, declined consent) have no codes.
    - Outreach and Profile Summary failures happen per Review, not per Post.
  - *Fix:*
    > - The SDK client uses `maxRetries: 0`.
    > - A `max_tokens` stop reason is `invalid_model_output`, and `max_tokens` per step lives in `model.ts`.
    > - The Artifact maps `sample` errors to `upstream_error` and `rate_limited`; add the latter to the code list.
    > - Review-level output errors show at Review level.

- **L2. Observability: Vercel Hobby keeps runtime logs only briefly.**
  - *Location:* Deferred (observability); SCHEMA `usage_event`.
  - *Fix:* Add `outcome text not null in ('ok','invalid_model_output','refused','upstream_error')` to `usage_event`, so the durable ledger also records failures.

- **L3. Data lifecycle is unstated.**
  - *Location:* AD-9 Deletes; Deferred (backups).
  - *Fix:* Add one bullet:
    > Reviews, including Creators' unpublished drafts, are kept until the User deletes them. Deleting an account means Bennett deletes the auth user, which cascades. `usage_event` keeps only uuids. Supabase Free includes no backups Bennett can restore; `content/` in git rebuilds the version tables, and saved Reviews can be lost.

    (Verify the Free-plan backup terms.)

- **L4. The spine's ERD contradicts SCHEMA.**
  - *Location:* Structural Seed ERD (`REVIEW ||--o{ USAGE_EVENT : "bills"`).
  - *Problem:* The ERD draws an identifying relationship, but `usage_event` has no foreign keys by design. The diagram also omits the `review → evaluation` composite FK.
  - *Fix:* `REVIEW ||..o{ USAGE_EVENT : "logical only, no FK"`, and add `REVIEW ||--o{ EVALUATION : "same versions (composite FK)"`.

- **L5. Mermaid edge labels may not parse.**
  - *Location:* Structural Seed flowchart (`-->|sample(), viewer-paid|` and `-->|supabase db push; npm run publish:content|`).
  - *Problem:* `;` separates statements in Mermaid, and `()` inside an unquoted label is fragile.
  - *Fix:* Quote both labels, for example `-->|"supabase db push, then npm run publish:content"|`.

- **L6. A cross-reference and a companion name are wrong.**
  - *Location:* Paradigm ("`SCHEMA.md` §Evaluation contracts"); frontmatter `companions: [SCHEMA.md]`.
  - *Fix:* Change the reference to "`SCHEMA.md` §4 Model-output contracts". The companion is promoted from `SCHEMA-draft.md`, so note that until promotion.

- **L7. Status tags and rationale.**
  - *Location:* AD-4, AD-7, AD-9 and AD-10 have no `[ADOPTED]` tag. The memlog has no owner decision for AD-4, AD-9, AD-10, AD-7's `CLAUDE_EFFORT = "medium"`, or `fallbacks`.
  - *Problem:* Rationale clauses sit inside Rules:
    - AD-13's oEmbed test evidence;
    - AD-8's "so deleting Reviews never resets either cap";
    - AD-10's "since `sample` already queues";
    - AD-5's "keeping each request under…".
  - *Fix:* Tag those four ADs `[PROPOSED]` and list them for Bennett at the gate. Move the rationale into the memlog.

- **L8. AD-5's wording is ambiguous.**
  - *Location:* AD-5 Prompts ("Post text, transcripts and screenshot instructions sit inside `<post>…</post>`").
  - *Problem:* "Screenshot instructions" reads as if instructions go inside the data delimiters.
  - *Fix:* "Post text and transcripts sit inside `<post>…</post>`. Image blocks follow in the same turn. All instructions come first and declare that text in, or read from, either one is data."

- **L9. The Artifact model switch is ambiguous.**
  - *Location:* AD-7 Demo Artifact ("switch to Sonnet 5.5 (`default`) or Haiku 5.5 (`quick`)").
  - *Problem:* It mixes tier names with model names, and RULES' "one constant" applies to each surface separately.
  - *Fix:* "The switch passes a named model, with the matching `modelTier` as the fallback. `artifact/src/pipeline.js` holds the Artifact's one model constant. The label shows `modelApplied`."

- **L10. Some agent rules are prose only.**
  - *Location:* AD-8 Agent rule; AD-7 ("Every module under `src/server/` imports `server-only`").
  - *Fix:*
    > - No `ANTHROPIC_API_KEY` exists in any local env file; Bennett supplies it inline for an approved run.
    > - An ESLint rule (or a test that scans the files) fails any `src/server/**` module that lacks `import "server-only"`.
    > - ESLint `no-restricted-imports` forbids `@/server/*` in `src/components/**`.

- **L11. Capability map gaps.**
  - *Location:* rows for FR-2, FR-13 and FR-14.
  - *Fix:*
    - FR-2 and FR-13 also live in `artifact/src/`.
    - FR-13 is also governed by AD-8 (Web App) and AD-12 (Artifact).
    - FR-14 is also governed by AD-2.
    - Optionally add NFR rows: latency → AD-10; secrets → AD-7 and AD-9; RLS → AD-9.

- **L12. `talking_points[].criterion` is nullable, but the Glossary ties every Talking Point to a Criterion.**
  - *Location:* SCHEMA §4.5; PRD §3 (Talking Point: "tied to a specific Post and Criterion").
  - *Fix:* Make it required, or amend the Glossary so affirmations may have no Criterion. [Bennett to choose]

- **L13. Draft Checkpoints count toward the daily cap of 3 Reviews.**
  - *Location:* AD-8 daily cap; PRD UJ-2.
  - *Problem:* A Creator checking drafts gets 3 a day in total.
  - *Fix:* Confirm this is intended, or exempt one-Post Draft Checkpoints. [Bennett]

## Suggested order before the Thursday build

1. H1, H2 and H3 bind the Artifact directly.
2. H8, M1, M10 and M11 (the `video_transcript` part) also touch the Artifact.
3. Everything else gates Phase 2 code and can be settled before `ARCHITECTURE.md` and `SCHEMA.md` are promoted.
