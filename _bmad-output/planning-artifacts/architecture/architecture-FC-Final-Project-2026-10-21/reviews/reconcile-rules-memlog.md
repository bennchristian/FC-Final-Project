# Reconcile review: RULES.md + addendum + memlog → spine + SCHEMA-draft

- **Reviewer:** input-reconciliation subagent (read-only except this file)
- **Date:** 2026-10-21
- **Inputs read in full:** `RULES.md`; `prds/prd-FC-Final-Project-2026-10-21/addendum.md`; `.memlog.md` (lines 8–30, plus the 3 entries appended at 16:22); `ARCHITECTURE-SPINE.md`; `SCHEMA-draft.md`. `PRD.md` was spot-checked for FR-4, FR-13, §7.2–7.5 and §8.
- **Excluded by instruction:** the two memlog entries appended after this review started are deliberate and will be applied with these fixes. They are the UX persona-order/Target Audience `constraint` and the snake_case and Artifact-localStorage `decision`. They are **not** counted as missing. The fix wording below already uses their conventions: snake_case keys, 4 screenshots per Post, and a theme preference allowed in localStorage.

## Verdict

**Mostly reconciled, with no critical gaps.** Every cap value, env var name, model id, threshold, the sign-in method, screenshot handling, the off-switch, and the "agents never make a live Claude call" rule all landed with matching values. The open findings are:

- **2 high:**
  - SCHEMA-draft reverses RULES' contract authority.
  - The memlog scaffold decision is missing.
- **15 medium:** most are memlog constraints that landed only partly, plus RULES rules that need enforcement or extension.
- Several **low** items.

Severity key:
- **critical:** blocks Friday or breaks a safety rule.
- **high:** contradicts a contract or loses a Bennett decision with real damage potential.
- **medium:** a governed gap an implementer will hit.
- **low:** wording, traceability or a nice-to-have.

---

## Task A: memlog → spine/schema

### Verified as landed (no action)

| Memlog entry | Landed in |
|---|---|
| L8 inherited constraints (stack, TS strict, RLS, server-only Claude, versioned data, one model constant, versions on every Evaluation, immutability, no follower/commenter data, Artifact no keys / no real posts) | Stack; AD-1, AD-5, AD-6, AD-7, AD-9, AD-12; SCHEMA §5 |
| L9 FR-3 oEmbed test → dropped | AD-13 |
| L10/L30 versions (next 16.4.2 … vitest 5.0.5, server-only 0.0.1, Node 24.x) | Stack table: all values match |
| L12 Artifact = `sample`, viewer-paid, consent, `{sample:{images:true}}`, network blocked, modelTier fallback | AD-7, AD-12, Stack (contract 0.2.88) |
| L13 Vercel 4.5 MB; publishable/secret keys; SMTP not needed while invite-only | AD-5; Config row; SCHEMA §6; Deferred |
| L15 pipeline shape B (blind step 1; Discuss 4–6 incl. 4 standing; Rewrite on threshold or action) | AD-2; SCHEMA §4.3 |
| L16 thresholds in code (lands-well, auto-rewrite <3, offer at min==3, none at all ≥4; summary math) | AD-3, matching values exactly |
| L18 `claude-opus-5-5` both surfaces; viewer may change model in Artifact; Web App bills Bennett | AD-7, Stack, SCHEMA `review.model_id` |
| L19 Web App unshared; FR-18/FR-23 still ship | AD-8, AD-11, Deferred |
| L21 `content/` layout, new file per version, inlined into Artifact, publish command, DB trigger, provenance label | AD-1, AD-6; SCHEMA §2, §3 |
| L22 Artifact persists nothing | AD-12; SCHEMA §6 |
| L24 OQ-5 option A (screenshots transient, `post_transcript`, `image_count` only, downscale before upload) | AD-5; SCHEMA `post` |
| L25 invite-only email + password, sign-up off, dashboard-created accounts | AD-11; SCHEMA §6 |
| L26 caps: $25 month-to-date, 3/day, 10 Posts, $30 workspace backstop | AD-8; SCHEMA §6, all values match |
| L27 repo-root app, one Supabase project, prod from `main`, no staging | Structural Seed, Stack, Deferred (**except** the scaffold procedure: A1) |
| L28 direction → L29 off-switch (supersedes per-Review approval) | AD-8 (`REVIEWS_ENABLED`, `reviews_paused`, fake adapter, agent rule) |
| L14, L17 (process / event) | Nothing needs to land |

