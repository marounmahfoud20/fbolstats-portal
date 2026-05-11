import { createHmac, timingSafeEqual } from "crypto";

export const GOD_ADMIN_USERNAME = "maroun1996";
const SESSION_COOKIE = "backend_admin_session";

function normalizeUsername(username: string): string {
  return (username || "").trim().toLowerCase();
}

function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  return secret.trim() ? secret : null;
}

function signUsername(username: string, secret: string): string {
  return createHmac("sha256", secret).update(username).digest("hex");
}

export function createAdminSessionValue(username: string): string | null {
  const normalized = normalizeUsername(username);
  const secret = getSessionSecret();
  if (!normalized || !secret) return null;
  const sig = signUsername(normalized, secret);
  return `${normalized}.${sig}`;
}

export function readAdminUserFromSessionValue(sessionValue: string | null | undefined): string | null {
  if (!sessionValue) return null;
  const dot = sessionValue.lastIndexOf(".");
  if (dot <= 0) return null;

  const username = sessionValue.slice(0, dot);
  const providedSig = sessionValue.slice(dot + 1);
  const normalized = normalizeUsername(username);
  if (!normalized || !providedSig) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const expectedSig = signUsername(normalized, secret);
  const a = Buffer.from(expectedSig, "hex");
  const b = Buffer.from(providedSig, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return normalized;
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function getAdminUserFromCookies(cookieStore: CookieReader): string | null {
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  return readAdminUserFromSessionValue(value);
}

export function isGodAdmin(user: string | null | undefined): boolean {
  return normalizeUsername(user || "") === GOD_ADMIN_USERNAME;
}

export function getAdminSessionCookieName(): string {
  return SESSION_COOKIE;
}
