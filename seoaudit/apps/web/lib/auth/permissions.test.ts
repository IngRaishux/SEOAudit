import { describe, expect, it } from 'vitest';
import { can, isAssignableRole, type OrgAction, type OrgRole } from './permissions';

// Matriz de la propuesta: rol -> acciones permitidas
const MATRIX: Record<OrgRole, OrgAction[]> = {
  owner: ['site.read', 'crawl.run', 'content.edit', 'site.delete', 'members.manage', 'org.manage'],
  admin: ['site.read', 'crawl.run', 'content.edit', 'site.delete', 'members.manage'],
  editor: ['site.read', 'crawl.run', 'content.edit'],
  viewer: ['site.read', 'crawl.run'],
};
const ACTIONS: OrgAction[] = ['site.read', 'crawl.run', 'content.edit', 'site.delete', 'members.manage', 'org.manage'];

describe('can', () => {
  for (const [role, allowed] of Object.entries(MATRIX) as [OrgRole, OrgAction[]][]) {
    for (const action of ACTIONS) {
      const expected = allowed.includes(action);
      it(`${role} ${expected ? 'puede' : 'no puede'} ${action}`, () => {
        expect(can(role, action)).toBe(expected);
      });
    }
  }

  it('rechaza roles desconocidos o ausentes', () => {
    expect(can('member', 'site.read')).toBe(false);
    expect(can(undefined, 'site.read')).toBe(false);
    expect(can(null, 'crawl.run')).toBe(false);
  });
});

describe('isAssignableRole', () => {
  it('no permite asignar owner', () => {
    expect(isAssignableRole('owner')).toBe(false);
    expect(isAssignableRole('viewer')).toBe(true);
  });
});
