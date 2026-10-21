# Input reconciliation: PRD.md → ARCHITECTURE-SPINE.md + SCHEMA-draft.md

- **Date:** 2026-10-21
- **Reviewer:** input-reconciliation subagent. Read-only except for this file.
- **Inputs:** `PRD.md` (final), `ARCHITECTURE-SPINE.md` (draft), `SCHEMA-draft.md` (draft), and `.memlog.md`, whose decisions are settled and are not re-litigated here. For context only: `RULES.md` (Output rules) and the UX run's `DESIGN.md` / `EXPERIENCE.md`, which are still empty stubs.
- **Legend:**
  - **Governed:** an AD, a convention, or a schema contract binds it.
  - **Partial:** the structural part is bound, but a named sub-rule has no home.
  - **Deferred:** explicitly parked, with an owner.
  - **Dropped:** removed by a logged decision.
  - **MISSING:** nothing in the spine or the schema governs it.
  - **N/A:** a policy statement with no build consequence.

## Verdict

**The structure reconciles, but the quiet rules do not.**

What reconciles:
- Every FR appears in the Capability map.
- FR-3 is dropped by a logged live test, which the PRD's own rule allows.
- OQ-5 is fully resolved (AD-5, AD-8, AD-12).
- All 14 Friday [F] requirements can be built inside AD-12's design: one page, the `sample` capability, page memory only, and no network.

What does not:
- The tone and content rules the PRD words most carefully (§7.4, FR-5, FR-6, FR-8, FR-11, FR-12, FR-13, §7.6) have no home in the spine. The only pointer is the convention "Prompt text lives in `content/prompts/`".
- `RULES.md` Output rules carry part of §7.4, but nothing says which prompt file must carry which rule.
- Two architecture choices make PRD rules harder to keep:
  - The Rewrite call receives the Soundness Flag.
  - React receives screenshots with no rule against third-party names.

A Thursday implementer who starts cold would build correct plumbing and generic prompts.

**Counts:** no critical, 4 high, 9 medium and 10 low findings.

---

## 1. Requirement → governance table

