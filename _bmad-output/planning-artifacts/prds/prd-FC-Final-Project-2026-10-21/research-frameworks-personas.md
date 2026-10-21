---
title: "Research: persona tiers, outsider perceptions, witness rubric, synthetic-persona risks"
created: 2026-10-21
purpose: Input for bmad-prd (persona tiers and rubric v1 are open questions in docs/brief.md). Research only, not a contract.
method: Web research (WebSearch / WebFetch). Pew pages returned HTTP 403 to direct fetch, so some Pew figures come from Pew search snippets or news coverage of Pew. Those are marked "via coverage".
---

# Research: persona tiers, outsider perceptions, witness rubric, synthetic-persona risks

## 0. Summary

- **Persona axes.** Three primary axes separate how a post lands:
  1. **Familiarity** with Christianity (insider literacy).
  2. **Disposition** toward the faith (receptive to hostile).
  3. **Church history** (none, drifted, or hurt).

  A fourth axis, **worldview frame** (secular, spiritual-but-not-religious, or another faith),
  decides whether God-talk reads as invitation or as disrespect. **Age/generation** and
  **political lean** work best as attributes on each persona card, not as separate tiers.
- **MVP personas (5).** The Seeker, The Drifter, The Neighbor of Another Faith, The
  Exvangelical, The Skeptic. They are ordered on a receptivity ladder (roughly Rainer U1 to U5)
  and spread across the other axes. A three-persona fallback is given in §1.4.
- **Rubric v1 (7 criteria).** Outsider Clarity, Gentleness & Respect, Welcome over Judgment,
  Kingdom over Party, Humility & Integrity, Love Made Visible, Invitation without Pressure. Each
  is scored 0–4 or N/A, with evidence quoted from the post. The rubric scores manner and fruit,
  not doctrine or political position.
- **Bonhoeffer quote: unverified and probably misattributed.** No primary source was found. It
  does not appear on Bonhoeffer's Wikiquote page, and quote sites give it with no citation. Use
  a genuine Bonhoeffer line instead, or label this one "commonly attributed" (§4).
- **Synthetic personas.** The research consistently finds that LLM personas flatten, caricature,
  and stereotype groups, show too little variance, and flatter the user. The strongest known fix
  is grounding personas in real interviews: Park et al. (2024) reached 85% of human
  test-retest accuracy this way. Label every output as simulated (§5).

---

## 1. Persona-tier axes

### 1.1 Typologies reviewed

