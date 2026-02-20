import { NextResponse } from 'next/server';
import { getScreenshot, isSessionActive } from '@/lib/browserSession';

export async function GET() {
  if (!isSessionActive()) {
    return NextResponse.json({ active: false });
  }

  try {
    const result = await getScreenshot();
    if (!result) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json({
      active: true,
      screenshot: result.screenshot,
      loginDetected: result.loginDetected,
      url: result.url,
    });
  } catch (err) {
    return NextResponse.json({ active: false, error: err.message });
  }
}
