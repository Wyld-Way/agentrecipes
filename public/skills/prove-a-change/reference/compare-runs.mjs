// Compares a baseline and a candidate that were scored on the same cases.
// Each run is a list of { id, pass } objects. The verdict uses a threshold you
// choose before looking at the results.

export function compareRuns(baseline, candidate, { maxRegressions = 0, minNetGain = 1, minCases = 20 } = {}) {
  const before = new Map(baseline.map((row) => [row.id, Boolean(row.pass)]));
  const after = new Map(candidate.map((row) => [row.id, Boolean(row.pass)]));
  if (before.size !== baseline.length || after.size !== candidate.length) throw new Error('Duplicate case ids');
  const missing = [...before.keys()].filter((id) => !after.has(id));
  const extra = [...after.keys()].filter((id) => !before.has(id));
  if (missing.length || extra.length) {
    throw new Error(`Runs cover different cases (${missing.length} missing, ${extra.length} extra). Compare on the same frozen dataset.`);
  }

  const fixed = [];
  const regressed = [];
  for (const [id, passed] of before) {
    if (!passed && after.get(id)) fixed.push(id);
    if (passed && !after.get(id)) regressed.push(id);
  }
  const passRate = (run) => [...run.values()].filter(Boolean).length / run.size;
  const result = {
    cases: before.size,
    baselinePassRate: passRate(before),
    candidatePassRate: passRate(after),
    fixed,
    regressed,
    netGain: fixed.length - regressed.length,
  };

  if (before.size < minCases) return { ...result, verdict: 'too_few_cases' };
  const ok = regressed.length <= maxRegressions && result.netGain >= minNetGain;
  return { ...result, verdict: ok ? 'better' : 'not_better' };
}
