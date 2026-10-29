---
title: "Sprint Change Proposal: the Web App becomes a companion; Reviews stay in the Artifact"
date: 2026-10-29
status: approved by Bennett 2026-10-30; applied to PRD.md, ARCHITECTURE.md (AD-18 new, AD-8 retired, AD-11 amended to open email sign-up), SCHEMA.md, RULES.md and CLAUDE.md
mode: batch
scope: major (Web App replan; Demo Artifact unchanged)
---

# Sprint Change Proposal: the Web App becomes a companion

## 1. Issue summary

**Trigger.** Bennett wants the Web App to cost him nothing to run: people should evaluate Posts on their own Claude account. On 2026-10-29 that was checked and found impossible as asked: Anthropic only lets Claude.ai sign-in (Free, Pro, Max) work in its own products. A third-party site has to call Claude with an API key, and someone pays per call (Opus 5.5, about $0.25 per Post; AD-8 cost basis). Sources: The Register 2026-02-20; GIGAZINE 2026-02-20; WinBuzzer 2026-02-19.

**Category.** New requirement from the owner (zero running cost), plus a technical limit found during planning.

**Decision (Bennett, 2026-10-29, "option 2").** The Web App handles sign-in, profiles and Saved Reviews. Reviews keep running in the Demo Artifact, which already calls Claude on each viewer's own plan (AD-12). The Web App sends people to the Artifact to run a Review. Follow-up answers the same day:
- **Handoff:** the viewer uploads the file saved from the Artifact (Save Review as file: a `.md` with a JSON appendix, `artifact/src/export.js`) to the Web App. Artifacts cannot send data to another site, because no capability allows outbound calls (checked against the runtime capability list, contract 0.2.92).
- **Profiles:** the Web App and the Artifact each keep their own. The Artifact cannot read the Web App's.
- **Caveat copy (required):** the Web App says plainly that this is temporary, and why.

**Evidence.** The capability list (`artifact`, `assets`, `comments`, `db`, `downloads`, `files`, `mcp`, `room`, `sample`, `self`, `user`) has no network capability. AD-12 already states "Page script makes no fetch or XHR."

## 2. Impact analysis

### Checklist status