### Findings

**A1 [high] MISSING: scaffold procedure (memlog L27; L13 facts).**
- **What the memlog says:** the app is scaffolded with `create-next-app@16.4.2 --no-agents-md` into a temp directory and then moved in.
- **What the spine says:** nothing. The tool refuses a non-empty directory. Without the flag it writes its own `AGENTS.md`/`CLAUDE.md`, and a naive copy would overwrite the repo's contract files.
- **Fix:** in Consistency Conventions, add a row after "Check command":
  > | Scaffold | `npx create-next-app@16.4.2 <empty-temp-dir> --no-agents-md` (TypeScript, ESLint, Tailwind, App Router, `src/` dir), then move the generated files into the repo root. Never overwrite the repo's `AGENTS.md`, `CLAUDE.md`, `README.md` or `.gitignore`: merge `.gitignore` and keep `.env*` ignored (RULES.md secrets). Add `"typecheck": "tsc --noEmit"` and `"test": "vitest run"` to `package.json`, since the template ships neither. |

**A2 [medium] MISMATCH: latency mitigation (memlog L20 assumption).**
- **What the memlog says:** "render each call's output as it lands (scores, then reactions, then questions/rewrite); effort low on step 2 if needed. Revisit Thursday 2026-10-22."
- **What the spine says:** AD-10 renders per Post, and this exact mitigation is listed under Deferred as "Within-Post progressive streaming". No later memlog entry supersedes L20. The newly appended UX constraint ("sub-steps Scores/Reactions after round 1, Rewrite/Questions after round 2") points the same way as the memlog.
- **Also wrong:**
  - The Deferred lever "lower step-2 effort" does not exist on the Artifact. `sample` exposes `modelTier` only (L12), and the Artifact is the surface tested Thursday.
  - The assumption is not tagged `[ASSUMPTION]` anywhere.
- **Fix, step 1:** in AD-10, replace the Rendering bullet with:
  > **Rendering:** within a Post, each round's validated output renders as it lands: Assess and React after step 1, then Discuss and Rewrite after step 2. The Artifact renders on each `sample()` resolve. The Web App evaluate route returns one NDJSON line per validated call. Across a Review, Posts render as each completes. Persistence stays all-or-nothing per Post.
- **Fix, step 2:** in Deferred, replace the "Within-Post progressive streaming" bullet with:
  > **[ASSUMPTION] A single-Post Evaluation on Opus 5.5 fits the 60 s NFR across two sequential steps.** Revisit Thu 2026-10-22 on real Posts in the Artifact. Levers: on the Web App, `effort: "low"` for step 2; on the Artifact, a lower `modelTier` for step 2, because `sample` has no effort control.
- **Alternative:** if Bennett prefers per-Post rendering, log a superseding memlog decision.

**A3 [medium] MISSING: Vercel Hobby maximum duration of 300 s (memlog L13).**
- **The gap:** one Post makes two sequential Opus calls, and each can take up to about 2 minutes on long structured prompts (L12). The spine sets no `maxDuration`. It also defines no recovery when a function is killed, so the Post stays `evaluating` forever.
- **Fix:** add an AD-10 bullet:
  > **Duration:** the evaluate route handler exports `maxDuration = 300` (the Vercel Hobby maximum). Any failure sets the Post to `failed`. A Post found `evaluating` when its Review is reopened is shown as `failed` with Try again.

**A4 [medium] MISSING: "the tool never reads past Reviews as context for new ones" (memlog L23).**
- **Fix:** add an AD-2 bullet:
  > **No cross-Review context:** a call receives only the current Post (steps 1–2) or the current Review's validated Evaluations (Outreach, Profile Summary). No call ever receives content from another Review. Saved Reviews can only be reopened (FR-19).

**A5 [medium] GAP: the off-switch is not checked at Review creation (memlog L29).**
- **The gap:** AD-8 checks `REVIEWS_ENABLED` only before Claude calls. "At Review creation" checks only the daily and Post caps, then appends `review_created`. While Reviews are paused, a user can therefore still create a Review, spend one of the 3 daily slots, and get back an empty Review whose Posts all fail.
- **Fix:** in AD-8 "At Review creation", prepend:
  > first the off-switch and the monthly cap above (same codes), so a paused app never creates a Review or spends a daily slot; then:

