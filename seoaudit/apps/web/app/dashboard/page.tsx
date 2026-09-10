import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import * as siteRepository from '@/lib/repositories/siteRepository';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { getSelectedOrganization } from '@/app/actions';
import { DashboardContent } from '@/components/DashboardContent';

interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export default async function DashboardPage(props: {
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
    // No organizations, redirect to create one
    redirect('/organizations');
  }

  // Determine which organization to display
  // Priority: URL param > cookie > redirect
  let accountId: string;

  // 1. Try URL parameter first (explicit choice)
  let resolvedOrgId = selectedOrgId;

  // 2. If not in URL, try cookie (remembered choice)
  if (!resolvedOrgId) {
    const cookieOrgId = await getSelectedOrganization();
    if (cookieOrgId && memberships.some((m) => m.organizationId.toString() === cookieOrgId)) {
      // Cookie is valid, redirect to dashboard with this org
      redirect(`/dashboard?org=${cookieOrgId}`);
    }
  }

  // 3. If still no valid org, redirect to selection
  if (!resolvedOrgId) {
    redirect('/organizations');
  }

  // Validate that user is member of selected org
  const isMember = memberships.some(
    (m) => m.organizationId.toString() === resolvedOrgId
  );
  if (!isMember) {
    redirect('/organizations');
  }

  accountId = resolvedOrgId;

  // Get organization details
  const orgData = (await Organization.findById(accountId).lean()) as any;
  if (!orgData) {
    redirect('/organizations');
  }

  // Get membership for this org to check role
  const membershipData = (await Membership.findOne({
    userId: session.user.id,
    organizationId: accountId,
  }).lean()) as any;

  let sitesData: ISite[] = [];
  let total = 0;

  try {
    sitesData = (await siteRepository.listSitesByAccount(accountId, {
      limit: 20,
      skip: 0,
    })) as unknown as ISite[];
    total = await siteRepository.countSitesByAccount(accountId);
  } catch (error) {
    console.error('Error fetching sites:', error);
  }

  // Serialize Mongoose objects to plain JavaScript
  const org = JSON.parse(JSON.stringify(orgData));
  const membership = JSON.parse(JSON.stringify(membershipData));
  const sites = JSON.parse(JSON.stringify(sitesData));

  return (
    <DashboardContent
      org={org}
      membership={membership}
      sites={sites}
      total={total}
      userEmail={session.user.email || ''}
      selectedOrgId={accountId}
      membershipsCount={memberships.length}
    />
  );
}
