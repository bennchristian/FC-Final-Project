# Skills and agents for FC-Final-Project

One winner per job. When several installed skills could plausibly handle a task, this table
decides. It also names the skills not to pick, because those are the ones that get chosen by
mistake.

BMAD v6.12.4 (`bmm` module) is installed in `.claude/skills/`. Every winner below was checked
as installed on 2026-10-21.

## Routing

| Job | Winner | Not these |
|---|---|---|
| Scaffold or gap-fill the planning docs | `scaffold-project` | `init`, `document-generate` |
| Product requirements (`PRD.md`) | `bmad-prd` | `bmad-product-brief`, `bmad-prfaq`, `bmad-spec`, `spec`, `bmad-agent-pm` |
| Pressure-test the idea, persona tiers, or metrics | `bmad-forge-idea` | `bmad-brainstorming`, `bmad-party-mode`, `office-hours` |
| Research a decision (persona grounding, metric design, platform APIs) | `bmad-deep-recon` | `audience-research`, `competitor-analysis`, `bmad-agent-analyst` |
| System architecture (`ARCHITECTURE.md`) | `bmad-architecture` | `design-consultation`, `bmad-spec`, `bmad-agent-architect`, `plan-eng-review` |
| Design system and experience (`DESIGN.md` + `EXPERIENCE.md`) | `bmad-ux` | `design-and-templates`, `design-html`, `design-consultation`, `design-shotgun`, `bmad-agent-ux-designer` |
| Build the Friday Claude Artifact | `artifact-design`, then `artifact-capabilities` for any runtime behaviour | `design-html`, `design-shotgun` |
| Diagrams inside an artifact | `artifact-diagramming` | `diagram` |
| Claude API / Anthropic SDK code, model choice, prompt caching | `claude-api` | — |
| Break the PRD into epics and stories | `bmad-create-epics-and-stories` | — |
| Sprint tracking | `bmad-sprint-planning` | — |
| Implement a feature or fix | `bmad-build` | `bmad-build-auto`, `bmad-agent-dev`, `ship` |
| Scope changed mid-build | `bmad-correct-course` | — |
| Simplify existing code | `/simplify` | `health`, `review` |
| Review a diff or PR (**only when Bennett asks**) | `/code-review` or `bmad-review` | `bmad-code-review`, `review`, `plan-eng-review`, `plan-ceo-review`, `plan-design-review`, `plan-devex-review` |
| Walk Bennett through a change | `bmad-walkthrough` | — |
| E2E tests for the web app | `bmad-qa-generate-e2e-tests` | `qa`, `qa-only` |
| Debug a failure | `investigate` | `bmad-build`, `qa` |
| Repo agent instructions (the `AGENTS.md` marker block) | `bmad-project-context`. **Run it last, once code exists.** | `init`, `document-generate` |
| Retrospective after the demo or prototype | `bmad-retrospective` | `retro` |
| "Which BMAD skill next?" | `bmad-help` | — |

TODO: choose a winner for Vercel deployment in Phase 2 (`setup-deploy` and `land-and-deploy`
are installed but have not been evaluated for this repo).

## Delegating to a subagent

Suggest a subagent rather than delegating automatically. A subagent earns its cost when the
work is a broad search across many files, or independent tasks that can genuinely run in
parallel. For a single known file or symbol, searching directly is faster than briefing an
agent.

## Not in scope here

- **The social-media content suite** (`caption-writer`, `carousel-writer`, `hook-writer`,
  `batch-content-plan`, `content-calendar`, `brand-profile`, `voice-builder`,
  `audience-research`, `analytics-and-reporting`, `instagram-*`, `li-*`, `linkedin-*`,
  `reels-script`, and the rest). These skills *produce* brand content. This project
  *evaluates* someone else's. Never invoke them to write posts for a ministry.
  `audience-research` and `analytics-and-reporting` may be **read as reference** when
  designing personas and metrics, but they are not run.
- **gstack** (`browse`, `qa`, `ship`, `canary`, `benchmark`, `plan-*-review`, and the rest),
  except where a row above names one.
- **iOS** (`ios-*`), **Figma** (`figma:*`), and the **image/video tools** (`nano-banana`,
  `canva`, `capcut`, and the rest).

These are installed but are not competing for any job in this project. Listing them here keeps
them out of the routing table above.

## Maintaining this file

Re-check this file when the installed skill set changes. A row naming a skill that is no
longer installed sends the agent after something that is not there, which is worse than having
no table. If a winner loses in practice, change the row rather than routing around it.
