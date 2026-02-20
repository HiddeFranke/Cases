import { NextResponse } from 'next/server';
import { startSession, closeSession, isSessionActive } from '@/lib/browserSession';

export async function POST() {
  try {
    if (isSessionActive()) {
      await closeSession();
    }
    const result = await startSession();
    if (!result) {
      return NextResponse.json({ error: 'Failed to start browser session' }, { status: 500 });
    }
    return NextResponse.json({
      screenshot: result.screenshot,
      loginDetected: result.loginDetected,
      url: result.url,
    });
  } catch (err) {
    console.error('Connect error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  await closeSession();
  return NextResponse.json({ ok: true });
}
