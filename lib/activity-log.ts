import prisma from "@/lib/prisma";

export type Activity = { username: string; accountId?: number | null; kind: string; action: string; path?: string | null; details?: string | null; success?: boolean };

export async function recordAdminActivity(activity: Activity) {
  try {
    const accountId = activity.accountId === undefined
      ? (await prisma.adminAccount.findUnique({ where: { username: activity.username }, select: { id: true } }))?.id ?? null
      : activity.accountId;
    await prisma.adminActivityLog.create({ data: { ...activity, accountId } });
  } catch {
    // Logging must not turn a completed save into a failed save or cause retries.
    console.error("Could not record administrator activity.");
  }
}
