import { NextResponse } from 'next/server';
import { getApplyScreenshot, hasActiveSession } from '@/lib/applySession';

export async function GET() {
  if (!hasActiveSession()) {
    return NextResponse.json({ active: false });
  }

  const result = await getApplyScreenshot();
  if (!result) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json(result);
}
