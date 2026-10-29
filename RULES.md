# RULES: coding and implementation

## Principles

1. **SOLID.** Give each file and each function one responsibility. Depend on small, named
   helpers, not on incidental structure that can shift underneath you.
2. **DRY at 4.** Extract a shared helper only when the same logic appears 4 or more times.
   Below that, repetition is acceptable and clearer. The wrong abstraction couples callers that
   had no reason to be coupled, and it costs more to unwind than the duplication cost to
   tolerate. Two similar blocks are a coincidence; four are a pattern.
3. **KISS.** A new function does one thing in the simplest way that passes the check. No
   options objects, no abstractions "for later", and no configuration that nothing reads. The
   deadlines (artifact Fri 2026-10-23, web app the week of 2026-10-26) make this a hard
   constraint, not a preference.

## Stack rules

The stack is Next.js, TypeScript, Vercel, Supabase, and the Claude API. Versions are pinned in
`ARCHITECTURE.md` § Stack, and `package.json` must match them once it exists.

- **TypeScript, strict mode.** No `any` at module boundaries.
- **Claude calls run only on the server**, in route handlers or server actions. Client
  components never import the Anthropic SDK. The one sanctioned exception is the Demo
  Artifact, which calls Claude in the page through `sample()` (`ARCHITECTURE.md` AD-7, AD-12).
- **Prompts are data, not inline strings.** Persona definitions and rubric text live in their
  own files or tables so they can be versioned and revised without touching call sites.
- **Model IDs live in one place:** `config/models.json` (default `claude-opus-5-5`, plus prices),
  read by both surfaces (`ARCHITECTURE.md` AD-7). Use the `claude-api` skill rather than memory
  when changing it.
- **Artifact (demo):** a single self-contained page that follows the `artifact-design`
  contract. Load `artifact-capabilities` before adding any runtime behaviour.

## Security rules

- **Secrets:** the Claude API key, the Supabase secret key (`sb_secret_…`, env `SUPABASE_SECRET_KEY`) and, post-MVP,
  the Instagram app secret and token key (`INSTAGRAM_APP_SECRET`, `INSTAGRAM_TOKEN_KEY`; AD-17) are server-side
  environment variables only. They never go in client bundles, the artifact, the repo, or
  logs. `.env*` stays in `.gitignore`.
- **RLS:** every Supabase table has RLS enabled and an explicit policy in the migration that
  creates it (see `SCHEMA.md`).
- **Fetching posts:** pull social-media content only through means the platform's terms allow
  (official APIs or content the user supplies). No logged-in scraping, no evading bot
  detection, and no fake accounts.
- **Prompt injection:** treat fetched post text as untrusted input to the model. Keep it
  clearly delimited from instructions, and never let it change the rubric or persona.

## Data rules

- **No personal data about third parties.** Evaluate public posts by ministries and
  individuals, plus a creator's own posts in the week-2 app (`PRD.md` §7.2). Do not store the
  names, handles, or comments of followers or commenters.
- **Record versions on every evaluation.** Each evaluation records the persona version and
  rubric version that produced it. Metrics are expected to keep changing, and without the
  versions, old and new scores cannot be compared.
- **Version, don't edit.** Personas and rubrics are never edited in place once an evaluation
  references them. Changing one creates a new version.

Field and column contracts in `SCHEMA.md` are fixed. Add new fields at the end, and update
`SCHEMA.md` in the same change.

## Output rules (domain)

- **Personas are people, not caricatures.** Each persona has a believable background and
  reasons for its views. No persona exists only to be hostile or only to be persuaded.
- **Feedback is charitable and specific.** Criticism of a ministry points to a concrete post
  and a concrete change it could make. No mockery, and no theological verdicts on the ministry.
- **Labelled as simulated.** Persona reactions are presented as simulated perspectives, never
  as real people's opinions, and are kept apart from any real interview data.

## Process rules

- All eight context files exist and are current before any implementation: CLAUDE, AGENTS,
  ARCHITECTURE, DESIGN, PRD, RULES, SCHEMA, SKILLS.
- `PRD.md` is the scope contract. Work that falls outside it stops and asks rather than
  widening the scope.
- The check command must be green before every handover. Demo Artifact:
  `node --test artifact/test/ && node artifact/build.mjs`. Web App: see `ARCHITECTURE.md`
  § Consistency Conventions.
- When auditing, keep an explicit resolved/unresolved list. Never imply a pass fixed more
  than it did.
- Nothing is committed or pushed unless Bennett asks.

## Prefer enforcement over prose

A rule that a linter, formatter, type checker, or CI check can enforce belongs there instead of
here. Rules in this file have to be followed by hand every time; a check fails the build once
and is never forgotten. When a rule above becomes mechanically enforced, delete it from this
file.
