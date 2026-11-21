import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import prisma from '@/lib/prisma';
import { scryptSync, timingSafeEqual } from 'crypto';
import { createAdminSessionValue, getAdminSessionCookieName, readAdminUserFromSessionValue } from '@/lib/adminAuth';
import { recordAdminActivity } from '@/lib/activity-log';

function parseBasicAuth(header: string | null): { user: string; pwd: string } | null {
  const match = header?.match(/^Basic\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    return sep < 0 ? null : { user: decoded.slice(0, sep), pwd: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

function normalizeUsername(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, existing] = storedHash.split(':');
  if (!salt || !existing) return false;
  const a = Buffer.from(existing, 'hex');
  const b = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyAdminAccountCredentials(username: string, password: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (!normalized || !password) return false;
  const rows = await prisma.$queryRaw<Array<{ passwordHash: string; isActive: boolean }>>`
    SELECT "passwordHash", "isActive" FROM "AdminAccount" WHERE "username" = ${normalized} LIMIT 1
  `;
  const account = rows[0];
  return !!account?.isActive && verifyPassword(password, account.passwordHash);
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;
  const cookieName = getAdminSessionCookieName();
  const sessionUser = readAdminUserFromSessionValue(req.cookies.get(cookieName)?.value);
  const isLoginPath = pathname === '/login' || pathname.startsWith('/login/');
  const isLoginApi = pathname === '/api/admin-auth';
  const isNextAsset = pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname === '/robots.txt'
    || pathname === '/favicon-orange.png' || pathname === '/Logo-minimal-orange.png';

  const authorizedResponse = (username: string, signedIn = false) => {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-admin-activity-path', pathname);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (signedIn) event.waitUntil(recordAdminActivity({ username, kind: 'login', action: 'Sign in', path: '/login' }));
    if (req.method === 'GET' && pathname.startsWith('/admin') && !req.headers.get('purpose')?.includes('prefetch') && !req.headers.get('sec-purpose')?.includes('prefetch')) {
      event.waitUntil(recordAdminActivity({ username, kind: 'page_view', action: 'Open page', path: pathname }));
    }
    return response;
  };

  if (isLoginPath || isLoginApi || isNextAsset) {
    if (sessionUser && isLoginPath) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (sessionUser) return authorizedResponse(sessionUser);

  // Keep the legacy backend Basic Auth entry point, while issuing the same site session.
  const hostname = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  if (hostname === 'backend.fbolstats.com') {
    const creds = parseBasicAuth(req.headers.get('authorization'));
    if (creds) {
      try {
        if (await verifyAdminAccountCredentials(creds.user, creds.pwd)) {
          const sessionValue = createAdminSessionValue(creds.user);
          const response = authorizedResponse(normalizeUsername(creds.user), true);
          if (sessionValue) response.cookies.set(cookieName, sessionValue, {
            httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12,
          });
          return response;
        }
      } catch {
        // Continue to the shared login page if the database is unavailable.
      }
      const envUser = normalizeUsername(process.env.ADMIN_USERNAME);
      const envPassword = process.env.ADMIN_PASSWORD || '';
      if (envUser && envPassword && normalizeUsername(creds.user) === envUser && creds.pwd === envPassword) {
        const sessionValue = createAdminSessionValue(creds.user);
        const response = authorizedResponse(normalizeUsername(creds.user), true);
        if (sessionValue) response.cookies.set(cookieName, sessionValue, {
          httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12,
        });
        return response;
      }
    }
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
