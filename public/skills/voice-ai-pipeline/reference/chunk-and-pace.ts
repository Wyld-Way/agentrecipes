/**
 * reference/chunk-and-pace.ts — provider-neutral shape for splitting a
 * script into synthesis chunks, classifying pauses, and re-assembling the
 * final audio with correct pacing and consistent loudness.
 *
 * This is a pattern to ADAPT, not a drop-in library. Swap the TTS call, the
 * silence-synthesis call, and the concat/loudnorm call for your own
 * provider's SDK / your own audio toolchain. No vendor-specific code here —
 * see RECIPE.md steps 2-3 and 6-7 for the reasoning behind each shape.
 */

// ── 1. Parse the script into text blocks + standalone pause markers ───────

type ScriptItem =
  | { type: 'text'; text: string }
  | { type: 'pause'; seconds: number }

/**
 * Split a script on blank lines into ordered items: spoken text blocks and
 * standalone `<pause seconds="N"/>`-style markers the author placed between
 * passages. Adapt the marker syntax to whatever your authoring pipeline
 * uses (SSML <break/>, a custom tag, plain "..." conventions).
 */
function parseScript(script: string): ScriptItem[] {
  const blocks = script.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((b) => {
    const m = b.match(/^<pause seconds="(\d+(?:\.\d+)?)"\s*\/?>$/i)
    return m ? { type: 'pause', seconds: parseFloat(m[1]) } : { type: 'text', text: b }
  })
}

// ── 2. Group into chunks, deciding which pauses become REAL silence ───────

interface Chunk {
  rawText: string
  /** Seconds of REAL reinjected silence to splice in after this chunk. */
  silenceAfterSec: number
}

/**
 * Group text blocks into at most `maxChunks` synthesis chunks, choosing the
 * `maxChunks - 1` LARGEST standalone pauses as real chunk-boundary silence.
 * Every other pause (smaller, or falling inside a merged chunk) gets
 * re-inlined as a token for the per-tier intra-chunk transform to handle
 * natively (see step 3 below) — it still paces, just not as spliced silence.
 *
 * Tune `maxChunks` and your own target-words-per-chunk against the SPECIFIC
 * tier's measured per-request latency (RECIPE.md step 2) — a size that's
 * right for a fast tier creates a straggler tail on a slow one.
 */
function groupIntoChunks(items: ScriptItem[], maxChunks: number): Chunk[] {
  type Base = { rawText: string; pauseAfterSec: number }
  const base: Base[] = []
  for (const it of items) {
    if (it.type === 'text') base.push({ rawText: it.text, pauseAfterSec: 0 })
    else if (base.length > 0) base[base.length - 1].pauseAfterSec += it.seconds
    // a leading pause with nothing to attach to is dropped — nothing to hold silence before
  }

  if (base.length <= maxChunks) {
    return base.map((b) => ({ rawText: b.rawText, silenceAfterSec: b.pauseAfterSec }))
  }

  const boundaryCount = base.length - 1
  const keep = Math.max(1, maxChunks - 1)
  const chosen = new Set(
    Array.from({ length: boundaryCount }, (_, i) => i)
      .sort((a, b) => base[b].pauseAfterSec - base[a].pauseAfterSec || a - b)
      .slice(0, keep),
  )

  const chunks: Chunk[] = []
  let parts: string[] = []
  for (let i = 0; i < base.length; i++) {
    parts.push(base[i].rawText)
    const isLast = i === base.length - 1
    if (isLast) {
      chunks.push({ rawText: parts.join('\n\n'), silenceAfterSec: 0 })
      break
    }
    const gap = base[i].pauseAfterSec
    if (chosen.has(i)) {
      chunks.push({ rawText: parts.join('\n\n'), silenceAfterSec: gap })
      parts = []
    } else if (gap > 0) {
      parts.push(`<pause seconds="${gap}"/>`) // re-inlined for the intra-chunk transform
    }
  }
  return chunks
}

// ── 3. Per-tier intra-chunk transform: what a pause becomes INSIDE a chunk ─

