---
title: 'Web App foundation: scaffold, email sign-in, first migration, Run a Review page'
type: 'feature'
created: '2026-10-30'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '5c5445e61f1f2def90ad0eca11860d2c5d520dac'
context:
  - '{project-root}/ARCHITECTURE.md'
  - '{project-root}/SCHEMA.md'
  - '{project-root}/RULES.md'
---

> **Closed unbuilt (2026-10-30).** Bennett changed course the same night: the live site is the web demo (PRD §4.14, ARCHITECTURE AD-19), with no real sign-in or database. The scaffold this spec started was removed. Reopen it only when the real companion Web App (AD-18) is wanted.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Web App companion (PRD §4.13, AD-18) has no code. Nothing yet lets a person sign in or learn how to run a Review in the Artifact at no cost, and the database the next two specs need does not exist.

**Approach:** Scaffold Next.js 16.4.2 into the repo root per ARCHITECTURE § Consistency Conventions. Add Supabase email sign-up, sign-in and sign-out (AD-11, AD-9). Write the first migration (`profile`, `review`, RLS) and apply it to `dev` only. Ship a public Run a Review page carrying the FR-25 caveat, in the Artifact's brand.

## Boundaries & Constraints

**Always:**
- Pin the Stack versions from ARCHITECTURE.
- Every `src/server/**` module imports `server-only`.
- Server code derives the user only from `supabase.auth.getClaims()`.
- Error responses use the conventions' shape with fixed copy.
- Brand tokens and fonts come from `artifact/src/page.css`, ported as CSS custom properties, light and dark.
- The FR-25 caveat is a code constant, copied verbatim from PRD §4.13.
- The Artifact check (`node --test artifact/test/ && node artifact/build.mjs`) stays green and part of the check command.

**Never:**
- `@anthropic-ai/sdk`, or any model call, anywhere in `src/` (enforced by lint).
- Touching `prod` (no `db push` to it, no link).
- Editing `artifact/`, `content/`, `conformance/` or `config/`.
- Building the Review File upload, Saved Reviews, profile editing or Profile Summary: those are the two deferred specs.
- `getSession(` anywhere in `src/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sign up | new email + password ≥ 8 chars | account created. With confirmation off: signed in, sent to `/`. With it on: told to check email | duplicate or invalid → fixed message, form kept |
| Sign in | valid credentials | session cookie set, masthead shows Sign out | wrong credentials → one fixed "email or password is wrong" message |
| Sign out | signed in | cookies cleared, back to `/` | — |
| Run a Review page | anyone, signed in or not | caveat, three-step round trip, link opens `NEXT_PUBLIC_ARTIFACT_URL` in a new tab with `rel="noopener noreferrer"` | env var missing → build fails (checked at module load) |
| RLS | signed-in user A queries `review`/`profile` via the publishable key | only A's rows; no insert, update or delete | — |

**Decisions (Bennett, 2026-10-30):**
- "Confirm email" stays off in both projects until an SMTP provider exists. Record that in AD-11 as temporary. The sign-up code handles both settings.
- Password reset is deferred until SMTP exists. Until then Bennett resets passwords in the Supabase dashboard.
- The agent adds `NEXT_PUBLIC_ARTIFACT_URL` (the live Artifact URL) to the Vercel `living-letter` project for Production, Preview and Development with the Vercel CLI.
- The spec is kept whole at about 1,700 tokens.

</frozen-after-approval>

## Code Map

- `artifact/src/page.css:7-48` -- tokens (`--bg`, `--fg`, `--heading`, `--accent`, `--muted`, `--line`, `--soft`, `--band`, `--radius`, `--serif`, `--sans`, `--fs-*`, `--measure`) and both dark-mode blocks. Port them, don't import the file.
- `artifact/src/page.css:84-100` -- masthead and `.brand` logo swap (light/dark).
- `artifact/src/img/logo-red.png`, `logo-cream.png` -- copy to `public/`.
- `artifact/build.mjs:94` -- Google Fonts: Instrument Serif and Open Sans 400/500/600. Use `next/font/google` instead.
- `CLAUDE.md` §2 -- Artifact URL `https://claude.ai/artifact/Mkc4qYCLCFXqMLq8Yf1Kdq`.
- `.env.local` -- has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (dev). Add `NEXT_PUBLIC_ARTIFACT_URL`. Never print values.
- `supabase/` -- only `.temp/` (linked to dev `hoiiempiwievlqchzzdv`). Run `supabase init` for `config.toml`, keeping the link.
- `.gitignore` -- `.env*`, `artifact/dist/`, `node_modules/`. Merge Next's entries (`.next/`, `next-env.d.ts`, etc.).
- `SCHEMA.md` §2 `profile`, `review`; §5 RLS; §7 migrations -- the migration's source of truth.
- `ARCHITECTURE.md` § Consistency Conventions -- scaffold command, lint rules, check command.
- Don't overwrite: `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`, `supabase/`, `artifact/`, `content/`, `conformance/`, `config/`, `docs/`, `video/`, `_bmad*/`, `.claude/`.

