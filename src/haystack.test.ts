import { isRef, parseRef } from 'haystack';

// Just a stub test
describe('haystack test', () => {
  it('isRef', () => {
    expect(isRef('@abc')).toBe(true);
    expect(isRef('@abc 123')).toBe(true);
    expect(isRef('@abc 123 abc')).toBe(true);
    expect(isRef('abc 123')).toBe(false);
    expect(isRef('abc @123')).toBe(false);
  });

  it('parseRef', () => {
    expect(parseRef('@abc')).toStrictEqual({ id: '@abc', dis: null });
    expect(parseRef('@abc "123"')).toStrictEqual({ id: '@abc', dis: '123' });
    expect(parseRef('@abc "123 abc"')).toStrictEqual({ id: '@abc', dis: '123 abc' });
  });
});
