---
title: "PRD: Living Letter"
status: final
created: 2026-10-21
updated: 2026-10-30
---

# PRD: Living Letter
*Name confirmed by Bennett on 2026-10-26 (OQ-4).*

## 0. Document Purpose

This PRD is the scope contract for Bennett's Frontier Commons final project. It is written for Bennett (owner), for the downstream BMAD workflows (`bmad-architecture`, `bmad-ux`, `bmad-create-epics-and-stories`), and for any agent implementing a brief. Vocabulary is fixed by the Glossary (§3); features are grouped in §4 with globally numbered requirements (FR-1…FR-N); every requirement is tagged with the delivery it belongs to: **[F]** for the Friday demo Artifact, **[W2]** for the week-2 web app (since 2026-10-29 a companion that stores and shows Reviews run in the Demo Artifact, §4.13); FR-22 is Demo-Artifact-only. Drafting assumptions were confirmed by Bennett on 2026-10-21 (§12). Technical detail, research evidence, and rejected alternatives live in [`addendum.md`](_bmad-output/planning-artifacts/prds/prd-FC-Final-Project-2026-10-21/addendum.md). Inputs: `docs/brief.md`, Bennett's discovery answers (logged in `_bmad-output/planning-artifacts/prds/prd-FC-Final-Project-2026-10-21/.memlog.md`), and three research digests in `_bmad-output/planning-artifacts/prds/prd-FC-Final-Project-2026-10-21/` (`research-feasibility-comparables.md`, `research-frameworks-personas.md`, `reconcile-culture-and-ministry-design.md`).

## 1. Vision

Much of what Christians post online is aimed at reaching people outside the faith but lands only with people already inside it. Some posts are deliberately combative. Many more are simply unaware: thick with church vocabulary, built on experiences that feel normal only to insiders, or fused with partisan politics. Their comment sections become echo chambers of agreement, and the people the posts were meant to reach scroll past, or are pushed further away.

Living Letter shows a Christian how a public post is likely to land with people who do not share their faith. A user brings in one or more posts. The tool scores each against a versioned witness rubric drawn from Scripture (the fruit of the Spirit, 1 Corinthians 13, Jesus at table with tax collectors and sinners, Paul in Athens) and from research on how outsiders perceive Christians. Alongside the scores, a panel of simulated personas — a seeker, a drifter, a neighbour of another faith, an exvangelical, a skeptic, a progressive, and an emboldened believer — each say how the post would make them feel. The tool then offers a gentler rewrite that keeps the post's main message, discussion questions for a small group, and, when someone wants to raise concerns with the poster, a charitable draft message and talking points.

The first use is formation, not correction: a youth leader puts other people's posts on a shared screen so teenagers like Emily can see, before they post much themselves, how a witness can wound or welcome. The second is a mirror for creators like Esther, who check their own drafts before publishing. The rubric and personas are expected to change as real conversations with non-believers and creators test them, so every score records the versions that produced it.

## 2. Target User

### 2.1 Jobs To Be Done

- **Formation (leaders and young Christians):** "Help my group see, concretely, how online witness can come across to people who don't believe — so they think before they post."
- **Mirror (creators and ministries):** "Before I publish, show me what a non-believer would trip over or be hurt by, and how I could say the same thing better."
- **Gentle correction (friends and leaders):** "Help me tell someone I care about how their posts come across, without wounding them or sounding self-righteous."
- **Stewardship (maintainer):** "Let me revise what 'good witness' means as I learn from real people, without making old results meaningless."

### 2.2 Non-Users (v1)

- Non-believers themselves. The tool simulates their perspective; it is not built for them to use.
- Ministry staff at scale (multi-seat teams, approval workflows, analytics). The demo audience is the FC cohort and instructors, and IFI colleagues via the Artifact link.
- Anyone wanting a theological audit of a ministry or person.

### 2.3 Key User Journeys

- **UJ-1. Emily sees how other people's posts might land with her school friends.** [F]
  - **Persona + context:** Emily, 15, in youth group, starting to post online and thinking about her witness to her school friends.
  - **Entry state:** Her youth or cell leader introduces the tool to the small group as a teaching tool. The leader drives it on a shared screen; Emily has no account.
  - **Path:** The group brings a collection of other people's public posts. The leader adds them to a Review.
  - **Climax:** For each post the group sees the Rubric Scores with evidence, the Persona Reactions — the thoughts different people might walk away with — and a Gentler Rewrite that keeps the main message.
  - **Resolution:** Discussion Questions ("What would you have done differently?", "What does the Bible say?") carry the conversation into the small group and to the leaders.
  - **Edge cases:** A post that is fine is reported as fine; the tool does not invent problems. A post whose main message may not be theologically sound gets a Soundness Flag, not a corrected rewrite.

- **UJ-2. Esther checks how her content comes across, before and after she posts.** [W2]
  - **Persona + context:** Esther, 24, a personal Christian influencer on Instagram who talks openly about her life and how God is real to her.
  - **Entry state:** Signed in to her own account. She came on her own, or someone introduced the tool to her (UJ-3).
  - **Path:** First use: she sets up her Creator Foundation — how she wants to come across, and her Target Audiences ranked. Then she reviews several past posts. Before publishing a new post, she runs the draft through a Draft Checkpoint.
  - **Climax:** The tool mirrors the post back: terms that may be unfamiliar to non-believers and need explaining, lines likely to offend many people, whether the post matches how she wants to come across, and a Gentler Rewrite.
  - **Resolution:** She edits the draft before posting, or rethinks how she posts.
  - **Edge case:** Esther ranks "build up existing Christians" first. The tool still scores witness to non-believers — the post can land on anyone's page — but shows the personas most likely to be affected first.

