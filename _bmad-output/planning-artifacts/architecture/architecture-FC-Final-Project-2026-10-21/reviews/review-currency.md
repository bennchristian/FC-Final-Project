---
review: currency
target: ARCHITECTURE-SPINE.md + SCHEMA-draft.md (architecture-FC-Final-Project-2026-10-21)
lens: Is every committed decision web-researched or reality-checked, rather than asserted from training data?
date: 2026-10-21
reviewer: finalize reviewer (read-only except this file)
verdict: PASS WITH FIXES. Every pinned version exists and matches the registry's latest or the starter's pin. The problems are compatibility and starter-default facts the spine relies on but never states.
---

# Currency review: Witness Review architecture spine

## Method

- **Registry:** I ran `npm view <pkg> version | peerDependencies | engines | exports | time | dist-tags` on 2026-10-21 for every row of the Stack table and for the peers and plugins those packages pull in.
- **Official docs:** nextjs.org, supabase.com, vercel.com, platform.claude.com, eslint.org.
- **Package files:** I read the published type definitions of `@anthropic-ai/sdk@0.137.0` and `server-only@0.0.1` on unpkg.
- **Starter:** I read the `create-next-app` source at tag `v16.4.2` (`packages/create-next-app/templates/index.ts`).
- **Memlog:** each `(version)` and `(constraint)` entry was re-checked rather than trusted.
- **Out of scope:** the Artifact `sample` facts (runtime contract 0.2.88), as the brief directs.

## Claim → verification table

