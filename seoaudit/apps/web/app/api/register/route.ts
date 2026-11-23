import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import clientPromise from '@/lib/db/mongo';
import { hashPassword } from '@/lib/password';
import { createOrganizationWithOwner } from '@/lib/org/createOrganization';
import { hasPendingInvitation } from '@/lib/invitations/service';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().optional(),
});

export const runtime = 'nodejs';

// `code` permite al cliente traducir el error sin depender del texto en inglés de `error`
export type RegisterErrorCode = 'EMAIL_IN_USE' | 'VALIDATION_ERROR' | 'SERVER_ERROR';

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
        { error: 'Email already in use', code: 'EMAIL_IN_USE' satisfies RegisterErrorCode },
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

    // Solo se crea organización si se pidió y el email no llega por una invitación:
    // quien fue invitado entra directo a la organización que lo invitó
    let organizationId = null;
    if (organizationName && !(await hasPendingInvitation(email))) {
      const { organization } = await createOrganizationWithOwner(organizationName, userId);
      organizationId = organization._id;
    }

    return NextResponse.json(
      { id: result.insertedId, email, name, organizationId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR' satisfies RegisterErrorCode, details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' satisfies RegisterErrorCode, details: errorMessage },
      { status: 500 }
    );
  }
}
