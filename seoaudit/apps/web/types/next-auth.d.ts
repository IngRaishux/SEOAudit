import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizations?: Array<{
        id: string;
        name: string;
      }>;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    organizations?: Array<{
      id: string;
      name: string;
    }>;
  }
}
