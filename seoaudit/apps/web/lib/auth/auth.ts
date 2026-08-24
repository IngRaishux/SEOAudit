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

      // Resolve organization and membership on first sign-in
      if (token.id && !token.accountId) {
        try {
          await connectMongoose();
          const membership = await Membership.findOne({ userId: token.id });

          if (membership) {
            const org = await Organization.findById(membership.organizationId);
            token.accountId = membership.organizationId.toString();
            token.organizationName = org?.name || 'Organization';
            token.role = membership.role;
          }
        } catch (error) {
          console.error('JWT callback - error resolving org:', error);
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.accountId = token.accountId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.role = token.role as 'owner' | 'admin' | 'member';
      }
      return session;
    },
  },
  events: {
    async signIn({
      user,
      account,
    }: {
      user: User;
      account: Account | null;
    }) {
      // Only create org on Credentials provider first sign-in (not Google)
      if (account?.provider !== 'credentials') return;

      try {
        await connectMongoose();
        const existing = await Membership.findOne({ userId: user.id });

        if (!existing) {
          const displayName = user.name || user.email || 'User';
          const org = new Organization({
            name: `${displayName}'s Organization`,
            slug: `${displayName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            createdByUserId: user.id,
          });
          const savedOrg = await org.save();

          const membership = new Membership({
            userId: user.id,
            organizationId: savedOrg._id,
            role: 'owner',
          });
          await membership.save();
        }
      } catch (error) {
        console.error('Error creating organization on sign-in:', error);
      }
    },
  },
};

export const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