| Framework | What it measures | Key numbers | Use for this tool | Caveat |
|---|---|---|---|---|
| **Engel scale** (James F. Engel; *What's Gone Wrong with the Harvest?*, Engel & Norton, 1975) | One axis, **knowledge**: from awareness of a supreme being but no gospel knowledge (−8) through decision to maturity (+5). Some versions add stages for unawareness of, or hostility to, a supreme being. | — | Defines the **familiarity** axis. | Linear and cognitive only. Criticised for its fixed linear path, which led to many modified versions. |
| **Gray Matrix** (Frank Gray, FEBC) and Søgaard's two-dimensional scale (1986) | **Two axes**: gospel knowledge (vertical, Engel-style) × **attitude/openness** (horizontal). | — | The key insight: **knowledge and attitude are independent**. A highly familiar person can be hostile (an exvangelical); an unfamiliar person can be open (a seeker). | Ministry tool, not peer-reviewed. Gray's account of which model came first is self-published and disputed. |
| **Rainer U1–U5** (Thom Rainer, *The Unchurched Next Door*, Zondervan 2003) | **Receptivity**: U1 highly receptive, U2 receptive, U3 neutral, U4 resistant but not antagonistic, U5 antagonistic or hostile. | U1 11%, U2 27%, U3 36%, U4 21%, U5 5% of the unchurched (via Mohler/Crosswalk). 82% "at least somewhat likely" to attend if invited (SBTS, 2003). | Defines the **disposition** axis. Its most useful lesson: **only about 5% are hostile**. Most outsiders are neutral or mildly resistant, not angry. | 2003 data, from about 300 interviews plus a survey. Dated and evangelical-sourced. |
| **Pew religious "nones"** | Self-identified identity: atheist, agnostic, or "nothing in particular." | 2023-24 Religious Landscape Study (released Feb 2025): **Christian 62%, nones 29%** (atheist 5%, agnostic 6%, nothing in particular 19%), **other religions 7%** (Jewish 2, Muslim 1, Buddhist 1, Hindu 1). Pew says the Christian decline "has been relatively stable since 2019." Among nones (Jan 2024 report): 63% nothing in particular, 20% agnostic, 17% atheist. | Gives realistic weights. The **largest outsider group is "nothing in particular,"** not atheists. | Identity labels say little about attitude toward Christians. |
| **Pew, why nones are nones** (Jan 2024; May 2025 survey reported Dec 2025) | Reasons for having no religion. | Jan 2024: 60% question teachings; 47% dislike religious organizations; 30% bad experiences with religious people; 55% cite organizations or people (or both). 43% say religion does more harm than good, 41% equal good and harm, 14% more good. "Nothing in particular" nones vote and volunteer less than atheists and agnostics, who participate at rates matching or exceeding the religiously affiliated (via coverage). May 2025: 78% "can be moral without religion," 64% question teachings, 54% don't need religion to be spiritual. | Feeds the **church-history** axis and the persona "triggers." | Self-reported reasons. |
| **PRRI "Exodus" typology** (2016) | Attitude among the unaffiliated. | **Rejectionists 58%** (religion not important personally and does more harm than good); **Apatheists 22%** (not important personally, but more helpful than harmful socially); **Unattached Believers 18%** (religion matters personally). Rejectionists skew younger and college-educated, and 27% report a mostly negative experience at worship. | A ready-made **disposition** split for nones. | 2016. No 2024 update of this typology was found. |
| **PRRI "Religious Change in America"** (Mar 2024, n > 5,600) | Reasons for leaving a childhood religion. | 26% unaffiliated (2023). Of those who left: **67% stopped believing**; **47% cite teachings about LGBTQ people** (up from 29% in 2016; Democrats 61%, independents 43%, Republicans 18%); **31% cite clergy sexual-abuse scandals** (45% of former Catholics). About a third say their religion was bad for their mental health. Only 9% are looking for a religion. | Strongest evidence for a **church-hurt** axis and for making LGBTQ and abuse topics high-sensitivity triggers. | PRRI's own analysis of its data. |
| **Barna: deconstruction and "spiritually open"** | | **42% of U.S. adults** say they have deconstructed the faith of their youth, including 37% of current Christians (Oct 2024 release; Nov 2023 survey, n = 2,003). "Spiritually open" means meeting at least 3 of 4 traits: senses a spiritual dimension, views spirituality positively, is curious or exploring, believes in God or a higher power. **16% of non-Christians** qualify (Dec 2022 survey). | "Deconstructed" is a **church-history** state, not a separate faith category. "Spiritually open" defines the **Seeker**. | Barna is an evangelical-aligned research firm. Definitions are its own. |
| **"Dones"** (Packard & Hope, *Church Refugees*, 2015) | People who leave church but keep their faith. Often formerly very active members. | Qualitative interviews. | Part of the **church-history** axis: high familiarity, institutional distrust, still sympathetic to Jesus. | Written for a popular audience; no bibliography. |
| ***The Great Dechurching*** (Davis, Graham, Burge, with Djupe; Zondervan 2023) | Former monthly attenders who now attend less than once a year. | About **40 million** dechurched (about 15–16% of adults). Roughly 75% left for "casual" reasons, most often moving. A smaller group of "casualties," essentially **exvangelicals**, left on purpose. Graham names five profiles: cultural Christians, mainstream evangelicals, exvangelicals, BIPOC evangelicals, mainline Protestants/Catholics. | Separates the **Drifter** (casual) from the **Exvangelical** (casualty). The book argues the casual majority could plausibly return. | One advocacy summary says exvangelicals are under 5% of the dechurched, but this is unverified. Exvangelicals are numerically small and loud online, so do not let them stand for all outsiders. |
| **Spiritual but not religious (SBNR)** | Pew "Spirituality Among Americans" (Dec 2023). | **22%** of U.S. adults are SBNR on Pew's combined measure (25% on raw self-identification). About 4 in 10 unaffiliated describe themselves as spiritual (PRRI 2024). | The **Seeker's** worldview frame. | Overlaps with nones and some Christians. |
| **Ryan Burge** (*The Nones*, 2021; *The Great Dechurching*) | Heterogeneity among nones. | Atheists and agnostics are the politically distinctive subset. "Nothing in particular" have walked away from religion without replacing it with a secular worldview, and are less engaged. | Supports treating the **Drifter** and the **Skeptic** as different personas. | Mostly secondary summaries were available. |
| **Political backlash thesis** (Hout & Fischer, *Sociological Science* 2014) | Why nones rose from 7% to 20% (1987–2012). | Political conflict over cultural issues, plus generational succession, drove non-affiliation. Political identity appears to drive religious identity, not the reverse. | Explains why **partisan posts land so badly** with outsiders, and with the young especially. | GSS data up to 2012. |
| **Generation/gender** | Survey Center on American Life (Apr 2024). | Among Gen Z adults who left their childhood religion, **54% are women** and 46% men, reversing the pattern of older generations. Linked to politics, abortion after Dobbs, and LGBTQ and gender teaching (via coverage). Countertrend: Barna/Gloo State of the Church 2025 reports weekly Bible reading among Gen Z rising from 30% to 49% in one year, and Gen Z churchgoers attending about 1.9 weekends a month. | Age is a **modifier** that raises sensitivity to LGBTQ, gender, and political content and changes platform norms. | Gen Z data is moving fast. Treat any persona's age-linked traits as provisional. |
| **Adherents of other faiths** | Pew RLS: 7% of U.S. adults. | — | A distinct **worldview** frame: religious, but not Christian. Sensitive to disparagement, misrepresentation, and pressure to convert (see the 2011 WCC/WEA/PCID code, §3.1). | High stereotype risk for LLMs (§5). |

The sibling extract [`reconcile-culture-and-ministry-design.md`](reconcile-culture-and-ministry-design.md)
proposes **Paul's three audiences** (synagogue / Lystra / Athens) as a persona axis. That maps
cleanly onto the familiarity and worldview axes here:

- **Synagogue:** high familiarity with Christian texts. In this tool, the Exvangelical.
- **Lystra:** folk or other-faith religion. In this tool, the Neighbor of Another Faith.
- **Athens:** a philosophical or secular frame. In this tool, the Skeptic and the Seeker.

### 1.2 Which axes best separate how a post lands

Ranked by how much each axis changes the reaction to the **same post**:

1. **Familiarity / insider literacy.** This decides whether jargon, verse references, and
   in-group assumptions are understood at all. A never-churched reader cannot decode "quiet
   time," "the blood," or "Rom 8:28." An ex-insider decodes everything, and may recognise
   manipulation. *(Engel; Gray; the Christianese research in §3.1.)*
2. **Disposition (receptive ↔ hostile).** This decides how much tolerance the reader has for
   preaching, certainty claims, and calls to action. It is independent of familiarity (Gray
   Matrix). Real hostility is rare: Rainer found about 5% hostile (U5), while PRRI's
   rejectionists (58% of nones) think religion does more harm than good but are not
   necessarily hostile to individuals.
3. **Church history (none, drifted, or hurt).** This decides sensitivity to hypocrisy,
   control, purity culture, abuse, politics, and LGBTQ teaching. It is the strongest predictor
   of being *wounded* by a post: PRRI 47% LGBTQ, 31% abuse, a third mental health; Pew 30% bad
   experiences with religious people.
4. **Worldview frame (secular, SBNR, or other faith).** This decides whether God-talk, prayer
   offers, and exclusive claims read as invitation, as irrelevant, or as disrespect toward the
   reader's own faith.
5. **Age/generation** works as a **modifier**. It correlates with axes 1–3: younger people are
   less familiar, more often SBNR, and more sensitive to LGBTQ and gender issues. Put it on the
   persona card instead of making it a tier.
6. **Political lean** also works as a **modifier**. Vary it on purpose across personas, so that
   partisan framing from *either* side is caught. Nones lean left overall, but "nothing in
   particular" nones are less engaged. A rubric that only catches right-coded partisanship
   would itself be partisan.
7. **Culture/ethnicity** works as a **modifier** too. *The Great Dechurching* found a distinct
   BIPOC profile. This is the highest stereotype risk, so leave it out of the MVP or add it only
   with interview grounding.

### 1.3 Recommended MVP personas (5)

The personas are ordered as the "levels" the brief asks for, from most receptive to most
critical. Each one also moves on the other axes, so no axis has just one representative.

| # | Persona | One line | Familiarity | Disposition | Church history | Worldview | Age / politics (modifiers) | Grounded in |
|---|---|---|---|---|---|---|---|---|
| 1 | **The Seeker** | Spiritually curious Gen Z adult who never went to church, open to Jesus but lost in church language. | Low | Receptive (U1–U2) | None | SBNR | 19–24; politically disengaged | Barna "spiritually open" (16% of non-Christians); Pew SBNR 22%; Barna Gen Z prefer witness through lived example |
| 2 | **The Drifter** | "Nothing in particular" adult, raised loosely Christian, who stopped going after a move; neutral and busy, scrolls past most religious content. | Medium | Neutral / apathetic (U3) | Drifted (casually dechurched) | Secular by default | 35–45; moderate or right-leaning, low engagement | Pew: nothing in particular is 19% of adults; Great Dechurching "casual" majority; PRRI Apatheists |
| 3 | **The Neighbor of Another Faith** | Practising member of another religion (e.g. a Muslim or Hindu professional) who respects faith but notices disparagement or pressure. | Low to medium (Christian jargon) | Respectful but committed elsewhere (U3) | None, or school/friends only | Other faith | 30s; varied | Pew 7% other faiths; WCC/WEA/PCID 2011 code |
| 4 | **The Exvangelical** | Raised in an evangelical youth group, deconstructed in college, still admires Jesus but distrusts churches; alert to hypocrisy, purity culture, and politics. | High | Resistant (U4) | Hurt / deconstructed | Unaffiliated, spiritual-ish | 26–34, often a woman; left-leaning | Barna 42% deconstructed; PRRI 47% LGBTQ and ~1/3 mental health; Survey Center 54% of Gen Z leavers women; *Church Refugees*; Great Dechurching "casualties" |
| 5 | **The Skeptic** | College-educated atheist who is critical but **not hostile**: civil, engaged, and allergic to overclaiming, pressure to convert, and politics. | Medium (culturally literate) | Critical (U4–U5, PRRI Rejectionist) | None, or brief | Secular / atheist | 30–50; politically engaged, left-leaning | Pew: atheists and agnostics highly engaged; Barna: 83% of atheists/agnostics see attempts to convert as extremist; PRRI Rejectionists |

**Design notes**

- **Keep the Skeptic from becoming a strawman.** Only about 5% of the unchurched are hostile.
  If you want a hostile stress-test persona, add it as an optional sixth ("The Hostile Critic"),
  turned off by default and labelled as a worst case.
- **Weighting.** If the tool shows an aggregate, weight it by prevalence instead of counting
  every persona equally. The Drifter and the Seeker stand for far more people than the
  Exvangelical does, even though exvangelicals are the loudest critics online.
- **Fallback set (3).** If the build is time-boxed, use the Seeker (low familiarity,
  receptive), the Exvangelical (high familiarity, hurt), and the Skeptic (medium familiarity,
  critical). Together they cover both ends of the familiarity and disposition axes.

---

## 2. Documented outsider perceptions of Christians

### 2.1 *unChristian* (Kinnaman & Lyons, Baker 2007)

The research was done by Barna with 16–29-year-olds; summaries describe it as drawn from
more than 10,000 interviews over three years. It found six broad themes: **hypocritical, too
focused on getting converts, antihomosexual, sheltered, too political, and judgmental.**

Among young non-Christians ("outsiders"), the most common labels for present-day
Christianity were:

| Label | Share of outsiders |
|---|---|
| Antihomosexual | 91% |
| Judgmental | 87% |
| Hypocritical | 85% |
| Old-fashioned | 78% |
| Too involved in politics | 75% |
| Out of touch with reality | 72% |
| Insensitive to others | 70% |

Even young churchgoers agreed in large numbers: about half called Christianity judgmental,
hypocritical, or too political, and 80% picked "antihomosexual." Only **3%** of young outsiders
held a favorable view of evangelicals (via coverage).

### 2.2 Newer data

| Source | Finding relevant to posts |
|---|---|
| **Barna, *Spiritually Open*** (Dec 2022 survey, published May 2023, with Gloo and He Gets Us) | **71%** of U.S. teens and adults view **Jesus** positively, but only **36% of non-Christians** view **Christianity** positively. People with no faith: **49% hypocritical, 48% judgmental**, and only **15%** say they respect Christianity. Hypocrisy is the top reason given for not embracing Christian teaching. Positive views: **megachurches 17%** and **celebrity pastors 19%** among non-Christians; local churches 47% overall. |
| **Barna, *The Open Generation*** (2022; 25,000 teens aged 13–17 in 26 countries) | **Loving:** 49% say this of Jesus, 31% of Christians. **Hypocritical:** 3% of Jesus, 18% of Christians. **Judgmental:** 4% of Jesus, 16% of Christians. The gap between Jesus and his followers is the story. |
| **Barna, *Reviving Evangelism*** (2019, n = 1,001) | Non-Christians and lapsed Christians most want a faith-conversation partner who **listens without judgment (62%)**, but only **34%** see that trait in Christians they know. **Does not force a conclusion:** 50% want it, 26% see it. **Interested in others' stories:** 29% vs 17%. |
| **Barna, Gen Z evangelism** (2021) | Non-Christian teens prefer witness through **behaviour (55%)**. **Having the Bible quoted** was least appealing (**17%**). 72% say listening without judgment marks someone comfortable sharing their faith. |
| **Barna, *Good Faith*** (Kinnaman & Lyons 2016; survey Aug 2015, n = 1,000) | **45%** of atheists, agnostics, and unaffiliated agree "Christianity is extremist." **83% of atheists/agnostics** consider *attempting to convert others* extremist, against 10% of evangelicals. |
| **Barna, *Spiritual Conversations in the Digital Age*** (2018) | **58% of non-Christians** say someone has shared faith with them on Facebook or social media (sources differ on which). Millennial Christians were the most likely to say digital life made them "more careful" (58%). Social media is already the main place where outsiders meet Christian witness. |
| **Pew, views of religious groups** (survey Sept 2022, published Mar 2023, n = 10,588) | **Evangelicals:** 28% favorable and 27% unfavorable among all adults, but **among non-evangelicals 18% favorable vs 32% unfavorable**. |
| **Pew, nones** (Jan 2024) | 47% dislike religious organizations; 30% report bad experiences with religious people; 43% say religion does more harm than good. |
| **PRRI** (Mar 2024) | 47% of people who left a religion cite its teachings on LGBTQ people; 31% cite clergy abuse; about a third say it was bad for their mental health. |
| **Pew, religion and politics** (survey Apr 6–12, 2026, published May 14, 2026) | **66%** say houses of worship should **keep out of political matters**, and **79%** say they should **not endorse candidates** (Republicans 74%, Democrats 84%). |
| **LifeWay Research** (2008, n = 1,402 unchurched) | **72%:** the church is "full of hypocrites." **44%:** Christians "get on my nerves." But **78%** would be willing to listen to someone share their beliefs, and 71% say Jesus makes a positive difference. |

### 2.3 What this means for the tool

- The gap is consistent from 2007 to 2023. Outsiders like **Jesus**. They distrust **Christians
  and institutions**, mainly over **hypocrisy, judgment, and politics**. Posts that look like
  Jesus (kindness, presence with outsiders, humility) work *with* existing goodwill. Posts that
  look like the stereotype confirm it.
- Outsiders want **listening, not pushing**, and **lived example over quoted proof**. Bare
  verse citations and pressure toward a decision are the least effective formats.
- **Gap:** no rigorous, recent study was found on how non-Christians perceive *Christians'
  social-media posts* specifically. All the data is about Christians and Christianity in general.
  This is a good use for the tool's interview plans.

---

## 3. Witness frameworks and rubric v1

### 3.1 Frameworks reviewed

| Source | Core idea | What it becomes in the rubric |
|---|---|---|
| **1 Pet 3:15–16** | Be ready to give a reason for your hope, but with **gentleness and respect**, keeping a good conscience. | Tone criterion. Readiness to answer when asked, rather than pushing. |
| **Col 4:5–6** | Walk wisely toward **outsiders**, and make speech **gracious, seasoned with salt**, so you know how to answer **each person**. | Speech fitted to the specific hearer, which is the basis for both Clarity and Tone. Salt also means not bland: a post may still have substance. |
| **Gal 5:22–23** | Fruit: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control. | Observable as tone (kindness, gentleness, patience), self-control (no outrage), and joy. |
| **1 Cor 13:4–7** | Love is patient and kind; it does not boast, is not proud, is not rude, keeps no record of wrongs. | Humility & Integrity (no boasting); Gentleness (not rude); Welcome (no record of wrongs). |
| **Matt 9:9–13** | Jesus eats with tax collectors and sinners; mercy, not sacrifice; the sick need a doctor. | Welcome over Judgment: presence with outsiders, not distance from them. |
| **1 Cor 5:12–13** | It is not ours to judge those outside; God judges outsiders. The church judges its own. | Moral critique pointed at insiders, including the poster, is fine. Condemning outsiders is the failure mode. |
| **"What would Jesus do"** | Imitate Jesus's way with people. | Used as an overall check, especially Barna's finding that Jesus is seen as loving and Christians as judgmental. Note: "loving" is how outsiders describe Jesus. |
| **Bonhoeffer (genuine)** | In *Discipleship*, the chapter on the disciple and unbelievers (Matt 7) argues that disciples may not judge others: judging blinds us to our own sin and to the grace others are equally owed. *Letters and Papers from Prison*, "Outline for a Book" (Aug 1944): "The church is church only when it exists for others." | Welcome over Judgment; Love Made Visible. |
| **Keller, *Center Church*** (Zondervan 2012, Part 3: contextualization) | Adapt the message so it is understandable and compelling to particular hearers without compromising truth. **Under-contextualising** idolises the speaker's culture (the fundamentalist error) and leaves hearers confused. **Over-contextualising** idolises the hearers' culture (the liberal error) and never challenges them. "Active contextualization" enters the culture, challenges it, then appeals: it affirms the culture's "A" beliefs and uses them to question its "B" beliefs. | Outsider Clarity, against under-contextualising. A safeguard against rewarding blandness: a post that challenges respectfully should not be marked down for discomfort. |
| **Newbigin, *The Gospel in a Pluralist Society*** (Eerdmans 1989, ch. 18, p. 227) | The congregation that believes the gospel and lives by it is the only real "hermeneutic of the gospel": the way people come to understand it. | Love Made Visible. Witness is judged by the life a post shows, not by its claims. |
| ***Christian Witness in a Multi-Religious World: Recommendations for Conduct*** (WCC, WEA and Pontifical Council for Interreligious Dialogue, 2011) | Twelve principles, among them acting in God's love; integrity, charity, compassion and humility that overcome arrogance, condescension and disparagement; respect for all people; renouncing false witness, meaning not misrepresenting other religions; and allowing people time for personal discernment before any change of religion. | Gentleness & Respect, especially for the Neighbor persona; Invitation without Pressure. A cross-tradition standard signed by bodies representing most of the world's Christians. |
| **Thiessen, *The Ethics of Evangelism*** (IVP Academic 2011) | Fifteen criteria for ethical persuasion: dignity, care, no physical, psychological or social coercion, no inducements, rationality, truthfulness, humility, tolerance, motivation, identity, cultural sensitivity, results, and the Golden Rule. | Invitation without Pressure (coercion, inducement), Humility & Integrity (truthfulness, motivation). |
| **"Christianese" research** | An Emory thesis treats evangelical jargon as a "religiolect" that builds a boundary against non-speakers. A Liberty University corpus study (about 885,000 words, including social-media posts) finds it earnest but **functionally ambiguous to outsiders**. Practitioners (*Christianity Today*, the Unstuck Group) advise outsider-testing church language and explaining unfamiliar Bible references. | Outsider Clarity. |
| **Published rubric?** | **None found.** No validated, published rubric scores Christian social-media witness. Closest: church social-media audit checklists (e.g. Diocese of Newark: tone, newcomer vs member balance, call to action), guest-focused website checklists ("speaks to guests, not insiders"), and Rainer's *Becoming a Welcoming Church* (hospitality in person). | Rubric v1 below is a **new synthesis**, so it should be versioned and calibrated (§3.5). |

### 3.2 Mapping Bennett's lenses to observable criteria

| Lens | Observable in a post | Rubric criterion |
|---|---|---|
| Fruit of the Spirit | Kind, patient, gentle wording; joy; self-control (no outrage, no all-caps) | Gentleness & Respect; Love Made Visible |
| What would Jesus do | Would Jesus say this to this person, in this way? Jesus is seen as loving, Christians as judgmental. | All criteria; used as the summary question |
| Matt 9, eating with sinners | Outsiders shown as neighbours and guests, not as enemies or "the world" | Welcome over Judgment |
| 1 Cor 13 love | No boasting, pride, rudeness, or score-keeping | Humility & Integrity; Gentleness & Respect |
| 1 Cor 5:12–13 | Who is the target of moral critique: insiders (fine) or outsiders (failure mode)? | Welcome over Judgment |
| Bonhoeffer quote (as Bennett means it) | Would an outsider see a life that raises a question, rather than an argument that ends one? | Love Made Visible; Invitation without Pressure |
| Concern: offensive | Contempt, mockery, caricature of groups | Gentleness & Respect; Welcome over Judgment |
| Concern: political / partisan | Party or candidate alignment, partisan slogans, faith fused with nation or party | Kingdom over Party |
| Concern: jargon / insider-only | Unexplained terms, bare verse references, in-group assumptions | Outsider Clarity |
| Concern: echo chamber | Written as if only Christians are reading; no door for anyone else | Outsider Clarity; Invitation without Pressure |

### 3.3 Rubric v1 (`witness-rubric@1.0`)

**Scale (every criterion).** Each criterion gets a score from 0 to 4, or N/A with a reason.
Every score must quote the words in the post that justify it.

| Score | Label | Meaning |
|---|---|---|
| 0 | Harmful | Actively confirms an outsider stereotype or wounds the reader |
| 1 | Poor | Clear problems that most outsider personas would notice |
| 2 | Mixed / neutral | Neither helps nor hurts |
| 3 | Good | Clear strengths, minor issues |
| 4 | Exemplary | A model of this criterion |

Use N/A when the criterion is not engaged. For example, Kingdom over Party is N/A for a post
with no political content. N/A scores are left out of any average so that an absent topic does
not inflate the result.

| ID | Criterion | One-line definition | Raises the score | Lowers the score | Lens / evidence |
|---|---|---|---|---|---|
| C1 | **Outsider Clarity** | Could someone with no church background understand the post and see that it is for them too? | Plain words; terms explained; a verse quoted *with* context or meaning; on-screen text and captions that make sense alone; addresses "you" as anyone | Unexplained jargon ("quiet time," "backslid," "covered by the blood," "season," "fellowship," acronyms, ministry brand names); bare references ("Rom 8:28"); assumes the reader was at Sunday's service; "church family" as the only audience | Col 4:6; Keller (under-contextualization); Christianese research; Barna (Bible quotes least appealing) |
| C2 | **Gentleness & Respect** | Is the tone kind and respectful toward everyone, including people who disagree or believe differently? | Warm, patient, humble tone; describes other views fairly; respectful about other religions; honest disagreement without contempt | Sarcasm, mockery, insults; "us vs them"; caricaturing atheists, other faiths or groups; outrage bait; all-caps shouting; fear-mongering | 1 Pet 3:15–16; Gal 5:22–23; 1 Cor 13; WCC/WEA/PCID principles on humility and false witness |
| C3 | **Welcome over Judgment** | Does the post treat outsiders as welcome neighbours, and keep moral correction aimed at insiders? | Shows Christians with outsiders (Matt 9); self-examination ("we," "I"); grace offered before demands; dignity for people whose lives differ | Condemns "the world," "the culture," or named groups; moralises at non-Christians; treats sinners as the enemy; implies outsiders are the problem | Matt 9:9–13; 1 Cor 5:12–13; Bonhoeffer, *Discipleship*; *unChristian* (judgmental 87%; antihomosexual 91%) |
| C4 | **Kingdom over Party** | Does the post keep the faith distinct from party, candidate, and national identity? (N/A if there is no political content.) | Engages public issues through care for affected people; nonpartisan framing; humility on contested policy; prays for leaders of every party | Endorses or opposes a candidate or party; partisan slogans, hashtags or memes; mocks political opponents; fuses being Christian with a party or nation. **Applies equally to left- and right-coded content.** | *unChristian* (too political 75%); Pew 2026 (66% keep out, 79% no endorsements); Hout & Fischer backlash thesis |
| C5 | **Humility & Integrity** | Does the post come across as honest and unpretentious, with no gap between what it claims and how it acts? | Admits weakness, doubt or failure; gives credit to others; claims proportionate to evidence; consistent with the values it states | Boasting about numbers, crowds or growth; celebrity-pastor gloss; polished perfection; self-promotion presented as ministry; defensiveness; overclaiming | 1 Cor 13:4 (does not boast); Barna (hypocrisy the top objection, 49%; celebrity pastors 19% positive); Thiessen (truthfulness, motivation) |
| C6 | **Love Made Visible** | Does the post show love *in action* toward real people, including people outside the church, rather than only talking about it? | Concrete stories of service, generosity or presence; neighbours who are not members included; joy; serves people with no strings attached | All internal programming, asks and events; love only stated in the abstract; people used as props for the ministry's image | Newbigin (the congregation as hermeneutic); Bonhoeffer ("church for others"); Barna Gen Z (behaviour 55%); Gal 5:22 |
| C7 | **Invitation without Pressure** | Does the post leave a door open, with a low-stakes next step, while respecting the reader's freedom to say no? | Asks questions; makes room for doubt; gentle, specific invitation ("come as you are," "ask us anything"); an answer offered when asked (1 Pet 3:15) | Guilt or fear pressure (hell threats aimed at strangers); manipulative urgency; "share or you're ashamed of Jesus"; conversion as a transaction; **or the opposite failure: no door at all, insider-only content** | Barna *Reviving Evangelism* (listen without judgment 62%; don't force a conclusion 50%); Barna *Good Faith* (83% of skeptics see converting as extremist); Thiessen (coercion); WCC (personal discernment) |

### 3.4 Guardrails: what the rubric does *not* score

- **Doctrine and theological tradition.** The rubric scores **manner and fruit**, not doctrine.
  A post can hold a traditional or a progressive view on any contested question and still score
  4 on every criterion, if it is clear, gentle, humble, nonpartisan, and welcoming.
- **The offence of the message vs the offence of the messenger.** Keller's over- and
  under-contextualization gives the test. A post that *challenges* respectfully may make a
  persona feel convicted or uncomfortable, and that should not count against it. Only avoidable
  offence caused by the manner should lower a score.

  This fits the memlog's core signal, the simulated **felt response**. Suggested vocabulary:

  | Kind of response | Feelings |
  |---|---|
  | Positive | drawn in, curious, respected, moved, convicted |
  | Neutral | indifferent, confused |
  | Negative | excluded, belittled, judged, pressured, offended, wounded |

  "Convicted" and "condemned" must stay separate labels.
- **Political position** is not scored. Only *partisan alignment and fusion* is (C4).
- **No individual scoring.** The rubric scores posts, not the spiritual state of the person
  who posted.

### 3.5 Versioning and calibration

- Give the rubric an ID and a semantic version (`witness-rubric@1.0`), and keep each
  criterion's ID stable (C1–C7). Store the full anchor text with each version, and have every
  score record the rubric version and persona version that produced it.
- **Patch** (1.0.x): wording fixes only, scores still comparable. **Minor** (1.x): add
  criteria or anchors, recompute old scores on the new version if needed. **Major** (x.0):
  change criteria or scale; old scores are not comparable.
- Keep a small **calibration set** of 10–20 posts, hand-scored by Bennett. Later, real
  non-believers react to them in interviews. Re-run it on every rubric or persona change to
  catch drift. Include deliberately bad and deliberately good posts, so the model can't rate
  everything a 3.
- Keep **rubric scoring** (evidence-based, one judge pass) **separate** from **persona
  reactions** (felt response for each persona). The personas should explain *why* a score
  matters to them, not produce the score. This keeps persona caricature out of the numbers.

---

## 4. Verifying the Bonhoeffer quote

> "Your life as a Christian should make non-believers question their disbelief in God."

**Verdict: unverified, and probably misattributed or a loose paraphrase.** Do not present it as
a Bonhoeffer quotation without a qualifier.

The evidence:

- **No primary source.** Every place it appears (Goodreads, AZQuotes, QuoteFancy, a
  CUFI "Bonhoeffer Fellowship" booklet, Pinterest, Sunday Social graphics, a 2014 post by The
  Gospel Project on X) gives no book, letter, sermon, or page.
- **Not on Wikiquote.** The [Wikiquote Bonhoeffer page](https://en.wikiquote.org/wiki/Dietrich_Bonhoeffer)
  lists sourced quotes and a "Misattributed" section. This line appears in neither, and the word
  "disbelief" does not appear on the page.
- **The earliest dated appearance found is 2014**, on social media. That is the typical
  pattern for a fabricated or drifted quotation.
- **A known pattern of fake Bonhoeffer quotes.** The famous "Silence in the face of evil is
  itself evil" was shown to be absent from his works. Doris Bergen first raised it in
  *Interpreting Bonhoeffer* (2013), and Victoria Barnett said she was "virtually certain" it
  does not exist. Wikiquote also lists a "less about cautiously avoiding sin" line that is
  really Eric Metaxas writing *about* Bonhoeffer.
- **A similar sentiment from someone else.** Cardinal Emmanuel Suhard (Archbishop of
  Paris, d. 1949) is widely quoted, through Madeleine L'Engle, on witness as being a "living
  mystery": living so that one's life would make no sense if God did not exist. The idea is
  close to Bennett's quote. That attribution is also unverified at the primary level, though it
  is an older and better-established chain.
- **Not checked:** the critical edition, *Dietrich Bonhoeffer Works* (DBWE, 17 volumes), was
  not searchable here. A DBWE full-text search or a question to the International Bonhoeffer
  Society would settle it.

**Recommendation.** Present the line as "a saying commonly attributed to Bonhoeffer," or use a
verified Bonhoeffer source that says something close:

- *Letters and Papers from Prison* (DBWE 8), "Outline for a Book," August 1944: the church is
  church only when it exists for others. Check the DBWE 8 page before citing.
- *Discipleship* (DBWE 4), the chapter on the disciple and unbelievers (Matt 7:1–12):
  disciples have no right to judge, and must not force the word on people. This chapter fits
  the 1 Cor 5:12–13 lens directly.

---

## 5. Synthetic personas: limits, risks, and mitigations

### 5.1 Known limits

| Risk | Evidence | What it means for this tool |
|---|---|---|
| **Misportrayal** | Wang, Morgenstern & Dickerson, *Nature Machine Intelligence* 7(3) 2025 (3,200 human participants, 16 identities, 4 LLMs): LLMs portray groups more as outsiders imagine them than as members see themselves. | An "exvangelical" persona may sound like what Christians imagine exvangelicals think. |
| **Flattening** | Same paper: identity-prompted outputs lose the variety found inside real groups. Prompting by identity can also **essentialise** identity. | Every Skeptic sounds alike, so the tool under-reports the range of reactions. |
| **Caricature** | Cheng, Piccardi & Yang, "CoMPosT," EMNLP 2023: simulations exaggerate defining traits, especially for **political and marginalised groups** and on general topics. | Personas over-react in the direction of their label. The Skeptic becomes militant and the Exvangelical always traumatised. |
| **Stereotyped persona text** | Cheng, Durmus & Jurafsky, "Marked Personas," ACL 2023: GPT-3.5/4 generated personas contain more stereotypes than human-written ones. | Persona cards written by an LLM need human review. |
| **Religion-specific bias** | Abid, Farooqi & Zou 2021: GPT-3 showed persistent anti-Muslim bias (e.g. "Muslim" completed as "terrorist" in 23% of analogy tests). Newer models vary. | The Neighbor of Another Faith persona is a high-risk area. Never let it voice a foreign-threat trope. |
| **Opinion misalignment** | Santurkar et al., ICML 2023 (OpinionQA): LM opinions are substantially misaligned with many U.S. demographic groups, by as much as the Democrat–Republican gap on climate change. | A model's default "outsider" may really be its own training-data average. |
| **Low variance and instability** | Bisbee et al., *Political Analysis* 2024: synthetic survey answers have means near the real ones but **far too little variance**, shift with small wording changes, and changed over a 3-month window. | Show a *range* of reactions, not one verdict. Pin the model and prompt version for each persona version. |
| **Demographics explain little** | Hu & Collier, ACL 2024: persona variables explained **under 10%** of annotation variance in subjective datasets. | Labels like age or religion predict reactions weakly. Backstory and specific values matter more. |
| **Sycophancy** | Sharma et al., ICLR 2024: RLHF assistants tend to agree with users. NN/g (Rosala & Moran, June 2024): synthetic users praised concepts that real users criticised, and were "too shallow." | It runs two ways here. Personas may **soften critique** for a user who looks Christian, or **perform the critique the prompt seems to want**. |
| **Alienness / generalisation** | Anthis et al., ICML 2025 position paper: five challenges (diversity, bias, sycophancy, alienness, generalisation). Outputs can look right for non-human reasons, and accuracy drops on new topics. | Validate on the calibration set. Don't trust personas on topics far from their grounding. |

### 5.2 Mitigations that have evidence behind them

1. **Ground personas in real interviews.** This is the strongest evidence. Park et al.
   (*Generative Agent Simulations of 1,000 People*, 2024) built agents from roughly two-hour
   interviews. They reproduced General Social Survey answers at **85% of the accuracy with
   which people replicate their own answers two weeks later**, and **reduced accuracy bias
   across racial and ideological groups** compared with agents built from demographics alone.
   For this tool, the "interview plans" feature is the grounding mechanism. Persona cards should
   cite interview-derived quotes and values as these accumulate, and record how many real
   interviews each persona rests on.
2. **Write persona cards with backstory and values, not labels.** Hu & Collier and Anthis
   both support specific, implicit detail over bare demographic tags. Suggested fields:
   - ID and version
   - name and one line
   - axis values: familiarity, disposition, church history, worldview
   - modifiers: age, political lean
   - short backstory
   - what they know about Christianity
   - what they value
   - what puts them off (triggers)
   - what would make them curious
   - platform habits
   - "do not portray as" (the stereotypes to avoid)
   - evidence sources
   - grounding status (synthetic only, or *n* interviews)
3. **Label every output as simulated.** NN/g's rule is never to present synthetic output as
   real-user research. Put this on every persona reaction: *"Simulated reaction from an
   AI persona built from published survey research. Not the view of a real person."* Show a
   grounding badge, such as "0 interviews," on each persona.
4. **Treat outputs as hypotheses, not validation.** Per NN/g, use personas to draft questions
   and spot likely problems, then test with real people. This matches the tool's
   interview-plan feature.
5. **Reduce sycophancy and caricature through prompt design.**
   - Have the model **predict as an expert** how this kind of person would likely react,
     instead of role-playing in the first person (an Anthis et al. suggestion).
   - Require **at least one strength and one concern** for every post.
   - Do not tell the persona who the user is or what verdict the user hopes for.
   - Run each persona in a **separate call**.
   - Sample more than once and show the **spread**, e.g. "most likely: indifferent; possible:
     curious."
   - Keep rubric scoring separate from persona voice (§3.5).
6. **Red-team the personas** against the "do not portray as" list (the angry atheist, the
   traumatised exvangelical, the foreign or threatening other-faith neighbour). Do this before
   the demo, and on every persona version.
7. **Use prevalence weighting and stated uncertainty** in any aggregate (§1.3).

### 5.3 Ethics notes for the PRD

- The memlog says the scope is **other people's public posts**, including named individuals'.
  Simulated persona criticism of a named individual is more sensitive than criticism of an
  organisation. Keep outputs about **the post**, never about the person's character or faith.
  The memlog already flags this for the Artifact demo.
- Consent and framing: the tool's tone should model the rubric. Critique should be gentle,
  specific, and evidence-quoted.

---

## 6. Open items for the PRD

- [ ] Confirm 5 MVP personas or the 3-persona fallback (§1.3).
- [ ] Confirm the 7 rubric criteria and the 0–4 + N/A scale, or trim to 5. If trimming, the
      most mergeable pairs are C2/C3 and C6/C7.
- [ ] Decide whether the aggregate is prevalence-weighted or equal-weighted.
- [ ] Decide how the Bonhoeffer line is presented (§4).
- [ ] Decide the felt-response vocabulary and whether "convicted" counts as positive (§3.4).
- [ ] TODO: check the DBWE 8 page for the "church for others" line, and search DBWE for the
      quoted line, before any public use.

---

## Sources

### Typologies and demographics

- Pew Research Center, [Religious Landscape Study executive summary](https://www.pewresearch.org/religion/2025/02/26/religious-landscape-study-executive-summary/) (Feb 2025)
- Pew, [Religious "nones" in America: who they are and what they believe](https://www.pewresearch.org/religion/2024/01/24/religious-nones-in-america-who-they-are-and-what-they-believe/) (Jan 2024)
- Pew, [Why are nones nonreligious?](https://www.pewresearch.org/religion/2024/01/24/why-are-nones-nonreligious/) (Jan 2024)
- Pew, [Why many U.S. adults are nones](https://www.pewresearch.org/religion/2025/12/15/why-many-us-adults-are-nones-and-why-some-former-nones-have-joined-a-religion/) (Dec 2025)
- Pew, [Spirituality among Americans](https://www.pewresearch.org/religion/2023/12/07/spirituality-among-americans/) (Dec 2023)
- Coverage of Pew nones findings: [Washington Times](https://www.washingtontimes.com/news/2024/jan/24/americas-nones-present-often-conflicting-views-on-/), [Baptist Standard](https://baptiststandard.com/news/faith-culture/new-pew-study-debunks-myths-about-the-nonreligious/?print=pdf), [Aleteia](https://aleteia.org/2024/01/29/pew-survey-finds-record-number-of-religious-nones-in-us)
- PRRI, [Religious change press release](https://prri.org/press-release/new-survey-shows-religiously-unaffiliated-is-fastest-growing-religious-category/) (Mar 2024)
- PRRI/RNS, [Exodus report (2016)](https://www.prri.org/wp-content/uploads/2016/09/PRRI-RNS-Unaffiliated-Report.pdf); [Deseret summary](https://www.deseret.com/2016/9/22/20596711/why-most-people-leave-religion-they-just-stop-believing)
- Barna, [Ex-Christians aren't the only ones deconstructing](https://www.barna.com/trends/ex-christians-deconstructing/) (Oct 2024)
- Barna, [Spiritual openness](https://www.barna.com/research/spiritual-openness); [Non-Christians' beliefs about God](https://www.barna.com/trends/non-christians-beliefs-about-god/)
- Rainer scale: [SBTS news (2003)](https://www.sbts.edu/news/gospel-receptivity-among-unchurched-surprisingly-high-new-book-says/), [Mohler review](https://albertmohler.com/?p=2129), [Crosswalk](https://www.crosswalk.com/faith/spiritual-life/the-unchurched-next-door-a-new-look-at-the-challenge-1231090.html)
- [Engel scale (Wikipedia)](https://en.wikipedia.org/wiki/Engel_scale); [EAUK on the Engel scale](https://eauk.org/great-commission/what-is-the-engel-scale); [Gray Matrix history](https://www.slideshare.net/slideshow/the-gray-matrix-tracking-its-history-ver10/47397667); [Gray Matrix PDF](https://home.snu.edu/~hculbert/matrix.pdf)
- *The Great Dechurching*: [HarperCollins](https://www.harpercollinschristian.com/9780310147435/the-great-dechurching), [ChurchLeaders](https://churchleaders.com/christianity/2221621-why-americans-are-leaving-church.html), [Baptist Standard](https://baptiststandard.com/news/faith-culture/religious-exodus-explored-in-the-great-dechurching/?print=pdf), [CRI review](https://www.equip.org/articles/leaving-the-church-and-losing-our-religion-a-review-of-the-great-dechurching-by-jim-davis-and-michael-graham/)
- Packard & Hope, *Church Refugees*: [Baptist News Global](https://baptistnews.com/article/these-christians-are-leaving-behind-the-church-but-not-their-faith/)
- Hout & Fischer, [Explaining why more Americans have no religious preference](https://sociologicalscience.com/articles-vol1-24-423/) (*Sociological Science*, 2014)
- Survey Center on American Life, [Young women are leaving church in unprecedented numbers](https://www.americansurveycenter.org/newsletter/young-women-are-leaving-church-in-unprecedented-numbers/) (Apr 2024)
- Barna/Gloo, [Bible reading trends](https://www.barna.com/trends/bible-reading-trends/) (2025); [ChurchLeaders on Gen Z attendance](https://churchleaders.com/news/518058-gen-z-millennials-regular-churchgoers.html)
- Ryan Burge: [Art of Manliness interview](https://www.artofmanliness.com/podcast/rise-of-the-religious-nones/), [Niskanen Center](https://www.niskanencenter.org/the-growing-influence-of-the-non-religious/)

### Outsider perceptions

- *unChristian* summaries: [Spectrum](https://spectrummagazine.org/post-archives/how-christianity-perceived/), [Box Turtle Bulletin](https://www.boxturtlebulletin.com/2007/10/03/846), [BGEA](https://billygraham.org/?p=1412), [Barna 2007 release](https://www.barna.com/research/a-new-generation-expresses-its-skepticism-and-frustration-with-christianity/)
- Barna, [Five ways Christianity is increasingly viewed as extremist](https://www.barna.com/research/five-ways-christianity-is-increasingly-viewed-as-extremist/) (2016)
- Barna, [What non-Christians want from faith conversations](https://barna.com/research/non-christians-faith-conversations/) (2019)
- [Baptist News Global on Barna Gen Z evangelism](https://baptistnews.com/article/gen-z-non-christians-pay-most-attention-to-those-who-live-out-their-faith-rather-than-preach-it/) (2021)
- [ChurchLeaders on Barna's Open Generation](https://churchleaders.com/news/435597-barna-christians-do-poor-job-of-representing-jesus-teens-say-in-global-study-bp.html) (2022)
- [ChurchLeaders on Barna's Spiritually Open](https://churchleaders.com/news/451798-barna-research-people-like-jesus-followers-not.html) (2023)
- Barna, [Evangelism in a digital age](https://barna.com/research/evangelism-in-a-digital-age-an-infographic/) (2018); [Christian Post coverage](https://assets.christianpost.com/news/nearly-30-percent-christians-share-faith-social-media-barna.html)
- Pew, [Americans feel more positive than negative about Jews, mainline Protestants, Catholics](https://www.pewresearch.org/religion/2023/03/15/americans-feel-more-positive-than-negative-about-jews-mainline-protestants-catholics); [Word&Way](https://wordandway.org/2023/03/16/americans-like-jews-catholics-and-mainline-protestants-evangelicals-not-so-much/)
- Pew, [Most Americans think churches should not endorse political candidates](https://www.pewresearch.org/?p=303127) (May 2026); [Pew chart](https://www.pewresearch.org/chart/most-republicans-and-democrats-agree-that-churches-should-not-endorse-political-candidates/)
- LifeWay 2008: [Christian Post](https://www.christianpost.com/news/how-do-unchurched-americans-view-christianity-30793/), [Baptist News Global](https://baptistnews.com/article/surveyunchurchedamericanssaychurchisfullofhypocrites/)

### Witness frameworks

- Keller on contextualization: [interview](https://www.dashhouse.com/2008122effective-ministry-in-a-changing-culture-an-interview-with-t-html/), [Derek Radney](https://derekradney.substack.com/p/contextualization-compromise-or-an); Keller, *Center Church* (Zondervan, 2012), Part 3
- Newbigin, *The Gospel in a Pluralist Society* (Eerdmans, 1989), p. 227: [Emergent Kiwi](https://emergentkiwi.org.nz/archive/the-congregation-in-a-pluralist-society-rereading-newbigin-for-missional-churches-today)
- *Christian Witness in a Multi-Religious World* (2011): [Church of England PDF](https://www.churchofengland.org/sites/default/files/2019-05/Christian_Witness_in_a_Multi-Religious_World.pdf), [Vatican](https://www.vatican.va/roman_curia/pontifical_councils/interelg/documents/rc_pc_interelg_doc_20111110_testimonianza-cristiana_en.html), [WEA](https://ifaith.worldea.org/?p=495)
- Thiessen, *The Ethics of Evangelism* (IVP Academic, 2011): [IVP](https://ivpress.com/the-ethics-of-evangelism), [Political Theology review](https://politicaltheology.com/the-ethics-of-evangelism-by-elmer-john-thiessen/)
- Christianese: [Emory thesis](https://etd.library.emory.edu/concern/etds/1544bp39d), [Liberty University study](https://digitalcommons.liberty.edu/exhibit/2026-research-week-awards/graduate-oral-presentations/decoding-christianese-analyzing-the-double-edged-sword-of-evangelical-jargon/), [Christianity Today](https://christianitytoday.com/2017/09/eliminate-christian-jargon-from-your-church)
- Church communication checklists: [Diocese of Newark social media audit](https://dioceseofnewark.org/wp-content/uploads/2025/10/Church-Social-Media-Audit-in-3-Steps.pdf), [Unstuck Group](https://theunstuckgroup.com/insider-churches-best-christian-show-town/)
- Col 4:6: [ESV](https://www.esv.org/verses/Colossians4:6)

### Bonhoeffer

- [Wikiquote: Dietrich Bonhoeffer](https://en.wikiquote.org/wiki/Dietrich_Bonhoeffer)
- Unsourced appearances: [Goodreads](https://www.goodreads.com/quotes/978699-your-life-as-a-christian-should-make-non-believers-question), [AZQuotes](https://www.azquotes.com/quote/798480), [The Gospel Project on X (2014)](https://x.com/gospel_project/status/455386114489335808), [deeperchristianquotes](https://deeperchristianquotes.com/making-atheists-question-their-disbelief-dietrich-bonhoeffer/), [CUFI booklet](https://cufi.org/wp-content/uploads/2020/06/Bonhoeffer_Booklet_NATIONAL.pdf)
- Fake-quote precedent: [Throckmorton (2016)](https://wthrockmorton.com/2016/08/25/the-popular-bonhoeffer-quote-that-isnt-in-bonhoeffers-works/), [Trevin Wax, TGC](https://www.thegospelcoalition.org/blogs/trevin-wax/famous-christian-quotes-arent-real/)
- "Church for others": [Richard Beck](https://richardbeck.substack.com/p/letters-from-cell-92-part-6-the-man-10-12-20), [Christian History Institute](https://christianhistoryinstitute.org/magazine/article/exploring-bonhoeffers-writings)
- Suhard: [Wikipedia](https://en.wikipedia.org/wiki/Emmanuel_C%C3%A9lestin_Suhard)

### Synthetic personas

- Wang, Morgenstern & Dickerson, [LLMs that replace human participants can harmfully misportray and flatten identity groups](https://arxiv.org/abs/2402.01908) (*Nature Machine Intelligence* 7(3), 2025)
- Cheng, Piccardi & Yang, [CoMPosT](https://aclanthology.org/2023.emnlp-main.669) (EMNLP 2023)
- Cheng, Durmus & Jurafsky, [Marked Personas](https://aclanthology.org/2023.acl-long.84) (ACL 2023)
- Santurkar et al., [Whose opinions do language models reflect?](https://proceedings.mlr.press/v202/santurkar23a.html) (ICML 2023)
- Argyle et al., [Out of one, many](https://arxiv.org/abs/2209.06899) (*Political Analysis*, 2023)
- Bisbee et al., [Synthetic replacements for human survey data?](https://resolve-he.cambridge.org/core/services/aop-cambridge-core/content/view/B92267DC26195C7F36E63EA04A47D2FE/S1047198724000056a.pdf/synthetic-replacements-for-human-survey-data-the-perils-of-large-language-models.pdf) (*Political Analysis*, 2024)
- Hu & Collier, [Quantifying the persona effect in LLM simulations](https://aclanthology.org/2024.acl-long.554) (ACL 2024)
- Sharma et al., [Towards understanding sycophancy in language models](https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models) (ICLR 2024)
- Park et al., [Generative agent simulations of 1,000 people](https://arxiv.org/abs/2411.10109) (2024); [Stanford HAI brief](https://hai.stanford.edu/policy/simulating-human-behavior-with-ai-agents)
- Anthis et al., [LLM social simulations are a promising research method](https://arxiv.org/abs/2504.02234) (ICML 2025)
- Rosala & Moran, [Synthetic users: if, when, and how to use AI-generated "research"](https://www.nngroup.com/articles/synthetic-users/) (NN/g, June 2024)
- Abid, Farooqi & Zou, [Persistent anti-Muslim bias in large language models](https://arxiv.org/abs/2101.05783) (2021)
