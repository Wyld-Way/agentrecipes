---
name: shared-agent-memory
description: Give AI agents a shared memory that survives every session — a version-controlled, file-based brain agents read at session start and write at session end, so knowledge compounds instead of resetting. Use when running agents repeatedly on the same project, especially more than one agent.
---

# Set up a shared brain for a user's agents

You are giving a developer's AI agents a durable, file-based shared memory in their
own repo. Implement it here, adapting to their setup. No database, no vector store —
plain markdown in version control plus a read/write protocol.

## Detect their setup

Which agent(s) they use (Claude Code, Cursor, etc.) and where each reads its
standing instructions (e.g. `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, a rules dir).
Whether they have a repo to hold the brain (use it) or need one. Whether they run
multiple agents (raises the value of one shared brain).

## Build this

1. **Pick the brain's home** — a version-controlled repo (or a `memory/` + docs
   tree inside their existing one). Git so history is a free audit log.

2. **Create the four homes, separated by how knowledge changes:**
   - durable knowledge / preferences (one fact per file)
   - current status (overwritten, not appended)
   - decisions (append-only, with the why)
   - time-bound plans (dated, lifecycle draft→active→done→archived)

3. **Memory file schema** — each durable memory is a small file with frontmatter:
   `name` (stable slug), `description` (one line, used to judge relevance on
   recall), `type`. Body = the one fact, linking related memories with
   `[[other-name]]`. See `reference/memory-file.example.md`.

4. **The index** — one file listing one line per memory (`- [title](file.md) —
   hook`) so an agent scans what exists before loading bodies. See
   `reference/MEMORY.index.example.md`.

5. **Write the read/write protocol into their agent's rules file** — the crucial
   step. At session start: read the index + relevant files. At session end: write
   back what changed. Adapt `reference/AGENTS.md` into their `CLAUDE.md` /
   `.cursorrules` / rules dir. Without this the brain is a folder nobody opens.

6. **Add the "artifacts over chat" habit** — results that matter get filed, not
   left in a conversation. And the "don't store the derivable" rule — nothing that
   restates the code, git history, or a ticket.

7. **Set up the pulse** — a periodic curation pass (a scheduled task, or a
   dedicated curator agent role) that merges duplicates, fixes stale facts against
   reality, prunes, and keeps files small + the index honest.

## Guardrails to enforce

- The read AND write halves both go in the rules file — a read-only brain stops
  compounding.
- One fact per file + an index. Never one monolithic memory file.
- Recalled memory is a lead to verify, not ground truth — instruct the agent to
  check anything that names a file/flag/function against live code before asserting.
- Store only the non-obvious; skip anything derivable from the repo.

## Verify before done

Open a fresh session and confirm the agent reads the index unprompted, can answer
a project question from memory alone, and writes a new/updated memory at session
end. Confirm two memories don't duplicate the same fact.

## Read alongside

`RECIPE.md` (the why + receipts) and `reference/` (protocol + schema to adapt).
