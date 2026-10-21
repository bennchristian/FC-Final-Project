---
title: "Reconcile: PRD vs original inputs"
created: 2026-10-21
reviewed: prd.md, addendum.md (as of 2026-10-21 15:13), .memlog.md
inputs: docs/brief.md; ~/Downloads/Culture and Ministry Design.md (via reconcile-culture-and-ministry-design.md, spot-checked against source L452-466, L600-626, L815-819, L1086-1160, L1245-1255)
purpose: Input-reconciliation review. Findings only; the PRD was not edited.
---

# Reconcile: PRD vs original inputs

Severity: **High** = contradicts a PRD guardrail or drops a principle the contract depends on.
**Medium** = a stated input or confirmed decision is missing from the contract. **Low** = wording,
traceability, or consistency. Deliberate deferrals and memlog-superseded items are not flagged.

## 1. `docs/brief.md`

### Covered

| Brief item | Where the PRD resolves it |
|---|---|
| Profile URL feasibility (open question) | §4.1 description, FR-2, FR-3 [W2 conditional], §6.3 bullet 1, addendum A (rejected alternative). Brief decision #2 is explicitly superseded. |
| Persona count | §4.3: seven personas; addendum B gives the axes. |
| Rubric v1, scoring | §4.2 table, FR-4 (1–5 + N/A, Evidence). |
| Rubric versioning | FR-7, FR-20, FR-21, Glossary "Rubric Version". |
| Output shape | Per-Post Evaluation (§3 "Evaluation"; FR-4–FR-12); Profile Summary FR-14 [W2]; persona display FR-8, FR-9. |
| Tone (constructive, charitable) | §7.4, FR-13 bullets 2–3, SM-C3 (partly; see 2.2). |
| MVP out-list (interviews, messaging, scheduled pulls) | §5 "Not an interview tool", "Not a messenger", "Not a monitor", "Not a scraper"; §6.3; OQ-3. |
| Interview plans / outreach plans (idea) | Interview Plans moved out of product (§5, §6.3, OQ-3, addendum F). Outreach plans → FR-13. |
| Living metrics | §1 last para, FR-20, FR-21, UJ-4. |
| Deadlines | §6.1 (Fri 2026-10-23 Artifact), §6.2 (week of 2026-10-26, live public link), §10. |
| Decisions: BMAD path; Next.js/Vercel/Supabase/Claude stack | §10; Glossary "Web App"; §8 Secrets/Data protection. |

### Gaps

**BR-1. Consent / opt-in is answered only by implication. — Medium**
- *Brief:* "Does a ministry opt in?"
- *PRD:* §7.2 bullet 1 says public Posts are "open to charitable critique" but never states the
  answer to the opt-in question, nor what the reviewed poster is told (nothing).
- *Fix:* Add one sentence to §7.2: "No opt-in is sought from the poster or ministry. Reviews of
  public Posts are private to the User (FR-18), are about the Post, and reach the poster only if
  a User chooses to share them (FR-13; §5 'Not a messenger')."

**BR-2. Persona "levels" and the age axis are not resolved in the PRD itself. — Medium**
- *Brief:* "What separates one level from the next: familiarity, hostility, past experience of
  church, culture, their age?"
