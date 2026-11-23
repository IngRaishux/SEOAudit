import { describe, expect, it } from 'vitest';
import {
  canChangeRole,
  canDelete,
  canLeave,
  canRemove,
  canStartTransfer,
  canTransfer,
  type MemberRef,
} from './memberRules';

const owner: MemberRef = { userId: 'o', role: 'owner' };
const admin: MemberRef = { userId: 'a', role: 'admin' };
const admin2: MemberRef = { userId: 'a2', role: 'admin' };
const editor: MemberRef = { userId: 'e', role: 'editor' };
const viewer: MemberRef = { userId: 'v', role: 'viewer' };

describe('canChangeRole', () => {
  it('un admin puede ascender a un editor a admin', () => {
    expect(canChangeRole(admin, editor, 'admin')).toEqual({ ok: true });
  });
  it('un admin puede degradar a otro admin', () => {
    expect(canChangeRole(admin, admin2, 'viewer')).toEqual({ ok: true });
  });
  it('un admin no puede cambiar el rol del owner', () => {
    expect(canChangeRole(admin, owner, 'viewer')).toEqual({ ok: false, code: 'CANNOT_MODIFY_OWNER' });
  });
  it('nadie puede asignar owner con el cambio de rol', () => {
    expect(canChangeRole(owner, admin, 'owner')).toEqual({ ok: false, code: 'USE_TRANSFER' });
  });
  it('rechaza roles desconocidos', () => {
    expect(canChangeRole(owner, editor, 'member')).toEqual({ ok: false, code: 'INVALID_ROLE' });
  });
  it('nadie cambia su propio rol', () => {
    expect(canChangeRole(admin, admin, 'editor')).toEqual({ ok: false, code: 'CANNOT_CHANGE_SELF' });
  });
  it('editor y viewer no gestionan miembros', () => {
    expect(canChangeRole(editor, viewer, 'editor')).toEqual({ ok: false, code: 'NOT_ALLOWED' });
    expect(canChangeRole(viewer, editor, 'viewer')).toEqual({ ok: false, code: 'NOT_ALLOWED' });
  });
});

describe('canRemove', () => {
  it('un admin quita a un viewer', () => {
    expect(canRemove(admin, viewer)).toEqual({ ok: true });
  });
  it('un admin no puede quitar al owner', () => {
    expect(canRemove(admin, owner)).toEqual({ ok: false, code: 'CANNOT_MODIFY_OWNER' });
  });
  it('quitarse a uno mismo se hace saliendo', () => {
    expect(canRemove(admin, admin)).toEqual({ ok: false, code: 'USE_LEAVE' });
  });
  it('un editor no puede quitar a nadie', () => {
    expect(canRemove(editor, viewer)).toEqual({ ok: false, code: 'NOT_ALLOWED' });
  });
});

describe('canLeave', () => {
  it('cualquier miembro que no es owner puede salir', () => {
    expect(canLeave(editor, 3)).toEqual({ ok: true });
    expect(canLeave(admin, 2)).toEqual({ ok: true });
  });
  it('el owner con otros miembros debe transferir primero', () => {
    expect(canLeave(owner, 3)).toEqual({ ok: false, code: 'OWNER_MUST_TRANSFER' });
  });
  it('el owner solo debe borrar la organización', () => {
    expect(canLeave(owner, 1)).toEqual({ ok: false, code: 'OWNER_MUST_DELETE' });
  });
});

describe('canDelete', () => {
  it('el owner borra si es el único miembro', () => {
    expect(canDelete(owner, 1)).toEqual({ ok: true });
  });
  it('no se borra con otros miembros, cualquiera sea su rol', () => {
    expect(canDelete(owner, 2)).toEqual({ ok: false, code: 'HAS_MEMBERS' });
  });
  it('solo el owner borra', () => {
    expect(canDelete(admin, 1)).toEqual({ ok: false, code: 'NOT_ALLOWED' });
  });
});

describe('transferencia', () => {
  it('sin admins no se puede iniciar', () => {
    expect(canStartTransfer(owner, 0)).toEqual({ ok: false, code: 'NO_ADMINS' });
    expect(canStartTransfer(owner, 1)).toEqual({ ok: true });
  });
  it('solo a un admin', () => {
    expect(canTransfer(owner, admin)).toEqual({ ok: true });
    expect(canTransfer(owner, editor)).toEqual({ ok: false, code: 'TARGET_NOT_ADMIN' });
  });
  it('solo el owner transfiere', () => {
    expect(canTransfer(admin, admin2)).toEqual({ ok: false, code: 'NOT_ALLOWED' });
    expect(canStartTransfer(admin, 2)).toEqual({ ok: false, code: 'NOT_ALLOWED' });
  });
  it('el destino debe ser otro miembro', () => {
    expect(canTransfer(owner, owner)).toEqual({ ok: false, code: 'INVALID_TARGET' });
    expect(canTransfer(owner, null)).toEqual({ ok: false, code: 'INVALID_TARGET' });
  });
});
