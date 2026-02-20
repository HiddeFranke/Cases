import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'rental_session';
const SESSION_VALUE = 'authenticated';

export function checkCredentials(username, password) {
  return (
    username === process.env.APP_USERNAME &&
    password === process.env.APP_PASSWORD
  );
}

export async function setSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function requireAuth() {
  const authenticated = await getSession();
  if (!authenticated) {
    redirect('/login');
  }
}