- *PRD:* §4.3 gives a flat set of seven with no axes. The axes live only in addendum B, which
  says "Age, generation, and culture vary within a persona" — that leaves open how old each
  persona is when it reacts. UJ-1 (Emily's witness to her *school friends*) depends on this.
- *Fix:* Add one line under the §4.3 persona table: the set replaces "levels" with a spread
  across familiarity, disposition, church history, and worldview (pointer to addendum B), and
  state how age is fixed in Persona Version 1 (e.g. per persona card). If undecided, log it as
  OQ-5 rather than leave it implicit.

**BR-3. "So old scores stay comparable" is answered as traceability, not comparability. — Low**
- *PRD:* FR-7/FR-19/FR-20 guarantee an old Review keeps its versions; nothing says whether
  scores from different Rubric Versions may be compared, or whether a saved Review can be
  re-run under a newer version.
- *Fix:* One sentence in FR-21 or §6.3: "Scores are comparable only within one Rubric Version;
  cross-version comparison and re-scoring are out of MVP scope."

### Contradictions

None. (Brief decision #2, profile URL as demo input, is reversed on evidence; addendum A
records it as a rejected alternative, and memlog L37/L41 confirm.)

## 2. *Culture and Ministry Design*

### Covered

| Input idea | Where in the PRD |
|---|---|
| Paul in Athens five marks (p.28) | Criteria 2, 3, 8, 9 + §4.2 "offence of the gospel" sentence; addendum C. |
| Jargon / contextualization (p.23; missional item 10, p.43) | Criterion 1 Outsider Clarity. |
| Word and deed (salt and light, p.13) | Criterion 7 Love Made Visible. |
| Personas are reasoners, not foils (de Nobili p.25; atheist p.9) | §4.3 description "believable person … not a foil". |
| Other-faith and church-hurt outsiders (p.29, p.37) | Neighbor of Another Faith, Exvangelical. |
| Persona construction (artifacts/narratives/longings, sub-culture, Paul's 3 audiences) | Addendum B (for persona authoring). |
| Critique forms, not convictions (p.47) | FR-11 bullet 1; §4.2 "not to its stance"; addendum D. |
| Jethro tone model (p.49–50) | FR-13 bullet 2 (partly; see CMD-5). |
| Observation → change format (Gather/Study/Design, p.29–32) | FR-4 Evidence; FR-13 Talking Points tied to Post + Criterion; §7.4. |
| Real people over simulation (p.29, p.35 L817) | §5 "Not a stand-in for real people"; FR-9; SM-4; addendum F. |
| Listen first in interviews (p.29) | Addendum F (Interview Plans are outside the product). |
| "Cultural artifact" glossary collision | §3 Avoid list. |

### Gaps

**CMD-2. Affirm-first, person-not-project tone is applied only to the outreach draft, not to
Evaluations. — Medium**
- *Input:* Creation (affirm) comes before Fall (critique) (p.31 L704-714); empathize questions
  start with "what can I affirm" (p.53 L1247-1251); Jethro treats Moses as "not a project or a
  problem" (p.49); Paul "does not condemn or disrespect" (p.28); the five willingnesses (p.21
  L456-466) — listen, ask gently, be willing to be wrong, hold convictions, let go of pride;
  fail forward through small experiments rather than stalling (p.47).
- *PRD:* §7.4 says "charitable and specific … no mockery … no theological verdicts". It does not
  say how a per-Post Evaluation should feel to Esther (own content, UJ-2) or how it frames a
  third-party poster in front of a youth group (UJ-1). The affirm-first rule appears only in
  FR-13 bullet 2. FR-12 has no rule keeping questions about the post, not the poster.
- *Fix:* Extend §7.4 with four short rules: (a) when an Evaluation raises concerns, it first
  names a genuine strength of the Post (FR-5 still governs fine posts); (b) all outputs,
  including Discussion Questions, address the Post, never the poster's character, motives, or
  faith; (c) findings are phrased as how the Post *may* land, not as fact (consistent with the
  Glossary ban on "verdict"); (d) feedback to a Creator ends on a concrete next step to try,
  not on a reason to stop posting.

**CMD-3. Personas may diagnose outsiders' motives; persona voice vs §7.4 is undefined. — Medium**
- *Input:* The extract's sharpened rule (§4, "the trap"): the source itself diagnoses outsiders'
  hearts (p.31-32), stereotypes (p.54), and treats longings as gaps to fill (p.11). "A persona
  reports what the person notices and feels, in their own terms. It never reports the tool's
  theological diagnosis of their motives."
- *PRD:* FR-8 requires the Persona's voice and reasons tied to the Post, and §4.3 says "not a
  foil", but nothing forbids a reaction like "deep down she is longing for God". It is also
  unstated whether §7.4 (charitable tone) binds a Persona voicing offence.
- *Fix:* Add to FR-8: "A Persona Reaction reports what the Persona notices and feels in their
  own terms; it never states a spiritual diagnosis of the Persona's motives or longings." Add to
  §7.4: "Personas may voice negative Felt Responses honestly but never mock or insult the
  poster."

**CMD-4. No rule against verdict-laden labels in user-facing output. — Medium**
- *Input:* Extract §3 "Avoid in user-facing output": idolatry, syncretism, demonization,
  triumphalism, pagans, "the weak", win/target, traditionalists/transformers; "describe the
  effect instead" ("reads as us-versus-them", "reads as a political rally").
- *PRD:* §3 Avoid lists only "cultural artifact", "the non-believer", "verdict". Addendum D
  proposes Keller's extremes as Profile Summary lenses, which would surface exactly these labels.
- *Fix:* Add to the §3 Avoid list (or §7.4): "Output describes effects on readers, never labels
  such as idolatry, syncretism, demonisation, triumphalism, pagans, or 'the weak'." Optional,
  owner's call: "Target Audience" uses a word the extract flags; the memlog (L51) uses it, so
  keep it unless Bennett prefers "Intended Audience".

**CMD-5. FR-13 cites the Jethro model but drops its first step ("ask first") and its "why". —
Low**
- *Input:* Jethro asks questions before advising, then names the problem *and why* (p.49).
  Addendum D repeats "ask first … name the problem and why it matters".
- *PRD:* FR-13 bullet 2: affirmation → top 2–3 concerns → concrete changes (structure confirmed
  by Bennett, memlog L62 — not disputed here). No question to the poster; no "why it matters".
- *Fix:* Add to FR-13 bullet 2, keeping the confirmed structure: "includes at least one genuine
  question about the poster's intent or audience, and says why each concern matters for how
  outsiders receive the Post."

**CMD-6. Paul-in-Athens mark 2 ("does not compromise truth claims") is not visible in the
rubric table. — Low**
- *Input / memlog L46:* all five marks "must be represented as criteria". The source contrasts
  two ditches: insular content and content that dilutes its convictions (p.14-15, p.24, p.28).
- *PRD:* Criterion 9 scores plainness and a clear answer; nothing scores a Post that waters down
  its convictions to avoid offence. Addendum C says Criteria 2 and 9 come from the marks but not
  which mark maps where.
- *Fix:* Extend Criterion 9's text: "… and does not blur or water down its convictions to avoid
  offence." Optionally add a "Source" column (lens / mark / research C#) to the §4.2 table.

**CMD-7. Simulated reactions are "simulated", not "hypotheses", and nothing user-facing says
rewrites cannot replace relationship. — Low**
- *Input:* Contextualization is "not as simple as 'Say it this way—not this way'" and comes from
  time with real people (p.35 L817); the extract: label reactions as hypotheses.
- *PRD:* §5 "Not a stand-in for real people" is a non-goal, not a user-visible message. FR-9
  and FR-17 are the only standing labels.
- *Fix:* Widen FR-9's label wording to "a simulated hypothesis, not a real person's view; talk
  to real people to test it", or add that clause to the FR-17 reminder.

**CMD-8. "Non-believer" is the PRD's core term but has no Glossary entry. — Low**
- *Input:* Extract §3 last row: pick one term and define it to include people of other faiths,
  dechurched people, and secular people.
- *Fix:* Glossary entry: "Non-believer — anyone outside Christian faith: secular, spiritual but
  not religious, of another faith, or dechurched. Not a single type (see Avoid)."

**CMD-9. Addendum "later" / "candidate" items have no deferral entry. — Low**
- *Addendum D:* design-thinking shape "for richer outreach plans later"; Keller postures and the
  attractional pattern as "candidate lenses" for FR-14. Neither appears in §6.3, §11, or FR-14,
  and the memlog records no decision on them.
- *Fix:* Add one line to §6.3 (or OQ-1): "Design-thinking outreach plans and posture/attractional
  lenses for the Profile Summary are candidates, not MVP."

### Contradictions

**CMD-1. §4.2 has the tool rule on whether offence is the gospel's — the input says that call
belongs to the poster. — High**
- *Input:* Extract §4 (p.18, p.28): report *where* offence comes from (the claim, the tone, or
  jargon) and do **not** rule whether it was the "offence of the gospel" or needless; that is
  the ministry's *discernment*.
- *PRD:* §4.2 description: "a post that offends only because of the gospel's own claims is not
  penalised" — this requires the tool to decide what counts as the gospel's own claims, which
  collides with §5 "Not a theological judge" and §7.4 "No theological verdicts". Addendum C
  keeps "report where any offence comes from", but no FR carries it, and the PRD wins over the
  addendum — so the reporting duty is effectively dropped.
- *Fix:* Reword §4.2: "Offence attributed to the claim itself is not penalised; the tool does not
  judge whether the claim is true or the offence deserved — that is the poster's discernment."
  Add to FR-8: "When a Felt Response is negative, the reaction names its likely source: the claim
  itself, the tone, or unfamiliar language."

**CMD-10. Addendum B uses "cultural artefacts", which the PRD Glossary bans. — Low**
- *PRD:* §3 Avoid: "cultural artifact". Addendum B L30: "Build each persona card from cultural
  artefacts …". (The extract's rule was narrower: write it in full and never call a Post an
  artifact.)