| # | Claim in spine / schema / memlog | Verified? (source) | Status | Fix |
|---|---|---|---|---|
| 1 | Node 24.x on Vercel functions | vercel.com/docs/functions/runtimes/node-js/node-js-versions: "24.x (default)", 22.x available; changelog "Node.js 20 is being deprecated on October 1, 2026" | confirmed | Add `"engines": {"node": "24.x"}` to `package.json` so the major is pinned in code |
| 2 | next 16.4.2 | `npm view next version` → 16.4.2 (published 2026-10-15); engines `node >=20.9.0` | confirmed | — |
| 3 | react 19.3.1 | `npm view react version` → 19.3.1 (2026-10-14). The create-next-app@16.4.2 template writes `react`/`react-dom` as exact **`"19.3.0"`** (`nextjsReactPeerVersion`) | confirmed, but differs from the starter | Pick one. Either bump to 19.3.1 after scaffolding or record 19.3.0 (L1) |
| 4 | typescript 5.9.3 | Registry latest is **7.0.2** (6.0.3 also exists). The template writes `"^5"`. `typescript-eslint@8.72.0` peer is `typescript >=4.8.4 <6.1.0`, so TS 7 would break lint | confirmed (deliberately behind latest) | Keep 5.9.3. Add one line to the spine saying why: the typescript-eslint peer range |
| 5 | eslint 9.39.5 | Exists, with dist-tag `maintenance`; `latest` = 10.13.0. eslint.org/version-support: **"ESLint v9.x reached end-of-life on 2026-08-06"** | outdated (EOL), forced by other pins | See M3 |
| 6 | eslint-config-next 16.4.2 | `npm view` → 16.4.2; peer `eslint >=9.0.0`. Its deps `eslint-plugin-react@7.37.5` (`^9.7`), `eslint-plugin-import@2.32.0` (`^9`) and `eslint-plugin-jsx-a11y@6.10.2` (`^9`) do not accept ESLint 10 | confirmed | It is what pins ESLint to 9 (M3) |
| 7 | tailwindcss 4.3.3 | `npm view` → 4.3.3; template `"^4"` (Turbopack uses `@tailwindcss/turbopack`, not `@tailwindcss/postcss`) | confirmed | — |
| 8 | @anthropic-ai/sdk 0.137.0 | `npm view` → 0.137.0 (2026-10-20); optional peer `zod ^3.25 \|\| ^4`. `resources/beta/messages/messages.d.ts` has `parse()`, `fallbacks?: BetaFallbacksParam` (`Array<…> \| 'default'`), `output_config?: BetaOutputConfig` (`format: json_schema`), `usage.iterations` with `type: 'fallback_message'`. `helpers/zod` and `helpers/beta/zod` (`betaZodOutputFormat`) both import `zod/v4` | confirmed | See M2 for which entry point to use |
| 9 | @supabase/supabase-js 2.118.0 | `npm view` → 2.118.0 (2026-10-15); engines `node >=22.0.0` | confirmed | — |
| 10 | @supabase/ssr 0.12.7 | `npm view` → 0.12.7; peer `@supabase/supabase-js ^2.114.0` (satisfied) | confirmed | — |
| 11 | Supabase CLI 2.121.0 | `npm view supabase version` → 2.121.0 (2026-10-14) | confirmed | — |
| 12 | zod 4.6.7 | `npm view` → 4.6.7; exports include `./v4`, which the SDK helpers import | confirmed | — |
| 13 | vitest 5.0.5 | `npm view` → 5.0.5. engines `node ^22.12.0 \|\| ^24 \|\| >=26`. **`vite` is a required (non-optional) peer** (`^6.4 \|\| ^7 \|\| ^8`; latest 8.3.5) and is not a dependency. `@types/node` peer `^22 \|\| >=24` | confirmed, with gaps | See M6 |
| 14 | server-only 0.0.1 | `npm view` exports: `react-server` → `empty.js`, `default` → `index.js`, which **throws** ("cannot be imported from a Client Component module") | confirmed, with gaps | See M6 (Vitest resolves the `default` condition) |
| 15 | `claude-opus-5-5`, prices beside the constant | platform.claude.com models overview: API ID `claude-opus-5-5`, $4 / $20 per MTok, adaptive thinking always on, default effort `medium`, retirement not before 2027-09-22 | confirmed | — |
| 16 | `CLAUDE_EFFORT = "medium"` set explicitly | Effort docs: `output_config.effort`, GA, no beta header; "medium" is Opus 5.5's default, so setting it is identical to omitting it | confirmed | — |
| 17 | Structured outputs via `output_config.format` | Structured-outputs docs: GA, no beta header, `claude-opus-5-5` supported; `messages.parse()` plus `zodOutputFormat`. Schema subset: `additionalProperties:false` required; **`minItems` only 0 or 1, no `maxItems`, no numeric or string min/max** | confirmed, with caveats | See L2 |
| 18 | Server-side refusal fallback `fallbacks: "default"`, header `server-side-fallback-2026-07-01` | Refusals-and-fallback docs: beta; the header must be exactly `2026-07-01` (`2026-06-01` accepts only the list form; any other value → 400). Supported for Opus 5.5 (not Haiku 5.5). The serving model is in top-level `model`. **Each attempt is billed at its own model's rates via `usage.iterations`; top-level `usage` covers only the final attempt.** Default routing is "not published per model" | confirmed, with caveats | See M1 and M2 |
| 19 | Next 16 session refresh via `proxy.ts` (renamed from middleware) | nextjs.org proxy reference: "v16.0.0 Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime"; codemod `middleware-to-proxy`. **The spine never mentions a proxy file** | confirmed, and the spine has a gap | See H1 |
| 20 | Supabase's Next.js App Router SSR guide | supabase.com/docs/guides/auth/server-side/nextjs: `proxy.ts` on Next 16+; refresh with `supabase.auth.getClaims()`; "Never trust `supabase.auth.getSession()` inside server code such as Proxy"; env `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | confirmed (env names match the spine) | See H1 |
| 21 | Publishable (`sb_publishable_`) and secret (`sb_secret_`) keys; legacy keys deprecated | supabase.com/docs/guides/api/api-keys: "deprecating the anon and service_role keys by the end of 2026" (no exact date); a secret key returns 401 to a browser User-Agent and bypasses RLS | confirmed | — |
| 22 | Public sign-up off, while Bennett creates auto-confirmed users in the dashboard | general-configuration docs: when off, "only existing users can sign in". github.com/supabase/auth/issues/1226 (maintainer): the dashboard "Create new user" dialog has an **Auto Confirm User** option, uses the admin create-user endpoint and sends no email. No official page states that admin-created users bypass the sign-up toggle | partially confirmed | See L4 |
| 23 | Supabase Free: one project, backups at "Free defaults" | supabase.com/pricing (Free): "Free projects are paused after 1 week of inactivity"; automatic backups **"Not included"**; 2 active projects; 500 MB database | confirmed; the spine's wording is misleading | See M4 |
| 24 | Vercel 4.5 MB request body | vercel.com/docs/functions/limitations: "maximum payload size for the request body or the response body … is 4.5 MB" (413 `FUNCTION_PAYLOAD_TOO_LARGE`) | confirmed | — |
| 25 | Vercel Hobby max duration 300 s | Same page: Hobby "300s default and maximum" (Fluid compute) | confirmed | — |
| 26 | Hobby allows this use | vercel.com/docs/limits/fair-use-guidelines: Hobby is "non-commercial personal use only"; commercial includes "a paid employee or consultant writing the code" | policy confirmed; whether it applies here is unverifiable | See M5 |
| 27 | (Not in the spine) Next.js Server Action body limit | nextjs.org serverActions config: "By default, the maximum size of the request body sent to a Server Action is 1MB" | **new constraint, not considered** | See H3 |
| 28 | Vitest 5 works with Next 16 and TS 5.9 | No peer conflict with next or typescript. The Next.js Vitest guide (updated 2026-08-25) is current. It says async Server Components are unsupported, which is irrelevant because tests cover only `src/domain` and `src/server/caps` | confirmed, with gaps | See M6 |
| 29 | Anthropic Console workspace monthly spend limit | platform.claude.com/docs/en/api/rate-limits: "you can set custom spend and rate limits per Workspace"; "You can't set spend limits on the default Workspace". Hitting the limit returns HTTP 400 `invalid_request_error` "…specified workspace API usage limits". Setting limits through the Admin API is early access; the Console UI is not | confirmed | See L5 |
| 30 | create-next-app@16.4.2 starter defaults (memlog: `--no-agents-md`, scaffold into temp dir) | nextjs.org create-next-app docs, recommended defaults: "TypeScript, ESLint, No React Compiler, Tailwind CSS, **No src/ directory**, App Router, **Cache Components**, AGENTS.md, **Agent feedback**"; Turbopack on by default. The template writes `cacheComponents: true` and `partialPrefetching: true` into next.config and `@types/node "^20"` | confirmed; the spine depends on three defaults it does not record | See H2 and M6 |
| 31 | create-next-app refuses non-empty directories | Not in the docs; the memlog says it was read from the bundle | unverifiable (low impact) | Keep the temp-dir-then-move plan; it is safe either way |
| 32 | Supabase built-in Auth email ~2/hour | Memlog already marks it unverified | unverifiable, moot | No email is sent under AD-11; drop it from the rationale or keep the "unverified" tag |
| 33 | `getClaims()` verifies locally | supabase.com getClaims reference and signing-keys docs: local WebCrypto verification only when the project uses asymmetric JWT signing keys (the default for new projects); otherwise each call hits the Auth server | confirmed | See L8 |

