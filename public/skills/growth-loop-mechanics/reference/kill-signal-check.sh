#!/usr/bin/env bash
# reference/kill-signal-check.sh — the pulse for the growth bench (RECIPE.md
# "The pulse" + step 5/7). Deliberately dumb: no judgment about whether a
# seed is WORTH keeping, just "is this seed past its kill-signal date and
# still marked watering?" A kill signal nobody reviews on schedule is a kill
# signal that never fires — run this before every standing portfolio review.
#
# Adapt BENCH_FILE's parsing to whatever format your bench doc actually uses
# (this expects a YAML file roughly shaped like growth-bench.schema.yaml).
# Requires python3 + pyyaml (a near-universal baseline); swap for yq or a
# small script in your own stack if you'd rather not add the dependency.
set -euo pipefail

BENCH_FILE="${BENCH_FILE:?set BENCH_FILE=path/to/growth-bench.yaml}"

python3 - "$BENCH_FILE" <<'PYEOF'
import sys, datetime

try:
    import yaml
except ImportError:
    print("kill-signal-check: pyyaml not installed (pip install pyyaml), or adapt this script to your bench format")
    sys.exit(2)

path = sys.argv[1]
with open(path) as f:
    data = yaml.safe_load(f) or {}

seeds = data.get("seeds", [])
today = datetime.date.today()

overdue = []
unplanted = []
for seed in seeds:
    slug = seed.get("slug", "<unnamed>")
    status = seed.get("status")
    kill = seed.get("kill_signal") or {}
    by_date = kill.get("by_date")

    if status == "watering":
        if not by_date or kill.get("threshold") is None:
            # Should never happen if step 2 was enforced at plant time, but
            # a bench that predates the discipline can drift here.
            unplanted.append(slug)
            continue
        due = datetime.date.fromisoformat(str(by_date))
        if due <= today:
            overdue.append((slug, due, kill.get("metric"), kill.get("threshold")))

if not overdue and not unplanted:
    print(f"OK: no seeds overdue for their kill-signal review ({len(seeds)} seeds checked).")
    sys.exit(0)

if unplanted:
    print("MISSING KILL SIGNAL — these are marked 'watering' with no metric/date, fix before the next review:")
    for slug in unplanted:
        print(f"  - {slug}")

if overdue:
    print("OVERDUE FOR REVIEW — bring these to the standing portfolio review, decide compost or re-plant:")
    for slug, due, metric, threshold in overdue:
        print(f"  - {slug}: kill signal was {metric} < {threshold} by {due} (passed)")

sys.exit(1)
PYEOF
