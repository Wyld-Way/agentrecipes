#!/usr/bin/env bash
# Saves everything in this working tree, including untracked files, under a
# private ref. It does not use the stash and does not change the tree or the index.
# Restore later with: git checkout <ref> -- <path>
set -euo pipefail

name="${1:-$(date -u +%Y%m%dT%H%M%SZ)}"
tmp_index="$(mktemp)"
trap 'rm -f "${tmp_index}"' EXIT

# Build the snapshot in a throwaway index so the real one is left alone.
cp "$(git rev-parse --git-dir)/index" "${tmp_index}" 2>/dev/null || true
GIT_INDEX_FILE="${tmp_index}" git add -A
tree="$(GIT_INDEX_FILE="${tmp_index}" git write-tree)"
commit="$(git commit-tree "${tree}" -p HEAD -m "rescue snapshot ${name}")"
git update-ref "refs/rescue/${name}" "${commit}"
echo "Saved refs/rescue/${name} (${commit})"
