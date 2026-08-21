import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import clientPromise from '@/lib/db/mongo';
import connectMongoose from '@/lib/db/mongoose';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';
import { comparePasswords } from '@/lib/password';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectMongoose();

          const mongoClient = await clientPromise;
          const db = mongoClient.db(process.env.MONGODB_DB_NAME);
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
            id: user._id?.toString() || '',
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id;
      }

      if (trigger === 'signIn' || trigger === 'update' || !(token as any).accountId) {
        try {
          await connectMongoose();

          const membership = await Membership.findOne({
            userId: token.id || token.sub,
          }).sort({ createdAt: 1 });

          if (membership) {
            const org = await Organization.findById(membership.organizationId);
            (token as any).accountId = membership.organizationId.toString();
            (token as any).organizationName = org?.name || 'My Organization';
            (token as any).role = membership.role;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id || token.sub || '';
        session.user.accountId = (token as any).accountId;
        session.user.organizationName = (token as any).organizationName;
        session.user.role = (token as any).role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await connectMongoose();

        const org = new Organization({
          name: `${user.name}'s Organization`,
          slug: `${user.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          createdByUserId: user.id,
        });
        const savedOrg = await org.save();

        const membership = new Membership({
          userId: user.id,
          organizationId: savedOrg._id,
          role: 'owner',
        });
        await membership.save();
      } catch (error) {
        console.error('Error creating organization and membership:', error);
      }
    },
  },
});
