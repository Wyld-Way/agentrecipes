---
name: agent-worker-fleet
description: Run a fleet of AI agents on real work without babysitting them — isolated ephemeral workers, output-gated (verify don't permission), fan-out caps, and a dumb watchdog that pages on silence. Use when running more than one agent, scheduled or unattended, on real repos/systems. Heavy on hard-won failure modes.
---

# Set up a safe agent worker fleet

You are helping a developer run multiple AI-agent workers safely — scheduled or
unattended, on real work. Adapt to their compute (CI, cloud sandboxes, containers)
and their repo host. Lead with the failure modes: most of this recipe's value is
in what NOT to do. Do not oversell — the pattern is proven by three failures; a
polished finished runtime is not.

## Detect their setup

Where workers would run (their CI / cloud / would they be tempted to run on the dev
machine — steer them off it), their repo host + how they'd scope worker tokens,
whether they have any scheduled/unattended ambition or just parallel interactive
agents (if the latter, tell them they don't need fleet machinery yet).

## Build this

1. **Isolated ephemeral workers.** Each worker runs in a fresh cloud sandbox / CI
   runner, fresh checkout per task, torn down after. Never the dev's machine, never
   a long-lived working tree. This is non-negotiable — it's the one thing every
   failure had in common (laptop-scheduled died; headless-CI never missed).

2. **Scoped, expiring credentials.** Per-worker tokens with the narrowest rights
   (branch-push, not merge; no prod; no secrets), and a spend cap on the model key
   so a runaway worker can't run away with cost.

3. **Manual dispatch, one accountable human.** No idle auto-scheduler. Flow: talk →
   decompose into tickets with done-conditions → dispatch each to ONE worker,
   scoped not to collide → review every landing → digest.

4. **Verify output, not permissions.** CI (tests+build) + PR review is the
   guardrail. Reserve human gates for a tiny irreducible set (money, prod data,
   outward publishes). Don't re-gate already-approved work — approval is
   authorization.

5. **Fan-out caps.** Depth ceiling (no spawning past N generations), breadth
   ceiling (≤ K workers per root task, ever), per-dispatch concurrency limit, and
   visible degradation on shared-quota exhaustion (never silent).

6. **A dumb watchdog on silence.** Dumber than what it watches — no AI, no
   dispatch. Checks "did the expected work post something recently?" and pages a
   human if not. Silence is a top-level failure, equal to an error. See
   `reference/heartbeat-watchdog.sh`.

7. **Shared-tree safety** (if any tree is shared): explicit-pathspec staging (never
   `add -A`), rebase with autostash, never force past a conflict, fail-open sync.

## Guardrails to enforce

- Nothing unattended on the human's machine.
- Every status must derive from real artifacts, never an agent's self-report
  ("state theater" is how the board lies while the fleet is dead).
- Answer a failure by making the work happen + watching for its absence — never by
  adding another component that only reports state (control-plane accretion).
- New runtime → probation window, evidence before redesign.

## Verify before done

Confirm a worker runs with no access to prod/secrets and can only push a branch.
Kill a scheduled run and confirm the watchdog pages within its window. Confirm two
workers on different tasks don't touch the same paths. Confirm exhausting the quota
logs a visible "skipped," not silence.

## Read alongside

`RECIPE.md` (the why + the three-deaths failure history) and
`reference/heartbeat-watchdog.sh`.
