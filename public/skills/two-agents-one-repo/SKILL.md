---
name: two-agents-one-repo
description: Set up a repository so several coding agents and people can work in it at once without overwriting each other, and recover work that was lost.
---

Read the two-agents-one-repo guide and both reference scripts before changing anything. Find out first who else is working in this repository: other agent sessions, other tools, a person editing by hand.

Work in your own git worktree created from the current remote branch. Install dependencies inside it under the runtime version the project pins. Never symlink dependencies from another checkout. Before starting a ticket, list open pull requests and recent commits on the main branch and stop if the ticket is already taken.

Stage files by explicit path after reading each diff. Never stage everything, never use the stash while other trees are active, and never rebase, reset, clean or switch a checkout that holds changes you did not make. Save work in progress as a commit or with reference/rescue-snapshot.sh.

Before reporting a file or feature as missing, fetch and check the remote branch, then compare environment key names across trees.

If work is lost, run git fsck --lost-found and recover staged content from unreachable objects before rewriting anything.

Report exactly which trees exist, which one you used and what you left untouched. Installing this skill does not authorize deleting worktrees, force-pushing or rewriting history.
