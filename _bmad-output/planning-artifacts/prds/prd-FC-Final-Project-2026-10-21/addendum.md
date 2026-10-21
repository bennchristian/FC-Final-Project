# Addendum: Witness Review PRD

Depth that informs downstream work (`bmad-architecture`, `bmad-ux`, persona and rubric authoring) but does not belong in the PRD's main narrative. The PRD wins where they differ.

## A. Input feasibility (for `bmad-architecture`)

Full report with sources: [`research-feasibility-comparables.md`](research-feasibility-comparables.md). Summary as of 2026-10-21:

| Route | Verdict |
|---|---|
| Instagram Basic Display API | Shut down 2024-12-04. |
| Instagram Graph API / Business Discovery | Reads only accounts that grant access, or Business/Creator accounts via the caller's own professional account plus App Review. Not viable for arbitrary posts. |
| Instagram oEmbed | Needs App Review + Business Verification; Meta forbids uses beyond displaying the embed. Not viable. |
| Scraping Instagram/TikTok | Breaks platform terms; robots.txt blocks crawlers. Excluded by `RULES.md`. |
| TikTok oEmbed | No auth, any origin; docs say caption returns as `title`, but a live test returned no `title`. Verify on a real post before building FR-3. Short `vt.tiktok.com` links resolve via 302. |
| TikTok Display / Research API | Display covers only the creator's own videos; Research is academic-only. |
| Claude web fetch tool | Obeys robots.txt (TikTok blocks `Claude-User`), no JavaScript, and would breach platform terms. |
| Claude Artifact network | Third-party origins blocked; in-page Claude call accepts text and dropped images only. |
| Video | Claude takes no video or audio input; use pasted transcript + screenshots. |

**Rejected alternative:** profile URL as the primary input. Kept as a Source URL (FR-2) with a conditional TikTok pre-fill (FR-3); paste and screenshots are the fallback that is always available.

**Comparables:** no direct competitor found. Nearest: human "secret worshipper" church audits; audience-simulation tools such as Artificial Societies' Reach (LinkedIn); synthetic-persona research tools; Christian AI tools that generate content but do not evaluate witness.

## B. Personas (for persona authoring)

Full report: [`research-frameworks-personas.md`](research-frameworks-personas.md).

- **Axes behind the set:** familiarity with Christianity (Engel scale); disposition from receptive to hostile, independent of familiarity (Rainer U1–U5, Gray Matrix; only ~5% of the unchurched are hostile); church history (none / drifted / hurt — PRRI 2024: 47% of leavers cite LGBTQ teachings, 31% clergy abuse); worldview (secular / spiritual-but-not-religious / another faith). Age, generation, and culture vary within a persona.
- *Culture and Ministry Design* offers a complementary axis: Paul's three audiences ordered by shared religious vocabulary — synagogue (dechurched or nominal), Lystra (another faith or spirituality), Athens (secular and sceptical). Build each persona card from cultural artefacts, narratives, longings, and a named sub-culture.
- **Synthetic-persona risks:** flattening, stereotyping, low variance, sycophancy. Mitigations: backstory-rich persona cards, "simulated" labels, red-teaming for stereotypes, and grounding in real interviews over time (Park et al. 2024 report ~85% accuracy when grounded).
- **Rejected alternative:** a three-persona MVP (Seeker / Exvangelical / Skeptic). Bennett chose the full five plus Progressive and Emboldened Believer.
- **Rejected alternative:** a secular-conservative counterweight persona. Bennett chose a deliberately one-sided political lean.

## C. Rubric v1 evidence (for rubric authoring)

The per-Criterion "raises / lowers" evidence tables and sources for Criteria 1, 3–8 are in `research-frameworks-personas.md` §3 (research Criteria C1–C7). Criteria 2 and 9 come from the "Paul in Athens" five marks in *Culture and Ministry Design* (p.28): awareness of the audience's culture; truth claims held without compromise, where the only acceptable offence is the offence of the gospel; no condemnation; dialogue and questions invited; a clear answer given.

- **Scale chosen:** 1–5 + N/A (Bennett). The research proposed 0–4.
- **Scoring model chosen:** Rubric Scored directly from the Post; Persona Reactions shown alongside and never feed scores. **Rejected alternative:** deriving scores from Persona Felt Responses (risks a caricatured persona skewing numbers).
- **Offence distinction:** report where any offence comes from (the claim itself, the tone, or jargon). Offence caused by the gospel's own claims is not penalised.

## D. Feedback and outreach tone (for prompt design)

From *Culture and Ministry Design* ([`reconcile-culture-and-ministry-design.md`](reconcile-culture-and-ministry-design.md)):
- **Jethro-to-Moses tone model** (Exodus 18): ask first, treat the person as a person, name the problem and why it matters, offer one concrete idea.
- **Design-thinking shape** for richer outreach plans later: Empathise (what outsiders saw) → Define → Ideate → Prototype (one small post experiment) → Test (re-score).
- **Critique forms, not convictions.**
- **Keller's four postures and their extremes** (triumphalism/nationalism, demonisation, syncretism, sacred-secular divide) and the **attractional** pattern (a feed of nothing but invitations) are candidate lenses for the Profile Summary (FR-14).

## E. Attribution check

The quote "Your life as a Christian should make non-believers question their disbelief in God" has no primary source; it is absent from Wikiquote and its earliest dated appearance found is a 2014 social post. A verified alternative: "The church is church only when it exists for others" (*Letters and Papers from Prison*, 1944; critical-edition page not yet checked).

## F. Interview Plans (for the separate session)

Bennett will produce Interview Plans in a separate Claude session (OQ-3): questions for non-believers (to test Persona plausibility, SM-4) and for budding Christian influencers and ministries (to test usefulness), each question mapped to the Criterion or Persona its answers would revise. *Culture and Ministry Design* suggests listening without arguing and presenting simulated reactions as hypotheses for interviews to test.