interface VoiceTier {
  id: string
  /** Does this tier honor a literal pause marker natively, or does it need
   *  translation to inline cue tags ("[short pause]" style)? */
  honorsNativePauseMarker: boolean
  /** Stability/consistency setting. Raise this for any tier that synthesizes
   *  chunks INDEPENDENTLY with no cross-chunk context — low stability lets
   *  the voice "wander" (accent, persona) chunk to chunk (RECIPE.md: accent
   *  drift failure mode). */
  stability: number
}

function intraChunkText(rawText: string, tier: VoiceTier): string {
  if (tier.honorsNativePauseMarker) {
    // Tier reads the marker natively — leave it alone.
    return rawText
  }
  // Tier needs translation to inline cue tags it actually understands.
  return rawText.replace(/<pause seconds="(\d+(?:\.\d+)?)"\s*\/?>/gi, (_, sec) =>
    parseFloat(sec) <= 1.5 ? ' [short pause] ' : ' [long pause] ',
  )
}

// ── 4. Synthesize chunks, bounded by the provider's concurrency ceiling ───

/** Run `fn` over `items` in waves of at most `concurrency`, preserving order. */
async function runInWaves<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const wave = items.slice(i, i + concurrency)
    out.push(...(await Promise.all(wave.map(fn))))
  }
  return out
}

/**
 * Synthesize one chunk with an OWN, strongly-referenced timeout chained to a
 * caller abort signal. RECIPE.md step 5: a composite/derived AbortSignal with
 * nothing holding the timeout strongly can silently never fire in some
 * runtimes, hanging the request and starving a shared concurrency slot.
 */
async function synthesizeChunk(
  text: string,
  tier: VoiceTier,
  opts: { signal?: AbortSignal; timeoutMs: number; ttsCall: (text: string, tier: VoiceTier, signal: AbortSignal) => Promise<Buffer> },
): Promise<Buffer> {
  const ac = new AbortController()
  const onExternalAbort = () => ac.abort()
  if (opts.signal) {
    if (opts.signal.aborted) ac.abort()
    else opts.signal.addEventListener('abort', onExternalAbort, { once: true })
  }
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs) // explicit, strongly held
  try {
    return await opts.ttsCall(text, tier, ac.signal)
  } finally {
    clearTimeout(timer) // always clear — this is what makes the timeout GC-safe
    if (opts.signal) opts.signal.removeEventListener('abort', onExternalAbort)
  }
}

// ── 5. Reinject real silence at chosen boundaries, concat, normalize ──────

/**
 * Interleave chunk audio with reinjected silence, then concatenate by
 * RE-ENCODING (never raw byte-copy — RECIPE.md step 6) and fold loudness
 * normalization into that same encoding pass (step 7). `concatAndMaster`
 * is a stand-in for your own audio toolchain (e.g. an ffmpeg invocation
 * with a concat demuxer + a loudnorm filter in one pass).
 */
async function assembleFinalAudio(
  chunks: Chunk[],
  chunkAudio: Buffer[],
  deps: {
    makeSilence: (seconds: number) => Promise<Buffer>
    concatAndMaster: (buffers: Buffer[], loudnessTargetLufs: number, truePeakDb: number) => Promise<Buffer>
  },
  loudnessTargetLufs = -16,
  truePeakDb = -1.5,
): Promise<Buffer> {
  const interleaved: Buffer[] = []
  for (let i = 0; i < chunkAudio.length; i++) {
    interleaved.push(chunkAudio[i])
    const gap = chunks[i].silenceAfterSec
    if (gap > 0 && i < chunkAudio.length - 1) {
      // Stretch slightly and clamp — a proven pacing policy, not a magic number
      // you need to invent from scratch. See RECEIPTS-internal.md for the
      // exact multiplier and clamp used at origin.
      interleaved.push(await deps.makeSilence(gap))
    }
  }
  return deps.concatAndMaster(interleaved, loudnessTargetLufs, truePeakDb)
}

export { parseScript, groupIntoChunks, intraChunkText, runInWaves, synthesizeChunk, assembleFinalAudio }
export type { ScriptItem, Chunk, VoiceTier }
