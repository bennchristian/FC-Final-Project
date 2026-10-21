# PRD Quality Review — Witness Review (prd-FC-Final-Project-2026-10-21)

Reviewed: `prd.md` and `addendum.md` (2026-10-21). Calibrated to internal-tool rigor for a course final (Demo Artifact video Fri 2026-10-23; Web App the week of 2026-10-26), chain-top for `bmad-architecture`, `bmad-ux` and `bmad-create-epics-and-stories`.

## Overall verdict

Adequate, close to strong. The thesis is real and specific, decisions are stated as decisions, the Non-Goals do real work, and the [F]/[W2] tags in §4 match §6.1 and §6.2 exactly. What is at risk: the Friday build has no cut line for 14 [F] FRs and one build day, FR-5 and FR-11 contradict each other on the core Evaluation, and several rules that stories and prompts must encode (N/A conditions, the gospel-offence carve-out, the Felt Response vocabulary, what a "profile" is) live in prose, the addendum, or nowhere.

## Decision-readiness — adequate

The PRD makes its calls plainly. Scoring is separated from Persona Reactions, with the reason given in §4.3 ("so a mis-drawn Persona cannot skew the numbers") and the rejected alternative recorded in addendum C. The persona set's lean is "deliberately one-sided". Retrieval is limited to one conditional route with a clear go/no-go test in FR-3 ("Ships only if a live test on a real public video returns the caption; otherwise dropped without replacement"). Soundness is limited to a flag. The Open Questions are genuinely open, and each has an owner and a point at which to revisit it.

The gaps are where the PRD meets the calendar and the camera. Nothing says what gives if Thursday runs short. The one FR whose standard is deferred still ships on Friday. The recorded video's handling of real people's posts goes unaddressed. The PRD has no `[NOTE FOR PM]` callouts, even though each of these is a live tension.

### Findings
- **[high]** No cut line for the Friday build (§6.1, §10) — §6.1 puts 14 FRs in the Demo Artifact. §10 gives them one build day ("Thu 2026-10-22 | Demo Artifact built.") and spends Friday morning on "Nail down the tool's flow end to end". FR-3 is the only FR with a declared drop rule. If Thursday overruns, nothing says which [F] FRs are must-show for the video and which go first. The Web App has the same gap: 8 FRs plus auth and RLS in a week, with no order. *Fix:* Split §6.1 into must-show (likely FR-1, FR-2, FR-4, FR-5, FR-7, FR-8, FR-9, FR-11) and cut-first (for example FR-6, FR-12, FR-13, FR-17, FR-20, FR-22, in a stated order). Add a one-line cut order to §6.2.
- **[medium]** The Soundness Flag ships Friday without a working standard (FR-6, §5, OQ-2) — FR-6 "can attach a Soundness Flag when a Post's main message may not be theologically sound", while "The standard for soundness is deferred". On Friday the model's unstated theology therefore decides when the flag fires, on real posts, in a recorded video. That sits awkwardly with §5's "Not a theological judge". OQ-2 records the question but not its consequence for Friday. *Fix:* Either give FR-6 a narrow interim trigger that Bennett names (for example, only when the main message contradicts a stated creedal baseline), or move FR-6 to the cut-first list.
- **[medium]** The recorded video's treatment of real posters is undecided (§7.2, §6.1, FR-2, FR-13) — §7.2 keeps real posts out of the *published Artifact* and strips followers and commenters. But "Example posts are entered during the recording". The poster's Source URL is displayed (FR-2), and a Ministry Outreach Plan is addressed to them (FR-13). That video goes to the cohort, the instructors, and probably IFI colleagues. The obvious objection, critiquing a named individual's Instagram on video without asking, is neither acknowledged nor answered. *Fix:* Add one decision to §7.2: fictional posts, consenting posters, blurred handles and URLs in the recording, or explicit acceptance with the reasoning.
- **[low]** The one-sided persona lean names no cost (§4.3, addendum B) — "The set's political lean is deliberately one-sided (no secular-conservative persona)" is stated, but nothing says what it gives up. A left-coded post that would alienate a conservative-leaning non-believer draws no Persona pushback, and FR-14's "which Personas consistently react well or badly" will skew. The memlog's confirmed decision that Kingdom over Party applies to left- and right-coded posts alike did not make it into the PRD. *Fix:* Add one sentence to §4.3 naming the gap and stating that Criterion 5 scores both directions.

