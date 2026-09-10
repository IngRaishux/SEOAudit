import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import connectMongoose from '@/lib/db/mongoose';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

export const runtime = 'nodejs';

/**
 * GET /api/migrations/session-schema
 *
 * Verifies and displays information about the session schema migration.
 * This endpoint checks:
 * - All users have proper organizations array in their sessions
 * - Membership relationships are valid
 * - Organization data is properly structured
 */
export async function GET(request: Request) {
  const session = await getServerSession(handler);

  // Only allow admins or during development
  if (!session?.user?.email || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoose();

    // Get all memberships
    const memberships = await Membership.find().lean();

    // Get all organizations
    const organizations = await Organization.find().lean();

    // Verify data integrity
    let validMemberships = 0;
    let invalidMemberships = 0;
    let userOrgMap = new Map<string, Array<{ id: string; name: string }>>();
    let invalidMembershipsList = [];

    for (const membership of memberships) {
      const org = organizations.find(
        (o) => (o._id as any).toString() === (membership.organizationId as any).toString()
      );

      if (!org) {
        invalidMemberships++;
        invalidMembershipsList.push({
          userId: membership.userId,
          organizationId: (membership.organizationId as any).toString(),
          reason: 'Organization does not exist',
        });
        continue;
      }

      validMemberships++;

      // Build the organizations array for each user
      if (!userOrgMap.has(membership.userId)) {
        userOrgMap.set(membership.userId, []);
      }

      const userOrgs = userOrgMap.get(membership.userId)!;
      userOrgs.push({
        id: (org._id as any).toString(),
        name: org.name,
      });
    }

    // Verify organization data structure
    let validOrgs = 0;
    let missingFieldsOrgs = [];

    for (const org of organizations) {
      if (!org.name || !org.slug || !org.createdByUserId) {
        missingFieldsOrgs.push({
          id: (org._id as any).toString(),
          name: org.name,
          slug: org.slug,
          createdByUserId: org.createdByUserId,
        });
        continue;
      }
      validOrgs++;
    }

    // Build example organizations for response
    let exampleUsers = [];
    let exampleCount = 0;
    for (const [userId, orgs] of userOrgMap) {
      if (exampleCount >= 3) break;
      exampleUsers.push({
        userId,
        organizations: orgs,
      });
      exampleCount++;
    }

    return NextResponse.json({
      status: 'success',
      migration: {
        newSessionSchema: {
          type: 'object',
          properties: {
            organizations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  name: 'string',
                },
              },
            },
            accountId: 'string (first organization ID)',
          },
        },
      },
      summary: {
        totalMemberships: memberships.length,
        validMemberships,
        invalidMemberships,
        totalOrganizations: organizations.length,
        validOrganizations: validOrgs,
        organizationsWithMissingFields: missingFieldsOrgs.length,
        totalUsersWithOrganizations: userOrgMap.size,
      },
      details: {
        invalidMemberships: invalidMembershipsList,
        organizationsWithMissingFields: missingFieldsOrgs,
        exampleUsers,
      },
    });
  } catch (error) {
    console.error('Migration verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/migrations/session-schema
 *
 * Cleans up invalid memberships (optional admin action)
 */
export async function POST(request: Request) {
  const session = await getServerSession(handler);

  // Only allow in development or if explicitly enabled
  if (!session?.user?.email || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup-invalid-memberships') {
      await connectMongoose();

      const memberships = await Membership.find().lean();
      const organizations = await Organization.find().lean();

      let deletedCount = 0;
      const validationResults = [];

      for (const membership of memberships) {
        const orgExists = organizations.some(
          (o) => (o._id as any).toString() === (membership.organizationId as any).toString()
        );

        if (!orgExists) {
          await Membership.deleteOne({ _id: membership._id });
          deletedCount++;
          validationResults.push({
            memberId: (membership._id as any).toString(),
            userId: membership.userId,
            organizationId: (membership.organizationId as any).toString(),
            action: 'deleted',
          });
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Cleanup completed: ${deletedCount} invalid memberships removed`,
        deletedMemberships: deletedCount,
        details: validationResults,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Migration cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
