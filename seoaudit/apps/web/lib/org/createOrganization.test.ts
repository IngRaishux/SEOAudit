import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/lib/models/Organization', () => ({ default: {} }));
vi.mock('@/lib/models/Membership', () => ({ default: {} }));

const { slugifyOrganizationName } = await import('./createOrganization');

describe('slugifyOrganizationName', () => {
  it('quita acentos, espacios y símbolos y agrega un sufijo único', () => {
    expect(slugifyOrganizationName("José's Hoteles  Ñandú", 123)).toBe('joses-hoteles-nandu-123');
  });

  it('usa un nombre por defecto si no queda nada', () => {
    expect(slugifyOrganizationName('!!!', 1)).toBe('org-1');
  });
});
