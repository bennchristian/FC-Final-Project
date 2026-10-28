- source_spec: `_bmad-output/implementation-artifacts/spec-fr-3a-instagram-tiktok-post-read.md`
  summary: Check mechanically that the Artifact's publish manifest declares every Supadata tool `reel.js` calls (supadata_metadata, supadata_transcript, supadata_check_transcript_status).
  evidence: The `mcp` manifest is passed only at publish time (AD-12). A republish that omits `supadata_metadata` makes captions and carousel detection fail, and only a prose note in CLAUDE.md guards against it. A build-emitted capabilities file plus a test would enforce it.
- source_spec: `_bmad-output/implementation-artifacts/spec-fr-3a-instagram-tiktok-post-read.md`
  summary: Show the caption read from a post link before the Post is added, so the User can edit or replace it.
  evidence: The caption goes straight into the Post's text at submit. PRD FR-3a now says so explicitly; the dropped FR-3 had promised an editable pre-fill. A preview step is a UX change for bmad-ux / Bennett to decide.
