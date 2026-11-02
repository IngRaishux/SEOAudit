import connectMongoose from '@/lib/db/mongoose';
import BusinessProfile from '@/lib/models/BusinessProfile';
import type { BusinessProfileData, ProfileInput } from '@/lib/geo/profile';

export type StoredBusinessProfile = BusinessProfileData & {
  _id: string;
  acceptedIdRewrites: Record<string, string>;
};

export async function getProfile(organizationId: string, origin: string) {
  await connectMongoose();
  return BusinessProfile.findOne({ organizationId, origin }).lean<StoredBusinessProfile>();
}

export async function createProfile(data: BusinessProfileData) {
  await connectMongoose();
  const saved = await new BusinessProfile(data).save();
  return saved.toObject() as StoredBusinessProfile;
}

export async function upsertProfile(organizationId: string, origin: string, data: ProfileInput) {
  await connectMongoose();
  return BusinessProfile.findOneAndUpdate(
    { organizationId, origin },
    { $set: { ...data, organizationId, origin } },
    { new: true, upsert: true }
  ).lean<StoredBusinessProfile>();
}

export async function setAcceptedIdRewrites(
  organizationId: string,
  origin: string,
  rewrites: Record<string, string>
) {
  await connectMongoose();
  return BusinessProfile.findOneAndUpdate(
    { organizationId, origin },
    { $set: { acceptedIdRewrites: rewrites } },
    { new: true }
  ).lean<StoredBusinessProfile>();
}
