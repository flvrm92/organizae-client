export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

export function getHighlightSegments(value: string | null | undefined, query: unknown): HighlightSegment[] {
  if (!value) {
    return [];
  }

  const terms = getTerms(query);
  if (terms.length === 0) {
    return [{ text: value, highlight: false }];
  }

  const pattern = new RegExp(`(${terms.map(term => escapeRegExp(term)).join('|')})`, 'gi');
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    const text = match[0];

    if (index > lastIndex) {
      segments.push({ text: value.slice(lastIndex, index), highlight: false });
    }

    segments.push({ text, highlight: true });
    lastIndex = index + text.length;
  }

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text: value, highlight: false }];
}

function getTerms(query: unknown): string[] {
  if (typeof query !== 'string') {
    return [];
  }

  return Array.from(new Set(
    query
      .trim()
      .split(/\s+/)
      .map(term => term.trim())
      .filter(term => term.length > 0)
      .sort((left, right) => right.length - left.length)
  ));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 