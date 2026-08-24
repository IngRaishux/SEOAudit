'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/Button';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button
      onClick={handleSignOut}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      Sign out
    </Button>
  );
}
