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
uses versioned metrics that are expected to keep changing. It also produces plans for
interviewing real non-believers and plans for telling the ministry how it could adapt. The
full idea and open questions are in [`docs/brief.md`](docs/brief.md).

- **Fri 2026-10-23:** demo as a Claude Artifact. The planned input is a profile URL, which has
  not been checked as feasible yet.
- **Week of 2026-10-26:** live prototype on Next.js, Vercel, Supabase, and the Claude API.

## 2. How to work on it

- **Status (2026-10-21):** scaffolded and BMAD v6.12.4 installed (`bmm` module, Claude Code
  skills in `.claude/skills/`). `PRD.md`, `ARCHITECTURE.md`, and `DESIGN.md` are still stubs.
- **Next:** `bmad-prd` with `docs/brief.md`, then `bmad-architecture`, then `bmad-ux`. Run
  one per session. Run `bmad-project-context` only after real code exists.
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
