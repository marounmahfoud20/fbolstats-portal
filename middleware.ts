import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // Only protect the backend subdomain
  if (hostname.includes('backend.fbolstats.com')) {
    // Prevent recursion for internal auth verification route.
    if (pathname.startsWith('/api/admin-auth')) {
      return NextResponse.next();
    }

    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue || '').split(':');

      // DB-backed admin auth (preferred)
      try {
        const verifyUrl = new URL('/api/admin-auth', req.url);
        const verifyRes = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: user, password: pwd }),
          cache: 'no-store',
        });

        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as { ok?: boolean };
          if (data?.ok) {
            return NextResponse.next();
          }
        }
      } catch {
        // Fall back to env-based auth below if DB check fails.
      }

      // Env-based fallback
      const validUser = process.env.ADMIN_USERNAME;
      const validPwd = process.env.ADMIN_PASSWORD;
      if (validUser && validPwd && user === validUser && pwd === validPwd) {
        return NextResponse.next();
      }
    }

    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Let all regular traffic to fbolstats.com pass through normally
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
