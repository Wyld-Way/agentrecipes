---
name: growth-loop-mechanics
description: Run a portfolio of small, cheap growth experiments ("seeds") so the ones that fail die cheap and the one that works gets a real owner instead of decaying from neglect — kill signals set before you plant, an explicit loop-back to your core product, separated on-site/off-site execution roles, and a graduation rule for when a bet actually works. Use when running more than one speculative growth bet at a time.
---

# Implement: a growth-seed portfolio (plant, rank+route, spread, graduate)

You are helping someone set up a disciplined way to run multiple small growth
bets at once — new content sites, audience plays, SEO/content surfaces, small
tools meant to feed a top-of-funnel — without any one bet quietly draining
attention forever, and without a winning bet dying from neglect once nobody's
"the owner" anymore. Implement the pattern below adapted to their team size,
tools, and existing docs/wikis. This is an operating pattern, not a codebase
— most of what you'll set up is documents, a review cadence, and role
definitions, plus one small script that keeps the discipline honest.

## Before you set anything up, detect their situation

Ask or infer: do they already have any growth bets running informally? Do
they have a place (a doc, a wiki page, a spreadsheet) that lists them? Is
there one person who owns "the portfolio" as distinct from whoever executes
any single bet? Do they have any standing on-site (SEO/content) or off-site
(outreach/partnerships) capacity? Adapt scope accordingly — a solo operator
needs the bench doc and the kill-signal discipline (steps 1–3, 5–9) far more
than the two-role split (step 4), which matters most once there's enough
volume that ranking and outreach compete for the same person's attention.

## Build these, in this order

1. **Create the bench doc.** One document, sections for `Seeded` (named,
   not yet planted), `Watering` (planted, running against its kill signal),
   `Took root` (graduated, now owned by a dedicated role), and `Composted`
   (killed by signal — keep this section even when empty). Every entry
   carries: the bet, the loop-back, the smallest-real-v1, and the kill
   signal (metric + date). See `reference/growth-bench.schema.yaml`.

2. **Never plant without a written kill signal.** Before any resources go
   into a seed, require a concrete metric and a concrete date (30–90 days
   out is a reasonable default) in the bench doc. No kill signal = not
   planted yet, full stop — don't let "we'll figure out the number once it's
   live" ship.

3. **Require an explicit loop-back sentence before shipping.** How does this
   seed feed the core product — more signups, more attention, cross-promo
   into an existing surface? If nobody can write that sentence, the seed
   isn't ready, or it's not actually a growth bet.

4. **Stand up the two execution roles once there's real volume.** One role
   (or person, or agent) owns on-site work: ranking mechanics, content, AND
   continuously testing the placement/copy of the promotion back to the
   core product — not just ranking, routing too. A second, separate role
   owns off-site work: building link-worthy resources, finding legitimate
   placements, drafting (never sending) outreach. Keep a hard rule: a human
   sends every outreach message, and a prospect only reaches "sent" once
   someone actually sent it — the drafting role's own tracking can't
   inflate that state.

5. **Run a standing portfolio review cadence, not ad hoc single-seed
   check-ins.** Put a recurring slot on the calendar (weekly or biweekly is
   typical) where the WHOLE bench gets reviewed together: what's overdue for
   its kill-signal check, what's ready to graduate, what new seed is worth
   planting. This is where kill signals actually get enforced — see
   `reference/kill-signal-check.sh` for a scriptable overdue-check you can
   run before that meeting.

6. **Before planting anything net-new, do a soil check.** A quick pass over
   what's already owned and dormant (parked domains, half-built tools,
   under-converted existing audiences) before greenlighting a greenfield
   idea.

7. **Enforce the kill without ceremony.** When the review finds a seed past
   its kill-signal date and under its bar, move it to Composted the same
   meeting. No informal extension without a NEW written number and date —
   treat that as re-planting, not continuing.

8. **Wire the graduation handoff.** The moment a seed clears its bar, draft
   (same review cycle) who becomes its dedicated owner, distinct from the
   portfolio-holder. Move it to "Took root" in the bench doc with that
   owner's name attached. The portfolio-holder does not keep running it
   "for now."

9. **Record the lesson, not just the outcome.** When a seed is composted or
   graduates, write one sentence in the bench doc about what it taught
   about seed viability in general — not just its final number. This is
   usually worth more than the seed itself.

## Guardrails to enforce as you build

- No seed enters "Watering" without both a kill signal AND a loop-back
  sentence already written.
- The portfolio-holder role and any single-seed execution role are
  different people (or clearly different hats), even in a very small team —
  verify this explicitly, it's the single most commonly skipped guardrail.
- Off-site outreach never auto-sends; confirm there's a manual send step and
  that the tracking ledger distinguishes "drafted" from "sent" from
  "landed."
- The Composted section is never deleted, even when it's the only nonempty
  section for a while — that visibility is the point.

## Verify before done

Walk through one real (or hypothetical) seed end to end: it enters Seeded
with a bet and no kill signal yet, gets a kill signal and loop-back before
moving to Watering, gets reviewed on the standing cadence, and either gets
composted with a recorded lesson or graduates to a named owner. Confirm the
bench doc's Composted section exists and isn't hidden. Report what you set
up and what's still manual.

## Read alongside

`RECIPE.md` (the why + the honest receipts) and `reference/` (the bench
schema and the overdue-kill-signal check, to adapt not copy verbatim).