**A6 [low] MISMATCH: "only Bennett sets it in Vercel" (memlog L29).**
- **The gap:** AD-8 says "until Bennett sets it", which does not forbid an agent from setting it.
- **Fix:** in AD-8 step 1, replace the second sentence with:
  > Only Bennett sets it, and only in Vercel. Agents never set or change it in any Vercel environment or through the Vercel CLI. It is unset (false) in every environment by default.

**A7 [medium] MISSING: `sample` constraints that change behaviour (memlog L12).**

- **(a) The 5-minute per-viewer answer cache vs AD-4's manual "Try again".**
  - **The gap:** an identical retry may replay the same invalid answer. The risk is higher on the Artifact, because `sample` enforces no schema.
  - **Fix:** add to AD-4:
    > **Artifact Try again** appends `<attempt n="2"/>` (incrementing) after the `</post>` block so the input differs from the cached request. [ASSUMPTION: the cache is keyed on identical input.]
- **(b) No page-controlled system prompt.**
  - **The gap:** the Prompt assembly convention is silent on this, so the Web App could put instructions in `system` while the Artifact cannot. That would give the two surfaces different prompt behaviour and a different injection posture, which AD-2 exists to prevent.
  - **Fix:** append to the "Prompt assembly" row:
    > Both surfaces send the assembled prompt as one user turn with no system prompt, because `sample` allows none. The Artifact's total input stays ≤ 256 KiB of text.
- **(c) `limits()`, `rate_limited` and `not_granted` [low].**
  - **Fix:** add to AD-12:
    > **Limits:** read `limits()` at load and cap screenshots per Post at `min(4, maxCount)`. `rate_limited` and `not_granted` become the per-Post error with Try again.

**A8 [low] MISMATCH: the workspace spend limit is stated as fact (memlog L13: "Admin API early access; Console UI to confirm").**
- **Fix:** append to AD-8 Backstop:
  > [ASSUMPTION: confirm in the Anthropic Console that a workspace monthly spend limit can be set. Until confirmed, the $25 code cap is the only stop.]

**A9 [low] INTERPRETATION: "3 Reviews per day" (memlog L26) became "rolling 24 hours" in AD-8.**
- **Fix:** tag AD-8's daily-cap bullet with `[ASSUMPTION: "per day" read as a rolling 24 h window; confirm with Bennett]`.

**A10 [low] UNTRACEABLE: values in the spine that no memlog entry records.**
- **Values to record or verify:**
  - **1568 px JPEG downscale (AD-5).** The memlog's verified figure is the 2576 px high-res tier, so 1568 px is a cost and legibility choice that should be logged.
  - **`fallbacks: "default"` (AD-7).** This is not among the Opus 5.5 features the memlog verified. Check it with the `claude-api` skill before writing the live adapter.
  - **`sample()` rather than `sample.json`, "so `modelApplied` is available" (AD-7).** Check this with `artifact-capabilities`.
  - **"Sonnet 5.5 (`default`) or Haiku 5.5 (`quick`)" (AD-7).** The memlog records tiers only, not which model each tier maps to.
- **Fix:** log each value as a memlog decision, or reword the last one in AD-7 as:
  > The viewer may switch `modelTier` to `default` or `quick`. The label shows `modelApplied`.

**A11 [low] MISSING: two memlog details are not carried over.**
- **Fix:**
  - Add Stack row `@types/node | 24.19.2` (L30).
  - Add the cost basis to AD-8: `Estimate basis: ~USD 0.25/Post, ~USD 2.50 per 10-Post Review (memlog)`, so future cap tuning has a reference point.

**Consistent (no action):** memlog L21 says "Web App reads the same files", and AD-1 says the Web App reads only the version tables, which are hash-checked copies of those files. These agree.

---

## Task B: RULES.md → spine/schema

### Verified as governed, with no contradiction

| RULES rule | Governed by |
|---|---|
| Claude only on the server; client never imports the SDK | AD-7: `src/server/claude/` only, `server-only`, ESLint `no-restricted-imports` (enforced) |
| Prompts are data | AD-1, Prompt assembly row ("never in TS or JS strings") |
| Secrets server-only, never in bundles, Artifact or logs | Config row, Logging row, AD-12, SCHEMA §6 |
| RLS on every table, policy in the same migration | SCHEMA §5, §7 (see the B2 exception) |
| Fetching only by permitted means | AD-12 (no network), AD-13 (no URL reads) |
| Prompt injection | AD-5 delimiters (see B8 for gaps) |
| Record versions on every Evaluation | AD-6 + composite FK |
| Version, don't edit | AD-1 + DB trigger (see B5 for the file-level gap) |
| Labelled as simulated | "Simulated label" row (see B14) |
| No theological verdicts | Soundness Flag is a flag only; "Never 'verdict'" naming |
| Check command | Conventions row: the RULES TODO extended with `test`. This is consistent, but RULES.md needs updating at promotion |