## Tasks & Acceptance

**Execution:**
- [ ] repo root -- scaffold with `create-next-app@16.4.2` (flags per conventions) into a temp dir and move it in, merging `.gitignore`. Add `typecheck` and `test` scripts, `engines.node: "24.x"`, deps pinned to Stack (`@supabase/ssr`, `@supabase/supabase-js`, `zod`, `vitest`, `server-only`). Add a `check` script that runs the full check command -- one green command for all checks.
- [ ] `eslint.config.mjs` -- `no-explicit-any` error; ban `getSession(`; `no-console` outside `src/server/log.ts`; `no-restricted-imports` for `@anthropic-ai/sdk` in `src/` and `@/server/*` in `src/components/` -- AD-18, AD-9.
- [ ] `src/server/supabase.ts`, `src/lib/supabase-browser.ts`, `src/proxy.ts` -- `createServerClient` with cookie handling; the proxy refreshes the session through `getClaims()` -- AD-11.
- [ ] `src/server/log.ts` -- the error boundary for Server Actions; logs `{code, step, ids, err.name}` only -- AD-15.
- [ ] `src/app/(auth)/sign-in`, `sign-up` pages + `src/app/actions/auth.ts` -- Server Actions with zod validation and fixed error copy; sign-out action -- FR-18.
- [ ] `src/app/layout.tsx`, `src/app/globals.css`, `src/components/Masthead.tsx` -- fonts, ported tokens, logo, nav (Run a Review; Sign in or Sign out), honouring `prefers-color-scheme`.
- [ ] `src/app/page.tsx` + `src/content/copy.ts` -- the Run a Review page at `/`: what to do (run in the Artifact, Save Review as file, add it here, which says "coming next" until spec 2), the FR-25 caveat verbatim, the Artifact link -- FR-25.
- [ ] `supabase/migrations/<ts>_init.sql` -- `profile` and `review` exactly per SCHEMA §2 (checks, index, `forbid_update` trigger), RLS select-own policies, no insert/update/delete grants for `anon`/`authenticated`. Apply with `supabase db push` to dev -- SCHEMA §5, §7.
- [ ] `src/**/*.test.ts` -- Vitest: env guard, auth action validation, a source scan asserting no `@anthropic-ai/sdk` and every `src/server/**` imports `server-only`.

**Acceptance Criteria:**
- Given the repo, when `npm run check` runs, then lint, typecheck, Vitest, `next build`, the Artifact tests and the Artifact build all pass.
- Given the dev database after `db push`, when the migration is listed, then `profile` and `review` exist with RLS enabled and the select-own policies only.
- Given a phone-width viewport (375px), when `/` loads, then no horizontal scroll and the caveat is fully readable.

## Design Notes

`/` is the Run a Review page, public, because FR-25 is the Web App's front door: it tells a visitor how a Review happens before asking them to sign in. Saved Reviews and Profile get nav links when their specs ship. The theme follows the system setting only; a toggle can come later.

## Verification

**Commands:**
- `npm run check` -- expected: all green.
- `supabase migration list` -- expected: the init migration applied on the linked dev project.

**Manual checks:**
- `npm run dev`: sign up, sign out, sign in on dev. `/` matches the Artifact's cream/red brand and has a dark mode.
