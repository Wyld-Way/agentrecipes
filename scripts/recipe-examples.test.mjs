import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listItems, getItem } from '../public/skills/service-to-mcp/reference/catalog.mjs';
import { makeHandoff, recordReview } from '../public/skills/cross-agent-handoff/reference/handoff.mjs';
import { planDesk } from '../public/skills/scoped-autonomous-operations/reference/queue.mjs';
import { weatherEvidence } from '../public/skills/pointmoon-grounding/reference/weather-evidence.mjs';
import { previewTitleChange, applyApprovedChange } from '../public/skills/ai-native-admin/reference/change-contract.mjs';

test('catalog: bounded list, safe projection, missing item and invalid input', () => {
  assert.deepEqual(listItems({ limit: 1 }), { items: [{ id: 'exhibit-1', title: 'Seeds on the move' }] });
  assert.equal(getItem({ id: 'exhibit-999' }).status, 'not_found');
  assert.throws(() => listItems({ limit: 100 }));
  assert.throws(() => getItem({ id: '../private' }));
});
test('handoff: exact artifact, one review and then a human', () => {
  const h = makeHandoff({ taskId: 'task-1', artifactId: 'draft-1', version: 1, producer: 'producer', reviewer: 'reviewer' });
  const r = { taskId: h.taskId, artifactId: h.artifactId, version: 1, reviewer: h.reviewer, verdict: 'pass' };
  assert.throws(() => recordReview(h, { ...r, version: 2 }));
  assert.throws(() => recordReview(h, { ...r, reviewer: 'producer' }));
  const done = recordReview(h, r);
  assert.equal(done.state, 'awaiting_human');
  assert.throws(() => recordReview(done, r));
});
test('daily desk: bounded, deduplicated, draft-only and quiet when empty', () => {
  const row = { id: 'one', summary: 'Synthetic enquiry' };
  const result = planDesk([row, row, { ...row, id: 'two' }], { maxItems: 1 });
  assert.equal(result.proposals.length, 1);
  assert.equal(result.sideEffects, 0);
  assert.equal(result.proposals[0].state, 'needs_human_review');
  assert.equal(planDesk([]).status, 'no_work');
  assert.throws(() => planDesk([], { maxItems: 0 }));
});
const now = Date.parse('2026-01-01T12:00:00Z');
function packet(overrides = {}) { return { schemaVersion: 'field-truth@1.1.0', facts: { fieldSnapshot: { weather: { current: { source: 'synthetic-fixture', observedAt: '2026-01-01T11:30:00Z', ttlMinutes: 60, temperatureC: 7, epistemicType: 'predicted', ...overrides } } } } }; }
test('Pointmoon adapter: keeps provenance and prediction type', () => {
  const result = weatherEvidence(packet(), now);
  assert.equal(result.status, 'available');
  assert.equal(result.epistemicType, 'predicted');
  assert.equal(result.source, 'synthetic-fixture');
});
test('Pointmoon adapter: missing source, stale, future, missing and unsupported remain unavailable', () => {
  for (const sample of [packet({ source: '' }), packet({ ttlMinutes: 10 }), packet({ observedAt: '2027-01-01' }), packet({ temperatureC: null }), {}]) {
    assert.equal(weatherEvidence(sample, now).status, 'unavailable');
  }
});
test('admin: preview binds the exact approved version and requires server permission', () => {
  const record = { id: 'exhibit-1', version: 1, title: 'Old title' };
  const p = previewTitleChange(record, 'New title');
  const ctx = { authenticated: true, permissions: ['catalog:write'], approvedDigest: p.digest };
  assert.equal(applyApprovedChange(record, p, ctx).version, 2);
  assert.throws(() => applyApprovedChange(record, p, { ...ctx, permissions: [] }));
  assert.throws(() => applyApprovedChange({ ...record, version: 2 }, p, ctx));
  assert.throws(() => applyApprovedChange(record, { ...p, title: 'Unapproved title' }, ctx));
  assert.throws(() => applyApprovedChange(record, p, { ...ctx, approvedDigest: 'wrong' }));
});

test('release check: only the validated commit on production passes', async () => {
  const { checkRelease } = await import('../public/skills/agent-safe-releases/reference/verify-release.mjs');
  const sha = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
  assert.equal(checkRelease({ environment: 'production', commit: sha }, sha).ok, true);
  assert.equal(checkRelease({ environment: 'production', commit: sha }, 'a1b2c3d').ok, true);
  assert.equal(checkRelease({ environment: 'production', commit: sha }, 'ffffffff').ok, false);
  assert.match(checkRelease({ environment: 'preview', commit: sha }, sha).reason, /preview/);
  assert.equal(checkRelease({ environment: 'production' }, sha).ok, false);
  assert.equal(checkRelease({ environment: 'production', commit: sha }, '').ok, false);
  assert.equal(checkRelease(null, sha).ok, false);
});
