import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/sessionUser';
import connectMongoose from '@/lib/db/mongoose';
import UserSettings from '@/lib/models/UserSettings';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoose();

    const settings = (await UserSettings.findOne({ userId }).lean()) ?? {
      theme: 'system',
      language: 'en',
      emailNotifications: true,
      weeklyReport: true,
    };

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
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, language, emailNotifications, weeklyReport } = body;

    await connectMongoose();

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      {
        userId,
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
