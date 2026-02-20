import { NextResponse } from 'next/server';
import { updateIntegrations } from '@/lib/db';

export async function POST() {
  updateIntegrations({
    pararius: {
      status: 'not_connected',
      encryptedAuthState: null,
      connectedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
