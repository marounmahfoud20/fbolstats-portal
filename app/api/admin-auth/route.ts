import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scryptSync, timingSafeEqual } from "crypto";

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
    const password = ((body?.password as string) || "").trim();

    if (!username || !password) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await ensureAdminAccountTable();

    const rows = await prisma.$queryRaw<AdminAuthRow[]>`
      SELECT "passwordHash", "isActive"
      FROM "AdminAccount"
      WHERE "username" = ${username}
      LIMIT 1
    `;

    const account = rows[0];
    if (!account || !account.isActive) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const ok = verifyPassword(password, account.passwordHash);
    return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
