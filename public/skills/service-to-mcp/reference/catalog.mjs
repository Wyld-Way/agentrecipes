// Synthetic read-only service. No access to a database, network or private files.
export const records = Object.freeze([
  Object.freeze({ id: 'exhibit-1', title: 'Seeds on the move', published: true }),
  Object.freeze({ id: 'exhibit-2', title: 'The life of a pond', published: true }),
]);
export function listItems({ limit = 5 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error('limit must be an integer from 1 to 10');
  return { items: records.slice(0, limit).map(({ id, title }) => ({ id, title })) };
}
export function getItem({ id }) {
  if (typeof id !== 'string' || !/^exhibit-\d+$/.test(id)) throw new Error('Invalid item ID');
  const item = records.find((item) => item.id === id);
  return item ? { status: 'found', item: { id: item.id, title: item.title } } : { status: 'not_found', id };
}
