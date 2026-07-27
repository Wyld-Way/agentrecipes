---
name: voice-ai-pipeline
description: Turn AI-generated text into voice audio that starts playing in seconds instead of making users wait for the whole file — chunked/progressive TTS delivery, pause fidelity across voice model tiers, loudness normalization, and a failure ladder that degrades to a proven batch fallback instead of erroring. Use when an LLM or dynamic script needs to become spoken audio on a live, latency-sensitive path.
---

# Implement: a streaming/progressive text-to-speech pipeline

You are helping a developer turn AI-generated (or any dynamic) text into voice
audio that starts playing quickly, instead of the user waiting for the whole
piece to render. Implement the pattern below IN THEIR codebase, adapting to
their language, framework, TTS provider, and audio player. Do not copy any
single vendor's SDK blindly — the pattern is provider-neutral; wire it to
whatever they have.

## Before you write code, detect their stack

Ask or infer: their language/runtime, their TTS provider (ElevenLabs, Azure
Speech, Google Cloud TTS, AWS Polly, OpenAI TTS, or none yet), whether that
provider offers both a fast/cheap tier and a higher-quality tier, its
documented concurrency limits, and what their client-side audio player can
already do (does it support gapless multi-track queueing, or only a single
file?). Adapt every step to what you find. If they have no player capable of
multi-track playback, either recommend the smallest viable upgrade or scope
down to the plain-batch path (skip steps 1–5, do 6–9 only).

## Build these, in this order

1. **Pick the delivery shape.** Default to progressive multi-track delivery
   if the client can (or can cheaply be made to) drain a queue of audio
   chunks gaplessly: return after the first chunk is ready, keep
   synthesizing + uploading the rest in the background. If the client can
   only play one file, do plain batch (skip to step 6) — don't force a
   client rewrite to unlock this recipe.

2. **Split text into synthesis chunks at natural seams.** Break at
   author-placed pause markers first, not by raw word count. Tune the target
   chunk size against the SPECIFIC tier's measured per-request latency: too
   few chunks puts one slow chunk on the critical path; too many creates a
   straggler tail that blows budget on a slow tier. See
   `reference/chunk-and-pace.ts` for the chunking + pause-classification
   shape.

3. **Translate pauses per model tier, never assume one syntax works
   everywhere.** Classify each pause as shallow (ride inline, using whatever
   native pause syntax that tier honors) or deep/authored (make it REAL
   reinjected silence spliced in at a chunk boundary — synthesize a short
   silent clip and stitch it in). Verify by ear on EACH tier you support; do
   not assume a script that paces correctly on one tier paces the same on
   another.

4. **Tier the voice model to the surface.** Fast/cheap tier for the
   interactive, someone's-waiting path. Slower/higher-quality tier ONLY for
   anything pre-generated ahead of need (a cron, a "prepare while the user
   is still browsing" trigger). Respect the provider's concurrency ceiling
   as a semaphore shared across ALL concurrent work (live + background); on
   a rate-limit response, retry with backoff instead of failing the whole
   generation.

5. **Give every synthesis call an explicit, strongly-held timeout chained to
   a caller abort.** Do not rely on a composite/derived AbortSignal alone —
   in some runtimes an unreferenced derived timer can be garbage-collected
   and silently never fire, hanging the request and starving a shared
   concurrency slot. Hold your own timer, clear it in a `finally`.

6. **Concatenate by re-encoding, never raw byte-copy.** Byte-copy concat is
   faster but leaves audible seam glitches (frame-boundary misalignment) and
   wrong duration metadata (a player reads only the first chunk's header).
   Re-encode through the format's real encoder in the same pass — still
   sub-second for a multi-minute piece.

7. **Fold loudness normalization into the same re-encode pass.** One filter
   pass, no added latency, targeting a standard loudness level with a
   true-peak ceiling so output volume doesn't drift piece to piece. See
   `reference/chunk-and-pace.ts` for where this slots into the concat step.

8. **Build the failure ladder, and make every rung detectable.** Name each
   failure point (upstream generation stalls, TTS connect fails, TTS returns
   no audio within budget, mid-stream error) with a wall-clock detection
   budget and a fallback action. The last rung is always a plain,
   already-proven batch path — never new code written only for the failure
   case. See `reference/failure-ladder.md` for the table shape.

9. **Instrument the seams.** Log time-to-first-audio-byte, per-chunk
   synthesis time, total stream duration, and which fallback rung (if any)
   fired — per generation, not just a single total.

## Guardrails to enforce as you build

- The interactive path never uses the expensive/slow tier live — only
  pre-generated ahead of need.
- A single hung synthesis request cannot hold a shared concurrency slot
  forever — verify the timeout actually fires under a simulated hang.
- Concatenation always re-encodes; never leave a fast byte-copy path in the
  code even "temporarily."
- Every fallback rung actually degrades to something that works — verify by
  forcing each failure point (bad API key, injected timeout, truncated
  response) and confirming the user still gets audio.
- Compression middleware / edge caching is explicitly disabled on the
  streaming route — verify bytes arrive incrementally with a raw client, not
  just "it played in a browser tab."

## Verify before done

Simulate each rung of the failure ladder (upstream stall, TTS connect
failure, TTS timeout, mid-stream error) and confirm the user still gets
audio via the batch fallback. Confirm a deep authored pause survives
playback on every voice tier in use. Confirm two consecutive generations of
the same script land at the same perceived loudness. Report what you wired
and what you stubbed.

## Read alongside

`RECIPE.md` (the why + the honest receipts) and `reference/` (working code
to adapt, not copy verbatim).
