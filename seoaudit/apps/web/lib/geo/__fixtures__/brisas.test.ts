import { describe, expect, it } from 'vitest';
import { acapulcoPageHtml, brisasOrganization, brisasResort } from './brisas';

describe('fixtures de Las Brisas', () => {
  it('se pueden importar y la página embebe ambos bloques', () => {
    expect(brisasResort['@type']).toBe('Resort');
    expect(brisasOrganization['@type']).toBe('Organization');
    expect(acapulcoPageHtml.match(/application\/ld\+json/g)).toHaveLength(2);
  });
});
