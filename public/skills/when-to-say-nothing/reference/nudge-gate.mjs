// Decides whether a proactive assistant may interrupt right now. Rules run
// before any model is asked. The result is always a decision and its reason.

const MINUTE = 60 * 1000;

export function nudgeGate(moment, {
  minGapMinutes = 90,
  dailyLimit = 2,
  quietHours = [22, 7],        // from 22:00 until 07:00 local
  dismissalBackoff = 2,        // each recent dismissal multiplies the gap
} = {}) {
  const { now, localHour, lastNudgeAt = null, nudgesToday = 0, recentDismissals = 0, busy = false, signal = null } = moment;
  const silent = (reason) => ({ speak: false, reason });

  const [from, until] = quietHours;
  const quiet = from > until ? (localHour >= from || localHour < until) : (localHour >= from && localHour < until);
  if (quiet) return silent('quiet-hours');
  if (busy) return silent('person-is-busy');
  if (nudgesToday >= dailyLimit) return silent('daily-limit');

  const gap = minGapMinutes * MINUTE * dismissalBackoff ** recentDismissals;
  if (lastNudgeAt !== null && now - lastNudgeAt < gap) return silent('too-soon');

  // Speaking needs a specific recorded signal, never just elapsed time.
  if (!signal || typeof signal.kind !== 'string' || typeof signal.observedAt !== 'number') return silent('no-signal');
  if (now - signal.observedAt > 30 * MINUTE) return silent('stale-signal');

  return { speak: true, reason: signal.kind };
}
