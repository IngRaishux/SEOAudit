import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import connectMongoose from '@/lib/db/mongoose';
import UserSettings from '@/lib/models/UserSettings';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(handler);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoose();

    let settings = await UserSettings.findOne({ userId: session.user.id }).lean();

    if (!settings) {
      settings = {
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        weeklyReport: true,
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(handler);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, language, emailNotifications, weeklyReport } = body;

    await connectMongoose();

    const settings = await UserSettings.findOneAndUpdate(
      { userId: session.user.id },
      {
        userId: session.user.id,
        theme: theme || 'system',
        language: language || 'en',
        emailNotifications:
          emailNotifications !== undefined ? emailNotifications : true,
        weeklyReport: weeklyReport !== undefined ? weeklyReport : true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
