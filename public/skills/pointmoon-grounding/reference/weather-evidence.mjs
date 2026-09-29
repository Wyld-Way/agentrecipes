// Narrow consumer-side adapter for the documented public field-truth@1.x envelope.
// Not Pointmoon's private inference, scoring or provider implementation.
export function weatherEvidence(packet, now = Date.now()) {
  const unavailable = (reason) => ({ status: 'unavailable', reason });
  if (typeof packet?.schemaVersion !== 'string' || !packet.schemaVersion.startsWith('field-truth@1.')) return unavailable('unsupported_schema');
  const reading = packet.facts?.fieldSnapshot?.weather?.current;
  if (!reading || reading.silent === true || reading.provider === 'unresolved') return unavailable('missing_reading');
  if (typeof reading.source !== 'string' || !reading.source.trim()) return unavailable('missing_source');
  if (typeof reading.observedAt !== 'string') return unavailable('invalid_time');
  const observed = Date.parse(reading.observedAt);
  if (!Number.isFinite(now) || !Number.isFinite(observed) || observed > now) return unavailable('invalid_time');
  if (!Number.isFinite(reading.ttlMinutes) || reading.ttlMinutes <= 0 || now - observed >= reading.ttlMinutes * 60000) return unavailable('stale_or_missing_ttl');
  if (!Number.isFinite(reading.temperatureC)) return unavailable('missing_temperature');
  return {
    status: 'available', temperatureC: reading.temperatureC, source: reading.source,
    observedAt: reading.observedAt, ttlMinutes: reading.ttlMinutes,
    epistemicType: reading.epistemicType ?? 'unspecified',
    notices: packet.notices ?? null,
  };
}
