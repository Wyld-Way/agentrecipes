---
name: prove-a-change
description: Set up a comparison of a baseline and a candidate AI version on the same frozen set of real inputs, with case-by-case flips and a threshold decided in advance.
---

Read the prove-a-change guide and reference/compare-runs.mjs before changing anything. Find the feature's written quality bar. If there is none, stop and ask for one; do not invent it.

Build a frozen dataset from real past inputs, including known failures. Score in layers: deterministic checks first, then a cheap model as judge answering yes or no questions, then a grounding check where the output states facts. Keep score names stable.

Run the baseline and the candidate on the same dataset with the same scoring. Compare case by case with reference/compare-runs.mjs. Report fixed cases, regressions and the ids of every case that got worse. Record the threshold before the run and do not move it afterwards.

For behaviour that depends on how people act, replay recorded activity before shipping. For each new guard, write one fixture only that guard can stop and confirm the test fails when the guard is removed. For a fix in a shared function, add a test that every call site goes through it.

Do not promote a version. Promotion is a separate act by a person. Do not gate user delivery on a model judge. Report what was run, on how many cases, and what is still unverified in production.
