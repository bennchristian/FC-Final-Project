# SCHEMA: FC-Final-Project

**Status: no database yet.** The Friday 2026-10-23 demo is a Claude Artifact with no backend.
The plan for the week-2 web app is Supabase (Postgres). Nothing below is a decided table until
a migration creates it.

## Entity overview

TODO: `bmad-architecture` decides this. These are candidate entities taken from `docs/brief.md`.
They are not commitments:

| Candidate | Why it might exist |
|---|---|
| `persona` | The non-believer personas, at several levels. Versioned so their wording can change. |
| `rubric_version` / `metric` | The evaluation metrics, which are expected to change. Each set is versioned. |
| `ministry` / `profile` | The account being evaluated. |
| `evaluation` | One run of personas and a rubric against a profile's posts. |
| `interview_plan` | A generated plan for interviewing real non-believers. |
| `ministry_report` | A generated plan for telling a ministry how it could adapt. |

## Tables

TODO: write this once the first Supabase migration exists. Until then there are no tables.

## Off-store state

- **Claude API key**: in an environment variable on the server only (Vercel project env in
  week 2). It never reaches the browser and never goes into the artifact.
- **Supabase keys**: the anon key may be public. The service-role key is server-only.
  TODO: confirm when the Supabase project is created.
- **Artifact storage (demo)**: anything the Friday artifact keeps is stored in the artifact's
  own runtime, not in Supabase. TODO: record what it keeps once the artifact is built.
- **Fetched social-media content**: post text and images pulled from a profile are
  third-party content. TODO: decide whether they are cached and for how long (see the data
  rules in `RULES.md`).

State that lives outside the database (caches, properties, environment, external services) is
invisible to a schema dump. It is the part people forget exists when reasoning about what a
change touches.

## Access control (RLS)

TODO: once tables exist, every table needs RLS enabled and an explicit policy in the same
migration that creates it.

Access rules are the security boundary, not a convenience layer. Every entity a client can
reach needs an explicit policy. In Postgres, a table with RLS enabled and no policy denies
everything, and a table without RLS enabled grants everything. Both failures are silent.

## Migrations

TODO: none yet. Migrations will live in `supabase/migrations/` (the Supabase CLI default).
Confirm when the project is initialised.

Once a migration has been applied to any shared environment, it is append-only. To change an
applied migration, write a new one that corrects it.

## Keeping this true

This file describes what exists. When it disagrees with the migrations, the migrations are
right and this file is stale. Regenerate the affected section rather than reconciling by hand.
