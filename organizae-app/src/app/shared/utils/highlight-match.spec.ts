import { getHighlightSegments, HighlightSegment } from './highlight-match';

describe('getHighlightSegments', () => {
  describe('empty / null inputs', () => {
    it('returns empty array for null value', () => {
      expect(getHighlightSegments(null, 'test')).toEqual([]);
    });

    it('returns empty array for undefined value', () => {
      expect(getHighlightSegments(undefined, 'test')).toEqual([]);
    });

    it('returns single non-highlighted segment when query is empty string', () => {
      expect(getHighlightSegments('hello', '')).toEqual([
        { text: 'hello', highlight: false },
      ]);
    });

    it('returns single non-highlighted segment when query is null', () => {
      expect(getHighlightSegments('hello', null)).toEqual([
        { text: 'hello', highlight: false },
      ]);
    });

    it('returns single non-highlighted segment when query is undefined', () => {
      expect(getHighlightSegments('hello', undefined)).toEqual([
        { text: 'hello', highlight: false },
      ]);
    });
  });

  describe('basic highlighting', () => {
    it('highlights a term found at the end', () => {
      expect(getHighlightSegments('hello world', 'world')).toEqual([
        { text: 'hello ', highlight: false },
        { text: 'world', highlight: true },
      ]);
    });

    it('highlights a term found at the start', () => {
      expect(getHighlightSegments('hello world', 'hello')).toEqual([
        { text: 'hello', highlight: true },
        { text: ' world', highlight: false },
      ]);
    });

    it('highlights the entire string when the full value matches', () => {
      expect(getHighlightSegments('hello', 'hello')).toEqual([
        { text: 'hello', highlight: true },
      ]);
    });
  });

  describe('case-insensitive highlighting', () => {
    it('highlights with original casing preserved', () => {
      const result = getHighlightSegments('Hello World', 'hello');
      expect(result.find((s: HighlightSegment) => s.highlight)?.text).toBe('Hello');
    });
  });

  describe('accent-insensitive highlighting', () => {
    it('highlights accented text matched by plain query', () => {
      const result = getHighlightSegments('café', 'cafe');
      expect(result.some((s: HighlightSegment) => s.highlight)).toBe(true);
      expect(result.find((s: HighlightSegment) => s.highlight)?.text).toBe('café');
    });

    it('highlights when query has accent and value is plain', () => {
      const result = getHighlightSegments('cafe', 'café');
      expect(result.find((s: HighlightSegment) => s.highlight)?.text).toBe('cafe');
    });

    it('highlights João when queried with joao', () => {
      const result = getHighlightSegments('João Silva', 'joao');
      expect(result.find((s: HighlightSegment) => s.highlight)?.text).toBe('João');
    });
  });

  describe('multi-term highlighting', () => {
    it('highlights each matching term independently', () => {
      const result = getHighlightSegments('João Silva', 'joao silva');
      const highlighted = result
        .filter((s: HighlightSegment) => s.highlight)
        .map((s: HighlightSegment) => s.text);
      expect(highlighted).toEqual(['João', 'Silva']);
    });

    it('highlights overlapping terms as a single merged segment', () => {
      const result = getHighlightSegments('abcdef', 'abc def');
      expect(result).toEqual([{ text: 'abcdef', highlight: true }]);
    });
  });

  describe('alignment with normalize', () => {
    it('produces the same match result as matchesQuery for accent cases', () => {
      const result = getHighlightSegments('Ação', 'acao');
      expect(result.some((s: HighlightSegment) => s.highlight)).toBe(true);
    });
  });
});
