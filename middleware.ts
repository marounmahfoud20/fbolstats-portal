import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';

  // Only protect the backend subdomain
  if (hostname.includes('backend.fbolstats.com')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Replace these with your actual desired admin username and password!
      if (user === 'admin' && pwd === 'lebanon2026') {
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