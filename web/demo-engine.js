// Demo evaluator for the Living Letter web demo. It stands in for Claude behind the
// Artifact's `sample()` call, so a Review looks and behaves like the real one without any
// model, key or network. It reads the same prompts the Artifact sends Claude, recognises the
// step by its task line, and answers with JSON that passes the Artifact's own validators
// (SCHEMA.md §4). Scores come from plain word lists, so they are rough, not judgement.
//
// The sample reel (artifact/sample-review.json) is answered with its real saved results.

const STEP_BY_TASK = [
  ['score one social-media Post', 'assess'],
  ['simulate how each Persona', 'react'],
  ['write Discussion Questions', 'discuss'],
  ['suggest a Gentler Rewrite', 'rewrite'],
  ['draft a Ministry Outreach Plan', 'outreach'],
];

export function stepOf(prompt) {
  const task = (prompt.match(/^# Task: (.*)$/m) || [])[1] || '';
  const hit = STEP_BY_TASK.find(([needle]) => task.includes(needle));
  return hit ? hit[1] : null;
}

// Data inside a tag is escaped canonical JSON (core.js tagData).
export function tagged(prompt, tag) {
  const m = prompt.match(new RegExp(`<${tag}>\\n([\\s\\S]*?)\\n</${tag}>`));
  if (!m) return undefined;
  return JSON.parse(m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

// ---------- Reading the Post ----------

const JARGON = {
  'saved': 'given new life', 'salvation': 'rescue by God', 'sanctified': 'made holy', 'sanctification': 'growing to be more like Jesus',
  'justified': 'made right with God', 'righteousness': 'being right with God', 'righteous': 'right with God', 'redeemed': 'rescued',
  'redemption': 'rescue', 'repent': 'turn back to God', 'repentance': 'turning back to God', 'sinners': 'people who do wrong',
  'sin': 'the wrong we do', 'sins': 'the wrong things we do', 'gospel': 'good news about Jesus', 'grace': "God's undeserved kindness",
  'hallelujah': '', 'amen': '', 'born again': 'given a fresh start by God', 'washed in the blood': 'forgiven through Jesus',
  'the blood': "Jesus' death for us", 'lamb of god': 'Jesus', 'anointed': 'set apart by God', 'fellowship': 'time together',
  'backslidden': 'drifting from faith', 'backsliding': 'drifting from faith', 'covenant': 'lifelong promise', 'the word': 'the Bible',
  'holy spirit': "God's Spirit", 'rapture': 'the end of the world as some Christians picture it', 'spiritual warfare': 'spiritual struggle',
  'prayer warrior': 'someone who prays a lot', 'heathens': 'people who are not religious', 'unbelievers': 'people who do not share my faith',
  'lukewarm': 'half-hearted', 'glorify': 'honour', 'worship': 'worship', 'scripture': 'the Bible',
};
const PLAIN_ENOUGH = new Set(['worship']);
const HARSH = ['hate', 'hates', 'wicked', 'evil', 'abomination', 'disgusting', 'pathetic', 'fool', 'fools', 'idiot', 'idiots', 'stupid',
  'shame on', 'burn', 'hell', 'perish', 'mockery', 'degenerate', 'demonic', 'sick people', 'wake up', 'sheep', 'fake christian',
  "can't call yourself", 'cannot call yourself', 'not a real christian', 'disgrace', 'garbage', 'trash', 'losers'];
const CONDEMN = /\byou(?: people| all| guys)?\s+(?:are|need to|should|must|can't|cannot|will|better)\b/gi;
const OUTSIDERS = ['sinners', 'unbelievers', 'the world', 'pagans', 'heathens', 'the lost', 'nonbelievers'];
const POLITICS = ['democrat', 'democrats', 'republican', 'republicans', 'liberal', 'liberals', 'conservative', 'conservatives', 'trump', 'biden',
  'harris', 'election', 'vote', 'voting', 'left-wing', 'right-wing', 'the left', 'the right', 'america', 'nation', 'government',
  'congress', 'president', 'politics', 'political', 'woke', 'maga', 'abortion', 'border', 'party'];
const LOVE = ['serve', 'served', 'serving', 'help', 'helped', 'helping', 'feed', 'fed', 'volunteer', 'volunteered', 'gave', 'give', 'giving',
  'listen', 'listened', 'visited', 'neighbor', 'neighbour', 'neighbors', 'neighbours', 'care', 'cared', 'donate', 'meal', 'meals',
  'shelter', 'hug', 'sat with', 'brought', 'drove', 'cooked'];
const HUMILITY = ['i struggle', "i'm learning", 'i am learning', 'honestly', 'i was wrong', "i don't have all", 'my own', 'i fail',
  "i've failed", 'i doubt', 'still figuring', 'i messed up', 'confess', 'not perfect', "i'm not", 'i am not'];
const BOAST = ['the best', 'biggest', 'record-breaking', 'thousands of', 'highly favored', 'look at us', 'so proud of ourselves', 'number one'];
const CULTURE = ['work', 'job', 'school', 'college', 'class', 'coffee', 'netflix', 'gym', 'anxiety', 'stress', 'lonely', 'loneliness', 'friends',
  'family', 'phone', 'scroll', 'music', 'game', 'weekend', 'monday', 'rent', 'bills', 'mental health', 'therapy', 'sleep', 'burnout',
  'grief', 'kids', 'parents', 'city', 'neighbourhood', 'neighborhood', 'tired'];
const INVITE = ['dm me', 'message me', 'comment', 'let me know', 'what do you think', 'would love to hear', 'ask me', 'join us',
  'come along', 'everyone is welcome', 'all are welcome', 'talk about it', 'reach out', 'come as you are'];
const CONVICTION = ['i believe', 'we believe', 'jesus is', 'god is', 'christ is', 'the truth is', 'i know that', 'the bible says',
  'scripture says', 'jesus said', 'god says', 'i trust'];
const THREAT = /\b(?:hell|burn|perish|damned?|wrath|judgment day|judgement day)\b/i;
const BLAME = /\b(?:blame|fault|ruin|ruined|destroy|destroying|enemy|enemies)\b/i;
const VERSE = /\b(?:[1-3]\s?)?[A-Z][a-z]+\.?\s\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?\b/g;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTerms(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((t) => new RegExp(`(^|[^a-z'])${escapeRe(t)}(?=$|[^a-z'])`, 'i').test(lower));
}

function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

// A short quotation without its closing full stop, so “…” reads cleanly inside a sentence.
function quote(s, n) {
  return clip(s, n).replace(/[.!]+$/, '');
}

function clip(s, n = 140) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t;
}

// The first sentence holding any of these terms, or null.
function sentenceWith(sentences, terms) {
  const lowered = terms.map((t) => t.toLowerCase());
  return sentences.find((s) => lowered.some((t) => new RegExp(`(^|[^a-z'])${escapeRe(t)}(?=$|[^a-z'])`, 'i').test(s))) || null;
}

export function analyse(text) {
  const sentences = sentencesOf(text);
  const jargon = findTerms(text, Object.keys(JARGON)).filter((t) => !PLAIN_ENOUGH.has(t));
  const verses = text.match(VERSE) || [];
  const harsh = findTerms(text, HARSH);
  const condemn = (text.match(CONDEMN) || []).length;
  const outsiders = findTerms(text, OUTSIDERS);
  const politics = findTerms(text, POLITICS);
  const love = findTerms(text, LOVE);
  const humility = findTerms(text, HUMILITY);
  const boast = findTerms(text, BOAST);
  const culture = findTerms(text, CULTURE);
  const invite = findTerms(text, INVITE);
  const questions = sentences.filter((s) => s.endsWith('?'));
  const conviction = findTerms(text, CONVICTION);
  return { text, sentences, jargon, verses, harsh, condemn, outsiders, politics, love, humility, boast, culture, invite, questions, conviction };
}

const clamp = (n) => Math.max(1, Math.min(5, Math.round(n)));

// ---------- Assess ----------

function score(key, a) {
  const first = a.sentences[0] || a.text;
  const pick = (terms) => sentenceWith(a.sentences, terms) || first;
  const harshLine = pick([...a.harsh, ...a.outsiders]);
  switch (key) {
    case 'outsider_clarity': {
      const hits = a.jargon.length + a.verses.length;
      const s = hits === 0 ? 4 + (a.sentences.length <= 6 ? 1 : 0) : hits === 1 ? 3 : hits <= 3 ? 2 : 1;
      const term = a.jargon[0] || a.verses[0];
      const ev = term ? pick([term]) : first;
      const ex = s >= 4
        ? `The Post uses everyday words, so someone with no church background can follow it. Nothing here needs a glossary. That makes its main point easy to hear for anyone scrolling past.`
        : `Words like “${term}” are clear to churchgoers but assume a background many readers do not have. Someone outside the faith may follow the mood but miss the meaning. Saying it in everyday words, or adding a short explanation, would raise this.`;
      return { s, ev, ex, src: s <= 3 ? ['jargon'] : [] };
    }
    case 'cultural_awareness': {
      let s = 3 + (a.culture.length >= 1 ? 1 : 0) + (a.culture.length >= 3 ? 1 : 0) - (a.harsh.length >= 2 || a.condemn ? 1 : 0);
      s = clamp(s);
      const ev = a.culture.length ? pick(a.culture) : first;
      const ex = s >= 4
        ? `It connects to ordinary life (${a.culture.slice(0, 2).join(', ')}), which shows it knows its readers' world. That earns a hearing before it asks anything of them. Readers outside the faith are more likely to keep reading.`
        : `The Post speaks mostly from inside church life and does not touch the everyday world its readers live in. That makes it easier to scroll past for someone who does not share the faith. One concrete link to ordinary life would raise this.`;
      return { s, ev, ex, src: s <= 3 ? [a.harsh.length ? 'tone' : 'jargon'] : [] };
    }
    case 'gentleness_respect': {
      let s = 4 - Math.min(3, a.harsh.length) - (a.condemn ? 1 : 0) + (!a.harsh.length && !a.condemn && (a.love.length || a.humility.length) ? 1 : 0);
      s = clamp(s);
      const ev = a.harsh.length ? harshLine : pick([...a.conviction, ...a.love, ...a.humility]);
      const ex = s >= 4
        ? `The tone is kind and respectful, including toward people who might disagree. Nothing here talks down to its readers. That gentleness makes the message easier to receive.`
        : s === 3
          ? `The tone is mostly respectful, but a line or two could read as pointed to someone who disagrees. Readers outside the faith tend to notice tone before content. Softening that wording would raise this.`
          : `Lines like this one are likely to read as harsh or contemptuous to someone who disagrees, whatever the intent. Most readers outside the faith would stop listening here. Stating the same conviction calmly, without the sharp words, would change this a lot.`;
      return { s, ev, ex, src: s <= 3 ? ['tone', ...(a.harsh.length >= 2 ? ['claim'] : [])] : [] };
    }
    case 'welcome_over_judgment': {
      let s = 4 - Math.min(2, a.harsh.length) - (a.condemn ? 1 : 0) - (a.outsiders.length ? 1 : 0) + (a.invite.length && !a.harsh.length ? 1 : 0);
      s = clamp(s);
      const ev = a.harsh.length || a.outsiders.length ? harshLine : pick([...a.invite, ...a.love, ...a.conviction]);
      const ex = s >= 4
        ? `Outsiders are treated as welcome neighbours here, not as a problem to fix. Any challenge in it is aimed at the speaker or at believers. A reader outside the faith would feel included.`
        : `Readers outside the faith are likely to feel judged or talked about rather than talked to. Correction aimed at outsiders tends to close the door the Post may hope to open. Keeping moral challenge for insiders, and welcoming everyone else, would raise this.`;
      return { s, ev, ex, src: s <= 3 ? ['tone'] : [] };
    }
    case 'kingdom_over_party': {
      if (!a.politics.length) return { s: null, ev: null, ex: 'The Post has no political content, so this Criterion does not apply.', src: [] };
      const s = clamp(a.politics.length >= 2 || a.harsh.length ? 2 : 3);
      return {
        s, ev: pick(a.politics),
        ex: `The Post ties its faith to political language (“${a.politics[0]}”), so readers may hear a party message rather than a Christian one. People on the other side are likely to stop listening, whichever side it leans. Keeping the faith distinct from party and nation would raise this.`,
        src: ['tone', 'claim'],
      };
    }
    case 'humility_integrity': {
      let s = 4 + (a.humility.length ? 1 : 0) - (a.boast.length ? 1 : 0) - (a.harsh.length >= 2 ? 1 : 0);
      s = clamp(s);
      const ev = a.humility.length ? pick(a.humility) : a.boast.length ? pick(a.boast) : first;
      const ex = s >= 4
        ? `It comes across as honest and unpretentious${a.humility.length ? ', and it admits the speaker is still learning' : ''}. There is no gap between what it claims and how it speaks. That honesty builds trust with sceptical readers.`
        : `Some of it reads as self-congratulating or certain in a way that leaves no room for the speaker's own failings. Readers outside the faith are quick to notice a gap between claim and conduct. A line of honest humility would raise this.`;
      return { s, ev, ex, src: s <= 3 ? ['tone'] : [] };
    }
    case 'love_made_visible': {
      let s = 3 + (a.love.length >= 1 ? 1 : 0) + (a.love.length >= 2 ? 1 : 0) - (a.harsh.length ? 1 : 0);
      s = clamp(s);
      const ev = a.love.length ? pick(a.love) : first;
      const ex = s >= 4
        ? `It shows love in action toward real people, not only in words. Readers can picture what that care looked like. That is often more persuasive than any argument.`
        : `The Post talks about faith but shows little of it being lived out toward real people. Readers outside the faith often look for love they can see before they listen. One concrete example of care would raise this.`;
      return { s, ev, ex, src: s <= 3 ? ['tone'] : [] };
    }
    case 'invitation_dialogue': {
      let s = 3 + (a.invite.length ? 1 : 0) + (a.questions.length && !a.harsh.length ? 1 : 0) - (a.condemn || a.harsh.length >= 2 ? 1 : 0);
      s = clamp(s);
      const ev = a.invite.length ? pick(a.invite) : a.questions[0] || first;
      const ex = s >= 4
        ? `It leaves a door open: readers are invited to respond or ask, without pressure. That makes it a conversation rather than a lecture. People outside the faith are more likely to engage.`
        : `It says its piece but gives readers no real way in. Without a question or an open invitation, someone who disagrees has nowhere to go but away. Ending with an honest question or an invitation to talk would raise this.`;
      return { s, ev, ex, src: s <= 3 ? [a.condemn || a.harsh.length ? 'tone' : 'claim'] : [] };
    }
    case 'clear_conviction': {
      const s = clamp(3 + (a.conviction.length >= 1 ? 1 : 0) + (a.conviction.length >= 2 ? 1 : 0));
      const ev = a.conviction.length ? pick(a.conviction) : first;
      const ex = s >= 4
        ? `It states plainly what it believes, so readers know where the speaker stands. This scores clarity, not whether the belief is right. Clear conviction, kindly said, is easier to respect than vagueness.`
        : `The Post hints at what it believes but never quite says it. Readers may be unsure what the speaker is actually claiming. One plain sentence of belief would raise this.`;
      return { s, ev, ex, src: s <= 3 ? ['claim'] : [] };
    }
    default:
      return null;
  }
}

export function assess(post, rubric) {
  const text = (post.pasted_text || post.video_transcript || '').trim();
  const transcript = (post.pasted_text || '').trim() || clip(post.video_transcript || '', 600);
  if (!text) {
    return {
      post_transcript: '',
      scores: rubric.criteria.map((c) => ({
        criterion: c.key, score: null, evidence: null, offence_sources: [],
        explanation: c.applies_to === 'own_content'
          ? c.na_reason_others
          : 'The demo web app cannot read screenshots yet, so there was nothing to assess. Paste the Post’s text to see its full Review.',
      })),
      soundness_flag: null,
    };
  }
  const a = analyse(text);
  return {
    post_transcript: transcript,
    scores: rubric.criteria.map((c) => {
      const r = c.applies_to === 'own_content' ? null : score(c.key, a);
      if (!r) return { criterion: c.key, score: null, evidence: null, explanation: c.na_reason_others || 'This Criterion does not apply here.', offence_sources: [] };
      return { criterion: c.key, score: r.s, evidence: r.s === null ? null : clip(r.ev, 220), explanation: r.ex, offence_sources: r.s === null ? [] : r.src };
    }),
    soundness_flag: null,
  };
}

// ---------- React ----------

const FEEL = {
  seeker: { positive: 'curious', mixed: 'curious but unsure', negative: 'confused' },
  drifter: { positive: 'encouraged', mixed: 'half-interested', negative: 'put off' },
  neighbor_other_faith: { positive: 'respected', mixed: 'wary', negative: 'belittled' },
  exvangelical: { positive: 'cautiously hopeful', mixed: 'guarded', negative: 'reopened wounds' },
  skeptic: { positive: 'willing to listen', mixed: 'unconvinced', negative: 'dismissive' },
  progressive: { positive: 'welcomed', mixed: 'conflicted', negative: 'shut out' },
  emboldened_believer: { positive: 'prompted to gentleness', mixed: 'unchallenged', negative: 'licensed to be harsh' },
};
const WEIGHTS = {
  seeker: ['outsider_clarity', 'welcome_over_judgment', 'invitation_dialogue'],
  drifter: ['humility_integrity', 'cultural_awareness', 'gentleness_respect'],
  neighbor_other_faith: ['gentleness_respect', 'welcome_over_judgment'],
  exvangelical: ['gentleness_respect', 'welcome_over_judgment', 'humility_integrity'],
  skeptic: ['clear_conviction', 'humility_integrity', 'cultural_awareness'],
  progressive: ['welcome_over_judgment', 'gentleness_respect', 'kingdom_over_party'],
  emboldened_believer: ['gentleness_respect'],
};

function reasonsFor(key, valence, q, a) {
  const term = a.jargon[0];
  const t = {
    seeker: {
      positive: [`When it says “${q}”, I actually followed it, and it made me want to know more.`, `Nobody is talking down to me here, so I might ask a question.`],
      mixed: [`“${q}” caught my attention, but I'm not sure I understood all of it.`, term ? `I don't really know what “${term}” means.` : `I'd need someone to explain what this means for someone like me.`],
      negative: [term ? `“${term}”? I don't know what that means, so this feels like it's for someone else.` : `“${q}” makes me feel like an outsider reading someone else's group chat.`, `It doesn't leave me any way to ask a question.`],
    },
    drifter: {
      positive: [`“${q}” sounds like a real person, not a sermon.`, `It reminds me of the parts of church I actually miss.`],
      mixed: [`“${q}” is fine, I guess, but I've heard it before.`, `It doesn't really touch my life right now.`],
      negative: [`“${q}” is exactly why I stopped going.`, `It feels like a lecture I didn't ask for.`],
    },
    neighbor_other_faith: {
      positive: [`I can respect “${q}”. It holds its belief without putting mine down.`, `I would be glad to talk with someone who posts like this.`],
      mixed: [`I understand holding a strong belief, and “${q}” is clear about it.`, `I'm not sure whether there's room in it for someone of my faith.`],
      negative: [`“${q}” makes me feel that my faith is being dismissed.`, `It reads as pressure rather than conversation.`],
    },
    exvangelical: {
      positive: [`“${q}” is gentler than what I grew up with, and I noticed.`, `It sounds like the Jesus I still admire.`],
      mixed: [`Part of me hears care in “${q}”, part of me braces for what usually comes next.`, `I'd want to see how they treat people who push back.`],
      negative: [`“${q}” is the exact tone I left behind.`, `It brings back how it felt to be on the outside of a church I loved.`],
    },
    skeptic: {
      positive: [`I don't share the belief, but “${q}” says it plainly and honestly.`, `I'd be willing to have that conversation.`],
      mixed: [`“${q}” is clear enough, but it gives me no reason to take it seriously.`, `I'd want to see the reasoning, not only the conclusion.`],
      negative: [`“${q}” reads like a slogan aimed at people who already agree.`, `It makes believers look certain and uncurious.`],
    },
    progressive: {
      positive: [`“${q}” feels welcoming, even though I see some things differently.`, `It doesn't make me feel like the enemy.`],
      mixed: [`Some of “${q}” resonates, but I'm wary of where it might go.`, `I'd want to know if people like me are really welcome.`],
      negative: [`“${q}” makes people like me feel like the target.`, `It sounds like faith being used against people I care about.`],
    },
    emboldened_believer: {
      positive: [`“${q}” makes me want to be kinder when I talk about my faith.`, `It shows I can be clear without being harsh.`],
      mixed: [`“${q}” doesn't really change how I'd talk to people.`, `It neither pushes me toward harshness nor toward gentleness.`],
      negative: [`“${q}” makes me feel I can say things that way too, and call it truth.`, `It gives me permission to be blunt with people who disagree.`],
    },
  };
  return t[key][valence];
}

export function react(post, assessment, personaSet) {
  const text = (post.pasted_text || post.video_transcript || '').trim();
  const a = analyse(text || ' ');
  const byKey = Object.fromEntries(assessment.scores.map((s) => [s.criterion, s]));
  return {
    reactions: personaSet.personas.map((p) => {
      const scores = WEIGHTS[p.key].map((k) => byKey[k] && byKey[k].score).filter((v) => v !== null && v !== undefined);
      const avg = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 3;
      const valence = !text ? 'mixed' : avg >= 3.8 ? 'positive' : avg <= 2.6 ? 'negative' : 'mixed';
      const weighted = WEIGHTS[p.key].map((k) => byKey[k]).filter((s) => s && s.evidence);
      weighted.sort((x, y) => (valence === 'positive' ? y.score - x.score : x.score - y.score));
      const q = quote((weighted[0] && weighted[0].evidence) || a.sentences[0] || 'this post', 90);
      const reasons = text ? reasonsFor(p.key, valence, q, a) : ['I can only see an image here, and I can’t tell what it says.'];
      return { persona: p.key, felt_response: FEEL[p.key][valence], valence, reasons };
    }),
  };
}

// ---------- Discuss ----------

export function discuss(post, assessment, reactions, personaSet) {
  const scored = assessment.scores.filter((s) => s.score !== null);
  const low = [...scored].sort((x, y) => x.score - y.score)[0];
  const q = quote((low && low.evidence) || post.post_transcript || 'this post', 100);
  const neg = reactions.reactions.find((r) => r.valence === 'negative') || reactions.reactions[0];
  const name = (personaSet.personas.find((p) => p.key === neg.persona) || {}).name || 'One Persona';
  return {
    questions: [
      { text: `If you wanted to make the same point as this post, what would you keep and what would you change? Look especially at “${q}”.`, standing: 'done_differently', persona: null },
      { text: 'What does the Bible say about how we speak to people who don’t share our faith? How does this post compare?', standing: 'bible_says', persona: null },
      { text: 'How might Jesus have responded if this post came up on his feed?', standing: 'jesus_responded', persona: null },
      { text: 'If Jesus wanted to make the same point, how might he have posted it?', standing: 'jesus_posted', persona: null },
      { text: `The simulated ${name} felt “${neg.felt_response}”. What in the post might make someone feel that way, and does that matter?`, standing: null, persona: neg.persona },
    ],
  };
}

// ---------- Rewrite ----------

const SOFTEN = [
  [/\byou (?:people|all|guys) (?:need to|must)\b/gi, "I'd gently invite you to"],
  [/\byou (?:need to|must|better)\b/gi, "I'd invite you to"],
  [/\byou (?:can't|cannot) call yourself\b/gi, "I don't think any of us can call ourselves"],
  [/\b(?:hate|hates)\b/gi, 'disagree with'],
  [/\b(?:wicked|evil|disgusting|pathetic|degenerate|demonic) (?=[a-z])/gi, ''],
  [/\b(?:wicked|evil|disgusting|pathetic|degenerate|demonic)\b/gi, 'wrong'],
  [/\babomination\b/gi, 'something I believe is wrong'],
  [/\bmockery\b/gi, 'a departure'],
  [/\b(?:fools?|idiots?|stupid|losers|trash|garbage)\b/gi, 'people'],
  [/\bshame on\b/gi, 'I hope better for'],
  [/\bwake up\b/gi, 'take a moment'],
];

export function rewrite(post) {
  const source = (post.pasted_text || post.video_transcript || post.post_transcript || '').trim();
  const changes = [];
  let reframed = false;
  const kept = [];
  for (const sentence of sentencesOf(source).slice(0, 12)) {
    let next = sentence;
    if (THREAT.test(sentence)) next = 'I believe what we do matters to God, and I care about where each of us ends up.';
    else if (findTerms(sentence, POLITICS).length && BLAME.test(sentence)) next = 'I’m grieved by a lot of what I see around us, and I want to start with my own heart.';
    if (next !== sentence) reframed = true;
    if (!kept.includes(next)) kept.push(next);
  }
  if (reframed) changes.push('Reframed threats and blame as a personal conviction, so readers hear care rather than condemnation.');
  let text = kept.join(' ').replace(/!+/g, '.');
  const before = text;
  for (const [re, to] of SOFTEN) text = text.replace(re, to);
  if (text !== before) changes.push('Softened the sharpest words so the conviction is heard without contempt.');
  const glossed = [];
  for (const term of Object.keys(JARGON).sort((x, y) => y.length - x.length)) {
    if (PLAIN_ENOUGH.has(term)) continue;
    const re = new RegExp(`(^|[^A-Za-z'])(${escapeRe(term)})(?=$|[^A-Za-z'])`, 'gi');
    if (!re.test(text)) continue;
    const plain = JARGON[term];
    text = text.replace(re, (m, pre) => (plain ? `${pre}${plain}` : pre));
    glossed.push(term);
  }
  text = text.replace(VERSE, (ref) => `the Bible (${ref})`);
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?])/g, '$1').replace(/(^|[.?!]\s+)([a-z])/g, (m, pre, c) => pre + c.toUpperCase()).trim();
  if (glossed.length) changes.push(`Put church words (${glossed.slice(0, 3).map((t) => `“${t}”`).join(', ')}) into everyday language.`);
  if (new RegExp(VERSE.source).test(source)) changes.push('Named Bible references as the Bible, for readers who don’t know them.');
  if (!/\?\s*$/.test(text) && !findTerms(text, INVITE).length) {
    if (!/[.!?…]$/.test(text)) text = `${text}.`;
    text = `${text} I’d love to hear how this lands with you, especially if you see it differently.`;
    changes.push('Ended with an honest invitation to reply.');
  }
  if (!changes.length) changes.push('Kept the wording close to the original; the main message already comes across gently.');
  return { rewrite: text || source, changes: changes.slice(0, 5) };
}

// ---------- Outreach ----------

const STRENGTH = {
  outsider_clarity: 'how plainly you write', cultural_awareness: 'how you connect faith to everyday life',
  gentleness_respect: 'how kindly you speak', welcome_over_judgment: 'how welcoming your posts feel',
  kingdom_over_party: 'how you keep faith above politics', humility_integrity: 'how honest and down-to-earth you are',
  love_made_visible: 'the real acts of love you share', invitation_dialogue: 'how you invite people into conversation',
  clear_conviction: 'how clearly you say what you believe',
};
const TIP = {
  outsider_clarity: 'Some church words might lose friends who didn’t grow up in church; putting them in everyday words could help.',
  cultural_awareness: 'Connecting the message to everyday life (work, school, family) could help it reach people outside church.',
  gentleness_respect: 'A few lines could sound harsh to someone who disagrees; saying the same conviction more gently could keep them listening.',
  welcome_over_judgment: 'Some lines might make outsiders feel judged; keeping the challenge for believers and the welcome for everyone could help.',
  kingdom_over_party: 'Tying faith to politics might make people hear a party message; keeping the two apart could help.',
  humility_integrity: 'A line of honest humility about your own journey could make the message easier to trust.',
  love_made_visible: 'Showing a real example of love in action could say more than words alone.',
  invitation_dialogue: 'Ending with a question or an open invitation could turn it into a conversation.',
  clear_conviction: 'Saying plainly what you believe could help readers know where you stand.',
};

export function outreach(evaluations) {
  const points = [];
  const concerns = [];
  for (const e of evaluations) {
    const scored = e.assessment.scores.filter((s) => s.score !== null && STRENGTH[s.criterion]);
    if (!scored.length) continue;
    const best = [...scored].sort((x, y) => y.score - x.score)[0];
    points.push({ post_position: e.position, criterion: best.criterion, kind: 'affirmation',
      text: `Post ${e.position} shows ${STRENGTH[best.criterion]}.`, change: null, persona: null });
    for (const s of scored.filter((x) => x.score <= 2)) concerns.push({ e, s });
  }
  concerns.sort((x, y) => x.s.score - y.s.score);
  const tips = [];
  for (const { e, s } of concerns) {
    if (tips.length >= 3 || tips.includes(TIP[s.criterion])) continue;
    tips.push(TIP[s.criterion]);
    points.push({ post_position: e.position, criterion: s.criterion, kind: 'concern',
      text: `In Post ${e.position}, “${quote(s.evidence || '', 90)}” may not land well with people outside the faith.`,
      change: TIP[s.criterion], persona: null });
  }
  while (points.length < 3 && evaluations.length) {
    const e = evaluations[points.length % evaluations.length];
    const s = e.assessment.scores.find((x) => x.score !== null) || e.assessment.scores[0];
    points.push({ post_position: e.position, criterion: s.criterion, kind: 'affirmation',
      text: `Post ${e.position} is clear about what it wants to say.`, change: null, persona: null });
  }
  const affirm = points.find((p) => p.kind === 'affirmation');
  const message = [
    'Hi! I’ve really appreciated your posts, and I can see how much you care about sharing your faith.',
    affirm && STRENGTH[affirm.criterion] ? `I especially appreciate ${STRENGTH[affirm.criterion]}.` : '',
    tips.length
      ? `I’ve been thinking about how a few of them might land with friends of mine who don’t share our faith, and I wanted to share a gentle thought or two, if that’s okay. ${tips.join(' ')}`
      : 'I think they come across well to people outside the faith, and I wanted to encourage you to keep going.',
    'I’m not saying this to criticise. I want more people to hear what you have to say. Would you be open to talking about it sometime?',
  ].filter(Boolean).join('\n\n');
  return { outreach_message: message, talking_points: points.slice(0, 5) };
}

// ---------- The sample() stand-in ----------

export function answer(prompt, content, samples = []) {
  const step = stepOf(prompt);
  const post = tagged(prompt, 'post');
  const text = post && (post.video_transcript || post.pasted_text || post.post_transcript);
  const sample = text ? samples.find((s) => s.text && s.text.trim() === text.trim()) : null;
  const e = sample && sample.evaluation;
  switch (step) {
    case 'assess':
      return e ? { post_transcript: e.post_transcript, ...e.assessment } : assess(post, content.rubric);
    case 'react': {
      if (e) return e.reactions;
      return react(post, assess(post, content.rubric), content.personaSet);
    }
    case 'discuss':
      return e && e.discussion_questions ? e.discussion_questions
        : discuss(post, tagged(prompt, 'assessment'), tagged(prompt, 'reactions'), content.personaSet);
    case 'rewrite':
      return e && e.gentler_rewrite ? e.gentler_rewrite : rewrite(post);
    case 'outreach':
      return outreach(tagged(prompt, 'evaluations'));
    default:
      throw Object.assign(new Error('unknown step'), { code: 'upstream_error' });
  }
}
