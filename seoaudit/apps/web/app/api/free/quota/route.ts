import { NextResponse, type NextRequest } from 'next/server';
import { disabledResponse, freeError, toQuota } from '@/lib/free/http';
import { utcDay } from '@/lib/free/quota';
import { visitorKey } from '@/lib/free/visitor';
import { getUsage } from '@/lib/repositories/freeUsageRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  try {
    const now = new Date();
    const usage = await getUsage(visitorKey(request.headers), utcDay(now));
    return NextResponse.json({ quota: toQuota(usage, now) });
  } catch (error) {
    console.error('Free quota error', error);
    return freeError('SERVER_ERROR', 500);
  }
}
