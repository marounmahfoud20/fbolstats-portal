import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MatchRow = {
  id: number;
  date: string | null;
  time: string | null;
  teamA: string;
  teamB: string;
  venue: string | null;
  status: string;
  roundName: string;
  seasonName: string;
  competitionName: string;
};

export default async function TeamMatchesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(teamId)) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, logo: true, gender: true },
  });
  if (!team) notFound();

  const matches = await prisma.$queryRaw<MatchRow[]>`
    SELECT
      m."id",
      m."date",
      m."time",
      m."teamA",
      m."teamB",
      m."venue",
      m."status",
      g."name" AS "roundName",
      s."name" AS "seasonName",
      l."competitionName" AS "competitionName"
    FROM "Match" m
    INNER JOIN "Group" g ON g."id" = m."groupId"
    INNER JOIN "Season" s ON s."id" = g."seasonId"
    INNER JOIN "League" l ON l."id" = s."leagueId"
    WHERE m."teamA" = ${team.name} OR m."teamB" = ${team.name}
    ORDER BY m."date" DESC NULLS LAST, m."time" DESC NULLS LAST, m."id" DESC
  `;

  const genderIcon =
    (team.gender || "").toLowerCase().includes("female") ? "♀" :
    (team.gender || "").toLowerCase().includes("male") ? "♂" : "⚽";

  return (
    <div className="min-h-screen bg-white p-6 text-[#040f4f]">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-2">
          <Link href={`/admin/teams/${team.id}`} className="text-sm font-bold text-[#f4a01c] hover:underline">
            ← Back To Team Details
          </Link>
        </div>

        <div className="mb-5 border border-[#040f4f] bg-[#f4a01c] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base font-bold text-[#040f4f] sm:text-lg">
              {genderIcon} List Of Matches - {team.name}
            </h1>
            {team.logo ? <img src={team.logo} alt={team.name} className="h-8 object-contain sm:h-10" /> : null}
          </div>
        </div>

        <div className="mb-3 border border-[#040f4f] bg-[#f2f2f2] p-2 font-bold text-[#040f4f]">
          Matches ({matches.length})
        </div>

        <div className="overflow-x-auto border border-[#040f4f] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="h-9 border-b border-[#040f4f] bg-[#f2f2f2] text-[#040f4f]">
              <tr>
                <th className="w-12 px-2 text-center">ID</th>
                <th className="w-44 px-2">Competition</th>
                <th className="hidden w-28 px-2 lg:table-cell">Season</th>
                <th className="hidden w-36 px-2 xl:table-cell">Round</th>
                <th className="w-28 px-2">Date</th>
                <th className="hidden w-20 px-2 md:table-cell">Time</th>
                <th className="w-60 px-2">Match</th>
                <th className="hidden w-40 px-2 lg:table-cell">Venue</th>
                <th className="hidden w-24 px-2 md:table-cell">Status</th>
                <th className="w-20 px-2 text-center">Link</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-sm font-semibold text-gray-500">
                    No matches found for this team.
                  </td>
                </tr>
              ) : (
                matches.map((m) => (
                  <tr key={m.id} className="h-10 border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-2 text-center font-mono text-gray-500">{m.id}</td>
                    <td className="px-2">{m.competitionName}</td>
                    <td className="hidden px-2 font-semibold lg:table-cell">{m.seasonName}</td>
                    <td className="hidden px-2 xl:table-cell">{m.roundName}</td>
                    <td className="px-2">{m.date || "-"}</td>
                    <td className="hidden px-2 md:table-cell">{m.time || "-"}</td>
                    <td className="px-2">
                      <span className={m.teamA === team.name ? "font-bold text-[#040f4f]" : ""}>{m.teamA}</span>
                      <span className="px-2 text-[10px] font-bold text-[#f4a01c]">VS</span>
                      <span className={m.teamB === team.name ? "font-bold text-[#040f4f]" : ""}>{m.teamB}</span>
                    </td>
                    <td className="hidden max-w-[160px] truncate px-2 lg:table-cell" title={m.venue || ""}>{m.venue || "-"}</td>
                    <td className="hidden px-2 md:table-cell">
                      <span className="rounded border border-[#040f4f] bg-[#f2f2f2] px-2 py-0.5">{m.status || "-"}</span>
                    </td>
                    <td className="px-2 text-center">
                      <Link href={`/admin/matches/${m.id}`} className="font-bold text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
