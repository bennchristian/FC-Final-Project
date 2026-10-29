@AGENTS.md

# FC-Final-Project: project guide

Keep this file current and short. After every change, remove anything stale and fold new facts
into the sections below. This file is the handover; nothing else is.

**Read these first. They are the contract; this file is the running commentary:**
`PRD.md` (scope, MVP, what is deliberately out) · `ARCHITECTURE.md` (flow, patterns, trust
boundaries) · `SCHEMA.md` (data contracts, off-store state) · `DESIGN.md` (palette,
typography, anti-slop rules) · `RULES.md` (SOLID / DRY-at-4 / KISS plus the stack, security,
and domain rules) · `AGENTS.md` (who plans, who implements, phase gating) · `SKILLS.md` (which
skill wins which job). Anything below that contradicts them is stale and should be fixed here,
not there.

## 1. What this is

Bennett's Frontier Commons final project: a PR bot that reviews a church's or ministry's social
media from the point of view of **several kinds of non-believers** and assesses its witness. It
uses versioned metrics that are expected to keep changing, and it produces a gentler rewrite,
discussion questions, and an outreach plan for raising concerns with a poster. Scope is in
[`PRD.md`](PRD.md). Interview plans are research done outside the product.

- **Fri 2026-10-23:** recorded video of a Claude Artifact. Input is pasted text plus
  screenshots; a profile URL is recorded as the source but never fetched (no platform allows it).
- **Week of 2026-10-26:** live prototype on Next.js, Vercel, Supabase, and the Claude API.

## 2. How to work on it

- **Status (2026-10-21):** `PRD.md`, `ARCHITECTURE.md` and `SCHEMA.md` are final. Run folders:
  `_bmad-output/planning-artifacts/prds/prd-FC-Final-Project-2026-10-21/` (addendum, research,
  decision log) and `_bmad-output/planning-artifacts/architecture/architecture-FC-Final-Project-2026-10-21/`
  (memlog, gate reviews). OQ-5 is resolved (AD-5, AD-8, AD-12). FR-3 is dropped: TikTok oEmbed
  returns no caption (AD-13). `bmad-ux` is still running in its own session; `DESIGN.md` stays a
  stub until it promotes (it owns OQ-6).
- **Next (Thu 2026-10-22):** finish `bmad-ux`, then build the Demo Artifact to AD-12 and AD-16.
  Author `content/` @1: `witness-rubric@1`, `persona-set@1` (including the UX target audiences)
  and `prompts@1` (with `guardrails.md`). Also write `config/models.json`, the `conformance/`
  vectors and `artifact/`. Lock the @1 ids in `content/published.lock.json` when publishing.
  Run `bmad-project-context` only after real code exists.
- **Artifact URL:** https://claude.ai/artifact/Mkc4qYCLCFXqMLq8Yf1Kdq (first published 2026-10-21, contract 0.2.88, shared with the organisation; capabilities `sample` + `downloads` + `mcp` for Supadata, added 2026-10-26, AD-13 / FR-3a). A republish reloads open copies, which wipes any Review not yet copied or saved. Every republish passes this URL (AD-12). `witness-rubric@1`, `persona-set@1` and `prompts@1` are locked: any content change is a new `@2`. **Live since 2026-10-23 (version 3):** `witness-rubric@2 · persona-set@1 · prompts@2`, which answer the feedback on the first test run (Personas suggested edits, reactions lacked depth, scores ran high). These are locked too. **Version 4 (2026-10-26)** adds reel transcripts: a Post whose link is an Instagram reel is transcribed through the viewer's Supadata connector (FR-3a, AD-13). It runs on the latest runtime contract (on 0.2.88 the page never got `mcp`).
- **Copy editor (version 5, 2026-10-26):** also makes "Start here" clickable (the envelope layers no longer catch clicks). Click the page, then Shift+E on the Artifact opens Bennett's owner-only copy editor. It reaches every tab and the Review results; How it works edits are display-only, and Claude's text is never saved (AD-12). **Version 6 (2026-10-26)** ships that together with the brand restyle (`page.css`, masthead, Go back to the intro, Dark mode toggle in `theme.js`). Its saved `copy-edits.json` goes at `artifact/copy-edits.json`; the build inlines it, and the next republish carries the copy (PRD §4.11, AD-12). **Artifact service version 11 (2026-10-26)** adds "Why Living Letter" (2 Corinthians 3:2–3) and "Who this is for" (creators reviewing their own Posts first, then individuals, then youth leaders) under Overview in `build.mjs`. **Version 12 (2026-10-26)** turns 2. Add Posts into two either/or toggles: "Link to the Post" or "Paste the transcript", then "Add screenshots" or "Paste the text". Only the chosen field is read on submit (`syncFormModes` in `ui.js`).
- **Built, not yet published (2026-10-28):** FR-3a widened to TikTok videos and captions (PRD FR-3a, AD-13). A link to one Instagram reel or TikTok video gets its caption through `supadata_metadata` and its transcript as before. The link field is for videos only; static Posts stay screenshots or text. **The next republish must declare `supadata_metadata` in the `mcp` tools** (AD-12). Spec: `_bmad-output/implementation-artifacts/spec-fr-3a-instagram-tiktok-post-read.md`.
- **Post-MVP scope added (2026-10-28, Bennett):** FR-16a Connected Account: a Creator connects their own Instagram professional account, and the Web App reads its captions and carousel slides through the official Instagram API (AD-17 PROPOSED; `instagram_connection` in SCHEMA, not in the first migration; PRD §6.4). It needs a Meta developer app that Bennett creates. Ayrshare is the paid alternative. Other people's carousel slides still come only from screenshots.
- **Video (2026-10-26):** script and cues in `docs/video/script.md`; the renderer is in `video/` (see its README). It replays Post 1 of the saved Review over the real Artifact, with reading pauses inserted into Bennett's VO (3:25). Output `video/out/living-letter.mp4` and the inputs in `video/assets/` are git-ignored. The Outreach Plan shot shows only the section, because no plan was generated.
- **Check command:** Thursday: `node --test artifact/test/ && node artifact/build.mjs`. Week 2: see
  `ARCHITECTURE.md` § Consistency Conventions.
- **Web App rules:** Reviews ship switched off. Agents never make a live Claude call, never set
  `CLAUDE_ADAPTER=live`, and never touch the `prod` Supabase project or run `publish:content --prod`
  without Bennett's OK. Development uses the second free Supabase project, `dev` (AD-8, AD-15).
- Interview plans (PRD OQ-3) are done and approved: [`docs/interview-plans.md`](docs/interview-plans.md).
  They are research, not part of the product.
- BMAD writes into dated folders under `_bmad-output/`. Promote the final document to the repo
  root; do not repoint BMAD's output paths.
- `_bmad/config.toml` and `_bmad/config.user.toml` are managed by the installer. Overrides go
  in `_bmad/custom/config.user.toml`.

## 3. Gotchas that cost real time

None yet.

Only observed mistakes belong here: something that actually went wrong, not something that
looks like it might. A repo yields endless trap-shaped facts and none of them predict real
failures; the ones that already bit you do.

## 4. Working with Bennett

- Plan before building. New scope goes through `PRD.md`; ask before widening it.
- Suggest the skill or subagent that fits before starting non-trivial work. Propose
  delegation rather than doing it automatically.
- Commit or push only when asked.
- Prefer a hook, lint rule, or CI check over a prose rule when the rule can be enforced
  mechanically.
