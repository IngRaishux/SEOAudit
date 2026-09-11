import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import clientPromise from '@/lib/db/mongo';
import { hashPassword } from '@/lib/password';
import connectMongoose from '@/lib/db/mongoose';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().optional(),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, password, organizationName } = registerSchema.parse(body);

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DB_NAME);
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();

    // Create organization only if organizationName is provided
    let organizationId = null;
    if (organizationName) {
      await connectMongoose();
      const org = new Organization({
        name: organizationName,
        slug: `${organizationName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        createdByUserId: userId,
      });
      const savedOrg = await org.save();
      organizationId = savedOrg._id;

      // Create membership
      const membership = new Membership({
        userId,
        organizationId: savedOrg._id,
        role: 'owner',
      });
      await membership.save();
    }

    return NextResponse.json(
      { id: result.insertedId, email, name, organizationId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
