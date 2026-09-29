---
name: service-to-mcp
description: Design and implement a narrow MCP adapter around an existing service, starting with a read-only synthetic catalog.
---

Read the service-to-mcp guide and reference/catalog.mjs before modifying a project. Inspect the actual service and identify one user task. Reuse its service layer, validation and server-authenticated permissions; do not expose raw SQL, shell execution or a generic HTTP proxy.

Start with list_items and get_item over synthetic records. reference/server.mjs follows the official MCP server quickstart but still needs package installation and host smoke testing. Keep it local until a separate authenticated remote deployment has been reviewed. Never log to stdout in stdio mode.

Test valid input, bounded results, missing records, denied access and malformed IDs. Add real data only after the boundary is checked. For writes, create proposals rather than acting immediately. Do not read or publish an organization's full operating playbook, private prompts or credentials.

Report exactly what was tested, package versions and which host worked. Do not claim production security or cross-host compatibility from offline helper tests. No deploy, permission widening or outward publication is authorized by installing this skill.
