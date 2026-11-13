import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createAdminSessionValue, getAdminSessionCookieName, GOD_ADMIN_USERNAME } from "@/lib/adminAuth";

type AdminAuthRow = {
  passwordHash: string;
  isActive: boolean;
};

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, existing] = storedHash.split(":");
  if (!salt || !existing) return false;

  const derived = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(existing, "hex");
  const b = Buffer.from(derived, "hex");
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = ((body?.username as string) || "").trim().toLowerCase();
    const password = (body?.password as string) || "";

    if (!username || !password) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const matchesConfiguredAdmin =
      !!process.env.ADMIN_USERNAME?.trim() &&
      !!process.env.ADMIN_PASSWORD &&
      username === process.env.ADMIN_USERNAME.trim().toLowerCase() &&
      password === process.env.ADMIN_PASSWORD;

    let authenticated = false;
    try {
      await ensureAdminAccountTable();

      const rows = await prisma.$queryRaw<AdminAuthRow[]>`
        SELECT "passwordHash", "isActive"
        FROM "AdminAccount"
        WHERE "username" = ${username}
        LIMIT 1
      `;

      let account = rows[0];
      if (!account && matchesConfiguredAdmin) {
        const salt = randomBytes(16).toString("hex");
        const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
        await prisma.$executeRaw`
          INSERT INTO "AdminAccount" ("username", "passwordHash", "isActive", "createdAt", "updatedAt")
          VALUES (${username}, ${passwordHash}, true, NOW(), NOW())
          ON CONFLICT ("username") DO NOTHING
        `;
        const createdRows = await prisma.$queryRaw<AdminAuthRow[]>`
          SELECT "passwordHash", "isActive" FROM "AdminAccount" WHERE "username" = ${username} LIMIT 1
        `;
        account = createdRows[0];
      }

      authenticated = !!account?.isActive && verifyPassword(password, account.passwordHash);
    } catch (error) {
      // Keep the configured administrator available during a database outage,
      // matching the legacy Basic Auth entry point in proxy.ts.
      if (!matchesConfiguredAdmin) throw error;
      authenticated = true;
    }

    if (!authenticated) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const sessionValue = createAdminSessionValue(username);
    if (!sessionValue) return NextResponse.json({ ok: false }, { status: 500 });
    const response = NextResponse.json({ ok: true, isGodAdmin: username === GOD_ADMIN_USERNAME });
    response.cookies.set(getAdminSessionCookieName(), sessionValue, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
