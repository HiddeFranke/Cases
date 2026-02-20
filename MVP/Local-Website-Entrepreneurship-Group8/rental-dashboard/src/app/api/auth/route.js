import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkCredentials } from '@/lib/auth';

const SESSION_COOKIE = 'rental_session';

export async function POST(request) {
  const body = await request.json();
  const { username, password } = body;

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
