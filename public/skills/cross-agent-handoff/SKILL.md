---
name: cross-agent-handoff
description: Set up one producer-reviewer handoff around a versioned artifact, with a deliberate stop at human review.
---

Read the guide and reference/handoff.mjs. Ask for or inspect the approved brief, sources, artifact store and access boundaries. Share only approved task material; do not copy unrelated conversation history, private prompts or secrets.

Prove the manual handoff first: one participant produces, another reviews the exact artifact version against the brief, and a human decides. The reference functions are not a transport. An automated version needs a supported API or agent runtime, an explicitly authorized trigger, authenticated actors and atomic state transitions.

Set one review per handoff and a real timeout and spend limit. A revision requires another explicit handoff. Reject stale versions, self-asserted reviewer identity and duplicate completion. A model's agreement is not evidence that a claim is true.

Test wrong-version, impersonation, duplicate and timeout cases. Report actual host and runtime tests separately from offline contract tests. Do not claim that ChatGPT and Claude automatically message each other merely because they share an MCP server.
