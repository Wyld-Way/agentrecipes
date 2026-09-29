import { createHash } from 'node:crypto';
// In-memory contract demonstration. A real service must use transactional writes,
// server-authenticated approval records and durable idempotency storage.
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function previewTitleChange(record, title) {
  if (!record || typeof record.id !== 'string' || !Number.isInteger(record.version) || record.version < 1) throw new Error('Invalid record');
  if (typeof title !== 'string' || !title.trim() || title.length > 120) throw new Error('Title must contain 1 to 120 characters');
  const change = { recordId: record.id, expectedVersion: record.version, title: title.trim() };
  return { ...change, digest: digest(change) };
}
export function applyApprovedChange(record, proposal, serverContext) {
  if (!serverContext?.authenticated || !serverContext.permissions?.includes('catalog:write')) throw new Error('Forbidden');
  const expected = previewTitleChange(record, proposal.title);
  if (proposal.recordId !== record.id || proposal.expectedVersion !== record.version) throw new Error('Stale proposal');
  if (proposal.digest !== expected.digest || serverContext.approvedDigest !== expected.digest) throw new Error('Exact change is not approved');
  return { ...record, title: expected.title, version: record.version + 1 };
}
