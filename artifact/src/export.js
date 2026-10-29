// Review export for the Demo Artifact: turns the in-memory Review into Markdown the
// viewer can copy or save themselves. Pure: no DOM, no I/O. Nothing here is kept
// by the page; the viewer decides where the text goes (AD-12).

const SIMULATED_NOTE = 'Persona Reactions are simulated perspectives, not real people’s opinions.';

function quote(text) {
  return text.split('\n').map((line) => `> ${line}`).join('\n');
}

function cell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function scoreText(score) {
  return score === null ? 'N/A' : `${score} / 5`;
}

function postSection({ position, post, evaluation, status }, content) {
  const { rubric, personaSet } = content;
  const criterion = Object.fromEntries(rubric.criteria.map((c) => [c.key, c]));
  const offence = Object.fromEntries(rubric.offence_sources.map((o) => [o.key, o.name]));
  const persona = Object.fromEntries(personaSet.personas.map((p) => [p.key, p.name]));
  const out = [`## Post ${position}`, ''];

  if (post.source_url) out.push(`Source: ${post.source_url}`, '');
  if (post.pasted_text) out.push('**Post text**', '', quote(post.pasted_text), '');
  if (post.video_transcript) out.push('**Video transcript**', '', quote(post.video_transcript), '');
  if (post.images.length) out.push(`Screenshots: ${post.images.length} (not included in this export)`, '');
  if (!evaluation || status !== 'done') {
    out.push(`*Not evaluated (${status}).*`, '');
    return out;
  }

  if (evaluation.post_transcript && evaluation.post_transcript !== post.pasted_text) {
    out.push('**Post text as read by Claude**', '', quote(evaluation.post_transcript), '');
  }

  const scores = evaluation.assessment.scores;
  if (evaluation.rewrite_mode === 'not_assessable') out.push('**Summary:** nothing in this Post could be assessed.', '');
  else if (evaluation.lands_well) out.push('**Summary:** likely to land well. No concerns to raise.', '');
  else {
    out.push('**Summary: concerns**', '');
    for (const s of scores.filter((x) => x.score !== null && x.score < 3)) out.push(`- ${criterion[s.criterion].name}`);
    out.push('');
  }

  const flag = evaluation.assessment.soundness_flag;
  if (flag) out.push(`**Soundness Flag:** “${flag.line}” ${flag.why} *(A prompt for discussion with a leader, not a ruling.)*`, '');

  out.push('### Rubric Scores', '', '| Criterion | Score | Offence source |', '|---|---|---|');
  for (const s of scores) {
    const c = criterion[s.criterion];
    out.push(`| ${cell(`${c.number}. ${c.name}`)} | ${scoreText(s.score)} | ${s.offence_sources.map((k) => offence[k]).join(', ') || '—'} |`);
  }
  out.push('');
  for (const s of scores) {
    const c = criterion[s.criterion];
    out.push(`**${c.number}. ${c.name}: ${scoreText(s.score)}**`, '');
    if (s.evidence) out.push(`- Evidence: “${s.evidence}”`);
    out.push(`- Why: ${s.explanation}`, '');
  }

  out.push('### Persona Reactions (simulated)', '', `*${SIMULATED_NOTE}*`, '');
  for (const r of evaluation.reactions.reactions) {
    out.push(`- **${persona[r.persona]}**: ${r.felt_response} (${r.valence})`);
    for (const reason of r.reasons) out.push(`  - ${reason}`);
  }
  out.push('');

  if (evaluation.gentler_rewrite) {
    out.push('### Gentler Rewrite (suggestion)', '', quote(evaluation.gentler_rewrite.rewrite), '', 'What changed:', '');
    for (const change of evaluation.gentler_rewrite.changes) out.push(`- ${change}`);
    out.push('');
  }

  if (evaluation.discussion_questions) {
    out.push('### Discussion Questions', '');
    evaluation.discussion_questions.questions.forEach((q, i) => {
      out.push(`${i + 1}. ${q.text}${q.persona ? ` *(cites the simulated ${persona[q.persona]})*` : ''}`);
    });
    out.push('');
  }
  return out;
}

function outreachSection(outreach, content) {
  const criterion = Object.fromEntries(content.rubric.criteria.map((c) => [c.key, c.name]));
  const persona = Object.fromEntries(content.personaSet.personas.map((p) => [p.key, p.name]));
  const out = ['## Ministry Outreach Plan', '', `*Written by ${outreach.model}*`, '', '### Outreach Message', '', quote(outreach.output.outreach_message), '', '### Talking Points', ''];
  for (const tp of outreach.output.talking_points) {
    const kind = tp.kind === 'concern' ? 'Concern' : 'Affirmation';
    out.push(`- **${kind} · Post ${tp.post_position} · ${criterion[tp.criterion]}:** ${tp.text}`);
    if (tp.change) out.push(`  - Change: ${tp.change}`);
    if (tp.persona) out.push(`  - Draws on the simulated ${persona[tp.persona]}`);
  }
  out.push('');
  return out;
}

// review = { posts: [{ position, post, evaluation, status }], reviewSourceUrl, outreach }
// With includeJson, a raw JSON appendix is added for later analysis. Versions appear only there,
// as data: the readable text never shows them (FR-7).
export function reviewToMarkdown(review, content, labels, { exportedAt, includeJson }) {
  const out = [
    '# Living Letter',
    '',
    `Exported: ${exportedAt}`,
  ];
  if (review.reviewSourceUrl) out.push(`Profile: ${review.reviewSourceUrl}`);
  out.push('', `*${SIMULATED_NOTE}*`, '');
  for (const p of review.posts) out.push(...postSection(p, content));
  if (review.outreach && review.outreach.status === 'done') out.push(...outreachSection(review.outreach, content));

  if (includeJson) {
    const data = {
      exported_at: exportedAt,
      versions: labels,
      review_source_url: review.reviewSourceUrl || null,
      posts: review.posts.map(({ position, post, evaluation, status }) => ({
        position,
        status,
        source_url: post.source_url || null,
        pasted_text: post.pasted_text || null,
        video_transcript: post.video_transcript || null,
        screenshot_count: post.images.length,
        evaluation: evaluation || null,
      })),
      outreach: review.outreach && review.outreach.status === 'done' ? review.outreach : null,
    };
    out.push('## Raw data (JSON)', '', '```json', JSON.stringify(data, null, 2), '```', '');
  }
  return out.join('\n');
}
