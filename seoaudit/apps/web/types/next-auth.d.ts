import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      accountId: string;
      organizationName: string;
      role: 'owner' | 'admin' | 'member';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accountId: string;
    organizationName: string;
    role: 'owner' | 'admin' | 'member';
  }
}
