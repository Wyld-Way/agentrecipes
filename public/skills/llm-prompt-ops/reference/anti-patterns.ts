// Reference implementation — the deterministic anti-pattern detector (step 7a).
// Runs inline on 100% of output in <10ms. Hard rules fail (and the mechanical
// ones auto-repair); soft rules only fail on accumulation. Replace the RULES
// with YOUR team's named quality bar — these examples are illustrative, not law.

export interface Rule {
  id: string;
  test: RegExp;
  repair?: (s: string) => string; // present => mechanically fixable, applied in-memory
}

// HARD rules: one hit = fail. Give the fixable ones a `repair`.
export const HARD_RULES: Rule[] = [
  { id: 'em-dash', test: /—/g, repair: s => s.replace(/\s*—\s*/g, ', ') },
  { id: 'double-space', test: /  +/g, repair: s => s.replace(/  +/g, ' ') },
  // ... your named anti-patterns go here (e.g. banned phrases, forbidden framings)
];

// SOFT rules: a single hit is fine; N+ within a window is a tic. One shared
// regex of "tell" words; the threshold is what flags it.
export const SOFT_TELLS = /\b(delve|nuanced|intricate|palpable|profound|evocative|tapestry|realm)\b/gi;
const SOFT_THRESHOLD = 2; // 2+ tells per ~200 words = flag

export interface CritiqueResult {
  pass: boolean;
  repaired: string;          // the (possibly auto-repaired) text
  hardFindings: string[];    // rule ids that fired after repair
  softCount: number;
  autoRepairs: number;
}

export function critique(input: string): CritiqueResult {
  let text = input;
  let autoRepairs = 0;

  // Apply mechanical repairs first, count them.
  for (const rule of HARD_RULES) {
    if (rule.repair && rule.test.test(text)) {
      const before = text;
      text = rule.repair(text);
      if (text !== before) autoRepairs++;
    }
  }

  // Re-check hard rules AFTER repair — only unrepairable residue counts.
  const hardFindings = HARD_RULES
    .filter(r => { r.test.lastIndex = 0; return r.test.test(text); })
    .map(r => r.id);

  const softCount = (text.match(SOFT_TELLS) ?? []).length;

  return {
    pass: hardFindings.length === 0 && softCount < SOFT_THRESHOLD,
    repaired: text,
    hardFindings,
    softCount,
    autoRepairs,
  };
}