## Substance over theater — strong

Nothing here is furniture. The Vision could not be swapped into another PRD: it names specific failure modes ("thick with church vocabulary", "fused with partisan politics", "echo chambers of agreement") and puts the uses in a stated order. Each of the four journey protagonists drives requirements:
- Emily drives FR-12 and the shared-screen NFR.
- Esther drives FR-10, FR-15, FR-16 and Criterion 10.
- The Introducer drives FR-13.
- Bennett drives FR-21.

The seven product Personas are a feature, not decoration, and each comes from the axes in addendum B. The NFRs are product-specific, and the latency NFR has a number. The addendum's "no direct competitor found" is an honest comparables note, not an innovation claim. The one soft spot is that two §8 bullets restate `RULES.md`; that is covered under Downstream usability.

## Strategic coherence — adequate

The PRD has a thesis. Posts meant to reach outsiders land only with insiders, and showing how they land changes how people post. The first use is formation and the second is a mirror. The Friday scope follows that thesis: the whole per-Post Evaluation pipeline (FR-4 to FR-12) is [F], and accounts and the Creator Foundation wait. The scope is a problem-solving experience demo, and its logic matches. Counter-metrics exist, which many PRDs omit.

The weak link is §9. The metrics check that the cohort understood the demo, that scores repeat, and that people used the tool. None of them checks the thesis that seeing the landing changes how someone posts or thinks. The repeatability metric also uses a tolerance wider than the thresholds the product acts on.

### Findings
- **[medium]** The metrics don't test the thesis, and three lack a bar (§9 SM-1, SM-3, SM-4) — SM-1 asks whether the cohort "can describe what the tool does and see why it is needed", with no threshold. SM-3 ("run real Reviews on the Web App") measures activity. Its confirmed "≥ 3 people" threshold (§12) is missing from the text. SM-4 has no count. No metric asks whether anyone would change a post. *Fix:* Restate SM-3 as "≥ 3 people Bennett knows run a Review on real posts and each name at least one change they would make". Give SM-1 a bar, for example a majority of feedback restating the purpose unprompted. Give SM-4 a minimum number of interviews.
- **[medium]** SM-2's tolerance is wider than the decision thresholds (§9 SM-2, FR-5, FR-11) — SM-2 requires "each Rubric Score within ±1 point". On a 1–5 scale, a Criterion scoring 3 on one run and 2 on the next flips the Post across FR-5's "fine" line. Scoring 4, then 3, flips whether FR-11 offers a rewrite. SM-2 can pass while what the user sees changes from run to run. It also has no protocol: how many Posts, how many reruns, or when it is run. "Objective" in the title is really repeatability. *Fix:* Add an outcome-level target, for example "FR-5 status and FR-11 rewrite presence identical across 3 reruns on ≥ 5 Posts". Schedule it in §10 (Thursday, before recording). Retitle it "Repeatable, evidence-based scoring".
- **[low]** The video's storyline is not the Vision's first use (§1, §6.1) — the Vision says "The first use is formation". §6.1's video shows "Posts from a profile going in", which is UJ-3's shape, and the profile roll-up (FR-14) is [W2]. SM-1 depends on the cohort understanding the story the video tells. *Fix:* Name in §6.1 which UJ the video walks through and which output closes it (for example FR-13), and put the profile roll-up on the Roadmap tab.
- **[low]** Counter-metric pairings don't match (§9 SM-C1, SM-C2) — SM-C2 "Agreement with Bennett" claims to counterbalance SM-1, but SM-1 measures cohort comprehension, not rubric fidelity. SM-C1 "Problems found" pairs more naturally with FR-5 than with SM-2's repeatability. *Fix:* Re-pair them, for example SM-C2 with SM-2 and SM-C1 with FR-5, or drop the "Counterbalances" clauses.

