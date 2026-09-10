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

export default async function OrganizationSettingsPage(props: {
  searchParams: Promise<{ org?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedOrgId = searchParams.org;

  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

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

  const memberships = await Membership.find({ userId: session.user.id }).lean();

  if (memberships.length === 0) {
    redirect('/organizations');
  }

  let accountId: string;

  if (!selectedOrgId) {
    accountId = memberships[0].organizationId.toString();
  } else {
    const isMember = memberships.some(
      (m) => m.organizationId.toString() === selectedOrgId
    );
    if (!isMember) {
      redirect('/settings/organization');
    }
    accountId = selectedOrgId;
  }

  const org = (await Organization.findById(accountId).lean()) as any;

  if (!org) {
    redirect('/settings/organization');
  }

  const membership = (await Membership.findOne({
    userId: session.user.id,
    organizationId: accountId,
  }).lean()) as any;

  if (!membership || !org) {
    redirect('/settings/organization');
  }

  const isOwner = membership.role === 'owner';

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      {memberships.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6">
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Select Organization
            </label>
            <select
              defaultValue={accountId}
              onChange={(e) => {
                window.location.href = `/settings/organization?org=${e.target.value}`;
              }}
              className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-full"
            >
              {memberships.map((m: any) => (
                <option key={m._id?.toString()} value={(m.organizationId as any).toString()}>
                  {org?.name || 'Organization'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Organization Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Organization Settings</h2>
        </div>

        <div className="p-6">
          {isOwner ? (
            <OrganizationSettings
              organizationId={accountId}
              organizationName={org.name}
            />
          ) : (
            <div className="text-zinc-600 dark:text-zinc-400">
              <p className="mb-2">
                Organization Name: <span className="font-semibold text-zinc-900 dark:text-white">{org.name}</span>
              </p>
              <p className="text-sm">Only the organization owner can change the organization name.</p>
            </div>
          )}
        </div>
      </div>

      {/* Organization Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Organization Information</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</p>
              <p className="text-zinc-900 dark:text-white font-medium">{org.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Your Role</p>
              <p className="text-zinc-900 dark:text-white font-medium capitalize">{membership.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
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
  );
}