- **UJ-3. A friend or leader gently tells a creator or ministry how their content comes across.** [F]
  - **Persona + context:** Someone who cares about a creator or ministry and wants to raise how its posts come across without wounding.
  - **Path:** They review the creator's or ministry's public posts and ask for a Ministry Outreach Plan.
  - **Climax:** They get a draft message they can send themselves, plus talking points tied to specific posts.
  - **Resolution:** They send the message or have the conversation in their own words. The tool never contacts anyone.

- **UJ-4. Bennett keeps the personas and rubric honest.** [W2]
  - **Persona + context:** Bennett, the Maintainer, who knows non-believers, budding Christian influencers, and ministries willing to be interviewed.
  - **Path:** He runs interviews from an Interview Plan made outside the tool, then publishes a new Persona Version or Rubric Version based on what he learns.
  - **Climax:** New Reviews use the new versions; old Reviews keep the versions that produced them.

## 3. Glossary

- **Post** — One piece of social-media content (caption or on-screen text, images, and for video a transcript), as supplied by the User. Usually public; in a Draft Checkpoint, an **Unpublished Post**. Belongs to one Review.
- **Profile** — One social-media account (a person's or a ministry's). A profile Review is a set of Posts from one Profile that the User supplies; the tool never retrieves a Profile itself.
- **Source URL** — The link a Post or profile came from. Recorded and displayed; never fetched except through a Permitted Retrieval route or a single Instagram reel or TikTok video read (FR-3a).
- **Permitted Retrieval** — Reading Post content from a Source URL through a route the platform's terms allow. In MVP the only candidate is TikTok's public oEmbed endpoint [W2, conditional].
- **Review** — One run of the tool over one or more Posts, producing one Evaluation per Post plus Review-level outputs. Records the Rubric Version and Persona Version used.
- **Others' Review** — A Review of someone else's public Posts. **Own-Content Review** — a Review of the User's own published or draft Posts [W2].
- **Connected Account** — A Creator's own Instagram professional account, linked to the Web App through Instagram's login so its Posts can be picked for an Own-Content Review (FR-16a) [Post-MVP].
- **Evaluation** — The per-Post result: Rubric Scores, Persona Reactions, Gentler Rewrite, any Soundness Flag, and Discussion Questions.
- **Rubric** — The set of Criteria that define good witness. **Rubric Version** — an immutable, numbered release of the Rubric (v1 is defined in §4.2).
- **Criterion** — One dimension of the Rubric, scored per Post. **Rubric Score** — a Criterion's value: 1–5, or N/A when the Criterion does not apply. Every Rubric Score carries **Evidence**: a quote from the Post that earned it.
- **Persona** — A simulated person with a believable background, used to voice how a Post might land. **Persona Version** — an immutable, numbered release of the Persona set.
- **Persona Reaction** — A Persona's simulated response to one Post: a Felt Response plus the reasons in the Persona's own voice. Always labelled simulated.
- **Felt Response** — The emotional landing of a Post for a Persona, e.g. *convicted, encouraged, uplifted, moved to openness* (positive) or *confused, belittled, offended, shut out* (negative). For the Emboldened Believer it is how the Post moves them to treat others, e.g. *licensed to be harsh* or *prompted to gentleness*.
- **Offence Source** — Where any offence in a Post comes from: the **claim** itself, the **tone**, or **jargon**.
- **Gentler Rewrite** — An alternative wording of a Post that would come across more gently while keeping its main message.
- **Soundness Flag** — A note that a Post's main message may not be theologically sound. A flag only; the tool does not adjudicate or correct doctrine.
- **Discussion Questions** — Questions for a small group to talk through a Post.
- **Ministry Outreach Plan** — For an Introducer: an **Outreach Message** (a message they can copy and send themselves) plus Talking Points.
- **Talking Point** — One concern or affirmation for a conversation, tied to a specific Post and Criterion.
- **Profile Summary** — A roll-up of all Evaluations in a Review of Posts from one profile [W2].
- **Creator Foundation** — A creator's or ministry's short profile: how they want to come across, and their Target Audiences ranked [W2].
- **Target Audience** — Who a creator intends a post for (e.g. evangelise non-believers, build up existing Christians).
- **Draft Checkpoint** — An Own-Content Review of an Unpublished Post [W2].
- **User** — Anyone operating the tool: a **Leader** (UJ-1), a **Creator** (UJ-2, including ministry social-media staff), or an **Introducer** (UJ-3). **Maintainer** — Bennett (UJ-4).
- **Demo Artifact** — The Claude Artifact delivered for Friday 2026-10-23. **Web App** — the Next.js/Vercel/Supabase companion site: sign-in, profile, Saved Reviews and Profile Summary. It runs no Reviews: they run in the Demo Artifact on the viewer's own Claude plan and come in as a Review File (§4.13). **Review File** — the `.md` file the Demo Artifact saves through Save Review as file, whose JSON appendix holds the Review's data.
- **Interview Plan** — Questions for real non-believers, creators, or ministries, and where their answers feed new versions. Produced outside the product.

*Avoid:* "cultural artifact" (collides with Demo Artifact); "the non-believer" as a single type; "verdict" for anything the tool produces.

## 4. Features

### 4.1 Post Intake

**Description:** The User builds a Review by adding Posts. Because no platform offers a terms-compliant way to read someone else's Instagram posts, and Claude cannot watch video, the primary input on both surfaces is user-supplied: pasted text, screenshots, and for video a pasted transcript. A Source URL can be attached so the Evaluation shows where the Post came from. A profile Review is a set of Posts from one Profile that the User supplies, with the Profile's URL as the Source URL. Realizes UJ-1, UJ-2, UJ-3.

