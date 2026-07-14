#!/usr/bin/env bash
# Reference: the dumb watchdog (step 5). A dead-man's switch on the fleet's OUTPUT.
# Deliberately dumber than what it watches: no AI, no dispatch — just "did the
# expected work post something recently? if not, page a human." Silence is the
# only trigger. Run it on a schedule ~1h after each slot your fleet is meant to act.
#
# This example watches a GitHub issue used as the fleet's log/heartbeat. Adapt the
# "did work happen?" probe to wherever your workers leave evidence (a log channel,
# a metrics ping, a status file, a DB row).
set -euo pipefail

REPO="${REPO:?set REPO=owner/name}"
HEARTBEAT_ISSUE="${HEARTBEAT_ISSUE:?issue number the fleet posts its log to}"
LOOKBACK_HOURS="${LOOKBACK_HOURS:-3}"      # fresh = posted within this window
PAGE_HANDLE="${PAGE_HANDLE:-@your-oncall}" # who gets mentioned on silence

# Cutoff = now - LOOKBACK_HOURS, in ISO-8601 UTC.
cutoff="$(date -u -v-"${LOOKBACK_HOURS}"H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
  || date -u -d "${LOOKBACK_HOURS} hours ago" +%Y-%m-%dT%H:%M:%SZ)"

# The probe: any fleet activity on the heartbeat since the cutoff?
recent="$(gh api "repos/${REPO}/issues/${HEARTBEAT_ISSUE}/comments" \
  --jq "[.[] | select(.created_at > \"${cutoff}\")] | length")"

if [ "${recent}" -gt 0 ]; then
  echo "OK: ${recent} fleet post(s) since ${cutoff} — fleet is alive."
  exit 0
fi

# SILENCE. That is the failure. Page, and exit non-zero so the scheduler
# (CI, cron) also surfaces it through its own failure channel (email/alert).
echo "SILENCE: no fleet activity since ${cutoff}. Paging."
gh api "repos/${REPO}/issues/${HEARTBEAT_ISSUE}/comments" \
  -f body="${PAGE_HANDLE} FLEET SILENT — no activity in ${LOOKBACK_HOURS}h. The work did not happen (or ran and posted nothing). Check the workers." >/dev/null
exit 1
