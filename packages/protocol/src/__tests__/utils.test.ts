import { stableStringify, stableHash } from '../utils';

describe('stableStringify', () => {
  it('should handle primitive types deterministically', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(undefined)).toBe('null'); // based on normalize
    expect(stableStringify(123)).toBe('123');
    expect(stableStringify('hello')).toBe('"hello"');
    expect(stableStringify(true)).toBe('true');
  });

  it('should handle Date objects deterministically', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    expect(stableStringify(date)).toBe('"2023-01-01T00:00:00.000Z"');
  });

  it('should handle arrays deterministically', () => {
    expect(stableStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(stableStringify(['a', null, undefined])).toBe('["a",null,null]');
    expect(stableStringify([{b: 2, a: 1}, {c: 3}])).toBe('[{"a":1,"b":2},{"c":3}]');
  });

  it('should sort object keys deterministically', () => {
    const obj1 = { b: 2, a: 1, c: 3 };
    const obj2 = { a: 1, c: 3, b: 2 };
    expect(stableStringify(obj1)).toBe('{"a":1,"b":2,"c":3}');
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
  });

  it('should sort nested object keys deterministically', () => {
    const obj1 = { a: { c: 3, b: 2 }, d: 4 };
    const obj2 = { d: 4, a: { b: 2, c: 3 } };
    expect(stableStringify(obj1)).toBe('{"a":{"b":2,"c":3},"d":4}');
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
  });
});

describe('stableHash', () => {
  it('should generate consistent hashes for identical objects with different key order', () => {
    const obj1 = { a: 1, b: 2, c: { d: 4, e: 5 } };
    const obj2 = { c: { e: 5, d: 4 }, b: 2, a: 1 };
    expect(stableHash(obj1)).toBe(stableHash(obj2));
  });

  it('should generate different hashes for different objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    expect(stableHash(obj1)).not.toBe(stableHash(obj2));
  });
});
