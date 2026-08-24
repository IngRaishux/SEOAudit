import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { Header } from '@/components/Header';
import { OrganizationSelector } from '@/components/OrganizationSelector';
import { getSelectedOrganization } from '@/app/actions';

export async function HeaderWithOrganizations() {
  const session = await getServerSession(handler);

  if (!session?.user?.email) {
    return <Header />;
  }

  // Get user ID
  let userId = session.user.id;
  if (!userId) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      return <Header />;
    }
    userId = user._id.toString();
  }

  // Get user's organizations
  await connectMongoose();
  const memberships = await Membership.find({ userId })
    .populate('organizationId')
    .lean();

  const organizations = memberships
    .map((m: any) => ({
      id: m.organizationId._id.toString(),
      name: m.organizationId.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get selected organization from cookie
  const selectedOrgId = await getSelectedOrganization();
  const currentOrgId =
    selectedOrgId && organizations.some((o) => o.id === selectedOrgId)
      ? selectedOrgId
      : organizations[0]?.id;

  const currentOrgName = organizations.find((o) => o.id === currentOrgId)?.name;

  return (
    <div>
      {organizations.length > 0 && (
        <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-8 py-2">
          <OrganizationSelector
            organizations={organizations}
            currentOrgId={currentOrgId}
          />
        </div>
      )}
      <Header currentOrganization={currentOrgName} />
    </div>
  );
}
