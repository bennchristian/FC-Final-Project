# AGENTS: who does what

## Roles

| Role | Who / model | Does | Never does |
|---|---|---|---|
| Owner | Bennett | Owns scope and `PRD.md`, approves each phase gate, decides open questions | — |
| Planner | Main Claude session | Reads the contracts, writes plans and briefs, routes work through `SKILLS.md` | Widens scope without asking; commits uninvited |
| Implementer | `bmad-build`, or a subagent briefed by the planner | Turns one brief into working, checked code | Changes contracts (`PRD`/`ARCHITECTURE`/`SCHEMA`) on its own |
| Reviewer | `/code-review` or `bmad-review`, **only when Bennett asks** | Reviews a diff or plan | Runs uninvited, including on edits just made |

## Brief format for an implementer

Every brief is self-contained and includes:
- the plan file path and the reading order
- the rules block from `RULES.md`
- the exact findings to address
- the files and functions expected to change, and what must not change
- the check command
- the required final report: the change made for each finding, any skipped items with
  reasons, and the check output verbatim

The usual failure is a brief that assumes the implementer shares this conversation's context.
The implementer starts cold every time.

## Phase gating

| Phase | Deliverable | Gate to the next phase |
|---|---|---|
| 0: Plan | The eight context docs. `PRD.md` is final (from `bmad-prd`). | Bennett approves the PRD scope |
| 1: Demo | Claude Artifact, **Fri 2026-10-23** | Demo is given. Feedback is captured in `CLAUDE.md` §3 and in `PRD.md` if it changes scope |
| 2: Prototype | Next.js on Vercel with Supabase, live link, **week of 2026-10-26** | `ARCHITECTURE.md` and `SCHEMA.md` are final; the check command is green |

`ARCHITECTURE.md` and `DESIGN.md` may be time-boxed for Phase 1. The artifact can be built from
the PRD alone. Both documents must be final before Phase 2 code starts.

## Handover

At the end of each working session:
- Update `CLAUDE.md` with what changed, what is next, and any gotcha that actually cost time.
- Keep `CLAUDE.md` short. Delete anything that is now stale.
- If a contract changed, update it in the same change. Never leave the fix only in commentary.
- BMAD runs resume from their folders under `_bmad-output/`. Note in `CLAUDE.md` which run is
  in progress.

<!-- bmad:context -->
<!-- bmad-project-context manages this block. Run it once the repo has real code to scan;
     it path-checks every claim it writes, so running it against an empty repo produces
     guesses or nothing. Everything above these markers is preserved across its runs. -->
<!-- /bmad:context -->
