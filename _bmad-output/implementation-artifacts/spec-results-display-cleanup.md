---
title: 'Review results display cleanup: versions, Concerns, Offence source, rewrite highlights'
type: 'feature'
created: '2026-10-29'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Before demo day (Fri 2026-10-30) Bennett finds the Review results cluttered: a versions line under each Post, a "Concerns (N):" list that repeats the Rubric Scores, an Offence source list that explains each source inline, and a Gentler Rewrite that does not show what changed.

**Approach:** Four display-only edits to the Demo Artifact (`artifact/`), applied to every Review including the Try the demo sample:

1. Remove the versions line (`witness-rubric@2 · persona-set@1 · prompts@2 · <model>`) from the page **and** from copied text and saved Markdown files (Bennett, 2026-10-29: "Remove everywhere"). Versions stay recorded in stored data (Saved Reviews records, the JSON appendix), since Saved Reviews and the sample check depend on them. PRD FR-7 is amended to match, and How it works copy that promises visible versions is reworded.
2. Remove the per-Post "Concerns (N):" list. "Likely to land well" and "could not be assessed" stay (FR-5). The tour's summary step is skipped when its target is absent.
3. Offence source becomes one inline line ("Offence source: Jargon, Claim") plus a collapsible "Where do offence sources come from?" holding each listed source's meaning and effect.
4. Gentler Rewrite: a word-level diff computed in code highlights new or changed words in the Suggestion only (Bennett chose "Highlight Suggestion"). The Original is unchanged. It works in both themes.

No change to locked content (`witness-rubric@2`, `persona-set@1`, `prompts@2`), prompts, or scores.

</frozen-after-approval>

## Implementation Notes

- Versions: `provenanceLabel` (core.js) removed, with its uses in `ui.js` `renderEvaluation` and `export.js` (per-Post line and the "Versions:" header). `versions` stays in the JSON appendix and in Saved Reviews records (`past.js`, `sameVersions`). PRD FR-7 and UJ-4, ARCHITECTURE AD-6 and the copy-editor note, and How it works copy in `build.mjs` were amended.
- Concerns: `renderSummary` returns null for a Post with concerns. `tour.js` `summary` step gets `skip` like `rewrite`. The Markdown export keeps its one-line "Summary: concerns" list of Criterion names (not part of the request).
- Offence: `renderOffence` returns a `p.offence` line plus a `<details>` with each source's effect only. Showing the meaning would have contradicted Bennett's shortened Claim copy edit, which applies only in How it works.
- Rewrite: `rewriteChanges(original, rewrite)` in core.js computes an LCS over normalised words. Kept runs under 3 words between changes count as changed, and the diff is skipped above 4M cells. `markedRewrite` in ui.js wraps changed runs in `mark.changed.said`; `.said` keeps them out of saved copy edits. The hint shows only when something is marked. On the sample, about 200 of 234 words are highlighted.
- Tests: new `artifact/test/rewrite.test.mjs`; `export.test.mjs` asserts no versions in the text but versions in the JSON; `guard.test.mjs` asserts no versions label, no Concerns list and the one-line offence. 236 pass. Checked in the browser on the replayed demo sample, in light and dark.

## Review Triage Log

- medium, patched: UJ-4 in PRD still said old Reviews "show" versions. Now "keep".
- low, patched: CLAUDE.md version 25 entry said results still show versions.
- medium, patched: the offence fold-out showed the full Claim meaning, contradicting the copy-edited short Claim text in How it works. It now shows the effect only.
- low, patched: the rewrite hint showed even when nothing changed.
- low, deferred: the tour's summary step never shows on the sample. A line about marked concern rows belongs in the `scores` step (tour.js, owned by the walkthrough session).
- maybe-intended, deferred to Bennett: the copied and saved Markdown still lists Criterion names under "Summary: concerns".
- false: the copied text carries no versions. Bennett chose "Remove everywhere" (2026-10-29).
- false: folding away "never lowers a score" was Bennett's request.
- false: deletions are not marked. Bennett chose "Highlight Suggestion" only.
- false: AD-6 scope. FR-7 is [F] for both surfaces, so the amendment binds both.
- false: the spec is missing sections. The one-shot route drops them by design.
- low, rejected: emoji-only changes are not marked. They are rare in transcripts, and the fix adds tokenising rules.
- low, rejected: highlight by colour alone. The tint also shifts luminance against `--band`, and the hint line names it. Underlining most of the text would be noisy.
- low, rejected: How it works does not say where versions are found, and the model is recorded per call. Wording nit.
- low, rejected: the UI is checked by source-grep guards. That matches the existing guard style; there is no DOM test harness.