- *Fix:* Either narrow the §3 Avoid line to the extract's rule, or reword addendum B to "the
  media and works they consume".

## 3. `.memlog.md` decisions

### Covered

All decisions that were not superseded are reflected. Specifically: journeys and protagonists
(L22, L27, L31, L35); Interview Plans out of product (L36); soundness flag only (L28); "fine
is fine" (L29); seven personas and one-sided lean (L43-45, L57, L62); scoring model (L47);
"convicted" as positive (L48); 1–5 + N/A (L50); ten Criteria (L49, L58); Friday/W2 split
(L52, L58); private accounts (L53); flow before recording (L54); Target Audience ordering
(L55); "lands anywhere" reminder (L56); success metrics (L59); WWJD standing questions (L64);
demo accounts kept out of the PRD (L64). Superseded entries (L17 → L47; L30 → L34-35;
L33 → L36; brief decision #2 → L37) are correctly not carried.

### Gaps

**ML-1. Kingdom over Party applying to left- and right-coded posts was dropped. — Medium**
- *Memlog L45:* no conservative persona, "Kingdom-over-Party criterion still applies to left- and
  right-coded posts." The PRD carries the first half (§4.3 last line) but not the counterweight.
- *Fix:* Criterion 5 text: "keeps the faith distinct from party, candidate, and nation, whether
  left- or right-coded (N/A if no political content)."

**ML-2. The confirmed SM-3 threshold is missing from SM-3. — Low**
- *Memlog L62 / PRD §12:* "SM-3 ≥ 3 people" is confirmed, but §9 SM-3 has no number.
- *Fix:* SM-3: "At least 3 leaders, creators, or ministries Bennett knows run real Reviews …"

**ML-3. Negative Felt Response vocabulary was never confirmed. — Low**
- *Memlog L48:* negatives tagged "[ASSUMPTION on negatives]"; not in the L62 confirmed list. §12
  says "None outstanding".
- *Fix:* Confirm with Bennett, or note in the Glossary that the negatives are illustrative and
  will be fixed in Persona Version 1.

### Contradictions

None.

## 4. Incidental (outside the reconciliation remit, found while reading)

- **X-1. FR-5 vs FR-11 at a score of 3 — Medium.** A Post whose lowest score is 3 is "fine"
  (FR-5: none below 3), so FR-11 bullet 3 gives it no rewrite, yet FR-11's main clause requires
  a rewrite when any Criterion is below 4. Both thresholds are confirmed; only the precedence
  needs stating (e.g. "a fine Post with a 3 gets an optional rewrite").
- **X-2. §0 empty inline code — Low.** "carry an inline `` and are indexed in §12" is a leftover
  from removing the assumption tags; reword to "were tagged inline and are indexed in §12".

## 5. Promotion notes (not PRD gaps; for when the PRD is promoted)

- `RULES.md` data rule "Evaluate the ministry's own posts" is superseded (memlog L15, L64).
- `CLAUDE.md` §1 still says "The planned input is a profile URL"; update to paste/screenshots
  with Source URL.
