"use server";

import { withAdminActivity } from "@/lib/admin-activity";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getAdminUserFromCookies } from "@/lib/adminAuth";
import { isSubstitutionIn, matchTime, playersOnField } from "@/lib/substitutions";
import { getEditionShirtNumbers } from "@/lib/edition-shirt-numbers";

class SubstitutionValidationError extends Error {}

export async function saveMatchNote(matchId: number, _previous: unknown, formData: FormData) {
  return withAdminActivity("saveMatchNote", { matchId }, async () => {
    if (!getAdminUserFromCookies(await cookies())) return { ok: false as const, error: "Please sign in to save this note." };
    const text = formData.get("note");
    if (!Number.isSafeInteger(matchId) || matchId <= 0 || typeof text !== "string") {
      return { ok: false as const, error: "Could not read the match note." };
    }

    const note = text.trim() ? text.replace(/\r\n?/g, "\n") : null;
    try {
      await prisma.match.update({ where: { id: matchId }, data: { note }, select: { id: true } });
    } catch (error) {
      console.error("Could not save match note.", error);
      return { ok: false as const, error: "Could not save the note. Please try again." };
    }

    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath("/admin/teams/[id]/matches", "page");
    revalidatePath("/admin/rounds/[id]", "page");
    revalidatePath("/admin/leagues/[id]/[seasonId]/[groupId]/matches", "page");
    revalidatePath("/admin/national-teams/[gender]/matches", "page");
    revalidatePath("/admin/people/[id]/membership/[membershipId]", "page");
    return { ok: true as const, note };
  });
}

export async function saveMatchSubstitution(matchId: number, payload: {
  substitutionId?: string;
  teamId: number;
  incomingPersonId: number;
  outgoingPersonId: number;
  minute: string;
  extraTime: string;
  reason?: string;
}) {
  return withAdminActivity("saveMatchSubstitution", { matchId, payload }, async () => {
  if (!getAdminUserFromCookies(await cookies())) return { ok: false as const, error: "Please sign in to save substitutions." };
  const time = matchTime(payload.minute, payload.extraTime);
  const reason = payload.reason?.trim() || "";
  if (!time) return { ok: false as const, error: "Enter a valid minute, such as 65 or 90+3." };
  if (reason.length > 300) return { ok: false as const, error: "The substitution reason must be at most 300 characters." };
  if (![matchId, payload.teamId, payload.incomingPersonId, payload.outgoingPersonId].every((id) => Number.isSafeInteger(id) && id > 0)) {
    return { ok: false as const, error: "Choose both players for the substitution." };
  }
  try {
    const events = await prisma.$transaction(async (tx) => {
      const appearances = await tx.matchAppearance.findMany({ where: { matchId, teamId: payload.teamId } });
      const existing = await tx.matchEvent.findMany({ where: { matchId, teamId: payload.teamId } });
      const pair = payload.substitutionId ? existing.filter((event) => event.substitutionId === payload.substitutionId) : [];
      if (payload.substitutionId && (pair.length !== 2 || !pair.some((event) => event.eventType === "sub_in") || !pair.some((event) => event.eventType === "sub_out"))) {
        throw new SubstitutionValidationError("This substitution no longer exists. Reload the match and try again.");
      }
      const incoming = appearances.find((a) => a.personId === payload.incomingPersonId && a.role.toLowerCase() === "substitute");
      const outgoing = appearances.find((a) => a.personId === payload.outgoingPersonId && ["starter", "substitute"].includes(a.role.toLowerCase()));
      if (!incoming || !outgoing || incoming.personId === outgoing.personId) {
        throw new SubstitutionValidationError("Choose a substitute and a different player from the same team.");
      }
      if (existing.some((event) => event.personId === incoming.personId && isSubstitutionIn(event.eventType) && (!payload.substitutionId || event.substitutionId !== payload.substitutionId))) {
        throw new SubstitutionValidationError("This substitute already has a substitution recorded.");
      }
      const onField = playersOnField(appearances, existing, payload.teamId, time, payload.substitutionId);
      if (!onField.has(outgoing.personId) || onField.has(incoming.personId)) {
        throw new SubstitutionValidationError("Choose a player who is on the field at that minute.");
      }
      const substitutionId = payload.substitutionId || randomUUID();
      const common = { matchId, teamId: payload.teamId, substitutionId, substitutionReason: reason || null, minute: String(time[0]), extraTime: time[1] ? String(time[1]) : null };
      const saved = [];
      for (const [eventType, personId] of [["sub_out", outgoing.personId], ["sub_in", incoming.personId]] as const) {
        const previous = pair.find((event) => event.eventType === eventType);
        const data = { ...common, eventType, personId };
        saved.push(previous
          ? await tx.matchEvent.update({ where: { id: previous.id }, data, include: { person: true, team: true } })
          : await tx.matchEvent.create({ data, include: { person: true, team: true } }));
      }
      return saved.map((event) => ({
        id: event.id, personId: event.personId, teamId: event.teamId, eventType: event.eventType,
        minute: event.minute, extraTime: event.extraTime, substitutionId: event.substitutionId,
        substitutionReason: event.substitutionReason, goalType: event.goalType, bookingReason: event.bookingReason,
        assistPersonId: null, assistPlayerName: null,
        playerName: event.person?.commonName || `${event.person?.firstName || ""} ${event.person?.lastName || ""}`.trim() || `Player ${event.personId}`,
        teamName: event.team?.name || null,
      }));
    }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 15000 });
    revalidatePath(`/admin/matches/${matchId}`);
    return { ok: true as const, events };
  } catch (error) {
    return { ok: false as const, error: error instanceof SubstitutionValidationError ? error.message : "Could not save the substitution. Please try again." };
  }

  });
}

