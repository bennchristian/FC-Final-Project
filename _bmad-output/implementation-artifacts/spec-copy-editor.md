---
title: 'Owner copy editor in the Demo Artifact'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: '28ca10242dcdc606706a329ec3a1c208fd20f6f7'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/ARCHITECTURE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bennett wants to rewrite and restyle the page copy himself (intro letter and main page) without going through code, and today every wording or styling change needs a source edit.

**Approach:** A hidden copy editor: Shift+E shows a floating bar whose toggle turns edit mode on. In edit mode, static text boxes are editable in place and can be moved, and can be restyled with font, size, bold, italic and underline. "Save edits" downloads `copy-edits.json`. Bennett drops that file at `artifact/copy-edits.json`. `build.mjs` validates and inlines it, and the page applies it on load, so the next republish carries the copy for every viewer.

Decisions (Bennett, 2026-10-26): export-and-fold-into-build, not live self-saving. The toggle stays hidden until Shift+E. Record it as an owner-only authoring aid in `PRD.md` and AD-12.

## Boundaries & Constraints

**Always:** The page still keeps nothing (AD-12): no storage, no new capability. Saving uses the existing `downloads`, with a clipboard copy as the fallback. Only static copy is editable. Applied edit HTML is sanitized to an allowlist. While editing, page clicks are suppressed so buttons and labels don't fire. Shift+E is ignored while focus is in an input, textarea, select or contenteditable.

**Never:** Editing rendered Review output, How-it-works content from `content/` (locked versions), status or error lines, or the versions label. Never `localStorage`, network calls, or changes to `content/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| No edits file | `artifact/copy-edits.json` absent | Build inlines `COPY_EDITS = null`; page unchanged | N/A |
| Valid edits file | `{version:1, edits:[{text,n,html?,style?}]}` | Each edit is applied to the n-th box whose original normalized text equals `text` | N/A |
| Bad file shape | wrong version, empty `text`, unknown style key, non-string value | Build fails, naming the field | `fail()` |
| Stale edit | the source text changed, so there is no match | Not applied; the bar shows "N saved edits no longer match"; kept in the next export | warn, don't drop |
| Hostile html | `<script>`, `onclick=`, `javascript:` href | Removed by the sanitizer; text kept | silently stripped |
| Selection vs box | text selected inside the active box | B/I/U/font/size apply to the selection; otherwise to the whole box | N/A |

</frozen-after-approval>

## Code Map

- `artifact/build.mjs` -- concatenates `src/*.js` into one IIFE (`toScript` strips import/export); add the optional `copy-edits.json` read + check, the `COPY_EDITS` const, `editor.css` in `<style>`, and `editor.js` **after** `intro.js` so the intro and the ui.js `start()` copy exist before edits apply.
- `artifact/content.mjs` -- `ROOT`; pattern for check functions returning `string[]`.
- `artifact/src/ui.js` -- the same outer scope as the editor: reuse `state.downloads` (`save({filename,data})`, errors `declined`/`rate_limited`) and `$`. `start()` sets `#lands-anywhere` and `#link-notice` once (editable); `render()` rewrites `#posts`, `#outreach-slot`, `#availability`, `#images-hint`, `#post-count` (not editable).
- `artifact/src/intro.js` / `intro.html` -- `#ll-intro` overlay (z 2147483000), a stage scaled by `--s`; `main` is `inert` until the intro exits, then `root.remove()`. Escape exits the intro.
- `artifact/test/index.js` -- register the new test file.
- `PRD.md` §4.11, `ARCHITECTURE.md` AD-12, `CLAUDE.md` §2 -- docs.

## Tasks & Acceptance

**Execution:**
- [x] `artifact/src/copy-edits.js` -- pure ESM: `STYLE_KEYS` (fontFamily, fontSize, fontWeight, fontStyle, textDecoration, translate), `FONT_CHOICES`, `normalizeText`, `checkCopyEdits(json) → string[]` -- testable in Node, shared by the build and the page.
- [x] `artifact/test/copy-edits.test.mjs` + `index.js` -- matrix rows 1–3 for `checkCopyEdits`/`normalizeText`.
- [x] `artifact/src/editor.js` -- IIFE: collect boxes (`h1–h4,p,li,label,button,summary` in `#ll-intro` and `main`, innermost only, excluding the dynamic regions above, `[aria-live]` and `.error`); key them by normalized original text plus occurrence index; sanitize and apply `COPY_EDITS`; Shift+E bar; edit toggle; active-box outline; drag handle (`style.translate`, delta divided by the box's render scale); font select, px size, B/I/U (execCommand on the saved selection, else a box style toggle); reset box and reset all; edit count; Save (downloads) and Copy (clipboard, textarea fallback); `beforeunload` while unsaved.
- [x] `artifact/src/editor.css` -- bar (z 2147483647, page tokens, phone width), outlines and handle.
- [x] `artifact/build.mjs` -- per the Code Map; log the edit count.
- [x] `PRD.md`, `ARCHITECTURE.md`, `CLAUDE.md` -- one owner-only authoring-aid note each.

**Acceptance Criteria:**
- Given a fresh load, when no key is pressed, then no editor UI is visible and the page behaves as before.
- Given edit mode on the intro letter, when Bennett drags the heading and sets Georgia 60px italic, then it moves and restyles in the scaled stage, and Save produces a file that reproduces it after a rebuild.
- Given edit mode, when Bennett clicks "Start here" or a tab button, then nothing navigates; with editing off, the page works normally.

## Implementation Notes

- `guard.test.mjs` banned `innerHTML` in every page source. `editor.js` is exempted from that one rule and gets a stricter test instead: its only `innerHTML` assignment is on an inert `<template>` in `cleanTemplate`; live boxes receive cleaned nodes through `replaceChildren`, and it never touches Review output.
- `copy-edits.js` also exports `COPY_EDITS_VERSION` and `matchCopyEdits` (pure box matching, unit-tested); `content.mjs` gained `loadCopyEdits` so the absent-file and bad-file rows are testable.
- `checkCopyEdits` also checks style values (px sizes, known weights/styles/decorations, a safe font-family string), requires `text` to be normalized, rejects an edit with neither `html` nor `style`, and rejects duplicate boxes. `n` is 0-based.
- In the full envelope layout the decorative `.ll-pocket` SVG covers the lower letter, so clicks there land on it. `editor.css` sets `pointer-events: none` on the envelope layers only while editing.
- Planner check (2026-10-26): at 1440×900 the bottom-docked bar covered "Start here", so the bar gained a "Bar to top / Bar to bottom" button (`ce-top` class).
- Matrix audit: rows 1–4 are unit-tested. Rows 5 (hostile html) and 6 (selection vs box) need a DOM, which the Node suite does not have, so they were verified by hand in the browser pane only.
- Shift+E only reaches the page once it has focus: click the page first.
- Step-04 review layers were skipped: AGENTS.md runs review only when Bennett asks. Nothing committed (commit only when asked).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `node --test artifact/test/ && node artifact/build.mjs` -- all tests pass, build succeeds.

**Manual checks:**
- Open `artifact/dist/witness-review.html` in the browser pane and walk through the ACs, including dark mode and 375px width.
