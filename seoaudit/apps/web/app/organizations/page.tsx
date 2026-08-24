import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import Link from 'next/link';
import { CreateOrganizationForm } from '@/components/CreateOrganizationForm';

export default async function OrganizationsPage() {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get user ID
  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (user) {
      session.user.id = user._id.toString();
    } else {
      redirect('/login');
    }
  }

  // Get all organizations for this user
  await connectMongoose();
  const memberships = await Membership.find({ userId: session.user.id })
    .populate('organizationId')
    .lean();

  const organizations = memberships.map((m: any) => ({
    id: m.organizationId._id.toString(),
    name: m.organizationId.name,
    role: m.role,
    createdAt: m.organizationId.createdAt,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Organizations</h1>

        {/* Create Organization Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Create New Organization</h2>
          </div>
          <div className="p-6">
            <CreateOrganizationForm userId={session.user.id} />
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">
              Your Organizations ({organizations.length})
            </h2>
          </div>

          {organizations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                You haven't created any organizations yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {organizations.map((org: any) => (
                <div
                  key={org.id}
                  className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {org.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Role: <span className="capitalize">{org.role}</span>
                    </p>
                  </div>
                  <Link
                    href={`/dashboard?org=${org.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Select
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
