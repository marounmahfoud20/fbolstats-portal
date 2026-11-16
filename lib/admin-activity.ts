import { cookies, headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { activityDetails } from "@/lib/activity-details";

import { recordAdminActivity, type Activity } from "@/lib/activity-log";

export async function withAdminActivity<T>(action: string, args: Record<string, unknown>, run: () => Promise<T>): Promise<T> {
  let activity: Activity | null = null;
  try {
    const username = getAdminUserFromCookies(await cookies());
    if (username) {
      const account = await prisma.adminAccount.findUnique({ where: { username }, select: { id: true } });
      const path = (await headers()).get("x-admin-activity-path");
      activity = { username, accountId: account?.id ?? null, kind: action === "logout" ? "logout" : "change", action, path, details: activityDetails(args) };
    }
  } catch {
    console.error("Could not identify administrator for activity log.");
  }

  try {
    const result = await run();
    if (activity) await recordAdminActivity({ ...activity, success: !(result && typeof result === "object" && "ok" in result && result.ok === false) });
    return result;
  } catch (error) {
    if (activity) await recordAdminActivity({ ...activity, success: isRedirectError(error) });
    throw error;
  }
}
