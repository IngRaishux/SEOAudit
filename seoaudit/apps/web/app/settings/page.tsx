import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { OrganizationSettings } from '@/components/OrganizationSettings';

export default async function SettingsPage() {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Resolve accountId if missing
  if (!session.user.accountId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email: session.user.email });

      if (!user) {
        redirect('/login');
      }

      await connectMongoose();
      const membership = await Membership.findOne({ userId: user._id.toString() });

      if (membership) {
        const org = await Organization.findById(membership.organizationId);
        session.user.id = user._id.toString();
        session.user.accountId = membership.organizationId.toString();
        session.user.organizationName = org?.name || 'Organization';
        session.user.role = membership.role as any;
      } else {
        redirect('/login');
      }
    } catch (error) {
      console.error('Error resolving accountId:', error);
      redirect('/login');
    }
  }

  if (!session.user.accountId) {
    redirect('/login');
  }

  // Fetch organization details
  await connectMongoose();
  const org = await Organization.findById(session.user.accountId).lean();

  // Get user's membership to check role
  const membership = await Membership.findOne({
    userId: session.user.id,
    organizationId: session.user.accountId,
  }).lean();

  if (!org || !membership) {
    redirect('/login');
  }

  const isOwner = membership.role === 'owner';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Organization</h2>
          </div>

          <div className="p-6">
            {isOwner ? (
              <OrganizationSettings
                organizationId={session.user.accountId}
                organizationName={org.name}
              />
            ) : (
              <div className="text-zinc-600 dark:text-zinc-400">
                <p className="mb-2">Organization Name: <span className="font-semibold text-zinc-900 dark:text-white">{org.name}</span></p>
                <p className="text-sm">Only the organization owner can change the organization name.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mt-6">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</p>
                <p className="text-zinc-900 dark:text-white font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Email</p>
                <p className="text-zinc-900 dark:text-white font-medium">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Role</p>
                <p className="text-zinc-900 dark:text-white font-medium capitalize">{membership.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
