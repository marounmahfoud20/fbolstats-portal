"use server";

import { withAdminActivity } from "@/lib/admin-activity";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { matchEventIdsToDelete } from "@/lib/match-event-deletion";

export async function deleteMatchEvents(matchId: number, eventIds: number[], appearanceIds: number[]) {
  return withAdminActivity("deleteMatchEvents", { matchId, eventIds, appearanceIds }, async () => {
  if (!getAdminUserFromCookies(await cookies())) return { ok: false as const, error: "Please sign in to delete events." };
  if (!Number.isSafeInteger(matchId) || matchId <= 0 || !Array.isArray(eventIds) || !Array.isArray(appearanceIds) ||
    [...eventIds, ...appearanceIds].some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return { ok: false as const, error: "Invalid event selection. Reload the page and try again." };
  }
  if (!eventIds.length && !appearanceIds.length) return { ok: false as const, error: "Select at least one event to delete." };

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const events = await tx.matchEvent.findMany({ where: { matchId }, select: { id: true, substitutionId: true } });
      const ids = matchEventIdsToDelete(events, eventIds);
      const removedEvents = await tx.matchEvent.deleteMany({ where: { matchId, id: { in: ids } } });
      const removedAppearances = await tx.matchAppearance.deleteMany({ where: { matchId, id: { in: appearanceIds } } });
      return removedEvents.count + removedAppearances.count;
    }, { isolationLevel: "Serializable", timeout: 15000 });
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath(`/admin/matches/${matchId}/delete-events`);
    revalidatePath(`/admin/matches/${matchId}/edit-lineups`);
    return { ok: true as const, deleted };
  } catch {
    return { ok: false as const, error: "Could not delete the selected events. Please try again." };
  }

  });
}