| Item | Status | Note |
|---|---|---|
| 1.1 Trigger | [x] | Owner requirement: zero cost; no Claude.ai sign-in for third parties |
| 1.2 Problem | [x] | The Web App design (AD-7, AD-8, AD-10, AD-15) has Bennett paying for every Review |
| 1.3 Evidence | [x] | See §1 |
| 2.x Epics | [N/A] | This project has no epics file. Scope is tracked as PRD requirements plus implementation specs in `_bmad-output/implementation-artifacts/`. No Web App spec exists yet |
| 3.1 PRD | [!] | §3, §4.2, §4.7–§4.10, new §4.13, §6.2–§6.4, §8, §9, §11 |
| 3.2 Architecture | [!] | AD-1, AD-2, AD-3, AD-4, AD-7, AD-8, AD-9, AD-10, AD-12, AD-15, AD-16; new AD-18 |
| 3.3 UX | [!] | `DESIGN.md` is unaffected (the Web App reuses the Artifact's brand). New screens: Run a Review (link and caveat), Add a Review (upload) |
| 3.4 Other | [!] | `SCHEMA.md` gets much smaller. `RULES.md` stack rules lose the SDK. `CLAUDE.md` handover |
| 4 Path | [x] | MVP Review: the Web App's scope is reduced and re-pointed. Nothing built is rolled back, because no Web App code exists |

### What changes, in one view

| Area | Before | After |
|---|---|---|
| Who pays for Claude on the Web App | Bennett (capped at $25 a month) | Nobody: the Web App never calls Claude |
| Where a Review runs | Web App (Claude API) | Demo Artifact only (viewer's Claude plan) |
| How a Review reaches the Web App | Created there | Uploaded as the file saved from the Artifact |
| Web App model code (`src/server/claude/`, `gate/`, `pipeline/`, `usage_event`, caps) | Required | Removed |
| Web App content versions | Version tables filled by `publish:content` | Read from `content/` at build; no version tables |
| Own-Content Review, Draft Checkpoint, Criterion 10 | Web App, week 2 | After the MVP: the Artifact runs Others' Reviews only |
| Profile Summary | Model narrative + code stats per profile Review | Code only, across the user's saved Reviews (as the Artifact does it) |

### Risk the change brings in

- **R-1: who can open the Artifact.** It is shared with the IFI organisation. The `user` capability says people outside the owner's organisation are "absent", and `db` is null without a signed-in viewer. Before the Web App link is shared outside IFI, Bennett must confirm that an outside claude.ai account can open the Artifact, run a Review (`sample`) and Save Review as file (`downloads`). New OQ-7. If outsiders can't, the Web App is IFI-only until the bring-your-own-key version.
- **R-2: hand-edited files.** An uploaded file is untrusted. It is validated on the server exactly like model output (AD-4), and checked against the locked versions, before anything is stored.
- **R-3: date.** The Web App milestone was the week of 2026-10-26. This change shrinks the build (no Claude path, caps or ledger), which partly offsets the slip.

## 3. Recommended approach

**MVP Review (reduce and re-point Web App scope).** Keep the Demo Artifact exactly as it is, apart from one possible copy line (FR-25). Make the Web App a thin companion: sign-in, profile, upload, Saved Reviews, Profile Summary, plus a link to run Reviews in the Artifact.

- **Effort:** lower than the current Web App plan. Roughly half the planned modules disappear.
- **Risk:** low technically. R-1 is the open product risk.
- **Timeline:** contracts today (2026-10-29), then build with `bmad-build` once the setup session reports Node, Supabase `dev` and Vercel ready.

## 4. Detailed change proposals

### 4.1 PRD.md

**P-1. Frontmatter and §0.** `updated: 2026-10-29`. In §0, after "**[W2]** for the week-2 web app;", add: "since 2026-10-29 the Web App is a companion that stores and shows Reviews run in the Demo Artifact (§4.13)".

**P-2. §3 Glossary, Web App.**
- OLD: "**Web App** — the Next.js/Vercel/Supabase prototype for the week of 2026-10-26."
- NEW: "**Web App** — the Next.js/Vercel/Supabase companion site: sign-in, profile, Saved Reviews and Profile Summary. It runs no Reviews: they run in the Demo Artifact on the viewer's own Claude plan and come in as a Review File (§4.13). **Review File** — the `.md` file the Demo Artifact saves through Save Review as file, whose JSON appendix holds the Review's data."

**P-3. §4.2 Rubric table, Criterion 10.** Change the tag "[W2]" to "[after MVP: needs an Own-Content Review, §6.4]".

**P-4. FR-10 Persona order [W2].**
- OLD: "On an Own-Content Review, the Personas most relevant to the Creator's top-ranked Target Audience are shown first."
- NEW: "When the signed-in User's profile role is creator, the Web App shows a saved Review's Personas with those most relevant to their top-ranked Target Audience first, as the Demo Artifact does (§4.11 profile)." The bullet "Ordering changes display only; scoring is unchanged." stays.

**P-5. FR-14 Profile Summary [W2].**
- OLD: "For a Review whose Posts come from one profile, the system produces a Profile Summary:" followed by five bullets.
- NEW: "For a creator, the Web App computes a Profile Summary in code, never by the model, across their Saved Reviews at the current versions: each Criterion's average; which Personas react well or badly; the strongest and weakest Posts; the top 2–3 changes (the Criteria with most concerns). This matches the Demo Artifact's summary (§4.11). The model-written narrative and recurring patterns move to after the MVP (§6.4)."

**P-6. FR-15 Creator Foundation [W2].** Append: "On the Web App this is part of the profile: role (creator, leader or individual), how they want to come across, their theology, tradition and convictions, and the ranked Target Audiences, the same fields as the Demo Artifact's profile. The two profiles are kept separately: the Artifact cannot read the Web App's, so a creator fills in both. The Web App says so on its profile page."

**P-7. FR-16 Own-Content Review and Draft Checkpoint.** Change the tag "[W2]" to "[after MVP]". Add: "Moved 2026-10-29: Reviews run only in the Demo Artifact, which runs Others' Reviews, so Criterion 10 cannot be scored until Reviews run on the Web App (§6.4)."

**P-8. FR-18 Private accounts [W2].**
- OLD: "Running a Review on the Web App requires sign-in."
- NEW: "Adding, viewing and deleting Saved Reviews, and the profile, require sign-in. Running a Review needs no Web App account: it happens in the Demo Artifact."

**P-9. FR-19 Saved Reviews [W2].**
- OLD: "A signed-in User can save a Review and reopen it later, unchanged, with its recorded versions."
- NEW: "A signed-in User saves a Review by uploading its Review File (FR-26), and can reopen it later, unchanged, with its recorded versions, or delete it. A reopened Review is read-only: nothing on the Web App re-runs, rewrites or regenerates it."

**P-10. FR-23 Usage caps.** Replace the body with: "> **Retired 2026-10-29:** the Web App makes no Claude calls, so there is nothing to cap. Each Review runs on the viewer's own Claude plan in the Demo Artifact (§4.13)."

**P-11. FR-21 Maintainer publishes new versions [W2].** Replace the bullet with: "Publishing is a new file in `content/` (AD-1) and a redeploy. The Web App keeps every locked version, so Saved Reviews made with older versions still open."

**P-12. New §4.13 Web App companion [W2] (added 2026-10-29 by Bennett).**

> **Description:** The Web App runs no Reviews. Reviews run in the Demo Artifact on the viewer's own Claude plan, which keeps the demo free for everyone, Bennett included. The Web App is where a signed-in User keeps their profile and their Saved Reviews. Realizes UJ-1, UJ-2, UJ-3.
>
> #### FR-25: Run a Review in the Artifact [W2]
> The Web App's "Run a Review" page links to the Demo Artifact and explains the round trip: run the Review there, choose Save Review as file, then add the file here (FR-26).
> - The page shows this caveat as fixed copy (wording owned by Bennett): "Reviews run in the Living Letter Artifact on your own Claude account, so this demo costs nothing to run. We hope to turn Living Letter into a full web app, but that needs each person to bring their own Anthropic API key, at about $0.25 per Post. Until then, this is how we keep the demo free."
> - The link opens the Artifact in a new tab. The Web App passes nothing to it.
>
> #### FR-26: Add a Review from its Review File [W2]
> A signed-in User can upload a Review File and have it saved as a Saved Review.
> - Only a file the Demo Artifact saved is accepted: its JSON appendix must pass every check the Artifact applies to model output (`SCHEMA.md` §4), and its versions must be locked versions in `content/`.
> - A file that fails is rejected with a plain message, and nothing is saved.
> - A Review File never holds screenshots, only their count (AD-5). Handles other than the poster's are removed before saving (AD-5).
> - Each upload is a new Saved Review; uploading the same file twice gives two.

**P-13. §6.2 Week of 2026-10-26, Web App.**
- OLD: "Live public link on Vercel. Everything in 6.1 except FR-22, plus FR-10, FR-14 to FR-16, FR-18, FR-19, FR-21, FR-23, and Criterion 10. Every week-2 requirement must ship. FR-3 was dropped on 2026-10-21 (AD-13)."
- NEW: "Live link on Vercel, as a companion to the Demo Artifact (changed 2026-10-29 by Bennett): FR-10, FR-14, FR-15, FR-18, FR-19, FR-21, FR-25 and FR-26. A Saved Review shows everything the Artifact produced (FR-4 to FR-9, FR-11 to FR-13, FR-17), read-only. FR-16, FR-23 and Criterion 10 are out (FR-23 retired; FR-16 and Criterion 10 after the MVP). FR-3 was dropped on 2026-10-21 (AD-13)."

**P-14. §6.4 After the MVP, new first bullet.** "**Reviews on the Web App, bring your own key.** Each person pastes their own Anthropic API key, used only in their browser, and pays about $0.25 per Post. That brings back FR-16, Criterion 10 and the model-written Profile Summary narrative. It needs a new architecture decision (AD-7, AD-8 and AD-10 were written for a key Bennett holds)."

**P-15. §8 NFRs.**
- Latency, append: "(Demo Artifact; the Web App runs no Reviews)."
- Secrets, OLD: "the Claude API key and Supabase service-role key stay server-side (Web App); the Demo Artifact holds no keys." NEW: "the Web App holds no Claude key; its Supabase secret key stays server-side. The Demo Artifact holds no keys."

**P-16. §9 SM-3.** OLD: "run real Reviews on the Web App." NEW: "run real Reviews in the Demo Artifact and keep them on the Web App."

**P-17. §10 Milestones.** Add row: "Thu 2026-10-29 | Web App re-scoped to a companion (this proposal); build starts once Node, Supabase `dev` and Vercel are ready."

**P-18. §11 new OQ-7.** "**OQ-7. Who can run a Review.** The Demo Artifact is shared with the IFI organisation. Can a claude.ai account outside it open the Artifact, run a Review and save the file? Owner: Bennett, tested with a non-IFI account before the Web App link is shared outside IFI. If not, the Web App is for IFI colleagues until the bring-your-own-key version (§6.4)."

### 4.2 ARCHITECTURE.md (applied through a `bmad-architecture` update run, keeping AD ids stable)

- **A-1. Frontmatter and Design Paradigm.** The Web App shell does I/O without model access: it validates an uploaded Review File, stores it, and renders it. "Shell: model access" for the Web App becomes "none"; "Shell: orchestration" becomes `src/server/import/`. The flowchart drops `src/server/claude` and `gate + pipeline`, and adds `import`.
- **A-2. New AD-18 — The Web App runs no Reviews; Reviews enter only as Review Files [ADOPTED 2026-10-29].** Binds FR-18, FR-19, FR-25, FR-26, Web App. Prevents: any Web App spend, any Claude SDK or key in the Web App, and unvalidated data reaching the database. Rule:
  - No Web App module imports `@anthropic-ai/sdk` or calls any model. Lint forbids the import anywhere in `src/`.
  - A Review enters only through the upload Server Action. It extracts the last ```` ```json ```` block after `## Raw data (JSON)`, caps the file at 2 MB, parses it, and validates: the appendix shape (SCHEMA §6), versions that are locked ids in `content/published.lock.json`, every `done` Post's Evaluation against the §4 validators of its pinned versions, derived values recomputed in code and matching (AD-3), AD-5 limits, and `screenshot_count` only (no image data). Then `redactHandles`, then one insert.
  - Errors: `invalid_review_file` (fixed copy), `unknown_versions`, `payload_too_large`.
  - FR-25's caveat is fixed UI copy (AD-14), never generated.
  - The Artifact's appendix shape is now a contract between the two surfaces. A change to `export.js`'s appendix is additive only, and the Web App's validator and the conformance vectors change in the same commit.
- **A-3. AD-1.** The Web App reads versions from `content/` at build (imported JSON), not from version tables. `publish:content`, the version tables and their trigger are removed. The lock-hash check stays in the check command.
- **A-4. AD-2, AD-10.** Mark them "Demo Artifact only (the Web App runs no Reviews, AD-18)". Remove the Web App rows: Route Handlers, NDJSON, `record_evaluation`, 2 in flight.
- **A-5. AD-3.** On the Web App, derived values are recomputed only once, at import, to validate. Persona order for a creator follows the Web App profile's ranked audiences (FR-10).
- **A-6. AD-4.** "Both surfaces" stays: the Web App's validator is the gate for uploaded files, not for model output.
- **A-7. AD-7.** The Web App part is retired. AD-7 governs the Artifact only.
- **A-8. AD-8.** Marked **[RETIRED 2026-10-29, superseded by AD-18]**. Kept in place for history, rules struck.
- **A-9. AD-9.** Writes: the upload Server Action, profile save and Review delete. `create_review` and `record_evaluation` are replaced by one insert (no advisory lock, no cap).
- **A-10. AD-11.** Unchanged for now. The setup session is asking Bennett whether to keep invite-only accounts or open email or Google sign-up. That answer amends AD-11 separately.
- **A-11. AD-12.** Add one bullet: "**Handoff to the Web App (AD-18):** Save Review as file is how a Review reaches the Web App. The JSON appendix is a cross-surface contract." Optionally, Results copy that points to the Web App, which needs a republish under the publish rules in `CLAUDE.md`.
- **A-12. AD-15.** Remove `ANTHROPIC_API_KEY`, `CLAUDE_ADAPTER`, `REVIEWS_ENABLED`, the "refuses to start" rule and `publish:content`. Production env: the Supabase secret key, plus the public URL and publishable key, plus `NEXT_PUBLIC_ARTIFACT_URL`.
- **A-13. AD-16.** The Web App runs the conformance vectors for validation, derivation, Persona order, redaction and intake limits, plus new Review File vectors (valid, tampered score, unknown version, extra key, oversize). Rendered-prompt fixtures stay Artifact-only.
- **A-14. Conventions, Stack, Seed, Map.**
  - Remove the error codes `reviews_paused`, `monthly_cap_reached`, `daily_cap_reached`, `invalid_model_output`, `refused` and `upstream_error` from the Web App. Add `invalid_review_file` and `unknown_versions`.
  - Stack: drop `@anthropic-ai/sdk` and the fallback beta header.
  - Structural seed: replace the Claude API node with "Browser uploads Review File". Update the ERD and tree, and the capability map rows for FR-10, FR-14–FR-16, FR-18, FR-19, FR-23, FR-25 and FR-26.
  - Deferred: add "Bring-your-own-key Reviews on the Web App (PRD §6.4)".

### 4.3 SCHEMA.md

- **S-1. Remove** `rubric_version`, `persona_version`, `prompt_set`, `post`, `evaluation`, `outreach_plan`, `profile_summary`, `usage_event` and the SQL functions `create_review` and `record_evaluation`. No migration has been applied, so nothing needs to be undone.
- **S-2. `creator_foundation` → `profile`.** Columns: `user_id` (PK, FK auth.users, cascade), `role` (`creator`|`leader`|`individual`|null), `come_across` and `theology` (text ≤ 2000, nullable), `come_across_at`, `theology_at`, `audiences` (jsonb array of Target Audience keys in rank order, checked against the latest persona set in `content/`) and `updated_at`. This matches the Artifact's `data/users/<id>/profile`.
- **S-3. `review`, new shape.** Columns: `id`, `user_id`, `rubric_version`, `persona_version`, `prompt_set` (text, locked ids), `review_source_url`, `exported_at`, `post_count`, `data` (jsonb: the validated, redacted appendix), `imported_at`. Index `(user_id, imported_at desc)`. Trigger `forbid_update`. Delete allowed.
- **S-4. §5 RLS:** `profile`, `review`: select own. Writes are server-only (AD-9).
- **S-5. §6:** add "**Review File (cross-surface contract, AD-18):** the `export.js` JSON appendix", with its exact shape, which matches the existing `sample-review.json` note. Remove the Anthropic and gate constants and `CLAUDE_ADAPTER`.
- **S-6. §7:** remove "Content is not a migration … publish:content".

### 4.4 Other files

- **RULES.md:** drop the Claude SDK and live-adapter stack rules for the Web App. Keep "never touch prod without Bennett's OK".
- **CLAUDE.md §2:** replace the "Web App rules" bullet (reviews switched off, `CLAUDE_ADAPTER`) with the companion summary, and note the setup session.
- **SKILLS.md:** no change.

## 5. Implementation handoff

**Scope: Major** (Web App replan).

| Step | Who | Deliverable |
|---|---|---|
| 1 | Planner (this session) | Apply P-1 to P-18 to `PRD.md` |
| 2 | Planner, through a `bmad-architecture` update run | A-1 to A-14 and S-1 to S-6; AD ids stay stable; promote to the root files |
| 3 | Planner | `RULES.md` and `CLAUDE.md` handover |
| 4 | Setup session (running) | Node 24, Supabase `dev`, Vercel account, sign-in decision → amends AD-11 |
| 5 | `bmad-build` | Web App MVP to AD-18: scaffold, auth, profile, upload, Saved Reviews, Profile Summary, Run a Review page |
| 6 | Bennett | OQ-7 test with a non-IFI account before sharing the link outside IFI |

**Success criteria**
- A Review run in the live Artifact, saved as a file and uploaded, opens on the Web App identical in content to the Artifact's Results.
- A tampered or foreign file is rejected and nothing is stored.
- The Web App's repo and environment hold no Anthropic key, and `src/` has no `@anthropic-ai/sdk`.
- The caveat copy is on the Run a Review page.
- The check command is green.
