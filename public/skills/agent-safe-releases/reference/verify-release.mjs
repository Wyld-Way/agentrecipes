// Compares what a deployment says it is running with the commit you validated.
// The health endpoint is expected to return JSON like { "environment": "production", "commit": "<sha>" }.
// Usage: node verify-release.mjs https://example.com/api/health <expected-commit>

export function checkRelease(health, expectedCommit, expectedEnvironment = 'production') {
  if (!health || typeof health !== 'object') return { ok: false, reason: 'no health response' };
  const { environment, commit } = health;
  if (typeof commit !== 'string' || commit.length < 7) return { ok: false, reason: 'health response has no commit' };
  if (environment !== expectedEnvironment) {
    return { ok: false, reason: `serving ${environment ?? 'an unknown environment'}, expected ${expectedEnvironment}` };
  }
  // Accept a short sha on either side, never an empty prefix.
  const [a, b] = [commit.toLowerCase(), String(expectedCommit ?? '').toLowerCase()];
  if (b.length < 7 || !(a.startsWith(b) || b.startsWith(a))) {
    return { ok: false, reason: `live commit ${commit} is not the validated commit ${expectedCommit}` };
  }
  return { ok: true, reason: `${expectedEnvironment} is serving ${commit}` };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  const [url, expected] = process.argv.slice(2);
  if (!url || !expected) {
    console.error('Usage: node verify-release.mjs <health-url> <expected-commit>');
    process.exit(2);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-store' } });
  const result = response.ok ? checkRelease(await response.json(), expected) : { ok: false, reason: `health endpoint returned ${response.status}` };
  console.log(`${result.ok ? 'OK' : 'FAIL'}: ${result.reason}`);
  process.exit(result.ok ? 0 : 1);
}