## Findings

### Critical

None. Every pinned package exists at the pinned version, and the model, effort, structured-output and fallback parameters exist as described. Phase 1 (the Demo Artifact) is unaffected by every finding below. All of them land on the Phase 2 Web App scaffold.

### High

**H1. The session-refresh mechanism (`src/proxy.ts`) is missing from the spine.**
- **Problem:** AD-9 says the browser uses `@supabase/ssr` cookies, but nothing names who refreshes the token.
  - Next 16 renamed `middleware.ts` to `proxy.ts`, which runs on Node by default.
  - Supabase's current guide requires a proxy that calls `supabase.auth.getClaims()` so refreshed cookies get written. Server Components cannot set cookies.
  - An implementer working from training data will write a deprecated `middleware.ts`, use `getSession()`, or skip the proxy. Sessions then silently expire and the user-scoped RLS reads fail.
- **Fix:**
  - Add `src/proxy.ts` to the Structural Seed.
  - Add to AD-9: "Session refresh happens in `src/proxy.ts` via `@supabase/ssr` `createServerClient` + `getClaims()`. Server code authorizes with `getClaims()`, never `getSession()`. Every server action and route handler re-verifies the user and does not rely on the proxy matcher." That last clause follows the Next proxy docs' own warning.

**H2. Three starter defaults the spine depends on but never states (Cache Components, `src/`, agent feedback).**
- **Cache Components:** "Yes, use recommended defaults" turns on Cache Components and Partial Prefetching. With that on, every per-user page that reads `cookies()` (all of them, through the Supabase server client) must sit under `<Suspense>` or in `"use cache: private"`, or Next flags the route as blocking. That interacts directly with the check command's `next build`.
- **`src/`:** the spine assumes a `src/` directory, but the default is **no `src/`**.
- **Agent feedback:** it is on by default. It writes `experimental.agentFeedback: true` into next.config.
- **Fix:** record the exact scaffold command in the spine. For example: `npx create-next-app@16.4.2 <tmp> --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --no-react-compiler --no-cache-components --no-agents-md --no-agent-feedback --use-npm`.
  - `--no-cache-components` is the KISS choice for an app where every page is per-user and dynamic.
  - If Bennett prefers Cache Components, add an AD saying auth-reading components live under `<Suspense>`.