### Findings

**B1 [high] CONTRADICTION: SCHEMA authority is reversed.**
- **Where:** SCHEMA-draft line 3 ("Once that migration exists, the migrations are right and this file follows them") and §"Keeping this true" ("the migrations are right… Regenerate the affected section").
- **Why it contradicts:**
  - RULES.md says column contracts in SCHEMA.md are fixed, new fields go at the end, and SCHEMA.md is updated in the same change.
  - AGENTS.md says an implementer never changes contracts (PRD/ARCHITECTURE/SCHEMA) on its own.
  - The draft wording lets a migration silently redefine the contract.
- **Fix, line 3:** replace with:
  > This file is the contract. Every migration that changes a table updates this file in the same change (RULES.md).
- **Fix, "Keeping this true":** replace the body with:
  > This file is the contract (RULES.md; AGENTS.md: implementers never change it on their own). Columns and output-contract fields are fixed: new ones are appended at the end, in the same change as the migration. If a migration and this file disagree, stop and ask Bennett; do not regenerate either side to match.

**B2 [medium] CONTRADICTION: `usage_event` has RLS enabled but no policy.**
- **Where:** AD-9 "`usage_event`: has RLS enabled and no policies", and the SCHEMA §5 row of dashes.
- **Why it contradicts:** RULES requires "an explicit policy in the migration that creates it". The intent, deny-all, is right; the wording breaks the rule.
- **Fix, AD-9:** change the bullet to:
  > **`usage_event`:** RLS enabled, with one explicit restrictive deny-all policy for `anon` and `authenticated`. Only the secret key reads or writes it.
- **Fix, SCHEMA §5:** under the table, add:
  > `create policy usage_event_no_client_access on public.usage_event as restrictive for all to anon, authenticated using (false) with check (false);`

  Then set the table row to `deny-all (restrictive)` in every column.

**B3 [medium] MISMATCH: "Model IDs live in one constant".**
- **The gap:** AD-7 fixes `CLAUDE_MODEL` for the Web App, but nothing says where the Artifact's `claude-opus-5-5` lives. As written, the repo ends up with two hand-typed model ids.
- **Fix:** add to AD-7:
  > The model id has one source, `config/model.json` (`{ "id": "claude-opus-5-5" }`). `src/server/claude/model.ts` imports it as `CLAUDE_MODEL`, and `artifact/build.mjs` inlines it as the Artifact default. No other file names a model id.
- **Alternative:** Bennett amends RULES to say "one constant per surface".

**B4 [medium] MISSING: third-party data can still be stored or displayed (RULES data rule; PRD §7.2).**
- **The gap:** AD-5 covers only `post_transcript` and contract field names. Two paths remain:
  1. `post.pasted_text` stores whatever the user pasted, including comments if the user pastes them.
  2. Free-text output fields can quote commenters: `evidence`, `reason`, `reasons`, `talking_points[].text` and `narrative`.
- **Fix:** add two AD-5 bullets:
  > **Pasted text:** intake labels say to paste the Post's own caption, on-screen text or transcript, not comments. Pasted text is stored as given, so this label is the only guard on that field (residual risk, accepted).
  >
  > **Every prompt**, not only Assess, says: ignore comment sections; never quote, name or describe a commenter or follower. This covers the free-text fields, which no schema can police.

**B5 [medium] MISSING (prefer enforcement): content files can still be edited.**
- **The gap:**
  - AD-1 makes the *tables* immutable by trigger, but `content/` is the source of truth and nothing stops an edit to `persona-set@1.json`.
  - "Published" is undefined for the Artifact, which inlines files before any `publish:content` runs.
- **Fix, AD-1:** add:
  > A file is published once it is merged to `main` or inlined into a published Artifact build, whichever comes first. `npm run check:content` fails if any existing `content/**/<name>@<n>` file is modified or deleted relative to `origin/main` (`git diff --diff-filter=MD`).
- **Fix, Check command row:** add `npm run check:content` to the command.