## Done-ness clarity — adequate

Most FRs have numeric, checkable consequences:
- at least 10 Posts (FR-1)
- 1–5 or N/A, with a one-sentence reason (FR-4)
- 1–3 reasons per reaction (FR-8)
- 4–6 questions, four of them standing (FR-12)
- 3–5 Talking Points and at most 2–3 concerns (FR-13)
- 60 s per Post (§8)

FR-3's go/no-go gate is a model for the rest. The weaknesses cluster in the decision logic of the core Evaluation: thresholds, N/A, and Felt Response. That logic is exactly what stories and prompts must encode, and three of the four affected FRs are [F]. Several smaller clauses rest on adjectives: "manufactured problems", "when warranted", "most relevant", "legible", "suitable for a teenage small group".

### Findings
- **[high]** FR-5 and FR-11 contradict when a Post's lowest score is 3, and FR-5 is not testable as written (FR-5, FR-11) — FR-5 calls a Post fine "When no Criterion scores below 3". FR-11 produces a rewrite "for each Post where any Criterion scores below 4", but its third bullet says "A Post judged to land well (FR-5) gets no rewrite, or an optional one on request". A Post whose lowest score is 3 meets both rules, so no acceptance test can be written. "On request" implies a control that no FR specifies. FR-5's "does not list manufactured problems" can't be checked: does a fine Post still show its scores, its reasons, and an "offended" reaction from the Progressive? *Fix:* Choose one rule, either "rewrite when any Criterion < 4 and FR-5 does not apply" or raise FR-5 to "no Criterion below 4". Specify or drop the on-request rewrite. Rewrite FR-5 as display behaviour: "leads with a 'likely to land well' statement; scores, reasons and Persona Reactions still display".
- **[medium]** N/A is unbounded (Glossary *Rubric Score*, §4.2 table, FR-4) — the Glossary allows N/A "when the Criterion does not apply" for any Criterion, but only Criteria 5 and 10 state when they don't apply. FR-5 counts only scored Criteria, so an Evaluation that marks weak Criteria N/A reads as "fine", and no test can tell a legitimate N/A from an evasion. *Fix:* State that only Criteria 5 and 10 may be N/A, or list an N/A condition per Criterion. Require a one-sentence reason for every N/A.
- **[medium]** Felt Response is an open list, and it doesn't fit the seventh Persona (Glossary *Felt Response*, FR-8, FR-14) — the Glossary gives examples ("e.g. convicted, encouraged…"). FR-8 requires that "Each reaction names a Felt Response", which is an emotional landing. Yet "The Emboldened Believer's reaction describes how the post might shape a Christian's behaviour toward others". FR-14's "react well or badly" needs a polarity for every value. The negative examples were a memlog assumption that never reached §12. *Fix:* Make Felt Response a closed, polarity-tagged list, add the Emboldened Believer's values (for example "emboldened to be harsh" or "prompted to gentleness"), and record the list as confirmed.
- **[medium]** Projector legibility has no bound (§8 "Readability on a shared screen") — "legible on a projector or TV for a small group" is an adjective. One Evaluation holds 10 scores with quotes and reasons, 7 reactions with up to 3 reasons each, a rewrite, and 4–6 questions. `bmad-ux` needs a bound to design against. *Fix:* Add a measurable bound, such as a minimum body size at 1080p viewed from about 4 m, or one section per screen in a presentation view. Alternatively, state that UJ-1 presents one section at a time.
- **[low]** FR-10 has no Target Audience → Persona mapping (FR-10, UJ-2 edge case, Glossary *Target Audience*) — Target Audiences are an open "e.g." list, and "most relevant to the Creator's top-ranked Target Audience" is undefined. UJ-2 states a different rule: "the personas most likely to be affected first". *Fix:* Close the Target Audience list to 2–4 values and add a small ordering table for each. Pick one of the two rules.
- **[low]** FR-12 runs on every Evaluation, but it is written for one audience (FR-12, Glossary *Evaluation*) — the questions are "suitable for a teenage small group led by an adult", yet the Glossary includes them in every Evaluation, so Esther's Draft Checkpoints and an Introducer's Review get them too. That adds latency to every Post. *Fix:* Scope FR-12 to Others' Reviews, or make it available on request.

