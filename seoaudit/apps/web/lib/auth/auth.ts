import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectMongoose from '@/lib/db/mongoose';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';
import { comparePasswords } from '@/lib/password';
import { connectToDatabase } from '@/lib/db/mongo';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import type { Account } from 'next-auth';

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { db } = await connectToDatabase();
          const usersCollection = db.collection('users');

          const user = await usersCollection.findOne({
            email: credentials.email as string,
          });

          if (!user) {
            return null;
          }

          const passwordMatch = await comparePasswords(
            credentials.password as string,
            user.password as string
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: User | null;
      account?: Account | null;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Resolve organizations on first sign-in
      if (token.id && !token.accountId) {
        try {
          await connectMongoose();
          const memberships = await Membership.find({ userId: token.id });

          if (memberships.length > 0) {
            const organizations = await Promise.all(
              memberships.map(async (m) => {
                const org = await Organization.findById(m.organizationId);
                return {
                  id: m.organizationId.toString(),
                  name: org?.name || 'Organization',
                };
              })
            );

            token.accountId = memberships[0].organizationId.toString();
            token.organizations = organizations;
          }
        } catch (error) {
          console.error('JWT callback - error resolving orgs:', error);
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const userId = token.id || token.sub;
        session.user.id = userId as string;

        try {
          await connectMongoose();
          const memberships = await Membership.find({ userId });

          if (memberships.length > 0) {
            const organizations = await Promise.all(
              memberships.map(async (m) => {
                const org = await Organization.findById(m.organizationId);
                return {
                  id: m.organizationId.toString(),
                  name: org?.name || 'Organization',
                };
              })
            );

            session.user.accountId = memberships[0].organizationId.toString();
            session.user.organizations = organizations;
          }
        } catch (error) {
          console.error('Session callback error:', error);
        }
      }
      return session;
    },
  },
  events: {},
};

export const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
