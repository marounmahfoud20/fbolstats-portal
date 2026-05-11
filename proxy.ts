import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { scryptSync, timingSafeEqual } from 'crypto';

function parseBasicAuth(header: string | null): { user: string; pwd: string } | null {
  if (!header) return null;
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep < 0) return null;
    return { user: decoded.slice(0, sep), pwd: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, existing] = storedHash.split(':');
  if (!salt || !existing) return false;

  const derived = scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(existing, 'hex');
  const b = Buffer.from(derived, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function ensureAdminAccountTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminAccount" (
      "id" SERIAL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminAccount_username_key"
      ON "AdminAccount" ("username")
  `);
}

async function verifyAdminAccountCredentials(username: string, password: string): Promise<boolean> {
  const normalized = (username || '').trim().toLowerCase();
  const pwd = (password || '').trim();
  if (!normalized || !pwd) return false;

  await ensureAdminAccountTable();
  const rows = await prisma.$queryRaw<Array<{ passwordHash: string; isActive: boolean }>>`
    SELECT "passwordHash", "isActive"
    FROM "AdminAccount"
    WHERE "username" = ${normalized}
    LIMIT 1
  `;
  const account = rows[0];
  if (!account || !account.isActive) return false;
  return verifyPassword(pwd, account.passwordHash);
}

export async function proxy(req: NextRequest) {
  const hostname = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  const pathname = req.nextUrl.pathname;
  const hasBackendSession = req.cookies.get('backend_admin_auth')?.value === '1';

  // Only protect the backend subdomain
  if (hostname === 'backend.fbolstats.com') {
    if (hasBackendSession) {
      return NextResponse.next();
    }

    // Prevent recursion for internal auth verification route.
    if (pathname.startsWith('/api/admin-auth')) {
      return NextResponse.next();
    }

    const creds = parseBasicAuth(req.headers.get('authorization'));
    if (creds) {
      const { user, pwd } = creds;

      // DB-backed admin auth (preferred)
      try {
        if (await verifyAdminAccountCredentials(user, pwd)) {
          const res = NextResponse.next();
          res.cookies.set('backend_admin_auth', '1', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 12, // 12 hours
          });
          return res;
        }
      } catch {
        // Fall back to env-based auth below if DB check fails.
      }

      // Env-based fallback
      const validUser = process.env.ADMIN_USERNAME;
      const validPwd = process.env.ADMIN_PASSWORD;
      if (validUser && validPwd && user === validUser && pwd === validPwd) {
        const res = NextResponse.next();
        res.cookies.set('backend_admin_auth', '1', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 12, // 12 hours
        });
        return res;
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
