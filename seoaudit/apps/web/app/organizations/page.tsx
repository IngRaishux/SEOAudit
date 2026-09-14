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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

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

  if (organizations.length === 0) {
    // New user: show only create form
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base-content/70 mb-8">
                Get started by naming your first organization.
              </p>
              <CreateOrganizationForm userId={session.user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Existing user: show all organizations
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-8">Select Organization</h1>

        <div className="space-y-6">
          {/* Organizations List Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                Your Organizations ({organizations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="divide-y divide-base-300">
                {organizations.map((org: any) => (
                  <div
                    key={org.id}
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-base-200/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-base-content">
                        {org.name}
                      </h3>
                      <p className="text-sm text-base-content/70 mt-1">
                        Role: <span className="capitalize font-medium text-base-content">{org.role}</span>
                      </p>
                    </div>
                    <Link
                      href={`/dashboard?org=${org.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Select
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Organization Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateOrganizationForm userId={session.user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
