---
name: llm-prompt-ops
description: Make an AI feature reliable in production while you keep changing the prompt — managed prompts with rollback, automatic quality checks on every output, graceful degradation when the provider blips, and prove-before-you-ship prompt changes. Use when an LLM writes user-facing content on a live path.
---

# Implement: reliable LLM feature in production

You are helping a developer add production reliability to a feature where an LLM
writes user-facing content (chat replies, summaries, generated text). Implement
the pattern below IN THEIR codebase, adapting to their language, framework, and
the prompt-management + observability service they use (or recommend one). Do
not copy any single vendor's SDK blindly — the pattern is provider-neutral; wire
it to whatever they have.

## Before you write code, detect their stack

Ask or infer: their language/runtime, their LLM provider(s), whether they use a
prompt/observability service (Langfuse, LangSmith, Braintrust, PromptLayer,
Helicone, or none), and where their generation call lives. Adapt every step to
what you find. If they have no prompt service, either wire the fallback layer
only (steps 2–3, 7) or recommend one — don't block.

## Build these, in this order

1. **Managed prompts, code fallback.** Move each prompt into the service under a
   named key with a `production` label. Keep a copy in code as a COLD-START
   fallback only. Rule: runtime fetches by label; humans promote by label; the
   in-code copy is never auto-pushed. Editing the file must not change prod.

2. **One prompt assembler with a fail-open chain.** Route all generation through
   a single function: fetch managed prompt → compile variables → on any failure
   fall back to the in-code template → worst case return a usable default. It
   MUST NOT throw on a service outage. See `reference/prompt-assembler.ts`.

3. **Cache short, keep last-good forever.** In-memory cache, short TTL (~10s), plus
   an indefinitely-held last-good version as the stale fallback. Cluster? broadcast
   invalidation cheaply (a touched file + mtime stat beats IPC).

4. **Seed inert, promote by hand.** The seeding script's DEFAULT creates versions
   under a `candidate` label — never `production`. Going live needs an explicit
   flag AND a human promoting in the UI. Keep a rollback script that restores a
   prior label by timestamp. (This prevents the #1 real incident — a stale
   checkout silently re-seeding over a newer live prompt.)

5. **Trace every generation, linked to the prompt version.** One trace per call
   (user/session id, surface, input); one generation object linked to the fetched
   prompt — that link is what makes "which prompt version produced this" filterable.

6. **Scores with stable names, pushed fail-safe.** A small frozen vocabulary
   (e.g. `quality-pass` 0|1, `quality-findings` int, `grounding-pass` 0|1,
   `user-feedback` -1|0|1). Wrap pushes so a telemetry error never reaches the user.

7. **Layer the evals — deterministic, then judge, then grounding:**
   - **Deterministic detector** (always, inline, <10ms): regex/string rules for the
     team's named anti-patterns. Hard rules fail (auto-repair the mechanical ones);
     soft rules only fail on accumulation. See `reference/anti-patterns.ts`.
   - **LLM-judge rubric** (always, async, observe-only): a cheap model scores each
     output against N yes/no gates AFTER the response is sent. Never gates delivery;
     fails open. Makes quality a filterable score.
   - **Grounding judge** (where facts matter, temp ≈ 0.1): pass verified facts + the
     text, ask "does it contradict or invent?", bias to pass. Pair with: the model
     may only phrase what the data layer asserts; strip unsourced claims.

8. **Tier models per surface.** Flagship gets the frontier model (off the critical
   path if you can pre-generate); everything else the cheap tier with a mid-tier
   fallback; judges on the cheap tier. Mark the system prompt for provider-side
   caching and keep it universal (no per-user details) so the cache key holds.

9. **Close the loop with datasets.** A script that pulls the last N traces
   (optionally only failures, via the pass score) into a dataset. That dataset is
   how a prompt change is tested against real inputs before it gets promoted.

## Guardrails to enforce as you build

- The user path never hard-fails on a prompt-service or judge error. Verify by
  simulating an outage (bad key) — the feature must still respond.
- No eval layer gates delivery except the deterministic one's auto-repair.
- Score names are frozen; adding is fine, renaming is a migration.
- Don't build the LLM-rewrite-on-failure loop first (or at all early): in the
  origin system it cost 8–12s + ~$0.02 per miss and lost to auto-repair + a
  recency feed. Ship the cheap layers; measure before adding the expensive one.

## Verify before done

Simulate a prompt-service outage (feature still responds), confirm a bad output
is caught by the detector, confirm a score lands on the trace linked to the
prompt version, and confirm promoting a new prompt version goes live without a
redeploy. Report what you wired and what you stubbed.

## Read alongside

`RECIPE.md` (the why + the honest receipts) and `reference/` (working code to
adapt, not copy verbatim).
