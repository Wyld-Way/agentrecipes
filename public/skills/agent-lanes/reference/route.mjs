// Routes a task to the one agent whose charter owns it. A charter is
// { name, owns: [keywords], notMine: [{ keywords: [...], owner }] }.
// Matching is plain keyword matching so you can read why a task went where it did.

const words = (text) => String(text).toLowerCase();
const hits = (task, keywords) => keywords.filter((keyword) => words(task).includes(words(keyword)));

export function route(task, charters) {
  const claims = charters
    .map((charter) => ({ name: charter.name, matched: hits(task, charter.owns ?? []) }))
    .filter((claim) => claim.matched.length > 0);

  // An agent that explicitly hands this kind of work to a neighbour does not claim it.
  const owners = claims.filter((claim) => {
    const charter = charters.find((candidate) => candidate.name === claim.name);
    return !(charter.notMine ?? []).some((rule) => hits(task, rule.keywords).length > 0);
  });

  if (owners.length === 1) return { status: 'routed', owner: owners[0].name, because: owners[0].matched };
  if (owners.length === 0) {
    const referred = charters.flatMap((charter) => (charter.notMine ?? [])
      .filter((rule) => hits(task, rule.keywords).length > 0).map((rule) => rule.owner));
    const known = [...new Set(referred)].filter((name) => charters.some((charter) => charter.name === name));
    if (known.length === 1) return { status: 'routed', owner: known[0], because: ['referred by a neighbour'] };
    return { status: 'unowned', owner: null, because: [] };
  }
  return { status: 'overlap', owner: null, because: owners.map((claim) => claim.name) };
}