**H3. The evaluate request can exceed Next's 1 MB Server Action body limit long before Vercel's 4.5 MB.**
- **Problem:** AD-5 sizes uploads only against Vercel's 4.5 MB. `src/app` lists "server actions, route handlers" without saying which carries evaluate. Up to 4 screenshots at 1568 px JPEG, base64-encoded in the body, routinely exceed 1 MB. A Server Action rejects that by default.
- **Fix:** state in AD-10 that evaluate is a Route Handler (`POST src/app/api/evaluate/route.ts`), so Vercel's 4.5 MB is the only limit. Alternatively, set `experimental.serverActions.bodySizeLimit`. Also state a client-side byte budget, e.g. "total encoded images ≤ 4 MB per request; reject before upload".

### Medium

**M1. Spend ledger under-counts whenever a server-side fallback runs.**
- **Problem:** the spine computes `cost_usd` as token usage × "the prices beside `CLAUDE_MODEL`", and `usage_event` stores one `model_id` per call. The docs say each attempt is billed at the rates of the model that ran it. `usage.iterations` is the per-attempt bill, while top-level `usage` covers only the attempt that produced the returned message. A refusal in a billed category (`bio`, `frontier_llm`, `reasoning_extraction`) plus the fallback is two charges.
  - Default routing is "not published per model", so the price table cannot be closed.
- **Fix:**
  1. Compute cost by summing `usage.iterations`, each at the price of that entry's model.
  2. Write one `usage_event` row per iteration, or add a per-attempt breakdown.
  3. Either switch to the explicit-list form (`fallbacks: [{ model: "<priced model>" }]`, still under the `2026-07-01` header) so every possible serving model has a price, or price an unknown model at the highest current list price (Fable 5.1, $10 / $50).
  4. Record `response.model` for every step, not only Assess.

**M2. `fallbacks` is a beta parameter, so the call path has to be the beta namespace.**
- **Problem:** AD-7 says "structured outputs + `fallbacks: "default"`" without the mechanics. `fallbacks` exists only on the beta Messages API. The Zod helper that pairs with it is `betaZodOutputFormat` from `@anthropic-ai/sdk/helpers/beta/zod`, not `zodOutputFormat` from `helpers/zod`.
- **Fix:** name the call shape in AD-7: `client.beta.messages.parse({ model: CLAUDE_MODEL, output_config: { effort: CLAUDE_EFFORT, format: betaZodOutputFormat(schema) }, fallbacks: "default", betas: [FALLBACK_BETA] })`. Keep `FALLBACK_BETA = "server-side-fallback-2026-07-01"` beside `CLAUDE_MODEL`. The docs say any other header date makes the API reject `fallbacks` with a 400, and a beta can change, so the exact date belongs in one constant.

**M3. ESLint 9.39.5 has been end-of-life since 2026-08-06.**
- **Problem:** the pin is not wrong. `eslint-config-next@16.4.2`'s React, import and jsx-a11y plugins cap their ESLint peer at `^9`, and the starter writes `eslint "^9"`. But the spine presents it as a current pick.
- **Fix:** annotate the Stack row: "EOL upstream; forced by eslint-config-next 16.4.2 plugin peers; dev-only, no runtime exposure. Revisit when eslint-config-next accepts ESLint 10." Biome, which create-next-app offers, is the alternative if Bennett wants a supported linter. It would need `no-restricted-imports` re-expressed (AD-7).

**M4. Supabase Free pauses after 1 week and includes no backups.**
- **Problem:** the Deferred line "backups beyond Supabase Free defaults" implies Free has some default backup. The pricing page says automatic backups are "Not included". Bennett is not sharing the link, so the project will very likely pause between the 10-26 week and any later showing.
- **Fix:**
  - Reword that line to "Supabase Free has no automatic backups."
  - Add a pre-demo step: restore the project if it is paused, and take `supabase db dump` before each demo.
  - Content tables can always be rebuilt from `content/` via `publish:content`. User Reviews cannot.

