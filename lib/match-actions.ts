"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveMatchLineups(matchId: number, appearances: { personId: number, teamId: number, role: string }[]) {
  // Delete all existing appearances for this match that are NOT Referees
  // Referees have teamId = null
  await prisma.matchAppearance.deleteMany({
    where: { 
      matchId,
      teamId: { not: null }
    }
  });

  // Insert the new ones
  if (appearances.length > 0) {
    await prisma.matchAppearance.createMany({
      data: appearances.map(app => ({
        matchId,
        personId: app.personId,
        teamId: app.teamId,
        role: app.role
      }))
    });
  }

  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveMatchCore(
  matchId: number,
  payload: { date?: string; time?: string; status?: string; venue?: string }
) {
  await prisma.match.update({
    where: { id: matchId },
    data: {
      date: payload.date ?? undefined,
      time: payload.time ?? undefined,
      status: payload.status ?? undefined,
      venue: payload.venue ?? undefined,
    },
  });
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveGroupName(groupId: number, name: string, matchId: number) {
  await prisma.group.update({
    where: { id: groupId },
    data: { name },
  });
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveMatchReferees(
  matchId: number,
  refs: {
    mainRefereeId?: number | null;
    assistant1Id?: number | null;
    assistant2Id?: number | null;
    fourthOfficialId?: number | null;
  }
) {
  await prisma.matchAppearance.deleteMany({
    where: {
      matchId,
      teamId: null,
      role: { in: ["Main Referee", "Referee", "Assistant 1", "Assistant 2", "4th Official"] },
    },
  });

  const rows: { matchId: number; personId: number; teamId: null; role: string }[] = [];
  if (refs.mainRefereeId) rows.push({ matchId, personId: refs.mainRefereeId, teamId: null, role: "Main Referee" });
  if (refs.assistant1Id) rows.push({ matchId, personId: refs.assistant1Id, teamId: null, role: "Assistant 1" });
  if (refs.assistant2Id) rows.push({ matchId, personId: refs.assistant2Id, teamId: null, role: "Assistant 2" });
  if (refs.fourthOfficialId) rows.push({ matchId, personId: refs.fourthOfficialId, teamId: null, role: "4th Official" });

  if (rows.length > 0) {
    await prisma.matchAppearance.createMany({ data: rows });
  }

  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveMatchMeta(
  matchId: number,
  payload: {
    spectators?: string;
    ftA?: string;
    ftB?: string;
    htA?: string;
    htB?: string;
    etA?: string;
    etB?: string;
    pkA?: string;
    pkB?: string;
  }
) {
  await prisma.matchMeta.upsert({
    where: { matchId },
    create: { matchId, ...payload },
    update: payload,
  });
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveMatchEventEntry(
  matchId: number,
  payload: {
    eventId?: number | null;
    personId: number;
    assistPersonId?: number | null;
    teamId?: number | null;
    eventType: string;
    minute?: string;
    extraTime?: string;
    goalType?: string;
    bookingReason?: string;
  }
) {
  try {
    if (payload.eventId) {
      await prisma.matchEvent.update({
        where: { id: payload.eventId },
        data: {
          personId: payload.personId,
          assistPersonId: payload.assistPersonId ?? null,
          teamId: payload.teamId ?? null,
          eventType: payload.eventType,
          minute: payload.minute || null,
          extraTime: payload.extraTime || null,
          goalType: payload.goalType || null,
          bookingReason: payload.bookingReason || null,
        } as never,
      } as never);
    } else {
      await prisma.matchEvent.create({
        data: {
          matchId,
          personId: payload.personId,
          assistPersonId: payload.assistPersonId ?? null,
          teamId: payload.teamId ?? null,
          eventType: payload.eventType,
          minute: payload.minute || null,
          extraTime: payload.extraTime || null,
          goalType: payload.goalType || null,
          bookingReason: payload.bookingReason || null,
        } as never,
      } as never);
    }
  } catch {
    if (payload.eventId) {
      await prisma.matchEvent.update({
        where: { id: payload.eventId },
        data: {
          personId: payload.personId,
          teamId: payload.teamId ?? null,
          eventType: payload.eventType,
          minute: payload.minute || null,
          extraTime: payload.extraTime || null,
        },
      });
    } else {
      await prisma.matchEvent.create({
        data: {
          matchId,
          personId: payload.personId,
          teamId: payload.teamId ?? null,
          eventType: payload.eventType,
          minute: payload.minute || null,
          extraTime: payload.extraTime || null,
        },
      });
    }
  }
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function saveMatchShirtNumber(matchId: number, personId: number, number: string) {
  await prisma.matchShirtNumber.upsert({
    where: { matchId_personId: { matchId, personId } },
    create: { matchId, personId, number },
    update: { number },
  });
  revalidatePath(`/admin/matches/${matchId}`);
}
