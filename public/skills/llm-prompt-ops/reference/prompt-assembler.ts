// Reference implementation — the fail-open prompt assembler (step 2 + 3).
// Provider-neutral: you supply a PromptStore (Langfuse / LangSmith / Braintrust /
// your own) and an in-code fallback. Adapt types to your stack; do not copy blind.
//
// The one invariant: assemble() NEVER throws on a store outage. Telemetry may
// degrade; user delivery never fails.

export interface ManagedPrompt {
  version: string;
  template: string; // may contain {{variables}}
}

export interface PromptStore {
  // Fetch the prompt labeled `production` for this name. May throw / time out —
  // the assembler is responsible for surviving that.
  fetch(name: string, label?: string): Promise<ManagedPrompt>;
}

// ---- short-TTL cache with an indefinitely-held last-good fallback (step 3) ----

interface CacheEntry { value: ManagedPrompt; fetchedAt: number; }

export class PromptCache {
  private fresh = new Map<string, CacheEntry>();
  private lastGood = new Map<string, ManagedPrompt>(); // never evicted

  constructor(
    private store: PromptStore,
    private ttlMs = 10_000,
    private now: () => number = () => Date.now(),
  ) {}

  async get(name: string): Promise<ManagedPrompt | null> {
    const hit = this.fresh.get(name);
    if (hit && this.now() - hit.fetchedAt < this.ttlMs) return hit.value;
    try {
      const value = await this.store.fetch(name, 'production');
      this.fresh.set(name, { value, fetchedAt: this.now() });
      this.lastGood.set(name, value); // remember the last thing that worked
      return value;
    } catch {
      // Store is down or slow. Serve the last thing that worked, forever.
      return this.lastGood.get(name) ?? null;
    }
  }
}

// ---- the assembler: managed -> compile -> in-code fallback -> usable default ----

export interface AssembleArgs {
  name: string;
  variables?: Record<string, string>;
  fallbackTemplate: string;   // the in-code cold-start copy (step 1)
  lastResort?: string;        // returned if even compilation fails; default ''
}

export interface AssembledPrompt {
  text: string;
  source: 'managed' | 'fallback' | 'lastResort';
  version?: string;           // set when source === 'managed' (link this in traces, step 5)
}

function compile(template: string, vars: Record<string, string> = {}): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

export async function assemble(
  cache: PromptCache,
  { name, variables, fallbackTemplate, lastResort = '' }: AssembleArgs,
): Promise<AssembledPrompt> {
  try {
    const managed = await cache.get(name);
    if (managed) {
      return { text: compile(managed.template, variables), source: 'managed', version: managed.version };
    }
  } catch {
    // fall through — never let the store break delivery
  }
  try {
    return { text: compile(fallbackTemplate, variables), source: 'fallback' };
  } catch {
    return { text: lastResort, source: 'lastResort' };
  }
}