**B6 [medium] MISSING: the check command does not cover the Friday deliverable.**
- **The gap:**
  - `test` covers only `src/domain/` and `src/server/caps/`. The Artifact's `core.js`, which holds AD-3 thresholds and the AD-4 validator, is plain JS outside lint, typecheck and test, contrary to RULES' TS-strict intent.
  - Two hand-written threshold implementations with no shared test can disagree, which is exactly what AD-3 "Prevents".
- **Fix, Check command row:** replace with:
  > `npm run lint && npm run typecheck && npm run test && npm run build && npm run build:artifact`. `artifact/src/*.js` start with `// @ts-check` and are in `tsconfig` via `checkJs`. Threshold and validator cases live once as data in `test/vectors/*.json`, and Vitest runs them against both `src/domain/` and `artifact/src/core.js`. [ASSUMPTION]

**B7 [medium] MISSING: agents writing to the production database.**
- **The gap:**
  - There is one Supabase project and no staging (L27), and the spine never says which database dev and tests use.
  - `supabase db push` and `npm run publish:content` write to production. RULES says nothing is pushed unless Bennett asks.
- **Fix:** add to AD-8's agent rule, or as a new conventions row "Database environments":
  > The one hosted Supabase project is production. Agents run `supabase db push` and `npm run publish:content` against it only when Bennett asks. Local dev and tests use the local stack (`supabase start`) [ASSUMPTION: Docker available; otherwise Bennett decides whether dev may write to the hosted project].

**B8 [low] MISSING: some injection paths are not delimited.**
- **The gaps:**
  - AD-5 delimits Post text, but later calls also receive model-derived text that quotes the Post verbatim: `evidence`, reactions, and Evaluations sent to Outreach and Profile Summary.
  - "screenshot instructions" is unclear wording.
- **Fix:** replace the AD-5 "Prompts" bullet with:
  > **Prompts:** Post text, pasted transcripts and screenshots (image blocks between the `<post>` and `</post>` text blocks) come after all instructions, and the prompt declares delimited content to be data. Model-derived text passed to later calls goes inside `<assessment>`, `<reactions>` or `<evaluations>` delimiters and is declared data too.

**B9 [low]:** the rule that `.env*` stays in `.gitignore` is folded into the A1 fix.

**B10 [low] SQL error: SCHEMA §5 says "in both `using` and `with check`" for every policy.**
- **The problem:** Postgres rejects `WITH CHECK` on SELECT and DELETE policies.
- **Fix:** replace the wording with:
  > in `using` for select, update and delete, and in `with check` for insert and update

**B11 [low] Prefer enforcement: "no `any` at module boundaries" is still a prose rule.**
- **Fix:** add to the conventions:
  > ESLint `@typescript-eslint/no-explicit-any: error` in `src/`

**B12 [low] MISSING: RULES says to load `artifact-capabilities` before adding runtime behaviour.**
- **Fix:** add to AD-12:
  > Load `artifact-capabilities` before writing any `sample()` code, and `artifact-design` before the page (RULES.md).

**B13 [low] MISSING: append-only output contracts for stored jsonb.**
- **The gap:** saved Evaluations keep the shape of the prompt set that produced them.
- **Fix:** add to the SCHEMA §4 intro:
  > Output contracts are append-only: a new field goes at the end and is optional, because saved Evaluations from earlier prompt sets lack it. No field is renamed, retyped or removed.

**B14 [low] The simulated label's scope is too narrow.**
- **Fix:** change the "Simulated label" row to:
  > A visible "Simulated perspective" label wherever Persona content appears: Persona Reactions, Discussion Questions that cite a reaction, Profile Summary persona tallies, and Outreach Talking Points (FR-9, PRD §7.3).

