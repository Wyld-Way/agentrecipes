---
name: ai-native-admin
description: Build one shared admin operation with a proposal, visual diff, validation and exact-change approval before commit.
---

Read the guide and reference/change-contract.mjs. Inspect the existing admin service, identity model and transaction boundary. Start with a low-risk title edit over synthetic records, not payments, user administration or destructive bulk actions.

Have web forms and MCP tools call the same service operation. Store proposals with expected record version and a stable digest. Derive actor, tenant, permissions and approval from authenticated server records, never model-supplied flags. Show the exact before/after change to the human.

The reference is an in-memory contract demonstration. Implement real transactions, durable idempotency, scoped authorization and audit/recovery before touching real data. A normal web page is sufficient unless an MCP App improves the task; keep a text-only fallback.

Test stale versions, denied access, altered proposals, duplicate commits and concurrent editors. Record UI and host tests separately from helper tests. Do not deploy, widen permissions or mutate production data merely because this skill is installed.
