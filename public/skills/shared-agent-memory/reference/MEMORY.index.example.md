<!-- Reference: the index (step 4). One line per memory file, so an agent can
     scan what exists BEFORE loading any bodies. Keep it short — a hook, not a
     summary. Regenerate or hand-edit whenever a memory file is added, renamed,
     or retired; a stale index is worse than no index. -->

# Memory index

One line per durable memory. Format: `- [name](relative/path.md) — description`.

## User / preferences
- [deploy-target-is-staging](memory-file.example.md) — app pushes go to
  staging, which is what real users hit; verify the target before any release.

## Project / reference
- [release-checklist](release-checklist.md) — the steps that precede any deploy
  (not written yet — a link to a memory that doesn't exist is fine; it marks
  something worth writing later).

## Decisions
- [no-direct-prod-deploys](no-direct-prod-deploys.md) — all releases go through
  staging first; settled, with the why, in the decisions log (illustrative —
  your decisions log has its own home; see RECIPE.md step 2).

<!-- Notes:
     - Group however makes sense for your project (by type, by area) — the
       index is a scan surface, not a schema.
     - A link to a memory that doesn't exist yet is fine; it marks something
       worth writing later (see RECIPE.md, "link related memories").
     - Keep entries current: retire the line when the file is archived, don't
       just delete the file and leave a dangling index entry.
-->