**M5. Vercel Hobby is "non-commercial personal use only".**
- **Problem:** Vercel's definition of commercial use includes "a paid employee or consultant writing the code". A class final project on Hobby is fine. Work done as part of paid employment or consulting would not be.
- **Fix:** ask Bennett one question and record the answer as a `(constraint)` in the memlog. If the answer is "paid work", Hosting needs Pro.

**M6. Vitest 5 toolchain gaps (vite peer, `@types/node`, `server-only`).**
- **vite:** `vite` is a required peer of `vitest@5.0.5` but is absent from the Stack table.
- **`@types/node`:** the starter writes `@types/node "^20"`, which is outside Vitest 5's `@types/node` peer (`^22 || >=24`) and behind the Node 24 runtime. The memlog notes 24.19.2, but the Stack table omits it.
- **`server-only`:** AD-7 puts `import 'server-only'` in every `src/server/` module, and tests cover `src/server/caps/`. `server-only`'s default export throws outside the `react-server` condition, so those tests fail on import.
- **Fix:**
  - Add Stack rows for `vite` 8.3.5 and `@types/node` ^24 (24.19.2).
  - Add a note that `vitest.config.mts` aliases `server-only` to an empty module (or sets `resolve.conditions: ['react-server']`) and resolves the `@/*` path alias (`vite-tsconfig-paths`, per the Next.js Vitest guide, or Vite's native tsconfig paths).

### Low

**L1. React pin differs from the starter.** The Stack says 19.3.1; create-next-app 16.4.2 writes exact `19.3.0`. Record the bump step or the 19.3.0 version so `npm ci` matches the doc.

**L2. The structured-output grammar can't express the contract's counts or ranges.** It cannot enforce "exactly one score per Criterion", "4–6 questions, exactly 4 standing", "1–3 reasons", "3–5 talking points", or `score` 1–5. `minItems` only accepts 0 or 1, and `maxItems` and numeric min/max are unsupported; the SDK helper moves such constraints into descriptions and validates locally. AD-4's local Zod check is therefore the real gate, so `invalid_model_output` remains a normal outcome. Say so in AD-4 so no one removes the local check as redundant.

**L3. `AssessOutput.scores[].reason` sits near the `reasoning_extraction` trigger.** The refusal docs list "a `reasoning`, `thinking`, or `trace` field in JSON output" as a trigger. That category is billed and has no fallback. A one-sentence `reason` is probably fine. Describe it in the prompt and schema as "a one-sentence explanation", never "reasoning", or rename it to `explanation`.

**L4. Smoke-test AD-11's dashboard flow.** The toggle and the "Auto Confirm User" dialog are confirmed. That admin-created users can sign in while sign-ups are off is standard behaviour but not stated on an official page, and there is an open report of a related "Email not confirmed" edge case (supabase/supabase#29632). A five-minute check on the real project closes it.

**L5. Map the workspace-limit response.** The $30 backstop answers HTTP 400 `invalid_request_error` "…specified workspace API usage limits". Map that to `monthly_cap_reached`, not `upstream_error`. Spend limits cannot be set on the Default workspace, which the spine's "dedicated workspace" already avoids. Make sure the key is created in that workspace.

**L6. Record why the downscale target is 1568 px.** That is older-model vision guidance. The memlog records a 2576 px high-resolution tier for Claude 4.7+. 1568 px is a fine choice for the body budget, but write that reason down so no one "corrects" it.

**L7. Pin the Node major in code.** Add `"engines": {"node": "24.x"}` so a dashboard change cannot silently move the runtime.

**L8. `getClaims()` verifies locally only with asymmetric JWT signing keys.** That is the default for new projects. Confirm the project uses them; otherwise every proxy pass makes a network call to Auth.

## What was already well-verified

- The memlog's `version` entries match the registry exactly on 2026-10-21.
- The Claude pricing and model facts match platform.claude.com.
- The Vercel 4.5 MB and 300 s limits match the docs.
- The Supabase key-migration facts match the official API-keys page.
- The FR-3 TikTok oEmbed drop was settled by a live test, not training data.

The gaps above are all facts the spine relies on but no one checked: starter defaults, a framework rename, beta-API mechanics, and billing semantics.
