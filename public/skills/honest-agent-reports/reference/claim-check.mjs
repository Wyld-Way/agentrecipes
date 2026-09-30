// Checks that each claim in a report uses a fixed status word and carries the
// kind of evidence that word requires. It reads the evidence you give it; it
// does not go and fetch anything.

const REQUIRED = {
  written: ['diff'],
  tested: ['command', 'output'],
  merged: ['commit'],
  deployed: ['liveRevision'],
  verified: ['action', 'observed'],
};
const HEDGES = /\b(should|probably|appears?|seems?|mostly|likely|i think|in theory)\b/i;

export function checkClaim(claim) {
  const problems = [];
  const status = String(claim?.status ?? '').toLowerCase();
  if (!REQUIRED[status]) return { ok: false, problems: [`"${claim?.status}" is not one of: ${Object.keys(REQUIRED).join(', ')}`] };
  for (const field of REQUIRED[status]) {
    const value = claim.evidence?.[field];
    if (typeof value !== 'string' || value.trim() === '') problems.push(`${status} needs evidence.${field}`);
  }
  if (status === 'deployed' && claim.evidence?.liveRevision && claim.evidence?.commit
    && !claim.evidence.liveRevision.startsWith(claim.evidence.commit.slice(0, 7))) {
    problems.push('the live revision is not the commit this claim is about');
  }
  if (HEDGES.test(String(claim.summary ?? ''))) problems.push('summary hedges; state what happened');
  return { ok: problems.length === 0, problems };
}

export function checkReport(claims) {
  const results = claims.map((claim) => ({ item: claim.item, ...checkClaim(claim) }));
  return { ok: results.every((result) => result.ok), reopen: results.filter((result) => !result.ok) };
}
