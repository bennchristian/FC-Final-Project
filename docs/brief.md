# Idea brief: ministry social-media witness review

Raw input for `bmad-prd`. This file is not a contract. Once `PRD.md` is final, the PRD wins.

## The assignment (Frontier Commons final project)

The final project is meant to be something the participant is personally proud of, built where
their affinity and their ability meet. A kingdom-minded or redemptive focus is encouraged but
not required. The goals are to practise real skills, to move from basic Claude usage to building
and shipping your own creations, and to gain confidence that you can build what you set your
mind to. Participants are encouraged to think creatively and stretch their limits.

## The idea (Bennett's words, lightly edited)

A PR bot that evaluates a Christian ministry's or church's social media **from the point of view
of a non-Christian**, and assesses its *witness*.

- **Several persona levels.** There should be different levels of non-believer personas so the
  tool never treats "the non-believer" as a single type of person.
- **Living metrics.** The metrics for judging how good the witness is, and how posts might come
  across, are expected to be revised and developed over time.
- **Interview plans.** The tool can produce plans for "interviewing" real non-believers to ground
  or test the personas.
- **Ministry outreach plans.** The tool can produce plans for informing or messaging the
  ministry about how it could adapt its social media.

## Deadlines

| Date | Deliverable |
|---|---|
| Fri 2026-10-23 | First demo, delivered as a **Claude Artifact** |
| Week of 2026-10-26 | A **live web-app prototype** with a working public link |

## Decisions already made (2026-10-21)

1. **Planning path:** BMAD (`bmad-prd` → `bmad-architecture` → `bmad-ux`).
2. **Demo input:** the user gives the tool a **social-media profile URL**.
3. **Week-2 stack:** Next.js, Vercel, Supabase and the Claude API.

## Open questions for the PRD and architecture

- **Can a profile URL work in the demo at all?** Probably not as-is: an artifact most likely
  cannot fetch Instagram, TikTok or Facebook pages, and those platforms restrict scraping in
  their terms. The fallback is pasted post text plus uploaded screenshots. This needs a
  decision before the artifact build starts. (`bmad-architecture`)
- **Persona tiers.** What separates one level from the next: how familiar the person is with
  the faith, how hostile they are to it, their past experience of church, their culture, their
  age? How many personas are in the MVP?
- **The first metric set (rubric v1).** What does "good witness" mean, and how is it scored?
  How are rubric versions tracked so old scores stay comparable?
- **Output shape.** Per-post scores, a whole-profile summary, or both? How does each persona's
  reaction get shown?
- **Consent and tone.** Does a ministry opt in? How is criticism framed so it stays
  constructive and charitable?
- **What to leave out of the MVP.** Running interviews, sending messages to ministries, and
  pulling posts in automatically on a schedule are likely out.
