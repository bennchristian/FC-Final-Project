- source_spec: `_bmad-output/implementation-artifacts/spec-fr-3a-instagram-tiktok-post-read.md`
  summary: Check mechanically that the Artifact's publish manifest declares every Supadata tool `reel.js` calls (supadata_metadata, supadata_transcript, supadata_check_transcript_status).
  evidence: The `mcp` manifest is passed only at publish time (AD-12). A republish that omits `supadata_metadata` makes captions and carousel detection fail, and only a prose note in CLAUDE.md guards against it. A build-emitted capabilities file plus a test would enforce it.
- source_spec: `_bmad-output/implementation-artifacts/spec-fr-3a-instagram-tiktok-post-read.md`
  summary: Show the caption read from a post link before the Post is added, so the User can edit or replace it.
  evidence: The caption goes straight into the Post's text at submit. PRD FR-3a now says so explicitly; the dropped FR-3 had promised an editable pre-fill. A preview step is a UX change for bmad-ux / Bennett to decide.
- source_spec: `_bmad-output/implementation-artifacts/spec-results-display-cleanup.md`
  summary: Guided demo never explains how concerns are marked; move "Concerns are marked in the Rubric Scores" into the tour's `scores` step and drop or repurpose the `summary` step.
  evidence: The sample Post has lands_well false, so the `summary` step's new skip always fires on the demo.
- source_spec: `_bmad-output/implementation-artifacts/spec-results-display-cleanup.md`
  summary: Decide whether the copied/saved Markdown should also drop its "Summary: concerns" list of Criterion names, to match the page.
  evidence: export.js postSection still writes it; Bennett's request named the page's Concerns segment only.

- source_spec: none
  summary: Web App Review File upload and Saved Reviews (FR-19, FR-26; AD-18 import steps 1-9, list, read-only reopen, delete).
  evidence: Split 2026-10-30 from the Web App MVP build at Bennett's choice; runs after spec-web-app-foundation.
- source_spec: none
  summary: Web App profile, code-only Profile Summary and Persona order by audience (FR-10, FR-14, FR-15).
  evidence: Split 2026-10-30 from the Web App MVP build at Bennett's choice; runs after the Review File upload spec.
