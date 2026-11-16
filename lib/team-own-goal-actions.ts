"use server";

import { withAdminActivity } from "@/lib/admin-activity";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { matchTime } from "@/lib/substitutions";

export async function saveTeamOwnGoal(matchId: number, payload: { teamId: number; minute: string; extraTime: string; eventId?: number }) {
  return withAdminActivity("saveTeamOwnGoal", { matchId, payload }, async () => {
  if (!getAdminUserFromCookies(await cookies())) return { ok: false as const, error: "Please sign in to add an own goal." };
  const time = matchTime(payload.minute, payload.extraTime);
  if (!time) return { ok: false as const, error: "Enter a valid minute, such as 52 or 90+3." };
  if (![matchId, payload.teamId, ...(payload.eventId !== undefined ? [payload.eventId] : [])].every((id) => Number.isSafeInteger(id) && id > 0)) {
    return { ok: false as const, error: "Choose a team in this match." };
  }
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId }, select: { teamA: true, teamB: true } });
    const team = await prisma.team.findUnique({ where: { id: payload.teamId }, select: { name: true } });
    if (!match || !team || ![match.teamA, match.teamB].includes(team.name)) return { ok: false as const, error: "Choose a team in this match." };
    const data = { matchId, teamId: payload.teamId, personId: null, eventType: "own_goal", minute: String(time[0]), extraTime: time[1] ? String(time[1]) : null };
    const event = payload.eventId !== undefined
      ? await prisma.matchEvent.update({ where: { id: payload.eventId, matchId, personId: null, eventType: "own_goal" }, data })
      : await prisma.matchEvent.create({ data });
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath(`/admin/matches/${matchId}/delete-events`);
    return { ok: true as const, event: {
      id: event.id, personId: null, assistPersonId: null, teamId: event.teamId, eventType: event.eventType,
      minute: event.minute, extraTime: event.extraTime, goalType: null, bookingReason: null,
      substitutionId: null, substitutionReason: null, playerName: "Own goal", assistPlayerName: null, teamName: team.name,
    } };
  } catch {
    return { ok: false as const, error: "Could not save the own goal. Please try again." };
  }

  });
}
