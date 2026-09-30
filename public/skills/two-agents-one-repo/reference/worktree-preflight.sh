#!/usr/bin/env bash
# Run before starting work. Exits non-zero when it is not safe to work here.
# Usage: worktree-preflight.sh [ticket-number]
set -euo pipefail

ticket="${1:-}"
git rev-parse --git-dir >/dev/null

# 1. A checkout that already holds changes belongs to whoever made them.
if [ -n "$(git status --porcelain)" ]; then
  echo "STOP: this checkout has uncommitted changes. If they are not yours, work in a fresh tree:"
  echo "  git fetch origin && git worktree add -b <branch> ../<dir> origin/<main-branch>"
  exit 1
fi

# 2. The stash is shared by every tree of this repository.
if [ -n "$(git stash list)" ]; then
  echo "WARNING: the shared stash is not empty. Do not pop or drop entries you did not push."
fi

# 3. A stale base looks like missing files.
git fetch --quiet origin
base="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)"
behind="$(git rev-list --count "HEAD..${base}")"
if [ "${behind}" -gt 0 ]; then
  echo "WARNING: this tree is ${behind} commits behind ${base}. Check the remote before calling anything missing."
fi

# 4. Is the ticket already taken?
if [ -n "${ticket}" ]; then
  if git branch -r | grep -E "[^0-9]${ticket}([^0-9]|$)" >/dev/null; then
    echo "STOP: a remote branch already names ticket ${ticket}:"
    git branch -r | grep -E "[^0-9]${ticket}([^0-9]|$)"
    exit 1
  fi
  if git log "${base}" --oneline -30 | grep -E "#${ticket}([^0-9]|$)" >/dev/null; then
    echo "STOP: recent commits on ${base} already reference #${ticket}."
    exit 1
  fi
fi

echo "OK: clean tree, ${behind} behind ${base}."
