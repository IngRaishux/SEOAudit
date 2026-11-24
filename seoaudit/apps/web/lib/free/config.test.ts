import { describe, expect, it } from 'vitest';
import { FREE_LIMITS, freeToolsEnabled } from './config';

describe('freeToolsEnabled', () => {
  it('solo se activa con "true"', () => {
    expect(freeToolsEnabled({ FREE_TOOLS_ENABLED: 'true' })).toBe(true);
  });

  it.each([undefined, '', 'false', 'TRUE', '1', 'yes'])('%j la deja desactivada', (value) => {
    expect(freeToolsEnabled({ FREE_TOOLS_ENABLED: value })).toBe(false);
  });

  it('límites de 20 páginas de rastreo y 20 de sugerencias', () => {
    expect(FREE_LIMITS).toEqual({ crawlPages: 20, suggestions: 20 });
  });
});