## Scope honesty — adequate

§5 does real work. Each of its eight Non-Goals closes a door the brief left open: scraper, messenger, interview tool, monitor, theological judge. §6.3 is explicit, OQ-1 to OQ-4 have owners, and all drafting assumptions were confirmed. Open-items density is low (4 OQs, 0 open assumptions, 0 `[NOTE FOR PM]`), which suits a green-light PRD. It is slightly too clean, though: the three gaps below are decisions made by omission rather than stated.

### Findings
- **[medium]** Whether a Web App Review needs sign-in is unstated, and there is no cost guard (§6.2, FR-18, FR-19, §8) — FR-18 says Users "can sign in", and FR-19's "A signed-in User can save a Review" implies anonymous users can run Reviews. A "Live public link on Vercel" that calls the Claude API on Bennett's key has no rate or spend limit in §8. This is an architecture decision as well as a scope one. *Fix:* State "sign-in required to run a Review on the Web App", or add an NFR with a per-user or per-IP daily cap.
- **[medium]** Saved Reviews conflict with the privacy rule on screenshots (FR-19, FR-4, §7.2) — §7.2 says the tool "does not store … the names, handles, or comments of followers or commenters, even when they appear in screenshots". FR-19 reopens a Review "unchanged", and FR-4 Evidence can "describe the screenshot region". Saving screenshots stores commenters' handles, and not saving them changes what a reopened Review shows. Redaction would be a feature in its own right. *Fix:* Decide for W2, for example "store extracted Post text and Evaluations, not images", and note what a reopened Review shows in place of the screenshot.
- **[medium]** The PRD overrides a `RULES.md` rule without saying so (§7.2, `RULES.md` Data rules) — `RULES.md` says "No personal data about third parties. Evaluate the ministry's own posts." The PRD makes Others' Reviews of individuals the primary mode: "Public Posts by individuals are treated like ministry Posts". `AGENTS.md` puts the `RULES.md` block into every implementer brief, so implementers will be given a rule the PRD overturns. The memlog flags this, but the PRD does not. *Fix:* Add a line to §7.2 naming the superseded rule, and update `RULES.md` in the same change that promotes the PRD.

## Downstream usability — adequate

The Glossary is strong and mostly followed. The FRs use the capitalised terms consistently, and the avoid-list holds: "the non-believer" is never used as a type, and "verdict" appears only in negations ("no theological verdict"). The IDs are contiguous and the cross-references resolve.

Three things will cost downstream work. Behaviour that stories need sits in prose or the addendum rather than in FRs. A load-bearing noun ("profile") has no definition. A few FRs and NFRs carry mechanism where they should carry an observable consequence.

