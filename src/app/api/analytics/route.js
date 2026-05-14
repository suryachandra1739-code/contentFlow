import { NextResponse } from 'next/server';
import { getAnalytics, getRecentActivity } from '@/lib/queries';

export async function GET() {
  const analytics = getAnalytics();
  const recentActivity = getRecentActivity(15);
  return NextResponse.json({ ...analytics, recentActivity });
}
