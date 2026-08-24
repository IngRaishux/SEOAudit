import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accountId?: string;
      organizationName?: string;
      role?: 'owner' | 'admin' | 'member';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accountId?: string;
    organizationName?: string;
    role?: 'owner' | 'admin' | 'member';
  }
}
