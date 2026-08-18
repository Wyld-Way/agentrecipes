# Reference: the failure ladder (RECIPE.md step 8)

A shape to adapt, not a fixed list — name every real failure point in YOUR
pipeline, give each a wall-clock detection budget, and give each a fallback
action. The bottom rung is always a plain path that already works.

| Point | Detection | Action |
|---|---|---|
| Upstream text generation stalls before any output | error/no-first-token event | abort this attempt, fall back to batch |
| Upstream text generation emits nothing within budget | wall-clock timer | abort, fall back to batch |
| TTS connection fails to open within its connect budget | connect timeout | switch to the provider's plain HTTP/single-shot mode, if one exists |
| TTS returns no audio within budget from stream start | wall-clock timer | abort, fall back to batch |
| Mid-stream error from either upstream | error event | abort and fall back — UNLESS enough audio has already reached the client that finishing cleanly (a replayable partial) beats restarting from zero |
| Client-side stalled read | player/transport error | client-side retry against the plain batch endpoint |
| A synthesis request hangs past its own timeout | the per-chunk timeout in `reference/chunk-and-pace.ts` | abort that specific chunk, free its concurrency slot immediately — do NOT let the whole generation wait on it |
| Provider returns a rate-limit response | HTTP 429 / equivalent | retry with backoff bounded by the same request's timeout, do NOT immediately dump the whole generation to the fallback tier |

## The rule this table encodes

Every row needs BOTH a detection (how do you know this failed, and how
quickly) and an action (what happens instead). A row with detection but no
tested action is a failure mode waiting to become an incident. A row with
neither is invisible until a user reports it.

The last rung — plain batch fallback — must be a path that is ALREADY
proven and already running for some traffic (e.g. the pre-streaming
implementation you had before this recipe). Never write new "just in case"
fallback code that itself has never been exercised in production; an
untested fallback is not a fallback, it's a second failure mode.
