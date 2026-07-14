---
name: grounded-generation
description: Make an LLM talk about the real world without making things up — data layer asserts facts with provenance, the model only phrases them, unsourced/stale claims are stripped, and it degrades to typed silence instead of inventing. Use when an LLM speaks about facts with a checkable ground truth (weather, place, prices, live data).
---

# Implement: grounded generation (no hallucinated facts)

You are stopping a developer's LLM feature from inventing real-world facts.
Implement the discipline below in their codebase. The core inversion: the model is
a PHRASER over facts a data layer asserts — it never originates a fact. Adapt to
their language, their data sources, and their model.

## Detect their setup

Where real facts enter (which APIs / data sources), where the model call is, and
whether facts currently reach the model as structured values or already baked into
a prose prompt (if baked-in, that's the first thing to fix — the model can't be
gated on provenance it can't see).

## Build this

1. **Structured facts with provenance.** Make the data layer return each fact as
   `{ value, source, observedAt, confidence }`, not prose. A fact missing any of
   source/observedAt/confidence does not pass to the model.

2. **The grounding gate** — classify every fact GROUNDED / SILENT / VIOLATION and
   block violations before the model. Includes the cardinal-sin check (high
   confidence + no source) and staleness (past its TTL). See
   `reference/grounding-gate.ts`.

3. **Typed silence.** Absence is `{ silent: true, reason }`, handled deliberately
   by the rendering layer — never invent to fill it, never error.

4. **Freshness.** Each fact declares a TTL (producer owns it); strip stale facts
   before the model sees them; conservative default TTL for unknown sources.

5. **Model phrases only.** Prompt the model to reword the given facts and add
   nothing. Then run cheap deterministic gates on its OUTPUT to catch leaks: raw
   null/placeholder strings, internal vocabulary, generic template fallbacks, and
   internal inconsistency (one field contradicting another). Score it.

6. **Degrade to silence.** Timeout / thin data / source down → silence-with-reason
   for that axis. Wrap flaky sources in a circuit breaker (open after N failures,
   cool down, probe).

7. **The replay loop.** Snapshot the raw facts behind every generation. When
   accuracy is questioned, replay the snapshot and grade it against current rules
   across the population — never hand-patch from one anecdote.

8. **A grounding metric.** `(grounded + silent) / (grounded + silent + violations)`
   — silence counts as integrity.

## Guardrails to enforce

- No fact reaches the model without provenance; no high-confidence claim ships
  without a source.
- Silence is a designed response, never an error or a filled-in default.
- Accuracy fixes are evidence-driven (replay + grade), never anecdote-driven.
- When a claim class stops correlating with reality, demote it to silence — don't
  tune the threshold.

## Verify before done

Force a source offline and confirm the feature goes silent-with-reason (not stale,
not invented). Feed a fact with no source and confirm it's blocked. Confirm the
output gates catch an injected fabrication. Confirm a stale fact is stripped.

## Read alongside

`RECIPE.md` (the why + receipts) and `reference/grounding-gate.ts`.