### Findings
- **[medium]** Core scoring rules live outside the FRs (§4.2 description, addendum C) — "a post that offends only because of the gospel's own claims is not penalised for that" and "Scores react … not to its stance or politics" appear only in §4.2's prose. Addendum C adds a user-visible output that no FR requires: "report where any offence comes from (the claim itself, the tone, or jargon)". `bmad-create-epics-and-stories` extracts FRs, so these rules will be dropped. *Fix:* Add two bullets to FR-4. First, a Criterion is not lowered for offence that comes only from the gospel's own claims. Second, when a score is lowered for offence, the reason names its source (claim, tone, or jargon).
- **[medium]** "Profile" carries weight but has no definition (§4.1, FR-2, FR-13, FR-14, §6.1, Glossary) — FR-14 applies "For a Review whose Posts come from one profile". §4.1 defines a "profile" review in prose, and FR-13's plan addresses a single creator or ministry. No FR says how a Review becomes a profile Review; a Review-level Source URL from FR-2 is the implied marker. Architecture has to decide whether Profile is an entity (`SCHEMA.md` lists a candidate `ministry / profile`). FR-13 on a mixed-source UJ-1 Review has no recipient. *Fix:* Add a Glossary entry ("Profile — the public account a Review's Posts came from; set by attaching a profile Source URL to the Review"). Make "Review has a Profile" an explicit precondition of FR-13 and FR-14.
- **[low]** Some FRs and NFRs carry implementation detail (FR-20, §8, FR-1, §7.5, FR-13):
  - FR-20 restates `RULES.md`'s "Version, don't edit" and cannot be observed in the Friday Artifact, which has no publishing and no persistence.
  - §8's *Secrets* bullet and its *Data protection* bullet ("every Supabase table has row-level security") repeat `RULES.md` security rules and name the mechanism. The user-facing requirement is already in FR-18.
  - FR-1 says "read by the model; no separate OCR step"; the user-facing requirement is just "no separate OCR step".
  - §7.5 says "delimited from instructions", which is a prompt technique.
  - FR-13's citation of the Jethro-and-Moses source is provenance, and addendum D already has it.

  FR-3's "TikTok's public oEmbed endpoint" and FR-21's "file or database change" are scope decisions and can stay. *Fix:* Restate FR-20 as an observable consequence ("a reopened Review shows the Rubric and Persona text it was scored with"). Point §8's security lines and §7.5's mechanism at `RULES.md`. Trim FR-1 and FR-13 as noted.
- **[low]** Some terms collide (Glossary, FR-13, title) — "draft" means both an unpublished Post (Draft Checkpoint, FR-16) and the Introducer's message (FR-13: "The draft opens with…", "The draft contains…"). In church usage, "Ministry Outreach Plan" reads as the ministry's own evangelism plan, which matters for SM-1, and it is also used for individual creators. The product name "Witness Review" contains the Glossary noun "Review". *Fix:* Rename the FR-13 message (for example "Outreach Message"), consider renaming the plan, and resolve the product name under OQ-4.
- **[low]** One section heading's tag contradicts its FR (§4.8, §4.11) — FR-17 is tagged [F] but sits under "§4.8 Creator Foundation and Own-Content Review [W2]". A tool that tags FRs by section heading would put it in the wrong delivery. §4.11 uses a third tag, "[F only]", that §0 doesn't define. *Fix:* Move FR-17 to its own subsection, or drop the tags from section headings. Define "[F only]" in §0, or tag FR-22 [F] and rely on §6.2's "except FR-22".

## Shape fit — strong

This is a multi-role tool with real UX: a teaching aid on a shared screen, a self-check for creators, and a correction aid for friends. That makes UJs load-bearing, and there are exactly four, each tied to FRs. UJ-4 (the Maintainer) is rightly kept light. The Rubric and Persona tables are capability-spec shape where that fits. As a chain-top PRD it rightly invests in a Glossary and IDs. It is neither over- nor under-formalized. The one gap is in the primary journey.