| Requirement | Tag | Status | Governed by / gap |
|---|---|---|---|
| FR-1 Add Posts by paste + screenshot (≥10 Posts, text/screens/both, video transcript, model reads screenshot text) | F | Governed | AD-5 (downscale, transient), AD-10 (per-Post work), AD-8 `MAX_POSTS_PER_REVIEW = 10`, SCHEMA `post` (`pasted_text`, `video_transcript`, `image_count`), Assess → `post_transcript`. Minor gap: step-2 inputs do not name `video_transcript` (L7). |
| FR-2 Source URL shown on Evaluation **and Outreach Plan**; never fetched; UI says the tool can't read links | F | Partial | Never-fetched: AD-12, AD-13. Display on the Evaluation: SCHEMA `review.source_url`, `post.source_url`. **Shown in the Ministry Outreach Plan: not governed** (M9). **"Can't read posts from a link" notice: no owner** (M1). |
| FR-3 TikTok oEmbed pre-fill | W2 cond. | **Dropped** | AD-13. Memlog event 2026-10-21 (no caption returned), as the PRD's own FR-3 rule allows. PRD text not yet annotated (L9). |
| FR-4 Score every Criterion 1–5/N/A with Evidence, one-sentence reason, Offence Source when ≤3; claim offence reported but not lowering; C10 N/A on Others'; no cross-version conversion | F | Partial | Evidence, reason and N/A reason: SCHEMA §4.1 + AD-4. C10 forced to N/A: AD-3. No cross-version comparison: AD-6. **Claim offence "reported but does not lower" has no rule, and the contract cannot express it** (H4). |
| FR-5 Say plainly when a Post is fine; score 3 not framed as a problem; does not invent problems | F | Partial | `lands_well` computed in code: AD-3, SCHEMA `evaluation.lands_well`. **No home for "lists no concerns" or "3 not framed as a problem". Step-2 calls are not told the Post lands well** (M2, H1). |
| FR-6 Soundness Flag: names line + why; "prompt for discussion, not a ruling"; never changes scores; rewrite keeps the main message | F | Partial | Shape: SCHEMA §4.1 `{line, why}`. OQ-2 deferred: spine Deferred. **"Never changes scores" is prompt-only, because one Assess call produces both, and nothing says so** (H1). **Rewrite receives the flag** (H2). **"Not a ruling" copy has no owner** (M1). |
| FR-7 Record + display versions | F | Governed | AD-6 provenance label on both surfaces (Artifact uses `modelApplied`, AD-7). |
| FR-8 One Persona Reaction per Persona; Felt Response + 1–3 reasons pointing at the Post; positive possible; Emboldened Believer behavioural; **no motive diagnosis, no "idolatry"/"syncretism" labels** | F | Partial | Count, reasons and valence: SCHEMA §4.2. Behavioural frame: SCHEMA §3 `frame`. Blind to scores: AD-2. **No-motives / no-labels rule has no home** (H1). |
| FR-9 Every reaction labelled simulated | F | Partial | Conventions "Simulated label" covers Reaction cards only. **Persona content also surfaces in Discuss, Profile Summary and Outreach** (M3). |
| FR-10 Persona order by Target Audience (display only) | W2 | Deferred | OQ-6 → bmad-ux. Location fixed in `persona-set@n.json`. Placing it inside the immutable Persona Version is a concern (M8). |
| FR-11 Gentler Rewrite thresholds; on-demand action; keeps main message and convictions; marked suggestion beside original | F | Partial | Thresholds: AD-3. On-demand reuses Rewrite: AD-2. Set-once: SCHEMA trigger. **"Keep message, change manner only" has no home** (H1). **Flag fed to Rewrite** (H2). **"Suggestion" label has no owner** (M1). **"The original" is undefined for screenshot Posts** (H3). |
| FR-12 4–6 Discussion Questions incl. the four standing questions; open; teen-suitable | F | Partial | Count and "exactly 4 `standing`": SCHEMA §4.3. **Which four can't be validated, and the canonical wording has no home** (M4). Open / teen-suitable: prompt, no home (H1). |
| FR-13 Outreach Message + 3–5 Talking Points; affirm first, ≤2–3 concerns, concrete changes; no mockery / verdict / real-persona claim; tool never contacts anyone | F | Partial | Shape: SCHEMA §4.5. Review-level input from validated Evaluations: AD-2. **Content rules have no home** (H1). **"Never contacts anyone" is implicit only** (L2). Talking Point `criterion` nullable vs Glossary (L2). |
| FR-14 Profile Summary | W2 | Governed | AD-3 arithmetic, SCHEMA §4.6. Strongest/weakest rule undefined; single-profile Review not marked (L6). |
| FR-15 Creator Foundation, editable, snapshotted per Review | W2 | Governed | SCHEMA `creator_foundation`; AD-6 `foundation_snapshot`; RLS own-row update. |
| FR-16 Own-Content Review + Draft Checkpoint, incl. Criterion 10 | W2 | Partial | `review.kind`, `is_draft_checkpoint`, `post.is_unpublished`. **Assess's input for Criterion 10 is unstated, and Target Audiences must not reach scoring** (M5). |
| FR-17 "Lands anywhere" reminder | F | Governed (thin) | Capability map: "static UI, both surfaces", with no AD. Copy owner is unclear (M1). |
| FR-18 Private accounts; no teen account | W2 | Governed | AD-9, AD-11 (invite-only; no account for minors), SCHEMA §5 RLS. |
| FR-19 Saved Reviews reopen unchanged with versions | W2 | Governed | AD-6 pins, immutable rows (SCHEMA §1), memlog reopen-only decision. Screenshots are not kept (logged OQ-5 option A). |
| FR-20 Immutable versions | F | Governed | AD-1 + DB trigger (Web App). On the Friday path it is prose-only until the DB exists (L5). |
| FR-21 Maintainer publishes versions | W2 | Governed | AD-1 `publish:content`, "latest = highest n". |
| FR-22 Roadmap tab, Artifact only | F | Governed | AD-12; Capability map. |
| FR-23 Usage caps (daily per account with retry time; monthly global; values in ARCHITECTURE) | W2 | Governed | AD-8 (`retry_at`, `monthly_cap_reached`, values recorded). The monthly check runs before every call, which is stricter than "new Reviews" (L8). |
| OQ-5 Storage + spend | — | Governed | AD-5 (screenshots), AD-8 (caps), AD-12 (Artifact calls on the viewer's usage). |
| §5 Non-goals (scraper, generator, judge, messenger, interview, monitor, analytics, stand-in) | — | Governed by absence | No retrieval (AD-13), no cron, no metrics. "Not a messenger" is not stated for the Web App (L2). "Not a generator / judge" are prompt rules (H1). |
| §6.1 [F] set achievable in the Artifact | F | Governed | All 14 fit AD-12. The Capability map does not mark which FRs the Artifact must build (M7). |
| §6.2 W2 set incl. Criterion 10 | W2 | Governed | AD-3 C10 handling, Own-Content schema. |
| §6.3 Out of scope | — | Governed | No retrieval, no sharing, no video input, no secular-conservative persona. The soundness-correcting rewrite is at risk via H2. |
| §7.1 Platform terms | — | Governed | AD-12, AD-13. |
| §7.2a Public posts open to charitable critique | — | N/A | Policy. |
| §7.2b RULES.md widened | — | Governed | Done: `RULES.md` Data rules cite PRD §7.2. |
| §7.2c No storing or **displaying** follower/commenter names; ignore comment sections | — | Partial | Storage: AD-5 (no image column, no name fields). **Display, React's image input and free-text fields are not covered** (H3). |
| §7.2d No real posts preloaded; samples fictional | F | Governed | AD-12 "Built-in examples". |
| §7.3 Honest simulation; apart from interview data | — | Partial | FR-9 gap (M3). There is no interview data in the product, so the "apart" rule is met by absence. |
| §7.4 Tone: charitable, specific, affirm first, critique Post not person, concrete line + change, no mockery, no theological verdicts | — | **MISSING** | No AD or convention. `RULES.md` Output rules hold part of it, but nothing routes it into prompts (H1). |
| §7.5 Untrusted input | — | Governed | AD-5 delimiters; AD-4 fixed contracts. Derived content and the Creator Foundation are not named as data (L7). |
| §7.6 Bonhoeffer attribution | — | **MISSING** | Nothing anywhere (M1). |
| §8 Latency: single Post ≤ 60 s | — | Partial | Deferred with a "first lever" (lower step-2 effort) that the Artifact's `sample` route does not offer (M6). |
| §8 Latency: 10-Post Review renders as Evaluations complete | — | Governed | AD-10 "Rendering". |
| §8 Secrets | — | Governed | AD-7, AD-12, Conventions "Config". |
| §8 RLS on every table | — | Governed | AD-9, SCHEMA §5. |
| §8 Projector legibility (bound via OQ-6) | — | Deferred (implicit) | The spine's Deferred list names only the FR-10 half of OQ-6 (L4). |
| Glossary terms verbatim | — | Partial | Conventions "Domain naming" lists 16 terms. Drift: `OutreachOutput.message` vs `outreach_message`; the list omits several terms (L3). |
| Avoid: "verdict" | — | Governed | Conventions. |
| Avoid: "cultural artifact" | — | Governed | Conventions ("never 'artifact' for model output"). |
| Avoid: "the non-believer" as one type | — | **MISSING** | Not in the conventions (L3). |
| SM-2 re-run stability | — | Note | The `sample` 5-minute answer cache makes quick Artifact re-runs return identical output (L10). |

---

## 2. Findings

### H1 (high): Tone and content rules have no home; a builder can miss them

**PRD:** §7.4, FR-5, FR-6, FR-8, FR-11, FR-12, FR-13, §5 ("not a content generator", "not a theological judge").

**Problem.**
- These rules can only be enforced through prompt wording.
- The spine says only that prompt text lives in `content/prompts/`. It never says which rule each prompt file must carry.
- `RULES.md` Output rules cover part of §7.4. They do not cover affirm-first, no motive diagnosis, the no-"idolatry" labels rule, "does not invent problems", flag independence, keeping the main message, the standing questions, or the Outreach structure.
- Because Assess returns scores and the Soundness Flag in one call, "the flag never changes Rubric Scores" (FR-6) can only be enforced in `assess.md`. Nothing records that.

**Fix.** Add this AD after AD-13 in `ARCHITECTURE-SPINE.md`:

> ### AD-14: Output guardrails are versioned prompt content that every call carries
>
> - **Binds:** FR-5, FR-6, FR-8, FR-9, FR-11, FR-12, FR-13, FR-14, PRD §5, §7.2, §7.3, §7.4, both surfaces
> - **Prevents:** a prompt that omits a PRD tone or content rule, and the two surfaces' prompts drifting apart.
> - **Rule:**
>   - `content/prompts/prompts@n/guardrails.md` is included in every call (Assess, React, Discuss, Rewrite, Outreach, Profile Summary). It goes after the call's own instructions and before the versioned content, inside the byte-stable cached prefix.
>   - `guardrails.md` carries these rules:
>     - Feedback is charitable and specific (§7.4).
>     - Affirm what is genuinely good before raising concerns.
>     - Critique the Post, never the person.
>     - Point to a concrete line and a concrete change.
>     - No mockery and no theological verdicts.
>     - Ignore comment sections. Write no name or handle other than the poster's (§7.2).
>     - Personas are simulated and are never presented as real people (§7.3).
>     - Never use the word "verdict", and never treat "the non-believer" as a single type.
>   - Each call file also carries its own rules:
>
>     | File | Must carry |
>     |---|---|
>     | `assess.md` | FR-4: N/A only when nothing can be assessed, and say why. Offence from tone or jargon lowers a score; offence from the claim is reported and never lowers it. FR-5: do not invent problems; a 3 is not a problem. FR-6: the Soundness Flag is independent of every score; Criterion 9 scores clarity, not correctness. |
>     | `react.md` | FR-8: speak from the Persona's own experience. Never diagnose the poster's or other outsiders' hidden motives. No labels such as "idolatry" or "syncretism". Point at specific parts of the Post. Give positive Felt Responses when warranted. The Emboldened Believer describes behaviour toward others. |
>     | `discuss.md` | FR-12: the four standing questions in canonical wording, adapted to the Post. Questions are open, not leading, and suitable for a teenage small group led by an adult. FR-5: when `lands_well`, no problem framing. |
>     | `rewrite.md` | FR-11: keep the main message and convictions as posted; change manner, clarity and framing only. Never correct doctrine (§6.3, OQ-2). Never write a new post (§5). |
>     | `outreach.md` | FR-13: open with genuine affirmation of something real. Raise at most the top 2–3 concerns. Propose concrete changes (the Jethro-and-Moses model). No mockery, no theological verdict, and no claim that the Personas are real. The message is written for the Introducer to send themselves. |
>     | `profile-summary.md` | FR-14: quantify patterns only from the supplied stats. Refer to Personas as simulated. |
>   - Each rule is marked in its file with `<!-- rule:<id> -->`, for example `<!-- rule:FR-8-no-motives -->`. `artifact/build.mjs` and a Vitest test over `content/prompts/` both fail when a required marker is missing from any prompt set.

Also add AD-14 to the FR-4/5/6, FR-8/9, FR-11, FR-12 and FR-13 rows of the Capability map. The marker check follows `RULES.md` "Prefer enforcement over prose". It costs one regex per file.

### H2 (high): The Rewrite call receives the Soundness Flag, which invites doctrine-correcting rewrites

**PRD:** FR-6 ("the Gentler Rewrite keeps the main message as posted"), FR-11 Out of Scope ("rewriting a Post's theology"), UJ-1 edge case ("a Soundness Flag, not a corrected rewrite"), §6.3.

**Problem.**
- AD-2 gives Rewrite "both step-1 outputs", and `AssessOutput` contains `soundness_flag`.
- Showing the model a "this line may be unsound" note and then asking it to improve the Post is the most likely way to produce a corrected-theology rewrite.
- The spine's own pattern is to hold a guarantee in code rather than in a prompt (AD-2 step 1 is blind). The same pattern applies here.

**Fix.** In AD-2, replace the Rewrite bullet with:

> - **Rewrite** runs only when AD-3 says so. It receives both step-1 outputs with `soundness_flag` removed by code; it never sees the flag (FR-6, FR-11).

This refines the logged shape-B decision rather than reversing it: Rewrite still sees Assess and React, minus one field. It needs Bennett's OK.

Optionally, and also Bennett's call, apply the same removal to the **Outreach** input. The Outreach Message must carry "no theological verdict", and the PRD frames the flag as a prompt for a leader conversation, not for the poster.

### H3 (high): Third-party names can still be displayed, through React's image input, free-text fields, and rendered screenshots

**PRD:** §7.2 ("does not store **or display** the names, handles, or comments of followers or commenters, even when they appear in screenshots; Evaluations ignore comment sections"), UJ-1 (shared screen).

**Problem.**
- AD-5's transcription rule binds only Assess's `post_transcript`.
- React also receives the images (AD-2), and nothing tells it to ignore comment sections.
- Free-text fields can carry a commenter's handle even though no contract has a name field. Those fields are `evidence` ("describes the screenshot region"), `reason`, and the reaction `reasons`.
- Nothing stops the Evaluation view from rendering the uploaded screenshot, for example as "the original" beside the Gentler Rewrite (FR-11). That would put commenter names on a projector.
- The Artifact keeps screenshots in page memory for the whole Review.

**Fix.** In AD-5, replace the **Assess** bullet with:

> - **Calls that see images (Assess, React):** ignore comment sections, and write no name or handle other than the poster's into any field (`post_transcript`, `evidence`, `reason`, `reasons`). Assess transcribes only the Post's own caption and on-screen text into `post_transcript`.

Add:

> - **Display:** no Evaluation, saved Review, or Ministry Outreach Plan renders an uploaded screenshot. "The original" beside a Gentler Rewrite is `pasted_text`, else `post_transcript`. Whether intake previews a screenshot before submission is bmad-ux's call; if it does, the preview is hidden once the Post is submitted.

### H4 (high): The Offence Source contract cannot report claim offence that did not lower a score

**PRD:** FR-4 ("Offence from tone or jargon lowers the score; offence from the claim itself is reported but does not lower it"), §4.2 description (the tool "names where any offence comes from but does not decide" whether it is the offence of the gospel).

**Problem.**
- `offence_source` is single-valued and required only when `score <= 3`.
- A gentle, clear Post whose claim offends (for example "Jesus is the only way") should score 4–5 with the claim offence reported. The contract has no clear place for it.
- A Post with both tone and claim offence can name only one source.
- The rule itself appears in no spine or prompt location.
- The SCHEMA field contracts are fixed once the Thursday validator is written, so a fix costs least now.

**Fix.** In SCHEMA §4.1, replace the `offence_source` line with:

```jsonc
"offence_sources": ["claim" | "tone" | "jargon"]   // non-empty when score <= 3; may be non-empty at any score.
                                                    // Tone and jargon lower a score; claim is reported and never lowers it (FR-4).
```

Also make these changes:
- In §4.6, derive `offence_source_counts` from the new array. It still counts per source.
- Carry the rule in `assess.md` (H1).

### M1 (medium): Fixed UI copy required by the PRD has no owner, and the UX docs are empty stubs

**PRD:** FR-2 (link notice), FR-6 ("a prompt for discussion with a leader, not a ruling"), FR-9 (simulated label), FR-11 ("marked as a suggestion"), FR-17 (reminder), §7.6 (Bonhoeffer).

**Problem.** These are short, mandatory strings. If the model writes them, one run can omit them. The spine owns only the "Simulated perspective" label. §7.6 appears nowhere, and the FR-17 reminder or the Artifact intro is the natural place the Bonhoeffer line would appear.

**Fix.** Add a row to the Consistency Conventions table:

> | Fixed UI copy | These strings are UI constants on both surfaces, never model output:
> - the "Simulated perspective" label (FR-9);
> - the FR-2 notice that the tool can't read posts from a link and asks for pasted text or screenshots;
> - the note on every Soundness Flag that it is a prompt for discussion with a leader, not a ruling (FR-6);
> - the "Suggestion" label on every Gentler Rewrite (FR-11);
> - the FR-17 "lands anywhere" reminder.
>
> The line "Your life as a Christian should make non-believers question their disbelief in God" appears, if at all, only as "commonly attributed to Bonhoeffer" (PRD §7.6). bmad-ux owns the wording; this spine owns the requirement that each string is present. |

### M2 (medium): "Does not invent problems" is not wired through step 2 or the UI

**PRD:** FR-5, UJ-1 edge case, SM-C1.

**Problem.**
- AD-3 computes `lands_well`, but Discuss and the on-demand Rewrite are never given it.
- A fine Post can therefore get problem-framed Discussion Questions, or a rewrite that presents itself as a fix.
- "Lists no concerns / score 3 not framed as a problem" is a display rule with no home.

**Fix.**
- In AD-2, add to step 2: "Both step-2 calls also receive the code-computed `lands_well` and minimum score (AD-3)."
- In AD-3, add: "**Display when lands well:** the Evaluation says the Post is likely to land well and shows no concerns list. Criteria scored 3 render with their Evidence and no concern styling (FR-5)."

### M3 (medium): The simulated label is scoped to Reaction cards, but Persona content appears elsewhere

**PRD:** FR-9, §7.3 ("labelled simulated **everywhere they appear**"), FR-13.

**Problem.** Persona content also appears in other places:
- Discuss may cite Persona reactions (logged decision).
- The Profile Summary reports which Personas react well or badly.
- Talking Points may cite a Persona.

**Fix.** Replace the Conventions "Simulated label" row with:

> | Simulated label | Every place a Persona speaks or is summarised carries a visible "Simulated perspective" label: Persona Reaction cards, Discussion Questions that cite a Persona, the Profile Summary's Persona rows and narrative, and Talking Points that cite a Persona. The Outreach Message never presents a Persona as a person (FR-9, §7.3, FR-13). |

### M4 (medium): The four standing Discussion Questions can't be validated

**PRD:** FR-12.

**Problem.**
- `standing: true` on exactly 4 items passes even if the model marks the wrong four.
- The canonical wording of the four questions has no home in `content/`.

**Fix.** In SCHEMA §4.3:

```jsonc
{ "questions": [ { "text": "string",
  "standing": "done-differently | bible-says | jesus-responded | jesus-posted | null" } ] }
// 4–6 items; each standing key exactly once; canonical wording lives in content/prompts/prompts@n/discuss.md
```

### M5 (medium): Assess's input for Criterion 10 is unstated, and Target Audiences must not reach scoring

**PRD:** FR-16, Criterion 10, UJ-2 edge case ("still scores witness to non-believers"), FR-10 ("scoring is unchanged"), §7.5.

**Problem.**
- AD-2 does not say that Assess receives the Creator Foundation on an Own-Content Review.
- If a builder passes the whole `foundation_snapshot`, the ranked Target Audiences could skew scores.
- The Foundation is user-written text, so it is untrusted input.

**Fix.** Add to the AD-2 Assess bullet:

> On an Own-Content Review, Assess also receives `foundation_snapshot.self_presentation`, inside the data delimiters (AD-5), for Criterion 10. No model call receives `target_audiences`; they change display order only (FR-10, UJ-2).

### M6 (medium): The latency deferral names a lever the Artifact does not have

**PRD:** §8 (single Post ≤ 60 s).

**Problem.**
- The spine's Deferred note says to revisit after Thursday's Artifact runs, and names "lower step-2 effort" as the first lever.
- The Artifact reaches Claude through `sample`, which exposes `modelTier` and no effort setting (memlog constraint).
- The memlog's mitigation, "render each call's output as it lands", was not adopted.
- Two sequential Opus steps at 5–60 s each, and up to 2 min for long structured prompts, can exceed 60 s on the surface being demoed.

**Fix.** Replace the "Within-Post progressive streaming" Deferred bullet with:

> - **Latency levers (PRD §8, 60 s per Post), measured from submit to the Evaluation on screen.**
>   - **Artifact:**
>     1. Render step-1 output (Rubric Scores and Persona Reactions) once both calls validate, before step 2. The Artifact persists nothing, so AD-10's all-or-nothing insert does not apply there.
>     2. Run Discuss and Rewrite on `modelTier: "default"`.
>   - **Web App:** lower step-2 `CLAUDE_EFFORT`.
>   - Decide on Thursday 2026-10-22 from real runs.

### M7 (medium): The Capability map doesn't show which FRs the Friday Artifact must build

**PRD:** §6.1 (14 [F] requirements, "no cut line"), §10 (one build day).

**Problem.**
- The map mixes both surfaces.
- The FR-13 row points to `outreach_plan` and AD-9, which are Web App-only, so the Artifact's Outreach call is easy to miss.
- Nothing says the Artifact runs Others' Reviews only.

**Fix.**
- Add a **Surface** column to the Capability map, with these values:
  - **F + W2:** FR-1, FR-2, FR-4–FR-9, FR-11–FR-13, FR-17, FR-20.
  - **F only:** FR-22.
  - **W2:** FR-10, FR-14–FR-16, FR-18, FR-19, FR-21, FR-23.
  - **Dropped:** FR-3.
- Add `artifact/src/pipeline.js` to FR-12 and FR-13 "Lives in".
- Add to AD-12:

> - **Scope:** the Demo Artifact implements FR-1, FR-2, FR-4–FR-9, FR-11–FR-13, FR-17, FR-20 and FR-22 (PRD §6.1). It runs Others' Reviews only, so Criterion 10 always shows N/A.

### M8 (medium): FR-10's display order lives inside the immutable Persona Version

**PRD:** FR-10 ("ordering changes display only"), FR-15, FR-20, OQ-6.

**Problem.**
- `target_audiences` / `persona_order` sit inside `persona-set@n.json` (SCHEMA §3, Structural Seed).
- OQ-6 will be resolved by bmad-ux, probably after Friday's `persona-set@1` ships. A display-only ordering change then forces `persona-set@2`.
- That bumps the provenance on every new Evaluation even though no Persona changed, which muddies SM-4 and the UJ-4 version history.
- `creator_foundation.target_audiences` keys are tied to "the current Persona Version", so they go stale whenever a new set renames a key.

This is not a logged decision.

**Fix.** Bennett picks one:
- **(a)** Move the audiences to their own file, `content/audiences/target-audiences@n.json`, holding the audience keys, labels and `persona_order`. It is outside the Evaluation provenance label, and `creator_foundation.target_audiences` references its keys.
- **(b)** Keep the current placement and add to Deferred: "`persona-set@1` ships Friday without `target_audiences`. FR-10 arrives as `persona-set@2`, whose personas are byte-identical to @1."

### M9 (medium): The Source URL in the Ministry Outreach Plan is not governed

**PRD:** FR-2 ("shown on the Evaluation **and in the Ministry Outreach Plan**"), FR-13 / Glossary (Talking Points tied to a specific Post).

**Problem.** The Outreach input is "validated Evaluations". `OutreachOutput` has `post_position` but no Source URL, and nothing says the plan view shows one.

**Fix.** In AD-2, extend the Review-level bullet:

> Outreach receives each Post's `position` and `source_url` and the Review's `source_url`. The plan view shows the Review's Source URL at the top and each Talking Point's Post Source URL beside it (FR-2).

### L1 (low): §7.6 Bonhoeffer attribution

Covered by M1. It is listed separately so the table's MISSING row has a finding. If M1 is not adopted, add the Bonhoeffer sentence from M1 as its own Conventions row.

### L2 (low): "The tool never contacts anyone" is implicit, and Talking Point `criterion` is nullable

**PRD:** FR-13, §5 "Not a messenger", Glossary "Talking Point… tied to a specific Post and Criterion".

**Fix.**
- Add a Conventions row:

  > | No outbound contact | No surface sends anything on a User's behalf. Neither codebase contains any email, DM, comment or social-platform API. The Outreach Message is rendered with a Copy action only (FR-13, PRD §5). |

- In SCHEMA §4.5, either make `criterion` required, or add the comment "null only for an affirmation about the Post as a whole".

### L3 (low): Glossary drift and the third Avoid term

**Problem.**
- The Domain naming convention omits "the non-believer" as a single type.
- `OutreachOutput.message` does not match the Glossary term "Outreach Message" or the column `outreach_message`.

**Fix.**
- Append to Conventions "Domain naming": "Never 'the non-believer' as a single type; say 'non-believers' or name the Persona. Also verbatim: Criterion, Rubric Score, Evidence, Outreach Message, Others' Review, Own-Content Review, Draft Checkpoint, Unpublished Post, Source URL."
- Rename `OutreachOutput.message` to `outreach_message`.
- `evaluation.assessment` is an acceptable internal name.

### L4 (low): The projector legibility half of OQ-6 is missing from the Deferred list

**Fix.** Add to Deferred:

> - **Projector legibility bound (PRD §8, OQ-6):** owned by bmad-ux. It binds both UI layers (`artifact/src/ui.js`, `src/components/`), and the Artifact needs it before Friday's recording.

### L5 (low): FR-20 is prose-only on the Friday path

**Problem.** Until the database trigger exists, nothing stops someone editing `content/rubric/witness-rubric@1.json` after it has shipped.

**Fix.** Add to AD-1:

> `artifact/build.mjs` and `publish:content` both check each `content/` file against `content/versions.lock.json` (id → SHA-256) and fail on a changed hash. A new version adds an entry to the lock file.

### L6 (low): Profile Summary details are undefined

**PRD:** FR-14.

**Fix.**
- Add to AD-3: "**Strongest / weakest Post:** highest / lowest mean of non-N/A scores; ties go to the lower position."
- Decide how a single-profile Review is marked: either "Profile Summary is offered when `review.source_url` is set", or a `review.is_profile` boolean.

### L7 (low): Untrusted-input delimiting doesn't name derived content, and step 2 doesn't name `video_transcript`

**PRD:** §7.5, FR-1.

**Fix.** Replace the AD-5 **Prompts** bullet with:

> All user-derived content sits inside data delimiters after all instructions, and the prompt declares it to be data. That content is:
> - Post text, `video_transcript` and `post_transcript`;
> - step-1 outputs that quote the Post;
> - Evaluations passed to Review-level calls;
> - the Creator Foundation.

In AD-2, change "receive `post_transcript` and the pasted text" to "receive `post_transcript`, `pasted_text` and `video_transcript`".

### L8 (low): The monthly cap can stop a Review partway through

**PRD:** FR-23 ("stops new Reviews").

**Problem.** AD-8 checks the cap before every call, which is stricter than the PRD and acceptable. A Review that is running when the cap is reached will show errors on its remaining Posts.

**Fix.** Add to AD-8:

> Posts still pending when the cap is reached show `monthly_cap_reached` with the same plain message.

### L9 (low): The PRD still describes FR-3 as conditional

**Fix.** This is Bennett's edit, since he owns `PRD.md`. At promotion, annotate FR-3 and §6.2 with: "Dropped 2026-10-21: a live oEmbed test returned no caption (ARCHITECTURE AD-13)."

### L10 (low): SM-2 re-runs on the Artifact are masked by the `sample` answer cache

**PRD:** SM-2 (±1 on re-run).

**Problem.** The `sample` capability caches answers for 5 minutes per viewer (SCHEMA §6). A re-run inside that window returns the same output and looks perfectly stable.

**Fix.** Add to Deferred:

> SM-2 re-runs on the Artifact wait more than 5 minutes between runs. Otherwise, measure SM-2 on the Web App with the live adapter, with Bennett's OK.

---

## 3. Checked and consistent (no action)

- AD-3 thresholds match FR-5 and FR-11 exactly: lands well means no score below 3; auto-rewrite means any score below 3; the on-demand rewrite applies when the Post lands well and the minimum score is 3; there is no rewrite when every score is 4 or above.
- The blind step 1 in AD-2 keeps Persona Reactions out of Rubric Scores (PRD §4.3). Discuss naming score/reaction mismatches is a logged decision.
- FR-7 provenance is shown on both surfaces. AD-6 adds the prompt set and model id beyond the PRD minimum.
- §8 Secrets and RLS, FR-18, FR-19 and FR-23 values are all governed. The OQ-5 parts are resolved by logged decisions.
- AD-12 meets §7.2d: built-in examples are fictional and the Artifact has no persistence.
- Every [F] requirement fits the Artifact design: one page, `sample` with images, page memory, no fetch, and a static Roadmap tab.
- `RULES.md` already carries the §7.2 data-rule widening.
