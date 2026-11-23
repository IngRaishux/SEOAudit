import connectMongoose from '@/lib/db/mongoose';
import Organization, { type IOrganization } from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';

export function slugifyOrganizationName(name: string, now = Date.now()): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'org'}-${now}`;
}

/** Crea una organización y deja a `userId` como su único owner. */
export async function createOrganizationWithOwner(name: string, userId: string) {
  await connectMongoose();
  const organization = await Organization.create({
    name: name.trim(),
    slug: slugifyOrganizationName(name),
    createdByUserId: userId,
  });

  try {
    const membership = await Membership.create({
      userId,
      organizationId: organization._id,
      role: 'owner',
    });
    return { organization: organization.toObject() as IOrganization, membership };
  } catch (error) {
    // Sin membresía la organización quedaría huérfana
    await Organization.deleteOne({ _id: organization._id });
    throw error;
  }
}