### Findings
- **[medium]** UJ-1 has no operator path (UJ-1, §8 latency, FR-19) — UJ-1 is told from Emily's side as a viewer, which suits the formation story. But the Leader actually operates the tool, and neither the Leader's name nor the Leader's path is given: "The leader drives it on a shared screen", "The leader adds them to a Review". Does the Leader prepare the Review before the session or enter posts live? Friday has no Saved Reviews (FR-19 is [W2]), so it would run live. At "within 60 seconds" per Post, a sequential 10-Post Review could keep a youth group watching a projector for close to 10 minutes. `bmad-ux` needs this. *Fix:* Add a Leader step to UJ-1 (prepares before the session, then presents one Post at a time). Either add a parallel-evaluation expectation to §8 or accept the live wait explicitly.

## Mechanical notes

- **[F]/[W2] roundtrip:** §6.1's list is exactly the 14 FRs tagged [F]: FR-1, FR-2, FR-4 to FR-9, FR-11 to FR-13, FR-17, FR-20 and FR-22. §6.2 adds exactly the 8 FRs tagged [W2] (FR-3, FR-10, FR-14 to FR-16, FR-18, FR-19 and FR-21) plus Criterion 10 [W2], and removes FR-22. The only mismatch is FR-17's section heading (above).
- **IDs:** FR-1 to FR-22, UJ-1 to UJ-4, SM-1 to SM-4, SM-C1 to SM-C3 and OQ-1 to OQ-4 are all contiguous and unique. The cross-references resolve (FR-2 → FR-3, FR-11 → FR-5, FR-6 → OQ-2, SM-C3 → §7.4, Glossary → §4.2).
- **§0 artifact:** "Inferences not yet confirmed carry an inline `` and are indexed in §12" has an empty code span; the tag text was stripped along with the inline tags. Rewrite as past tense, pointing to §12.
- **Assumptions Index:**
  - "All twelve drafting assumptions" lists 11 items, or 13 if the Emboldened Believer item counts as three.
  - Ten of the items appear in the body (FR-1, FR-5, FR-11, §4.3/FR-8, FR-13, FR-15, FR-21, §7.2 twice, §8). **"SM-3 ≥ 3 people" does not**; SM-3 has no number.
  - The memlog's negative Felt Response examples ("[ASSUMPTION on negatives]") were never indexed.
- **Glossary drift:**
  - "Talking Points" is capitalised in the Glossary and FR-13 but never defined, and it appears in lowercase in §1 and UJ-3.
  - "personas" appears in lowercase in UJ-2's edge case and FR-13.
  - "Neighbor of Another Faith" uses US spelling, while §1 and the §4.2 table say "neighbour" and the rest of the PRD uses UK spelling.
  - §1 says "witness rubric" where the Glossary term is Rubric.
  - The Glossary defines Evidence as "a quote from the Post", but FR-4 also allows "describes the screenshot region".
  - "review" is used as a verb (UJ-2, UJ-3, FR-16).
  - Addendum B says "cultural artefacts", which is the Glossary's avoid-term in UK spelling.
- **Version IDs:** the Rubric has an identifier (`witness-rubric@1`) but the Persona set has none, though FR-7 displays both versions.
- **Criterion 10 on Friday:** Rubric v1 includes the [W2] Criterion 10, and FR-4 scores "every Criterion of the current Rubric Version". Every Friday Evaluation will therefore show C10 as N/A. Say whether Friday hides or shows it.
- **FR-2 vs FR-3:** FR-2's "The UI states plainly that the tool cannot read posts from a link" becomes false in W2 if FR-3 ships. Qualify it ("…except a TikTok caption, when available").
- **UJ-3 protagonist:** "a friend or leader" has no name, and "leader" overlaps the Leader role. Give the protagonist a name and state that an Introducer may also be a Leader.
- **SM-1 feedback location:** SM-1 sends feedback to `CLAUDE.md` §3, which `CLAUDE.md` reserves for "Only observed mistakes". `AGENTS.md` agrees with the PRD, so reconcile `CLAUDE.md`.
- **FR-13 formatting:** FR-13's second bullet has a stray parenthetical after its full stop.
- **Required sections:** all are present for these stakes and this product type.
