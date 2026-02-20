import { NextResponse } from 'next/server';
import { performAction, captureAuthState, extractEmail, closeSession, isSessionActive } from '@/lib/browserSession';
import { encrypt } from '@/lib/encryption';
import { updateIntegrations } from '@/lib/db';

export async function POST(request) {
  if (!isSessionActive()) {
    return NextResponse.json({ error: 'No active browser session' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { type, x, y, text, key, selector } = body;

  if (!type) {
    return NextResponse.json({ error: 'Missing action type' }, { status: 400 });
  }

  try {
    const result = await performAction({ type, x, y, text, key, selector });

    if (result.loginDetected) {
      // Get email captured from the login form during the login process
      const email = extractEmail();
      const storageState = await captureAuthState();
      const encryptedAuthState = encrypt(storageState);

      updateIntegrations({
        pararius: {
          status: 'connected',
          encryptedAuthState,
          connectedAt: new Date().toISOString(),
          email: email || null,
        },
      });

      await closeSession();

      return NextResponse.json({
        screenshot: result.screenshot,
        loginDetected: true,
        saved: true,
        url: result.url,
      });
    }

    return NextResponse.json({
      screenshot: result.screenshot,
      loginDetected: false,
      url: result.url,
    });
  } catch (err) {
    console.error('Action error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
