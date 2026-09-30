---
name: when-to-say-nothing
description: Build the decision for a proactive assistant so that silence is the default, rules run before any model, and it speaks one grounded line only when a recorded signal earns it.
---

Read the when-to-say-nothing guide and reference/nudge-gate.mjs. Find every place the product interrupts a person and list the trigger behind each.

Make the decision return either a line or silence with a reason, and log both. Put deterministic rules first: minimum gap, daily limit, quiet hours, whether the person is busy. Require a specific recorded signal before speaking. Pass the model a compact, abstracted summary, never raw screen contents or message text. Ask it one yes or no question before generating any line.

Keep the line to one sentence that names what was noticed and offers one action, using only facts the system holds. A dismissal lengthens the gap before the next attempt.

Before release, replay every trigger over recorded real activity and report how often each would have fired. Report acted-on and dismissed rates and the mix of silence reasons. Do not report the number of interruptions sent as a success measure.

Do not add new data collection to make the decision. Do not enable any interruption that has not been replayed.
