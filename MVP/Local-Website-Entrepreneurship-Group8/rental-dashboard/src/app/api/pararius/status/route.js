import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db';

export async function GET() {
  const user = getUser();
  const pararius = user?.integrations?.pararius || {};

  return NextResponse.json({
    status: pararius.status || 'not_connected',
    connectedAt: pararius.connectedAt || null,
    email: pararius.email || null,
  });
}
