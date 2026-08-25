import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { DeleteOrganizationDialog } from '@/components/DeleteOrganizationDialog';

export default async function SettingsPage(props: {
  searchParams: Promise<{ org?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedOrgId = searchParams.org;

  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get user ID
  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      redirect('/login');
    }
    session.user.id = user._id.toString();
  }

  await connectMongoose();

  // Get all organizations for this user
  const memberships = await Membership.find({ userId: session.user.id }).lean();

  if (memberships.length === 0) {
    redirect('/organizations');
  }

  // Determine which organization to display
  let accountId: string;

  if (!selectedOrgId) {
    // No org selected, use the first one
    accountId = memberships[0].organizationId.toString();
  } else {
    // Validate that user is member of selected org
    const isMember = memberships.some(
      (m) => m.organizationId.toString() === selectedOrgId
    );
    if (!isMember) {
      redirect('/settings');
    }
    accountId = selectedOrgId;
  }

  // Fetch organization details
  const org = (await Organization.findById(accountId).lean()) as any;

  if (!org) {
    redirect('/settings');
  }

  // Get user's membership to check role
  const membership = (await Membership.findOne({
    userId: session.user.id,
    organizationId: accountId,
  }).lean()) as any;

  if (!membership || !org) {
    redirect('/settings');
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
                organizationId={accountId}
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

        {isOwner && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900 mt-6">
            <div className="p-6 border-b border-red-200 dark:border-red-900">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                ⚠️ Danger Zone
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                    Once you delete an organization, there is no going back. Please be certain.
                  </p>
                  <DeleteOrganizationDialog
                    organizationId={accountId}
                    organizationName={org.name}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
