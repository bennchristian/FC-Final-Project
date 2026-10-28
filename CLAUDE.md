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
- **Artifact URL:** https://claude.ai/artifact/Mkc4qYCLCFXqMLq8Yf1Kdq (first published 2026-10-21, contract 0.2.88, shared with the organisation; capabilities `sample` + `downloads` + `mcp` for Supadata reel transcripts, added 2026-10-26, AD-13 / FR-3a, + `db` + `user` for Past Reviews, added 2026-10-26). A republish reloads open copies, which wipes any Review not yet copied or saved. Every republish passes this URL (AD-12). `witness-rubric@1`, `persona-set@1` and `prompts@1` are locked: any content change is a new `@2`. **Live since 2026-10-23 (version 3):** `witness-rubric@2 · persona-set@1 · prompts@2`, which answer the feedback on the first test run (Personas suggested edits, reactions lacked depth, scores ran high). These are locked too. **Version 4 (2026-10-26)** adds reel transcripts: a Post whose link is an Instagram reel is transcribed through the viewer's Supadata connector (FR-3a, AD-13). It runs on the latest runtime contract (on 0.2.88 the page never got `mcp`).
- **Copy editor (version 5, 2026-10-26):** also makes "Start here" clickable (the envelope layers no longer catch clicks). Click the page, then Shift+E on the Artifact opens Bennett's owner-only copy editor. It reaches every tab and the Review results; How it works edits are display-only, and Claude's text is never saved (AD-12). **Version 6 (2026-10-26)** ships that together with the brand restyle (`page.css`, masthead, Dark mode toggle in `theme.js`). Its saved `copy-edits.json` goes at `artifact/copy-edits.json`; the build inlines it, and the next republish carries the copy (PRD §4.11, AD-12). **Artifact service version 11 (2026-10-26)** adds "Why Living Letter" (2 Corinthians 3:2–3) and "Who this is for" (creators reviewing their own Posts first, then individuals, then youth leaders) under Overview in `build.mjs`. **Version 12 (2026-10-26)** turns 2. Add Posts into two either/or toggles: "Link to the Post" or "Paste the transcript", then "Add screenshots" or "Paste the text". Only the chosen field is read on submit (`syncFormModes` in `ui.js`).
- **Artifact service version 13 (published 2026-10-26):** new page flow, merged with Bennett’s versions 11–12 (his either/or Add Posts toggles kept; his Why/Who copy replaced by the Home sections). The envelope leads to Home (what, why with cited stats, who it is for, overview, why “Living Letter”), then Review (send) → Results → Next steps (Copy, Save as file, View past Reviews, Next post) with the Outreach Plan optional below. How it works is reordered, and Roadmap is now a footer link. **Past Reviews** save each sent Review to the viewer’s private `db` subtree (`artifact/src/past.js`, SCHEMA §6). Published with `db: {}` and `user: {}` alongside the existing capabilities (AD-12); every later publish must keep them. **Artifact service version 14 (published 2026-10-27 from branch `Alternative`, commit `acccf33`):** the Review page follows the design partner’s mockup: a letter scrolling inside an open envelope, a sticky Mailbox with a Next… card (Send feedback = the Outreach Plan), the envelope flying into the Mailbox slot on Send (`artifact/src/desk.js`), a profile icon opening Your profile (Past Reviews; target audiences and overall feedback still Roadmap), and the intro letter’s Start here split into Learn more (Home) and Begin review (the Review page). Needs no new capability. **Version 15 (2026-10-27, commit `0aef870`):** the envelope fits the screen (container-query sizing, open flap shown, never cropped), and Why Living Letter cites social-media sharing (Pew 2014) instead of livestreamed services. **Version 16 (2026-10-27, commit `dc9c8bb`):** Home follows the design partner's home mockup (tagline "may be the only gospel people know", ESV 2 Cor 3:2–3, "Rubric Scores"); illustrations are the design partner's transparent PNGs in `artifact/src/img/`, inlined as data URIs (page about 780 KB). The build writes `<meta charset="utf-8">` first, since only the Artifact host adds one. **Version 17 (2026-10-27, commit `565d2a6`):** Go back is removed (the intro no longer reopens), and the Home intro paragraph is centred. **Version 18 (2026-10-27, commit `6654777`):** the Review desk follows the design partner's envelope mockup: the envelope fills the column (1350:1500), bleeds up to 6rem into the left gutter, and the Review page ends with it; letter type scales with the envelope (`--lt`); the Roadmap link moves under the Mailbox on the desk (`showView` in `ui.js`). **Version 19 (2026-10-27, commit `0e956e1`):** dark mode uses the mist blue-grey (`--heading-alt`, `--strong` in `page.css`) for section headings, Home subtitles and the results summary; page titles, logo and nav stay cream; light mode is unchanged. **Version 20 (2026-10-27, commit `a8a2d82`):** How it works is a six-tab toggle (Overview, Scoring, Personas, Mechanism, Sources, Privacy; a 3 × 2 grid on phones, `syncHowTab` in `ui.js`), with the ten Criteria and the Personas collapsible; the letter paper stays white in dark mode (page tokens reset on `.letter, .feedback-letter` in `page.css`). **Version 21 (2026-10-27, commits `e2d4885`, `5e28367`):** the masthead and intro logos are the design partner's PNGs (`artifact/src/img/logo-red.png`, `logo-cream.png` for dark mode); boxes, buttons and toggles share `--radius: 5px`; Send feedback opens the Ministry Outreach Plan in a popup letter (a modal `<dialog id="feedback">`, message plus Copy message, then Talking Points as affirmation and concern columns), and the Results no longer have an Outreach section. **Version 22 (2026-10-27, commit `efa2b2c`):** one type scale (`--fs-2xs` to `--fs-3xl`, 13–64px; body 18px) and one left edge for every page (prose kept to `--measure`); Dark mode is a moon/sun icon in the masthead; new CSS sizes should use a `--fs-*` step, not a literal. **Version 23 (2026-10-27, commit `77f0a91`):** How it works' Overview tab follows the design partner's mockup: four illustrated steps joined by CSS-mask arrows, then the closing line centred; the other tabs keep `--measure`. **Version 24 (2026-10-28, commit `7c13506`):** the design partner's transparent icons (`artifact/src/img/icon-*.png`) replace the mockup cut-outs in How it works and head the four columns of Home's Overview, now one slate panel; `build.mjs` inlines each icon once as a CSS variable (`ICON_CSS`, shown via `.icon-*` classes), so reuse adds no size (page about 1.26 MB). **Version 25 (2026-10-28, commit `30b1151`):** How it works' Scoring and Personas tabs are two columns from 1000px (explanation left, the ten Criteria or the Personas right; `.how-split`); the "Versions: …" label is gone from the footer and Past Reviews (saved and copied Reviews keep it, and each Post's results still show its versions, as PRD requires). **Version 26 (2026-10-28, commit `cc42d31`):** the intro letter stands higher on its stage (top 190, `--ll-letter-in` 630px in `intro.css`) so the room above it and below Learn more / Begin review is about even. **Version 27 (2026-10-28, commit `a568ec2`):** the profile (PRD "Profile in the Demo Artifact"): signed in with the viewer's Claude account (no name: that needs `user: {scopes: ["profile"]}`, not declared), role (creator, leader or individual), and for creators their preferences (how they want to come across, theology, ranked Target Audiences) and a code-computed Profile Summary; Persona Reactions follow a creator's ranked audiences, scores unchanged. The profile is `data/users/<id>/profile` (`artifact/src/profile.js`, skipped when Reviews are listed), and each saved Review keeps a `foundation` copy. User-facing "Past Reviews" is now "Saved Reviews". **Version 28 (2026-10-28, commit `2f424e1`):** "How you want to come across" and "Your theology and tradition" each save on their own; once saved they read as text with "Last edited …" and Edit (Save and Cancel while editing), kept in `come_across_at` and `theology_at`; the audience order has its own Save order. **Version 29 (2026-10-28, commit `26ebfe1`):** Home motion (`artifact/src/home.js`): the first time Home shows, the envelope mark draws, the hero types in place, then the underline draws under "the only gospel people know"; once typed and in view, the four devices (`device-*.png`, split from the old devices picture) drop in and float. Reduced motion skips it. The hidden Browser pane only advances animations while being screenshotted, so check motion with repeated screenshots. **Version 30 (2026-10-28, commit `84a03bb`):** each hero block stays hidden until its own typing starts (`type-pending`), typing is about a third faster, and the devices wait for the fully drawn underline and 50% in view (checked on `intersectionRatio`, not just `isIntersecting`), then hover up and down only, 3–5px on 9–12s loops.
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

- This Mac has no `node`. Run the check command with Bun instead: `~/.bun/bin/bun test artifact/test/ && ~/.bun/bin/bun artifact/build.mjs` (all 180 tests pass under Bun 1.4.2).

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
