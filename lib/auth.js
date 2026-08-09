import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'shop_session';
const SECRET = process.env.AUTH_SECRET || 'shop-dashboard-secret-change-me';

export function signSession(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, t: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.uid;
  } catch {
    return null;
  }
}

export function setSession(userId) {
  cookies().set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export function getSessionUserId() {
  const token = cookies().get(COOKIE)?.value;
  return verifySession(token);
}

// For server components / pages: redirects to /login if not authed
export function requireAuth() {
  const uid = getSessionUserId();
  if (!uid) redirect('/login');
  return uid;
}
