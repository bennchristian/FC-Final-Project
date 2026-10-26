// Past Reviews for the Demo Artifact (ARCHITECTURE.md AD-12): how a Review is stored in, and
// read back from, the viewer's private `db` subtree. Pure: no DOM, no I/O; ui.js does the calls.
// Screenshots are never stored, only their file names (AD-5).
//
//   data/users/<viewer id>/<review id>               one document per Review (pastReviewRecord)
//   data/users/<viewer id>/<review id>/posts/<n>     one document per Post (pastPostRecord)

export const PAST_REVIEWS_SHOWN = 50;

// The viewer's own Reviews collection. Only the AWAITED `user.id()` names the private subtree.
export function pastReviewsPath(viewerId) {
  return `data/users/${viewerId}`;
}

// Counts behind the overall summary of a Review, worked out by code (never by the model).
export function reviewTally(posts) {
  const done = posts.filter((p) => p.status === 'done' && p.evaluation);
  const assessable = done.filter((p) => p.evaluation.rewrite_mode !== 'not_assessable');
  const landsWell = assessable.filter((p) => p.evaluation.lands_well).length;
  return {
    total: posts.length,
    done: done.length,
    landsWell,
    concerns: assessable.length - landsWell,
    notAssessable: done.length - assessable.length,
    failed: posts.filter((p) => p.status === 'failed' || p.status === 'refused').length,
  };
}

export function pastReviewRecord({ posts, reviewSourceUrl, modelId, outreach }, labels, savedAt) {
  return {
    savedAt,
    reviewSourceUrl: reviewSourceUrl || '',
    modelId,
    labels,
    postCount: posts.length,
    tally: reviewTally(posts),
    // A plan still being written is not kept.
    outreach: outreach && outreach.status === 'done' ? outreach : null,
  };
}

export function pastPostRecord(post, position) {
  return {
    position,
    pasted_text: post.pasted_text || '',
    video_transcript: post.video_transcript || '',
    source_url: post.source_url || '',
    image_names: post.images.map((img) => img.name),
    // A Post stopped mid-run is saved as not yet evaluated.
    status: post.status === 'evaluating' ? 'pending' : post.status,
    evaluation: post.status === 'done' ? post.evaluation : null,
    error: post.error || null,
  };
}

// A stored Post back in the shape ui.js keeps in page memory. Screenshots come back as names
// only, so a Post with screenshots and no evaluation cannot be sent again.
export function restorePost(record, id) {
  return {
    id,
    pasted_text: record.pasted_text || '',
    video_transcript: record.video_transcript || '',
    source_url: record.source_url || '',
    images: (record.image_names || []).map((name) => ({ name })),
    status: record.status,
    evaluation: record.evaluation || null,
    error: record.error || null,
    rewriteStatus: 'idle',
  };
}

// A Review scored with other rubric, Persona or prompt versions is listed but not reopened:
// this page renders only the versions it was built with (FR-20).
export function sameVersions(a, b) {
  return Boolean(a && b) && a.rubric === b.rubric && a.personas === b.personas && a.prompts === b.prompts;
}
