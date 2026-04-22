import { matchesQuery, normalize, removeAccents } from './string-utils';

describe('removeAccents', () => {
  it('removes accent marks from accented characters', () => {
    expect(removeAccents('café')).toBe('cafe');
    expect(removeAccents('Ação')).toBe('Acao');
    expect(removeAccents('João')).toBe('Joao');
  });

  it('leaves plain ASCII strings unchanged', () => {
    expect(removeAccents('hello')).toBe('hello');
    expect(removeAccents('123')).toBe('123');
  });
});

describe('normalize', () => {
  it('lowercases and removes accents', () => {
    expect(normalize('CAFÉ')).toBe('cafe');
    expect(normalize('João')).toBe('joao');
    expect(normalize('Ação')).toBe('acao');
  });

  it('returns an already-normalized string unchanged', () => {
    expect(normalize('hello world')).toBe('hello world');
  });
});

describe('matchesQuery', () => {
  describe('empty / null inputs', () => {
    it('returns true when query is empty string', () => {
      expect(matchesQuery('anything', '')).toBe(true);
    });

    it('returns true when query is null', () => {
      expect(matchesQuery('anything', null)).toBe(true);
    });

    it('returns true when query is undefined', () => {
      expect(matchesQuery('anything', undefined)).toBe(true);
    });

    it('returns true when query is whitespace only', () => {
      expect(matchesQuery('anything', '   ')).toBe(true);
    });

    it('returns false when value is empty string', () => {
      expect(matchesQuery('', 'test')).toBe(false);
    });

    it('returns false when value is null', () => {
      expect(matchesQuery(null, 'test')).toBe(false);
    });

    it('returns false when value is undefined', () => {
      expect(matchesQuery(undefined, 'test')).toBe(false);
    });
  });

  describe('accent-insensitive matching', () => {
    it('matches accented value with plain query', () => {
      expect(matchesQuery('café', 'cafe')).toBe(true);
    });

    it('matches plain value with accented query', () => {
      expect(matchesQuery('cafe', 'café')).toBe(true);
    });

    it('matches Ação with acao', () => {
      expect(matchesQuery('Ação', 'acao')).toBe(true);
    });
  });

  describe('case-insensitive matching', () => {
    it('matches uppercase value with lowercase query', () => {
      expect(matchesQuery('Hello World', 'hello')).toBe(true);
    });

    it('matches lowercase value with uppercase query', () => {
      expect(matchesQuery('hello world', 'WORLD')).toBe(true);
    });
  });

  describe('multi-term AND semantics', () => {
    it('returns true when all terms match', () => {
      expect(matchesQuery('João Silva', 'joao silva')).toBe(true);
    });

    it('returns false when at least one term does not match', () => {
      expect(matchesQuery('João Silva', 'joao santos')).toBe(false);
    });

    it('returns true for a single matching term', () => {
      expect(matchesQuery('Smartphone Pro', 'smart')).toBe(true);
    });
  });

  describe('substring matching', () => {
    it('matches a term that appears in the middle of the value', () => {
      expect(matchesQuery('Arroz integral', 'integr')).toBe(true);
    });

    it('returns false when term is not a substring', () => {
      expect(matchesQuery('Arroz', 'feijao')).toBe(false);
    });
  });
});
