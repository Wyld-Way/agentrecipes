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

test('compare runs: counts flips, refuses small samples and mismatched datasets', async () => {
  const { compareRuns } = await import('../public/skills/prove-a-change/reference/compare-runs.mjs');
  const base = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, pass: i < 10 }));
  const better = base.map((row, i) => ({ id: row.id, pass: i < 14 }));
  const result = compareRuns(base, better);
  assert.equal(result.verdict, 'better');
  assert.equal(result.fixed.length, 4);
  assert.deepEqual(result.regressed, []);
  const traded = base.map((row, i) => ({ id: row.id, pass: i >= 1 && i < 14 }));
  assert.equal(compareRuns(base, traded).verdict, 'not_better');
  assert.deepEqual(compareRuns(base, traded).regressed, ['c0']);
  assert.equal(compareRuns(base, traded, { maxRegressions: 1 }).verdict, 'better');
  assert.equal(compareRuns(base.slice(0, 5), better.slice(0, 5)).verdict, 'too_few_cases');
  assert.throws(() => compareRuns(base, better.slice(1)), /different cases/);
  assert.throws(() => compareRuns([...base, base[0]], [...better, better[0]]), /Duplicate/);
});

test('claim check: each status needs its own evidence and plain wording', async () => {
  const { checkClaim, checkReport } = await import('../public/skills/honest-agent-reports/reference/claim-check.mjs');
  assert.equal(checkClaim({ status: 'tested', evidence: { command: 'npm test', output: '18 pass' } }).ok, true);
  assert.equal(checkClaim({ status: 'tested', evidence: { command: 'npm test' } }).ok, false);
  assert.equal(checkClaim({ status: 'done', evidence: {} }).ok, false);
  assert.equal(checkClaim({ status: 'deployed', evidence: { liveRevision: 'a1b2c3d4', commit: 'a1b2c3d4e5' } }).ok, true);
  assert.equal(checkClaim({ status: 'deployed', evidence: { liveRevision: 'ffffffff', commit: 'a1b2c3d4e5' } }).ok, false);
  assert.equal(checkClaim({ status: 'verified', summary: 'Should be working now', evidence: { action: 'opened the page', observed: 'new text' } }).ok, false);
  const report = checkReport([
    { item: 'a', status: 'merged', evidence: { commit: 'a1b2c3d' } },
    { item: 'b', status: 'deployed', evidence: {} },
  ]);
  assert.equal(report.ok, false);
  assert.deepEqual(report.reopen.map((entry) => entry.item), ['b']);
});

test('lanes: one owner, an unowned task, an overlap and a referral', async () => {
  const { route } = await import('../public/skills/agent-lanes/reference/route.mjs');
  const charters = [
    { name: 'notes', owns: ['release notes', 'changelog'], notMine: [{ keywords: ['announcement'], owner: 'campaigns' }] },
    { name: 'campaigns', owns: ['announcement', 'social post'], notMine: [] },
    { name: 'docs', owns: ['changelog'], notMine: [] },
  ];
  assert.equal(route('Write the release notes', charters).owner, 'notes');
  assert.equal(route('Draft the launch announcement', charters).owner, 'campaigns');
  assert.equal(route('Fix the login bug', charters).status, 'unowned');
  assert.deepEqual(route('Update the changelog', charters).because, ['notes', 'docs']);
  assert.equal(route('Release notes and an announcement', charters).owner, 'campaigns');
});

test('nudge gate: silence by default, one reason each, speaks only on a fresh signal', async () => {
  const { nudgeGate } = await import('../public/skills/when-to-say-nothing/reference/nudge-gate.mjs');
  const now = 1_000 * 60 * 60 * 1000;
  const minute = 60 * 1000;
  const signal = { kind: 'long-unbroken-session', observedAt: now - 5 * minute };
  const base = { now, localHour: 14, signal };
  assert.deepEqual(nudgeGate(base), { speak: true, reason: 'long-unbroken-session' });
  assert.equal(nudgeGate({ ...base, signal: null }).reason, 'no-signal');
  assert.equal(nudgeGate({ ...base, signal: { ...signal, observedAt: now - 45 * minute } }).reason, 'stale-signal');
  assert.equal(nudgeGate({ ...base, localHour: 23 }).reason, 'quiet-hours');
  assert.equal(nudgeGate({ ...base, localHour: 6 }).reason, 'quiet-hours');
  assert.equal(nudgeGate({ ...base, busy: true }).reason, 'person-is-busy');
  assert.equal(nudgeGate({ ...base, nudgesToday: 2 }).reason, 'daily-limit');
  assert.equal(nudgeGate({ ...base, lastNudgeAt: now - 60 * minute }).reason, 'too-soon');
  assert.equal(nudgeGate({ ...base, lastNudgeAt: now - 100 * minute }).speak, true);
  assert.equal(nudgeGate({ ...base, lastNudgeAt: now - 100 * minute, recentDismissals: 1 }).reason, 'too-soon');
});