export async function saveMatchLineups(
  matchId: number,
  appearances: { personId: number; teamId: number; role: string }[],
  shirts: { personId: number; number: string }[] = [],
) {
  return withAdminActivity("saveMatchLineups", { matchId, appearances }, async () => {
    if (!getAdminUserFromCookies(await cookies())) throw new Error("Unauthorized");
    if (!Number.isSafeInteger(matchId) || matchId <= 0 || !Array.isArray(appearances) || !Array.isArray(shirts)) {
      throw new Error("Invalid lineup");
    }
    if (appearances.some(a => !Number.isSafeInteger(a.personId) || a.personId <= 0 || !Number.isSafeInteger(a.teamId) || a.teamId <= 0 || typeof a.role !== "string" || !a.role.trim())) {
      throw new Error("Invalid lineup appearance");
    }
    if (shirts.some(s => !Number.isSafeInteger(s.personId) || typeof s.number !== "string" || !/^\d{0,3}$/.test(s.number.trim()))) {
      throw new Error("Shirt numbers must contain up to three digits");
    }
    await prisma.$transaction(async tx => {
      const match = await tx.match.findUnique({ where: { id: matchId }, include: { group: true, shirts: true } });
      if (!match) throw new Error("Match not found");
      const teams = await tx.team.findMany({ where: { name: { in: [match.teamA, match.teamB] } }, select: { id: true } });
      if (appearances.some(a => !teams.some(t => t.id === a.teamId))) throw new Error("Choose players from the match teams");
      const players = appearances.filter(a => a.role === "Starter" || a.role === "Substitute");
      if (new Set(players.map(a => a.personId)).size !== players.length) throw new Error("A player can only have one lineup role");
      if (shirts.some(s => !players.some(p => p.personId === s.personId))) throw new Error("Only lineup players can have shirt numbers saved here");
      const defaults = await getEditionShirtNumbers(tx, {
        matchId, seasonId: match.group.seasonId, date: match.date, teamIds: teams.map(t => t.id),
      });
      // Save the entire draft atomically, preserving referee assignments.
      await tx.matchAppearance.deleteMany({ where: { matchId, teamId: { not: null } } });
      if (appearances.length) await tx.matchAppearance.createMany({ data: appearances.map(a => ({ ...a, matchId })) });
      const numbers = players.flatMap(player => {
        const override = shirts.find(s => s.personId === player.personId);
        const existing = match.shirts.find(s => s.personId === player.personId);
        const number = override ? override.number.trim() : existing ? existing.number : defaults[`${player.teamId}-${player.personId}`];
        return number == null ? [] : [{ matchId, personId: player.personId, number }];
      });
      // One batch read/write keeps full lineups within the transaction timeout.
      if (numbers.length) {
        await tx.matchShirtNumber.deleteMany({ where: { matchId, personId: { in: numbers.map(s => s.personId) } } });
        await tx.matchShirtNumber.createMany({ data: numbers });
      }
    }, { maxWait: 10000, timeout: 15000 });
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath(`/admin/matches/${matchId}/edit-lineups`);
  });
}

export async function saveMatchCore(
  matchId: number,
  payload: { date?: string; time?: string; status?: string; venue?: string }
) {
  return withAdminActivity("saveMatchCore", { matchId, payload }, async () => {
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

  });
}

export async function saveGroupName(groupId: number, name: string, matchId: number) {
  return withAdminActivity("saveGroupName", { groupId, name, matchId }, async () => {
  await prisma.group.update({
    where: { id: groupId },
    data: { name },
  });
  revalidatePath(`/admin/matches/${matchId}`);

  });
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
  return withAdminActivity("saveMatchReferees", { matchId, refs }, async () => {
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

  });
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
  return withAdminActivity("saveMatchMeta", { matchId, payload }, async () => {
  await prisma.matchMeta.upsert({
    where: { matchId },
    create: { matchId, ...payload },
    update: payload,
  });
  revalidatePath(`/admin/matches/${matchId}`);

  });
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
  return withAdminActivity("saveMatchEventEntry", { matchId, payload }, async () => {
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

  });
}

export async function saveMatchShirtNumber(matchId: number, personId: number, number: string) {
  return withAdminActivity("saveMatchShirtNumber", { matchId, personId, number }, async () => {
  await prisma.matchShirtNumber.upsert({
    where: { matchId_personId: { matchId, personId } },
    create: { matchId, personId, number },
    update: { number },
  });
  revalidatePath(`/admin/matches/${matchId}`);

  });
}
