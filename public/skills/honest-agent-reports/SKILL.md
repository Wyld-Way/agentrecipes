---
name: honest-agent-reports
description: Make every status an agent reports carry one fixed meaning and the evidence for it, and add an independent check that reopens work marked done without proof.
---

Read the honest-agent-reports guide and reference/claim-check.mjs. Adopt the five status words and use no others: written, tested, merged, deployed, verified. Each claim names its evidence: a diff, the command and its output, a commit, the live revision, or what was exercised and observed.

Report failures with their output. Name every step that was skipped. Report a failed save as unsaved. Before calling a file or feature missing, fetch and check the remote. Do not describe work on a branch as done.

When you stop for approval, state who requires it and where that requirement is written. If you cannot, say that the constraint is your own assumption.

Commit under the agent's own identity, never a person's.

Build the final report from the evidence list. Validate it with reference/claim-check.mjs before sending. Do not soften a failed check into "mostly working", and do not mark your own work verified on the strength of reading the code.
