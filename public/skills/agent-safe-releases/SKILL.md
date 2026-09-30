---
name: agent-safe-releases
description: Set up releases so production only runs a build whose exact commit passed every required check, one deploy at a time, with the live commit confirmed afterwards.
---

Read the agent-safe-releases guide and reference/verify-release.mjs before changing a pipeline. Inspect how this project builds, tests and deploys today, and write down whether it can pin a commit and promote the build made from it.

Tie validation to one candidate commit and its build. Run every required check on that commit. Never reuse results from another commit. Deploy the tested build, not a rebuild of a moving branch. Later merges wait for the next release; a changed candidate is validated again.

Serialize production deploys so an older release cannot replace a newer one. Add a health endpoint that reports the environment and commit, and compare it after each deploy with reference/verify-release.mjs. Follow with a short production smoke test.

Commit migrations with the code that needs them, run them before the code deploys, and keep preview builds off the production database.

Keep required checks, review and migration gates in place. Do not grant yourself merge or deploy rights, do not skip a failing check, and do not deploy. Report which commit was validated, which checks ran on it and what the health endpoint returned. If the pipeline cannot pin a commit, say so plainly rather than calling a release validated.
