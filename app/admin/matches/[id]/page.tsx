import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Match", "match", { nameOnly: true });

import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchDetailsEditor from "./MatchDetailsEditor";
import EditLineupForm from "./edit-lineups/EditLineupForm";
import { isDatabaseConnectionError, retryDatabaseRead } from "@/lib/database-read";
import { getEditionShirtNumbers, getMatchShirtNumbers } from "@/lib/edition-shirt-numbers";

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    return await renderMatchDetails({ params });
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    const { id } = await params;
    return (
      <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-bold">Match temporarily unavailable</h1>
        <p className="mt-2">The database connection failed while loading this match. Please try again.</p>
        <a href={`/admin/matches/${encodeURIComponent(id)}`} className="mt-4 inline-block rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white">
          Retry loading match
        </a>
      </div>
    );
  }
}

async function renderMatchDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);

  if (isNaN(matchId)) notFound();

  const match = await retryDatabaseRead(() => prisma.match.findUnique({
    where: { id: matchId },
    include: {
      group: {
        include: {
          season: {
            include: {
              league: true,
            },
          },
        },
      },
      appearances: {
        include: {
          person: true,
          team: true,
        },
      },
      meta: true,
      events: {
        include: {
          person: true,
          assistPerson: true,
          team: true,
        },
      },
      shirts: true,
    },
  }));

  if (!match) {
    return (
      <div className="min-h-screen bg-white p-10 font-bold text-red-600 flex justify-center pt-20">
        404 - Match not found in database.
      </div>
    );
  }

  const genderIcon = match.group.season.league.type.includes("Women") || match.group.season.league.type.includes("Girls") ? "F" : "M";
  const [teamAData, teamBData, refereePeople, venues] = await Promise.all([
    retryDatabaseRead(() => prisma.team.findFirst({
      where: { name: match.teamA },
      include: {
        memberships: {
          include: { person: true },
        },
      },
    })),
    retryDatabaseRead(() => prisma.team.findFirst({
      where: { name: match.teamB },
      include: {
        memberships: {
          include: { person: true },
        },
      },
    })),
    retryDatabaseRead(() => prisma.person.findMany({
      where: { isReferee: "yes" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        commonName: true,
      },
      orderBy: [{ commonName: "asc" }, { lastName: "asc" }],
    })),
    retryDatabaseRead(() => prisma.venue.findMany({
      where: { status: "active" },
      select: { name: true },
      orderBy: { name: "asc" },
    })),
  ]);

  const suggestedShirts = await retryDatabaseRead(() => getEditionShirtNumbers(prisma, {
    matchId, seasonId: match.group.seasonId, date: match.date,
    teamIds: [teamAData?.id, teamBData?.id].filter((id): id is number => id != null),
  }));
  const displayedShirts = getMatchShirtNumbers(match.appearances, match.shirts, suggestedShirts);

  return (
    <div className="min-h-screen bg-white text-[#040f4f] pb-20 font-sans text-[13px] p-4">
      <div className="flex items-center w-full h-[30px] border border-[#B40404] rounded-[8px] bg-[#dfdfdf] font-bold px-[10px] mb-2.5 shadow-sm text-sm">
        <span className="mr-[5px] flex items-center">FB {genderIcon}</span>
        <div className="w-[600px] whitespace-nowrap overflow-hidden text-ellipsis">
          <Link href={`/admin/leagues/${match.group.season.leagueId}`} className="hover:underline">
            {match.group.season.league.competitionName}
          </Link>
          {" - "}
          <Link href={`/admin/seasons/${match.group.seasonId}`} className="hover:underline">
            {match.group.season.name}
          </Link>
          {" - "}
          <Link href={`/admin/rounds/${match.groupId}`} className="hover:underline">
            {match.group.name}
          </Link>
        </div>
      </div>

      <div className="mb-3 flex justify-end">
        <Link href={`/admin/matches/${matchId}/delete-events`} className="rounded border border-red-800 bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800">
          Delete Events
        </Link>
      </div>

      <MatchDetailsEditor
        match={{
          id: match.id,
          groupId: match.groupId,
          teamA: match.teamA,
          teamB: match.teamB,
          teamAId: teamAData?.id ?? null,
          teamBId: teamBData?.id ?? null,
          date: match.date,
          time: match.time,
          status: match.status,
          venue: match.venue,
          roundName: match.group.name,
          teamALogo: teamAData?.logo || null,
          teamBLogo: teamBData?.logo || null,
        }}
        initialMeta={match.meta}
        initialNote={match.note}
        initialEvents={match.events.map((e: {
          id: number;
          personId: number | null;
          assistPersonId?: number | null;
          teamId: number | null;
          eventType: string;
          minute: string | null;
          extraTime: string | null;
          goalType?: string | null;
          bookingReason?: string | null;
          substitutionId: string | null;
          substitutionReason: string | null;
          person: { id: number; firstName: string | null; lastName: string | null; commonName: string | null } | null;
          assistPerson?: { id: number; firstName: string | null; lastName: string | null; commonName: string | null } | null;
          team: { name: string } | null;
        }) => ({
          id: e.id,
          personId: e.personId,
          teamId: e.teamId,
          eventType: e.eventType,
          minute: e.minute,
          extraTime: e.extraTime,
          assistPersonId: e.assistPersonId ?? null,
          assistPlayerName: e.assistPerson
            ? e.assistPerson.commonName || `${e.assistPerson.firstName || ""} ${e.assistPerson.lastName || ""}`.trim() || `Player ${e.assistPerson.id}`
            : null,
          goalType: e.goalType ?? null,
          bookingReason: e.bookingReason ?? null,
          substitutionId: e.substitutionId,
          substitutionReason: e.substitutionReason,
          playerName: e.person?.commonName || `${e.person?.firstName || ""} ${e.person?.lastName || ""}`.trim() || "Own goal",
          teamName: e.team?.name || null,
        }))}
        initialShirts={displayedShirts}
        refereeOptions={refereePeople.map((p) => ({
          id: p.id,
          name: p.commonName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Referee ${p.id}`,
        }))}
        appearances={match.appearances.map((a) => ({
          id: a.id,
          role: a.role,
          teamId: a.teamId,
          teamName: a.team?.name || null,
          teamLogo: a.team?.logo || null,
          person: {
            id: a.person.id,
            firstName: a.person.firstName,
            lastName: a.person.lastName,
            commonName: a.person.commonName,
            position: a.person.position,
            nationality: a.person.nationality,
          },
        }))}
        venueOptions={venues.map((v) => v.name)}
      />

      <div className="mt-4 border border-[#B40404] bg-[#040f4f] text-white p-4">
        <EditLineupForm
          key={matchId}
          matchId={matchId}
          matchDate={match.date}
          initialShirts={Object.fromEntries(match.shirts.map((shirt) => [shirt.personId, shirt.number || ""]))}
          suggestedShirts={suggestedShirts}
          teamA={teamAData}
          teamB={teamBData}
          existingAppearances={match.appearances.map((a) => ({
            personId: a.personId,
            teamId: a.teamId,
            role: a.role,
          }))}
        />
      </div>
    </div>
  );
}
