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

- **Status (2026-10-21):** `PRD.md` is final (promoted from
  `_bmad-output/planning-artifacts/prds/prd-FC-Final-Project-2026-10-21/`, which also holds the
  addendum, research digests, and decision log). `ARCHITECTURE.md` and `DESIGN.md` are stubs.
- **Next:** `bmad-architecture`, with `bmad-ux` running alongside in its own session (Bennett
  chose to run them in parallel). Architecture owns PRD OQ-5, UX owns OQ-6. Run
  `bmad-project-context` only after real code exists.
- Interview plans (PRD OQ-3) are done and approved: [`docs/interview-plans.md`](docs/interview-plans.md).
  They are research, not part of the product.
- BMAD writes into dated folders under `_bmad-output/`. Promote the final document to the repo
  root; do not repoint BMAD's output paths.
- `_bmad/config.toml` and `_bmad/config.user.toml` are managed by the installer. Overrides go
  in `_bmad/custom/config.user.toml`.
- TODO: dev, build, and check commands once the Next.js app exists.

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
