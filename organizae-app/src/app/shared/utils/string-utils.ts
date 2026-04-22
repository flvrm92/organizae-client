export function removeAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Normalize a string for client-side search: lowercase + accent removal. */
export function normalize(value: string): string {
  return removeAccents(value.toLowerCase());
}

/**
 * Returns true if every whitespace-separated term in query appears as a
 * substring of value (case- and accent-insensitive).
 * An empty or absent query always returns true.
 * A null/undefined value always returns false.
 */
export function matchesQuery(
  value: string | null | undefined,
  query: string | null | undefined,
): boolean {
  if (!value) return false;
  if (!query || !query.trim()) return true;
  const normalizedValue = normalize(value);
  const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
  return terms.every(term => normalizedValue.includes(normalize(term)));
}
