// Reference implementation — the grounding gate (steps 2, 4, 8) + the grade
// primitive (step 7). Provider-neutral. Adapt to your fact shape; don't copy blind.
//
// Core idea: classify every fact as GROUNDED, SILENT, or VIOLATION. Only GROUNDED
// facts reach the model. SILENT is honest absence. VIOLATION never ships and is
// what you measure against.

export interface Fact {
  value: unknown;
  source?: string;
  observedAt?: number;   // epoch ms
  confidence?: number;   // 0..1
  ttlMinutes?: number;   // producer-declared freshness; falls back to default
  silentReason?: string; // set => a typed absence, not a claim
}

export type Verdict =
  | { kind: 'GROUNDED'; fact: Fact }
  | { kind: 'SILENT'; reason: string }
  | { kind: 'VIOLATION'; reason: string; cardinal: boolean };

const CARDINAL_CONFIDENCE = 0.7;   // confidence >= this with no source = impossible
const DEFAULT_TTL_MINUTES = 1440;  // conservative: unknowns are NOT spoken as fresh

export function classify(fact: Fact, now = Date.now()): Verdict {
  // Typed absence is first-class integrity, not a failure.
  if (fact.silentReason || fact.value == null) {
    return { kind: 'SILENT', reason: fact.silentReason ?? 'no-signal' };
  }
  const hasSource = !!fact.source;

  // The cardinal sin: confident claim with no source.
  if (fact.confidence != null && fact.confidence >= CARDINAL_CONFIDENCE && !hasSource) {
    return { kind: 'VIOLATION', reason: 'confident claim with no source', cardinal: true };
  }
  // Provenance is mandatory for any real claim.
  if (!hasSource || fact.observedAt == null) {
    return { kind: 'VIOLATION', reason: 'missing provenance (source/observedAt)', cardinal: false };
  }
  // Staleness: past its freshness window => strip, don't speak as current.
  const ttl = (fact.ttlMinutes ?? DEFAULT_TTL_MINUTES) * 60_000;
  if (now - fact.observedAt > ttl) {
    return { kind: 'VIOLATION', reason: 'stale beyond TTL', cardinal: false };
  }
  return { kind: 'GROUNDED', fact };
}

// Only GROUNDED facts are handed to the model. VIOLATIONs are dropped;
// SILENTs are passed to the render layer as typed absence to handle deliberately.
export function forModel(facts: Fact[], now = Date.now()): { grounded: Fact[]; silent: Verdict[] } {
  const grounded: Fact[] = [];
  const silent: Verdict[] = [];
  for (const f of facts) {
    const v = classify(f, now);
    if (v.kind === 'GROUNDED') grounded.push(v.fact);
    else if (v.kind === 'SILENT') silent.push(v);
    // VIOLATION: intentionally dropped — never reaches the model or the user.
  }
  return { grounded, silent };
}

// The grounding metric — silence counts as integrity, only violations count against.
export function groundingRate(facts: Fact[], now = Date.now()): number {
  let ok = 0, violation = 0;
  for (const f of facts) {
    const v = classify(f, now);
    if (v.kind === 'VIOLATION') violation++;
    else ok++; // GROUNDED and SILENT both count as integrity
  }
  const total = ok + violation;
  return total === 0 ? 1 : ok / total;
}

// The grade primitive (step 7): re-run today's rules over a historical snapshot,
// so accuracy fixes are evidence-driven across the population, not anecdote-driven.
export function grade(snapshot: Fact[], now = Date.now()): { rate: number; violations: Verdict[] } {
  const violations = snapshot
    .map(f => classify(f, now))
    .filter((v): v is Extract<Verdict, { kind: 'VIOLATION' }> => v.kind === 'VIOLATION');
  return { rate: groundingRate(snapshot, now), violations };
}