#### FR-1: Add Posts by paste and screenshot [F]
A User can add one or more Posts to a Review, each as pasted text, one or more screenshots, or both; for a video Post, a pasted transcript.
- A Review accepts at least 10 Posts.
- Each Post can be submitted with text only, screenshots only, or both.
- Screenshot text is read by the model; no separate OCR step is required of the User.

#### FR-2: Attach a Source URL [F]
A User can attach a Source URL to a Post or to the whole Review (a Profile's URL).
- The Source URL is shown on the Evaluation and in the Ministry Outreach Plan.
- Attaching a Source URL never triggers a fetch, except through FR-3 or FR-3a.
- The UI states plainly that the tool reads only links to a single Instagram reel or TikTok video, and asks for paste or screenshots otherwise.

#### FR-3: Permitted Retrieval for TikTok captions [W2, conditional — dropped]
> **Dropped 2026-10-21:** a live oEmbed test on two real public videos returned no caption (`ARCHITECTURE.md` AD-13).

When the Source URL is a TikTok video, the Web App can pre-fill the Post's caption through TikTok's public oEmbed endpoint.
- Ships only if a live test on a real public video returns the caption; otherwise dropped without replacement.
- The User can edit or replace the pre-filled caption.
- No other platform is read from a URL in MVP.

#### FR-3a: Instagram reel and TikTok video reading [F, added 2026-10-26 by Bennett; widened to TikTok videos and captions 2026-10-28 by Bennett]
The link field is for video Posts; static Posts are added as screenshots or pasted text (FR-1). When a Post's Source URL is a single Instagram reel or TikTok video, the Demo Artifact reads it through the viewer's Supadata connector (`ARCHITECTURE.md` AD-13):
- **Caption:** when no text was pasted, the video's caption is used as the Post's text. It is added without being shown first; the User sees it with the Evaluation.
- **Transcript:** the video's spoken words are used as the Post's video transcript.
- The UI does not name the service.
- If the video cannot be read, a Post with a caption, text or screenshots is still added; otherwise the User is asked to paste the transcript or text.

**Out of Scope:** automatic retrieval of a whole profile; any Instagram retrieval; scraping; logged-in access.

### 4.2 Rubric Evaluation

**Description:** Each Post is scored directly against the current Rubric Version. Scores react to how the Post is likely to land with non-believers, not to its stance or politics: a political post scores low on Kingdom over Party when it fuses faith with party, whichever side it leans. The tool names where any offence comes from but does not decide whether a claim's offence is "the offence of the gospel"; that judgement belongs to the User and their group. A post that is fine is reported as fine. Realizes UJ-1, UJ-2.

**Rubric v1** (`witness-rubric@1`, merged from Bennett's lenses, the research Criteria, and the "Paul in Athens" marks in *Culture and Ministry Design*):

| # | Criterion | Scores whether the Post… |
|---|---|---|
| 1 | Outsider Clarity | can be understood by someone with no church background; no unexplained jargon or bare verse references |
| 2 | Cultural Awareness | shows it knows the audience's world, earning a hearing |
| 3 | Gentleness & Respect | is kind and respectful toward everyone, including those who disagree; does not condemn or disrespect its audience |
| 4 | Welcome over Judgment | treats outsiders as welcome neighbours and keeps moral correction aimed at insiders |
| 5 | Kingdom over Party | keeps the faith distinct from party, candidate, and nation; applies equally to left- and right-coded posts (N/A if no political content) |
| 6 | Humility & Integrity | comes across as honest and unpretentious, with no gap between claim and conduct |
| 7 | Love Made Visible | shows love in action toward real people, not only in words |
| 8 | Invitation & Dialogue | leaves a door open and invites questions, without pressure |
| 9 | Clear Conviction | states plainly what it believes and gives a clear answer (scores clarity, not correctness) |
| 10 | Self-Presentation Alignment | matches how the Creator says they want to come across (Own-Content Reviews only; N/A otherwise) [after MVP: needs an Own-Content Review, §6.4] |

#### FR-4: Score each Criterion with Evidence [F]
The system scores every Criterion of the current Rubric Version for each Post, 1–5 or N/A, each with Evidence.
- Every non-N/A Rubric Score quotes the Post text (or describes the screenshot region) that earned it.
- Each Rubric Score has a reason of two or three plain-language sentences: what in the Post earned it, how it is likely to land, and, for a score of 3 or below, what would raise it. *(Changed from one sentence by Bennett, 2026-10-21.)*
- Criterion 10 is N/A on every Others' Review. Any other Criterion is N/A only when the Post contains nothing it can assess, and the Evaluation states why.
- Every Rubric Score of 3 or below names its Offence Source. Offence from tone or jargon lowers the score; offence from the claim itself is reported but does not lower it.
- Rubric Scores are compared only within the same Rubric Version; the tool never converts scores between versions.

#### FR-5: Say plainly when a Post is fine [F]
When no Criterion scores below 3, the Evaluation says the Post is likely to land well and lists no concerns; Criteria scored 3 are shown with their Evidence but are not framed as problems.

#### FR-6: Flag possible soundness concerns [F]
The system can attach a Soundness Flag when a Post's main message may not be theologically sound.
- The flag names the line concerned and why it was flagged, and says it is a prompt for discussion with a leader, not a ruling.
- The flag never changes Rubric Scores, and the Gentler Rewrite keeps the main message as posted.
- The standard for soundness is deferred (§11, OQ-2).

#### FR-7: Record versions on every Evaluation [F]
Every Evaluation records the Rubric Version and Persona Version that produced it. The versions are kept with every saved Review and in a saved file's data, so scores are never compared across versions, but they are not shown to the User: not in the results, the copied text or the readable part of a saved file (changed 2026-10-29 by Bennett: the versions line cluttered the results).

### 4.3 Persona Reactions

**Description:** Seven Personas react to each Post, each in their own voice, with a Felt Response and reasons. Persona Reactions are shown alongside the Rubric Scores and never feed them, so a mis-drawn Persona cannot skew the numbers. Every Persona is a believable person with reasons for their views, not a foil. Realizes UJ-1, UJ-2.

**Persona set v1:**

| Persona | Who they are |
|---|---|
| Seeker | Gen Z (a peer of Emily's school friends), never churched, spiritually curious, lost in insider language |
| Drifter | Grew up around church, now indifferent; the largest group of US "nones" |
| Neighbor of Another Faith | Practises another religion; respects faith, bristles at disparagement or pressure |
| Exvangelical | Knows the faith well, was hurt by church, still admires Jesus |
| Skeptic | Atheist, critical but fair-minded |
| Progressive | Non-believer holding progressive convictions (e.g. pro-LGBT, pro-choice) |
| Emboldened Believer | A Christian who may read the post as licence to be abrasive or rude — e.g. a post urging believers to "speak the truth" that itself does so harmfully |

The set's political lean is deliberately one-sided (no secular-conservative persona).

#### FR-8: Generate a Persona Reaction per Persona per Post [F]
For each Post, the system produces one Persona Reaction for each Persona in the current Persona Version.
- Each reaction names a Felt Response and gives 1–3 reasons in the Persona's voice, pointing at specific parts of the Post.
- Positive Felt Responses (convicted, encouraged, uplifted, moved to openness) are possible and shown when warranted.
- The Emboldened Believer's reaction describes how the post might shape a Christian's behaviour toward others, not how it lands with a non-believer.
- Personas speak from their own experience; they never diagnose the poster's or other outsiders' hidden motives, and reactions never use labels such as "idolatry" or "syncretism".

#### FR-9: Label reactions as simulated [F]
Persona Reactions are visibly labelled as simulated perspectives, never presented as real people's opinions. One plain line under the Persona Reactions heading says so; individual reactions, Discussion Questions, Talking Points and Profile Summary rows carry no per-item tag (changed 2026-10-29 by Bennett: the tags added clutter, not clarity).

#### FR-10: Order Personas by Target Audience [W2]
When the signed-in User's profile role is creator, the Web App shows a saved Review's Personas with those most relevant to their top-ranked Target Audience first, as the Demo Artifact does (§4.11 profile). *(Changed 2026-10-29 from Own-Content Reviews only: the Web App runs no Reviews, §4.13.)*
- Ordering changes display only; scoring is unchanged.

### 4.4 Gentler Rewrite

**Description:** For each Post that has room to improve, the tool offers one alternative wording that would come across more gently while keeping the main message. Realizes UJ-1, UJ-2.

#### FR-11: Offer a Gentler Rewrite [F]
The system produces a Gentler Rewrite automatically for each Post where any Criterion scores below 3. For a Post judged to land well (FR-5) whose lowest score is 3, the Evaluation offers a "Suggest a gentler version" action that produces one on request. A Post whose scores are all 4 or above gets no rewrite.
- The rewrite keeps the Post's main message and convictions; it changes manner, clarity, and framing.
- The rewrite is marked as a suggestion and shown next to the original.

**Out of Scope:** rewriting a Post's theology; producing new posts from scratch.

### 4.5 Discussion Questions

#### FR-12: Generate Discussion Questions [F]
The system produces 4–6 Discussion Questions for each Post, suitable for a teenage small group led by an adult. Realizes UJ-1.
- The set always includes four standing questions, adapted to the Post: "What would you have done differently?", "What does the Bible say about this?", "How might Jesus have responded to this post?", and "How might Jesus have posted this?".
- Questions are open, not leading toward a single answer.

### 4.6 Ministry Outreach Plan

#### FR-13: Generate a Ministry Outreach Plan [F]
An Introducer can request a Ministry Outreach Plan for a Review. Realizes UJ-3.
- The plan has an Outreach Message the Introducer can copy and send themselves, and 3–5 Talking Points.
- The Outreach Message opens with genuine affirmation of something real in the content, raises at most the top 2–3 concerns, and proposes concrete changes (after the Jethro-and-Moses tone model in *Culture and Ministry Design*).
- The Outreach Message contains no mockery, no theological verdict, and no claim that the personas are real people.
- The tool never sends, posts, or contacts anyone.

### 4.7 Profile Summary [W2]

#### FR-14: Summarise a profile Review [W2]
For a creator, the Web App computes a Profile Summary in code, never by the model, across their Saved Reviews at the current versions, matching the Demo Artifact's summary (§4.11):
- each Criterion's average across the Posts;
- which Personas consistently react well or badly;
- the strongest and weakest Posts;
- the top 2–3 changes likely to help most (the Criteria with most concerns).

*(Changed 2026-10-29: the model-written narrative and quantified recurring patterns move to after the MVP, §6.4, because the Web App makes no Claude calls.)*

### 4.8 Creator Foundation and Own-Content Review

**Description:** Creators and ministries can review their own content. Before the first Own-Content Review they set up a Creator Foundation. Realizes UJ-2.

#### FR-15: Set up a Creator Foundation [W2]
A Creator can record how they want to come across and rank their Target Audiences.
- The Creator can edit the Foundation later; each Review records the Foundation as it was at the time.
- On the Web App the Foundation is part of the profile: role (creator, leader or individual), how they want to come across, their theology, tradition and convictions, and the ranked Target Audiences, the same fields as the Demo Artifact's profile (§4.11). The two profiles are kept separately, because the Artifact cannot read the Web App's, so a creator fills in both; the Web App's profile page says so. A Review File carries no Foundation, so Web App Reviews record none: Persona order uses the live profile (`ARCHITECTURE.md` AD-18).

#### FR-16: Run an Own-Content Review and Draft Checkpoint [after MVP]
A Creator can review their own published Posts or an Unpublished Post, receiving the full Evaluation including Criterion 10.
- Moved 2026-10-29: Reviews run only in the Demo Artifact, which runs Others' Reviews, so Criterion 10 cannot be scored until Reviews run on the Web App (§6.4).

#### FR-16a: Connect a Creator's own Instagram account [Post-MVP, added 2026-10-28 by Bennett]
A signed-in Creator can connect their own Instagram professional (Business or Creator) account and pick Posts from it for an Own-Content Review instead of pasting or screenshotting them (`ARCHITECTURE.md` AD-17).
- The Creator connects through Instagram's own login and can disconnect at any time, which deletes the stored access.
- The Web App reads only the Connected Account's own media: caption, media type, link, and for a carousel each slide's image. Slide images are sent to Claude as screenshots and are never stored.
- Only Posts the Creator picks are read. Nothing is read on a schedule (§5, Not a monitor).
- A personal (non-professional) account cannot connect; the Creator is told to paste or screenshot instead.
- Until Meta approves the app (App Review and Business Verification), only accounts with a role on the app can connect.

#### FR-17: Show the "lands anywhere" reminder [F]
Every User sees a standing reminder that a post can land on anyone's page, so witness matters whatever the intended audience.

### 4.9 Accounts and Saved Reviews [W2]

#### FR-18: Private accounts [W2]
Leaders, Creators, and Introducers can sign in to their own private account. Adding, viewing and deleting Saved Reviews, and the profile, require sign-in. Running a Review needs no Web App account: it happens in the Demo Artifact (§4.13).
- Anyone can create an account with their email address and a password, confirmed by email (Bennett, 2026-10-29; replaces invite-only accounts, `ARCHITECTURE.md` AD-11).
- A User's Reviews are visible only to that User.
- No teen needs an account: in UJ-1 the Leader operates the tool.

#### FR-19: Saved Reviews [W2]
A signed-in User saves a Review by uploading its Review File (FR-26), and can reopen it later, unchanged, with its recorded versions, or delete it. A reopened Review is read-only: nothing on the Web App re-runs, rewrites or regenerates it.

#### FR-23: Usage caps [retired]
> **Retired 2026-10-29:** the Web App makes no Claude calls, so there is nothing to cap. Each Review runs on the viewer's own Claude plan in the Demo Artifact (§4.13).

### 4.10 Versioned Personas and Rubric

#### FR-20: Immutable versions [F]
Rubric Versions and Persona Versions are never edited in place once any Evaluation references them; a change creates a new version.

#### FR-21: Maintainer publishes new versions [W2]
The Maintainer can publish a new Rubric Version or Persona Version; new Reviews use the latest version, and saved Reviews keep theirs. Realizes UJ-4.
- Publishing is a new file in `content/` (`ARCHITECTURE.md` AD-1) and a redeploy, not an in-app editor. The Web App keeps every locked version, so Saved Reviews made with older versions still open.

### 4.11 Demo Roadmap Tab

#### FR-22: Roadmap tab in the Demo Artifact [F]
The Demo Artifact has a separate tab listing what is planned but not yet built, for reference in the recorded video.
- The Web App does not include this tab.
- Since 2026-10-26 it is a Roadmap page reached from a link in the page footer.

**Demo page flow and Past Reviews (added 2026-10-26 by Bennett).** After the intro, the Demo Artifact opens on a Home page (what Living Letter is, why, with cited statistics, who it is for, an overview of the outputs, and why it is called Living Letter), then a Review send page, a Results page and a How it works page. Review and Results sit beside a Mailbox whose Next… card offers Next post, Save Review as file, Copy review, View past reviews and Send feedback, which drafts the Ministry Outreach Plan and shows it in a popup letter: the Outreach Message to copy, then the Talking Points (2026-10-27; the plan is no longer a section of the Results). On wide screens the Review page is a letter in an open envelope, and Send for review shows the letter going into the envelope and the envelope into the Mailbox (2026-10-27). A profile icon opens the viewer’s profile: Past Reviews now; ranked target audiences and overall feedback across Posts stay planned for the Web App (Roadmap: Creator Foundation, Profile Summary). Each Review a viewer sends is saved to their own Past Reviews, which only that viewer can see. They can reopen or delete it. Screenshots are never saved (`ARCHITECTURE.md` AD-12).

**Profile in the Demo Artifact (added 2026-10-28, approved in session by Evangeline for the team).** The profile page brings parts of FR-14, FR-15, FR-18 and FR-19 into the Demo Artifact, within what an Artifact can do:
- **Sign-in:** the viewer is already signed in with their Claude account; the page says so and keeps everything in their private store. Email sign-up is a Web App matter (FR-18, AD-11).
- **How you're using Living Letter:** the viewer picks one role (creator, leader or individual). This is new: the role decides what the profile shows.
- **Facilitation guide (for leaders, added 2026-10-29 by Bennett):** a fixed, written plan for running a small-group session with Living Letter (before, during, ground rules, what to watch for), shown when the role is leader (UJ-1). Static copy; nothing is generated or saved.
- **Creator preferences (FR-15, for creators):** how they want to come across, **their theology, tradition and main convictions**, such as a stance they hold strongly on sexuality, gender or marriage (new: free text, recorded only; it never changes scores), and the five Target Audiences in their order. Each saved Review keeps a copy of the preferences as they were (FR-15).
- **Persona order by audience (Roadmap item, now in the demo):** on a creator's Reviews, Persona Reactions are listed with the Personas who lead their top audiences first. Preferences never change scores, prompts or the locked rubric and Persona versions.
- **Profile Summary (FR-14, for creators):** worked out by code, never by the model, across the creator's saved Reviews at the current versions: each Criterion's average, which Personas react well or badly, the strongest and weakest Posts, and the top 2–3 changes (the Criteria with most concerns, with what a score of 4 looks like). Recurring patterns were dropped from the Artifact's summary on 2026-10-29: the Criterion averages and Top changes already cover them.

**Owner copy editor (owner-only authoring aid, added 2026-10-26 by Bennett).** Not a User feature. Shift+E shows a hidden bar that lets Bennett rewrite, move and restyle the text of the intro letter and every tab, then save it as `copy-edits.json`. The file is folded into the next build, so every viewer sees the new copy after a republish. Edits to the rubric and Persona text in How it works change only what the page shows; Claude still scores with the locked versions. In the Review results, label edits apply to every Post and are saved; Claude's text and pasted Posts can be retyped on screen but are never saved. Status lines are never editable (`ARCHITECTURE.md` AD-12).

### 4.12 Try the Demo

#### FR-24: Try the demo [F]
*Added 2026-10-29 by Bennett, for demo-day checklist item 1: one click into the app with sample data already in it.*
The Demo Artifact's first screen, the intro letter, offers "Try the demo" as a third choice beside "Learn more" and "Begin review". **Since 2026-10-29 (Bennett, demo-day checklist item 2) it is a guided walkthrough of the real flow:** one click plays the normal exit onto Home, and coach cards walk the viewer through Home, Your profile, How it works and then the real, empty Review page. The sample is the public Instagram reel "Should a Christian attend a gay wedding?" (`https://www.instagram.com/p/DcRYltnvb77/`), fully evaluated. The same Post appears in the recorded video.
- **The walkthrough (order changed 2026-10-29, Bennett: "It goes straight into the Review without telling me what Living Letter is"):** about 22 cards. Home: what Living Letter is, who it is for, what you get. Your profile: that it is private to the viewer's Claude account with Saved Reviews at the bottom; the viewer picks a role (creator adds a Creator preferences card). How it works: the four steps (Overview tab), the Scoring tab and the Personas tab, which also names Mechanism, Sources and Privacy. The Review page: set up the review (model and profile link), add a Post (videos and static posts), then the tour fills in the reel's link and waits for the viewer to click Send for review. Then the Results (overall summary, the Post's summary, Rubric Scores, Persona Reactions, Gentler Rewrite when there is one, Discussion Questions); the Mailbox (waits for View saved reviews); Saved Reviews (waits for Open); and a closing card on the Results. Before the Review page, Next moves to the next page itself and the card names the masthead link that leads there; only picking a role, Send for review, View saved reviews and Open wait for the viewer's click. Every card has Back where it makes sense, Next or a waiting hint, and End tour. A step that needs a click offers Next instead when this view cannot save (no `db` or no signed-in viewer). At 375px the card docks to the bottom of the screen.
- **Nothing runs live.** Send replays the saved sample only while the demo is on, the Review has no Posts, and the form holds exactly the sample link and nothing else (no profile link either): the normal envelope flight, the Post shown as "Reviewing…" for a moment, then the saved Evaluation. No Claude or Supadata call. Anything else is a normal, live Send. The sample is Post 1 of a Review Bennett ran and saved in the live Artifact; the saved file's JSON appendix is `artifact/sample-review.json`, which the build checks and inlines.
- **The demo Review is saved** to the viewer's Saved Reviews like any other sent Review, link included, so the tour can reopen it. Reopened, it still shows the sample notice.
- The sample has no profile URL, no screenshots and no @handle (§7.2). A Post's Source URL is null or an Instagram post link. An Outreach Plan is optional. Its versions must equal the page's locked versions (FR-7), so a content change needs a new sample. The build fails otherwise.
- A visible notice shows while sample Posts are on screen: a sample Review of a public reel, evaluated ahead of time, that used none of the viewer's Claude usage. Try the demo never replaces a Review that already holds Posts (it is then plain Begin review). End tour, the last card or Clear Review ends the demo.
- The "Add fictional example Posts" button is removed (Bennett, 2026-10-29).
- Without a sample file, or when its first Post has no link, the build still passes and the button stays hidden.

### 4.13 Web App Companion [W2]

*Added 2026-10-29 by Bennett ("option 2"). Anthropic lets Claude.ai sign-in work only in its own products, so a third-party site cannot run a Review on a person's Claude account; it needs an API key that someone pays for.*

**Description:** The Web App runs no Reviews. Reviews run in the Demo Artifact on the viewer's own Claude plan, which keeps the demo free for everyone, Bennett included. The Web App is where a signed-in User keeps their profile and their Saved Reviews. Realizes UJ-1, UJ-2, UJ-3.

#### FR-25: Run a Review in the Artifact [W2]
The Web App's "Run a Review" page links to the Demo Artifact and explains the round trip: run the Review there, choose Save Review as file, then add the file here (FR-26).
- The page shows this caveat as fixed copy (wording owned by Bennett): "Reviews run in the Living Letter Artifact on your own Claude account, so this demo costs nothing to run. We hope to turn Living Letter into a full web app, but that needs each person to bring their own Anthropic API key, at about $0.25 per Post. Until then, this is how we keep the demo free."
- The link opens the Artifact in a new tab. The Web App passes nothing to it.

#### FR-26: Add a Review from its Review File [W2]
A signed-in User can upload a Review File and have it saved as a Saved Review.
- Only a file the Demo Artifact saved is accepted: its JSON appendix must pass every check the Artifact applies to model output (`SCHEMA.md` §4), and its versions must be locked versions in `content/`.
- A file that fails is rejected with a plain message, and nothing is saved.
- A Review File never holds screenshots, only their count. Handles other than the poster's are removed before saving (`ARCHITECTURE.md` AD-5).
- Each upload is a new Saved Review; uploading the same file twice gives two.

### 4.14 Web Demo [live, added 2026-10-30 by Bennett]

*Bennett, 2026-10-30: "make Living Letter into a live web app without changing anything from the Artifact … this is just a demo, not a real app. I don't need working log ins, sign ups, etc. It just has to look like it works."*

A public website (https://living-letter-kappa.vercel.app) shows the Demo Artifact exactly as it is, outside Claude (`ARCHITECTURE.md` AD-19).
- **Sign-in looks real.** Any email and password are accepted, and nothing leaves the browser. Profile, preferences and Saved Reviews are kept in that browser.
- **Reviews look real.** A demo evaluator answers in place of Claude from the Post's own text. Its scores are rough heuristics, and screenshots cannot be read. The sample reel shows its real saved Review. No cost to anyone.
- **The sign-in screen says so.** It states that this is a demo with simulated Reviews, carries the FR-25 caveat about bringing your own API key at about $0.25 per Post, and links to the Artifact as the full, free version.
- The companion Web App of §4.13 (FR-25, FR-26) stays planned and is not built.

## 5. Non-Goals (Explicit)

- **Not a scraper.** No automatic collection of posts from Instagram, TikTok, or anywhere else beyond FR-3, the single-video read of FR-3a, and a Creator's own Connected Account (FR-16a).
- **Not a content generator.** The Gentler Rewrite revises a supplied Post; the tool does not write new posts or content calendars for ministries.
- **Not a theological judge.** No doctrinal scoring or rulings on a ministry or person; the Soundness Flag is the limit.
- **Not a messenger.** The tool never sends messages, comments, or DMs.
- **Not an interview tool.** Interview Plans are made outside the product; the product does not schedule, run, or record interviews.
- **Not a monitor.** No scheduled or ongoing watching of accounts.
- **Not an analytics tool.** No reach, engagement, or follower metrics.
- **Not a stand-in for real people.** Simulated Persona Reactions never replace conversations with real non-believers.

## 6. MVP Scope

### 6.1 Friday 2026-10-23 — Demo Artifact

Delivered as a **recorded screen video of the Demo Artifact with Bennett's voice-over**; the Artifact itself has a live link shared with IFI colleagues. The video shows: Posts from a profile going in, how they are evaluated, the outputs, and the Roadmap tab.

In: FR-1, FR-2, FR-4 to FR-9, FR-11 to FR-13, FR-17, FR-20, FR-22. **No cut line:** Bennett has decided every Friday requirement must ship; none is optional. FR-24 (Try the demo) was added to the Demo Artifact on 2026-10-29.

### 6.2 Week of 2026-10-26 — Web App

Live link on Vercel, as a companion to the Demo Artifact (changed 2026-10-29 by Bennett): FR-10, FR-14, FR-15, FR-18, FR-19, FR-21, FR-25 and FR-26. A Saved Review shows everything the Artifact produced (FR-4 to FR-9, FR-11 to FR-13, FR-17), read-only. FR-16, FR-23 and Criterion 10 are out (FR-23 retired; FR-16 and Criterion 10 after the MVP). Every week-2 requirement must ship. FR-3 was dropped on 2026-10-21 (AD-13).

### 6.3 Out of Scope for MVP

- Automatic profile retrieval from a URL — no permitted route exists (see addendum).
- Interview Plans inside the product — produced in a separate Claude session.
- Sharing Reviews between accounts, teams, or organisations.
- Video or audio analysis — Claude takes no video input; transcripts stand in.
- A secular-conservative persona — deliberately excluded.
- A soundness standard and soundness-correcting rewrites — deferred (OQ-2).
- Platforms beyond Instagram and TikTok as named targets (pasted content from anywhere still works).
- Reading other people's accounts through Instagram Business Discovery: it covers only Business and Creator accounts, cannot look up one post by link, and needs App Review for production.

### 6.4 After the MVP

- **Reviews on the Web App, bring your own key.** Each person pastes their own Anthropic API key, used only in their browser, and pays about $0.25 per Post. That brings back FR-16, Criterion 10 and the model-written Profile Summary narrative. It needs a new architecture decision: AD-7, AD-8 and AD-10 were written for a key Bennett holds.
- **FR-16a Connected Account.** Lands after the week-2 Web App, because it needs a Meta developer app that Bennett creates and, for anyone outside the app's roles, Meta's App Review. Alternative to weigh first: Ayrshare is already Meta-approved and returns carousel slide links for connected accounts, but costs $299 a month after a 28-day trial.

## 7. Constraints and Guardrails

### 7.1 Platform terms
Post content enters only by user supply or Permitted Retrieval. No logged-in scraping, no bot-detection evasion, no fake accounts.

### 7.2 Privacy
- Public Posts by individuals are treated like ministry Posts: public, and therefore open to charitable critique. Posters are not asked to opt in.
- This PRD widens `RULES.md`'s data rule ("Evaluate the ministry's own posts") to others' public Posts plus a Creator's own Posts; `RULES.md` is updated when this PRD is promoted.
- The tool does not store or display the names, handles, or comments of followers or commenters, even when they appear in screenshots; Evaluations ignore comment sections.
- The Demo Artifact keeps a viewer's sent Reviews (Post text, transcripts, links and results, never screenshots) in that viewer's private Past Reviews, readable by nobody else, Bennett included, until the viewer deletes them (added 2026-10-26 by Bennett).
- The published Demo Artifact ships with no real people's posts preloaded. Example posts are entered during the recording; any built-in sample is fictional. **Exception (Bennett, 2026-10-29):** the FR-24 sample Review preloads one public reel by a public creator, with any handle removed. Its link (`https://www.instagram.com/p/DcRYltnvb77/`, which names no handle) ships in the sample, is filled in by the guided demo, and is saved with the demo Review in the viewer's own Saved Reviews (widened 2026-10-29). (Claude Artifact publishing policy bars content that targets private individuals, so the sample must never be a private person's post.)

### 7.3 Honest simulation
Persona Reactions are labelled simulated where they appear (FR-9) and are kept apart from any real interview data.

### 7.4 Tone
All feedback — Evaluations as well as Outreach Messages — is charitable and specific: it affirms what is genuinely good before raising concerns, critiques the Post rather than the person, and points to a concrete line and a concrete change. No mockery of the poster. No theological verdicts.

### 7.5 Untrusted input
Post text and screenshots are untrusted input to the model: delimited from instructions, and unable to change the Rubric, the Personas, or the output format.

### 7.6 Attribution
The Bonhoeffer line Bennett cited ("Your life as a Christian should make non-believers question their disbelief in God") is unverified and probably misattributed. If it appears in the product, it is introduced as "commonly attributed to Bonhoeffer" or replaced with a verified quotation.

## 8. Cross-Cutting NFRs

- **Latency:** a single-Post Evaluation returns within 60 seconds; a 10-Post Review shows Evaluations as they complete rather than all at the end (Demo Artifact; the Web App runs no Reviews).
- **Secrets:** the Web App holds no Claude key; its Supabase secret key stays server-side. The Demo Artifact holds no keys.
- **Data protection:** every Supabase table has row-level security so Users see only their own Reviews.
- **Readability on a shared screen:** Evaluations are legible on a projector or TV for a small group (UJ-1); the measurable bound is set in `bmad-ux` (OQ-6).

## 9. Success Metrics

**Primary**
- **SM-1: The cohort gets it.** After the Friday video, FC cohort members and instructors can describe what the tool does and see why it is needed. Measured by demo feedback captured in `CLAUDE.md` §3. Validates the whole MVP.
- **SM-2: Objective, evidence-based scoring.** Re-running the same Post with the same versions gives each Rubric Score within ±1 point, and 100% of non-N/A Rubric Scores cite Evidence. Validates FR-4, FR-7.

**Secondary (week 2 onward)**
- **SM-3: Real use.** At least 3 leaders, creators, or ministries Bennett knows run real Reviews in the Demo Artifact and keep them on the Web App.
- **SM-4: Personas ring true.** In interviews, real non-believers recognise their Persona's reactions as plausible. Validates FR-8 and drives new Persona Versions.

**Counter-metrics (do not optimise)**
- **SM-C1: Problems found.** More flags is not better; a Post that lands well should be called fine (FR-5). Counterbalances SM-2.
- **SM-C2: Agreement with Bennett.** Evaluations need not match Bennett's own judgement of the demo examples; they should follow the Rubric. Counterbalances SM-1.
- **SM-C3: Harshness.** Sharper criticism is not better witness feedback; tone stays charitable (§7.4).

## 10. Delivery Milestones

| When | Milestone |
|---|---|
| Wed 2026-10-21 | PRD approved; `bmad-architecture` and `bmad-ux` run in parallel sessions (time-boxed for Phase 1). |
| Thu 2026-10-22 | Demo Artifact built. Risk: one build day for 14 Friday requirements with no cut line. |
| Fri 2026-10-23, before recording | **Nail down the tool's flow end to end**, then record the video with voice-over. |
| Week of 2026-10-26 | Web App live on Vercel; `ARCHITECTURE.md` and `SCHEMA.md` final before code starts. |
| Thu 2026-10-29 | Web App re-scoped to a companion (`_bmad-output/planning-artifacts/sprint-change-proposal-2026-10-29.md`); build starts once Node, Supabase `dev` and Vercel are ready. |

## 11. Open Questions (deferred)

1. **OQ-1. Prevalence weighting.** Should the Profile Summary weight Persona patterns by how common each group is? Owner: Bennett. Revisit when FR-14 is built.
2. **OQ-2. Soundness standard.** What standard defines "theologically sound", and should a rewrite ever correct doctrine? Owner: Bennett. Revisit after the Web App ships.
3. **OQ-3. Interview Plans.** Questions for non-believers, creators, and ministries, and which Criteria or Personas each answer would revise. Owner: Bennett, in a separate Claude session. Revisit before SM-4 interviews.
4. **OQ-4. Product name.** Resolved 2026-10-26: **Living Letter** (Bennett, with his design partner's brand guide; after 2 Corinthians 3:2–3). It replaces the earlier working title.
5. **OQ-5. Storage and spend (to `bmad-architecture`).** *Resolved: screenshots by AD-5; caps retired with FR-23 and AD-8 (2026-10-29).* How saved Reviews keep screenshots without persisting commenters' names or handles (§7.2); FR-23 cap values; how the Demo Artifact's in-page Claude calls are counted and limited. Owner: architecture session. Revisit before Web App code starts.
6. **OQ-6. Persona order and shared-screen legibility (to `bmad-ux`).** The rule mapping each Target Audience to a Persona order (FR-10), and a measurable legibility bound for projector use (§8). Owner: UX session.
7. **OQ-7. Who can run a Review.** The Demo Artifact is shared with the IFI organisation. Can a claude.ai account outside it open the Artifact, run a Review and save the file? Owner: Bennett, tested with a non-IFI account before the Web App link is shared outside IFI. If not, the Web App is for IFI colleagues until the bring-your-own-key version (§6.4).

## 12. Assumptions Index

All twelve drafting assumptions (Review size ≥ 10 Posts; "fine" threshold < 3; rewrite threshold < 4; Emboldened Believer name, Friday inclusion and behavioural framing; outreach draft structure; Foundation snapshot per Review; version publishing by file or database change; comment sections ignored; no real posts preloaded in the Demo Artifact; 60-second Evaluation; SM-3 ≥ 3 people) were confirmed by Bennett on 2026-10-21. None outstanding.
