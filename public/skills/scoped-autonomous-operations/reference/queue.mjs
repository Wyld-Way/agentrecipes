// Synthetic daily desk: creates reviewable proposals only. No side-effect capability.
export function planDesk(items, { maxItems = 3 } = {}) {
  if (!Array.isArray(items) || !Number.isInteger(maxItems) || maxItems < 1 || maxItems > 20) throw new Error('Invalid queue or work budget');
  const seen = new Set();
  const proposals = [];
  for (const item of items) {
    if (proposals.length >= maxItems) break;
    if (!item || typeof item.id !== 'string' || !item.id.trim() || typeof item.summary !== 'string') throw new Error('Invalid queue item');
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    proposals.push({ itemId: item.id, action: 'prepare_internal_draft', sourceSummary: item.summary.slice(0, 500), state: 'needs_human_review' });
  }
  return { status: proposals.length ? 'drafts_prepared' : 'no_work', proposals, sideEffects: 0 };
}
