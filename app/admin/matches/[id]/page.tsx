import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchDetailsEditor from "./MatchDetailsEditor";
import EditLineupForm from "./edit-lineups/EditLineupForm";

export default async function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);

  if (isNaN(matchId)) notFound();

  const match = await prisma.match.findUnique({
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
          team: true,
        },
      },
      shirts: true,
    },
  });

  if (!match) {
    return (
      <div className="min-h-screen bg-white p-10 font-bold text-red-600 flex justify-center pt-20">
        404 - Match not found in database.
      </div>
    );
  }

  const genderIcon = match.group.season.league.type.includes("Women") || match.group.season.league.type.includes("Girls") ? "F" : "M";
  const [teamAData, teamBData, refereePeople, venues] = await Promise.all([
    prisma.team.findFirst({
      where: { name: match.teamA },
      include: {
        memberships: {
          include: { person: true },
        },
      },
    }),
    prisma.team.findFirst({
      where: { name: match.teamB },
      include: {
        memberships: {
          include: { person: true },
        },
      },
    }),
    prisma.person.findMany({
      where: { isReferee: "yes" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        commonName: true,
      },
      orderBy: [{ commonName: "asc" }, { lastName: "asc" }],
    }),
    prisma.venue.findMany({
      where: { status: "active" },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

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

      <MatchDetailsEditor
        match={{
          id: match.id,
          groupId: match.groupId,
          teamA: match.teamA,
          teamB: match.teamB,
          date: match.date,
          time: match.time,
          status: match.status,
          venue: match.venue,
          roundName: match.group.name,
          teamALogo: teamAData?.logo || null,
          teamBLogo: teamBData?.logo || null,
        }}
        initialMeta={match.meta}
        initialEvents={match.events.map((e: {
          id: number;
          personId: number;
          assistPersonId?: number | null;
          teamId: number | null;
          eventType: string;
          minute: string | null;
          extraTime: string | null;
          goalType?: string | null;
          bookingReason?: string | null;
          person: { id: number; firstName: string | null; lastName: string | null; commonName: string | null };
          team: { name: string } | null;
        }) => ({
          id: e.id,
          personId: e.personId,
          teamId: e.teamId,
          eventType: e.eventType,
          minute: e.minute,
          extraTime: e.extraTime,
          assistPersonId: e.assistPersonId ?? null,
          assistPlayerName: null,
          goalType: e.goalType ?? null,
          bookingReason: e.bookingReason ?? null,
          playerName: e.person.commonName || `${e.person.firstName || ""} ${e.person.lastName || ""}`.trim() || `Player ${e.personId}`,
          teamName: e.team?.name || null,
        }))}
        initialShirts={Object.fromEntries(match.shirts.map((s) => [s.personId, s.number || ""]))}
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
          matchId={matchId}
          matchDate={match.date}
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
