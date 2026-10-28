// The viewer's profile in the Demo Artifact (PRD "Profile in the Demo Artifact", SCHEMA.md §6):
// one private document beside their Past Reviews, the Persona order their ranked audiences give,
// and the Profile Summary (FR-14), worked out by code from saved Reviews, never by the model.
// Pure: no DOM, no I/O; ui.js does the calls.

export const PROFILE_DOC = 'profile';
export const ROLES = ['creator', 'leader', 'individual'];
const TEXT_LIMIT = 2000;

// The stored profile. Unknown roles and audience keys are dropped; every known audience appears once,
// in the viewer's order, with any they have not placed kept at the end in the Persona set's order.
export function profileRecord(form, audienceKeys, savedAt) {
  const chosen = (form.audiences || []).filter((k, i, all) => audienceKeys.includes(k) && all.indexOf(k) === i);
  return {
    role: ROLES.includes(form.role) ? form.role : '',
    come_across: String(form.come_across || '').trim().slice(0, TEXT_LIMIT),
    theology: String(form.theology || '').trim().slice(0, TEXT_LIMIT),
    audiences: chosen.concat(audienceKeys.filter((k) => !chosen.includes(k))),
    updatedAt: savedAt,
  };
}

// Persona keys in the order a creator's ranked audiences give: the lead Personas of the first
// audience, then the next audience's, then any Persona no audience leads. Scores never change.
export function personaOrder(audiences, targetAudiences, personaKeys) {
  const byKey = Object.fromEntries(targetAudiences.map((a) => [a.key, a]));
  const order = [];
  for (const key of audiences) {
    for (const persona of (byKey[key] && byKey[key].lead_personas) || []) {
      if (personaKeys.includes(persona) && !order.includes(persona)) order.push(persona);
    }
  }
  return order.concat(personaKeys.filter((k) => !order.includes(k)));
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function round1(n) {
  return n === null ? null : Math.round(n * 10) / 10;
}

// The Profile Summary across saved Posts. `posts` are { evaluation, excerpt, savedAt } for done Posts
// at the page's versions. Posts that could not be assessed are left out. Scores below
// `rubric.thresholds.auto_rewrite_below` are concerns; 4 and above are strengths.
export function profileSummary(posts, rubric, personaKeys) {
  const below = rubric.thresholds.auto_rewrite_below;
  const assessed = posts.filter((p) => p.evaluation && p.evaluation.rewrite_mode !== 'not_assessable');
  const scoresOf = (p) => Object.fromEntries(p.evaluation.assessment.scores.map((s) => [s.criterion, s.score]));
  const scored = assessed.map((p) => ({ ...p, scores: scoresOf(p) }));

  const criteria = rubric.criteria.map((c) => {
    const values = scored.map((p) => p.scores[c.key]).filter((v) => typeof v === 'number');
    return {
      key: c.key,
      average: round1(mean(values)),
      scored: values.length,
      concerns: values.filter((v) => v < below).length,
      strengths: values.filter((v) => v >= 4).length,
    };
  });

  // Recurring: on at least two Posts. Most frequent first.
  const recurring = (field) => criteria
    .filter((c) => c[field] >= 2)
    .sort((a, b) => b[field] - a[field] || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((c) => ({ criterion: c.key, count: c[field], of: c.scored }));

  const personas = personaKeys.map((key) => {
    const tally = { key, positive: 0, mixed: 0, negative: 0 };
    for (const p of assessed) {
      const r = ((p.evaluation.reactions && p.evaluation.reactions.reactions) || []).find((x) => x.persona === key);
      if (r && r.valence in tally) tally[r.valence] += 1;
    }
    return tally;
  });

  const ranked = scored
    .map((p) => ({ excerpt: p.excerpt, savedAt: p.savedAt, average: round1(mean(Object.values(p.scores).filter((v) => typeof v === 'number'))) }))
    .filter((p) => p.average !== null)
    .sort((a, b) => b.average - a.average);
  const shown = Math.min(3, Math.floor(ranked.length / 2)) || (ranked.length ? 1 : 0);

  // The changes likely to help most: the Criteria with the most concerns, then the lowest averages.
  const topChanges = criteria
    .filter((c) => c.concerns > 0)
    .sort((a, b) => b.concerns - a.concerns || a.average - b.average)
    .slice(0, 3)
    .map((c) => ({ criterion: c.key, concerns: c.concerns, of: c.scored }));

  return {
    postCount: assessed.length,
    notAssessable: posts.length - assessed.length,
    averages: criteria.map(({ key, average, scored: n }) => ({ criterion: key, average, scored: n })),
    concernPatterns: recurring('concerns'),
    strengthPatterns: recurring('strengths'),
    reactWell: personas.filter((p) => p.positive > p.negative).sort((a, b) => b.positive - a.positive),
    reactBadly: personas.filter((p) => p.negative > p.positive).sort((a, b) => b.negative - a.negative),
    strongest: ranked.slice(0, shown),
    weakest: ranked.length > 1 ? ranked.slice(-shown).reverse() : [],
    topChanges,
  };
}