**B15 [low] RULES.md wording to update at promotion (Bennett's file, not the spine):**
- "service-role key" becomes `SUPABASE_SECRET_KEY` (`sb_secret_`).
- The server-only Claude rule should name the Artifact's `sample()` as its sanctioned exception.
- The model and check-command TODOs are now resolved.

---

## Task C: addendum → spine/schema

### Verified as landed (no action)

- **§A input routes:** Instagram APIs, oEmbed and scraping are rejected; TikTok oEmbed was tested and dropped (AD-13). The Artifact has no network and calls Claude only through `sample` with text and dropped images (AD-12).
- **§A Source URL:** kept for display only (AD-12, AD-13; SCHEMA `source_url`).
- **§C scoring model:** scores come straight from the Post, and reactions never feed them (AD-2 blind step 1, AD-3). The scale is 1–5 + N/A (SCHEMA §3), and the `offence_source` field exists (SCHEMA §4.1).
- **§B "simulated" labels:** see the conventions row.

### Findings

**C1 [medium] MISSING: the Jethro-to-Moses tone model (§D; FR-13) and "critique forms, not convictions".**
- **The gap:**
  - Nothing in the spine or the contracts carries the tone model.
  - `OutreachOutput` has no field for the concrete change that FR-13, RULES ("a concrete change it could make") and §D ("offer one concrete idea") require.
  - `talking_points[].criterion` is nullable, but the PRD Glossary says each Talking Point is "tied to a specific Post and Criterion".
- **Fix, conventions:** add a row:
  > | Feedback tone | Every feedback prompt (assess, rewrite, discuss, outreach) critiques forms, not convictions (PRD §7.4). `outreach.md` follows the Jethro-to-Moses model (addendum §D; FR-13): ask first, treat the poster as a person, open with genuine affirmation of something real, raise at most the top 2–3 concerns, say why each matters, and offer one concrete change for each. |
- **Fix, SCHEMA §4.5:** change the talking point to
  `{ "post_position": 1, "criterion": "outsider_clarity", "kind": "affirmation | concern", "text": "string", "change": "string | null" }`
  with these rules:
  - `criterion` is required.
  - `change` is required when `kind = concern`.
  - AD-4 rejects more than 3 `concern` items.

**C2 [medium] MISSING: claim offence is reported but not penalised (§C; FR-4).**
- **The gap:**
  - No rule governs it. The contract ties `offence_source` to a low score, so a model that lowers a score for a gospel claim passes validation and triggers auto-Rewrite. That penalises exactly what §C says must not be penalised.
  - Claim offence on a 4–5 is never *required* to be reported.
- **Fix, AD-3:** add a bullet:
  > **Offence Source:** `claim` offence is reported but never lowers a score (FR-4). AD-4 validation rejects a score below 3 whose only Offence Source is `claim`.
- **Fix, SCHEMA §4.1:** change the `offence_source` comment to:
  > required when score <= 3; allowed on any score, so claim offence on a 4–5 is still reported; `claim` alone never justifies a score below 3
- **Optional:** make it an array, `offence_sources`, since the PRD Glossary says "where *any* offence comes from".

**C3 [medium] MISSING: Claude's own fetch and search tools are not excluded (§A row "Claude web fetch tool").**
- **The gap:** AD-13 says "No surface fetches a Source URL", but a server tool on a model call is not a "surface".
- **Fix:** add to AD-13:
  > No model call enables a Claude server tool (`web_fetch`, `web_search`) or any tool that can read a URL, and the Source URL is never sent to the model (addendum §A: Claude's fetcher obeys robots.txt, runs no JavaScript and would breach platform terms).

**C4 [low] IMPLICIT: video arrives via transcript (§A "Video").**
- **The gap:** this is implied only by SCHEMA `video_transcript`.
- **Fix:** add to AD-5:
  > **Video:** no surface accepts video or audio files. A video Post is a pasted transcript plus optional screenshots (FR-1). The Artifact intake has a transcript field.

**C5 [low] MISSING from Deferred: the §D candidates.**
- **Fix:** add to Deferred:
  > **Richer outreach and summary lenses** (addendum §D): the design-thinking outreach shape (Empathise → Define → Ideate → Prototype → Test by re-scoring), and Keller's four postures plus the attractional pattern as Profile Summary lenses. These are candidates only; they enter as a new prompt set (`prompts@n`), not as code.

**C6 [low] MISMATCH: the persona card is missing two elements from §B.**
- **The gap:** SCHEMA §3 `card` omits "narratives" and "a named sub-culture".
- **Fix:** change the `card` description to:
  > markdown: background, named sub-culture, cultural touchpoints, narratives, longings, reasons for their views

---

## Resolved / unresolved ledger

All items are **unresolved**. This review edits nothing except this file.

| Severity | Items |
|---|---|
| High | A1, B1 |
| Medium | A2, A3, A4, A5, A7a/b, B2, B3, B4, B5, B6, B7, C1, C2, C3 |
| Low | A6, A7c, A8, A9, A10, A11, B8, B9, B10, B11, B12, B13, B14, B15, C4, C5, C6 |
