<!-- Reference: the read/write protocol. Adapt into the agent's own standing
     instructions file (CLAUDE.md, AGENTS.md, .cursorrules, or a rules dir).
     This is the piece that makes the brain live — without it, the folder is
     never opened. -->

# Shared brain protocol

This repo is the shared brain. Read from it at session start; write back at
session end.

## At session start
1. Read `MEMORY.md` — the index. One line per memory; scan for what's relevant.
2. Read the current-status file for what exists / is live / is in flight.
3. Read the specific memory files, decisions, or plans the task touches.

## At session end (write back what changed)
| If you… | Write to… |
|---|---|
| Learned a durable fact or preference | a new one-fact memory file + a line in `MEMORY.md` |
| Changed what's live / shipped / in flight | the current-status file (overwrite to current state) |
| Made a settled decision | append it to the decisions log, with the why |
| Started time-bound work | a dated plan file (status: draft/active) |

## Rules
- **One fact per memory file**, with frontmatter (`name`, `description`, `type`).
  Link related memories with `[[name]]`.
- **Current state, not history** in status files — the git log holds the past.
- **Artifacts over chat** — file what's meant to compound; don't leave it only in
  a reply.
- **Don't store the derivable** — nothing recoverable from the code, git history,
  or a ticket. Store the non-obvious.
- **Recalled memory is point-in-time** — before acting on a memory that names a
  file, flag, or function, verify it against the live code.
- Before saving, check for an existing memory that already covers it — update that
  file rather than create a duplicate.
