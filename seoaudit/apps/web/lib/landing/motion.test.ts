import { describe, expect, it } from 'vitest';
import { parseCountTarget } from './motion';

describe('parseCountTarget', () => {
  it.each([
    ['7', 7],
    ['0', 0],
    ['120', 120],
  ])('cuenta hasta %s', (text, value) => {
    expect(parseCountTarget(text)).toBe(value);
  });

  it.each(['JSON-LD', '', '7+', ' 7', '7 ', '1.5', '1,000'])('no cuenta %j', (text) => {
    expect(parseCountTarget(text)).toBeNull();
  });

  it('no cuenta sin texto', () => {
    expect(parseCountTarget(null)).toBeNull();
    expect(parseCountTarget(undefined)).toBeNull();
  });
});
