// Pure transition example, not a message transport or an autonomous scheduler.
export function makeHandoff({ taskId, artifactId, version, producer, reviewer }) {
  for (const value of [taskId, artifactId, producer, reviewer]) {
    if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new Error('Invalid handoff identifier');
  }
  if (!Number.isInteger(version) || version < 1 || producer === reviewer) throw new Error('Invalid version or reviewer');
  return { taskId, artifactId, version, producer, reviewer, state: 'awaiting_review', reviewBudget: 1 };
}
export function recordReview(handoff, review) {
  if (handoff.state !== 'awaiting_review' || handoff.reviewBudget !== 1) throw new Error('Review already consumed');
  if (review.taskId !== handoff.taskId || review.artifactId !== handoff.artifactId || review.version !== handoff.version || review.reviewer !== handoff.reviewer) throw new Error('Review does not match the assigned artifact');
  if (!['pass', 'changes_requested'].includes(review.verdict)) throw new Error('Invalid review verdict');
  return { ...handoff, reviewBudget: 0, state: 'awaiting_human', verdict: review.verdict };
}
