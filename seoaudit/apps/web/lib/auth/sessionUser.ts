import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { handler } from '@/lib/auth/auth';
import { connectToDatabase } from '@/lib/db/mongo';

/**
 * Id del usuario autenticado, o null si no hay sesión.
 * getServerSession(handler) no ejecuta el callback `session` de authConfig, así que
 * `session.user.id` puede faltar: en ese caso se resuelve por email.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = (await getServerSession(handler)) as Session | null;
  if (session?.user?.id) return session.user.id;
  if (!session?.user?.email) return null;

  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ email: session.user.email });
  return user ? user._id.toString() : null;
}
