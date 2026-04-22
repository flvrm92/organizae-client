import { normalize } from './string-utils';

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

  const normalizedValue = normalize(value);
  const normalizedTerms = terms.map(t => normalize(t));
  const highlights = new Array<boolean>(value.length).fill(false);

  for (const term of normalizedTerms) {
    let pos = 0;
    while ((pos = normalizedValue.indexOf(term, pos)) !== -1) {
      for (let i = pos; i < pos + term.length; i++) {
        highlights[i] = true;
      }
      pos += 1;
    }
  }

  const segments: HighlightSegment[] = [];
  let i = 0;
  while (i < value.length) {
    const isHighlight = highlights[i];
    let j = i + 1;
    while (j < value.length && highlights[j] === isHighlight) {
      j++;
    }
    segments.push({ text: value.slice(i, j), highlight: isHighlight });
    i = j;
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
