'use client';

import { signOut } from 'next-auth/react';
import { RiLogoutBoxRLine } from '@remixicon/react';

/** Cierra la sesión actual para entrar con la cuenta a la que va dirigida la invitación. */
export function InviteSignOutButton({ callbackUrl, label }: { callbackUrl: string; label: string }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => signOut({ callbackUrl })}>
      <RiLogoutBoxRLine className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
