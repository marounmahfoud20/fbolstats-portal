import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function signal(ok: boolean) {
  return ok ? (
    <span className="inline-block h-3 w-3 rounded-full bg-green-500" title="Complete" />
  ) : (
    <span className="inline-block h-3 w-3 rounded-full bg-red-500" title="Missing" />
  );
}

export default async function SeasonPlayerDetailsMonitorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const seasonId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(seasonId)) notFound();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      league: true,
      teams: { include: { team: true } },
    },
  });
  if (!season) notFound();

  const seasonTeamIds = season.teams.map((st) => st.teamId);

  const players = await prisma.person.findMany({
    where: {
      memberships: {
        some: {
          teamId: { in: seasonTeamIds.length > 0 ? seasonTeamIds : [-1] },
          role: { equals: "player", mode: "insensitive" },
        },
      },
    },
    include: {
      memberships: {
        where: {
          teamId: { in: seasonTeamIds.length > 0 ? seasonTeamIds : [-1] },
          role: { equals: "player", mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
        include: { team: { select: { id: true, name: true, area: true, country: true } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
    take: 1200,
  });

  return (
    <div className="min-h-screen bg-white p-6 text-[#040f4f]">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-2">
          <Link href={`/admin/seasons/${season.id}`} className="text-sm font-bold text-[#f4a01c] hover:underline">
            ← Back To {season.name}
          </Link>
        </div>

        <div className="mb-4 border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold text-[#040f4f]">
            Player Details Monitor - {season.league.competitionName} {season.name}
          </h1>
        </div>

        <div className="mb-3 border border-[#040f4f] bg-[#f2f2f2] p-2 font-bold text-[#040f4f]">
          Season Players ({players.length})
        </div>

        <div className="overflow-x-auto border border-[#040f4f] bg-white">
          <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
            <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
              <tr className="h-9">
                <th className="px-2">Area</th>
                <th className="px-2">Team</th>
                <th className="px-2">Player ID</th>
                <th className="px-2">Player</th>
                <th className="px-2 text-center">Cmn Name</th>
                <th className="px-2 text-center">Position</th>
                <th className="px-2 text-center">DOB</th>
                <th className="px-2 text-center">Birthplace</th>
                <th className="px-2 text-center">Height</th>
                <th className="px-2 text-center">Weight</th>
                <th className="px-2 text-center">Foot</th>
                <th className="px-2 text-center">Photo</th>
                <th className="px-2 text-center">Lock</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-sm font-semibold text-gray-500">
                    No season players found.
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const latestMembership = p.memberships[0];
                  const team = latestMembership?.team || null;
                  const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Player ${p.id}`;
                  const complete =
                    !!p.commonName &&
                    !!p.position &&
                    !!p.dob &&
                    !!p.placeOfBirth &&
                    !!p.height &&
                    !!p.weight &&
                    !!p.strongFoot &&
                    !!p.image;

                  return (
                    <tr key={p.id} className="h-9 border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-2">{team?.area || p.countryOfBirth || "-"}</td>
                      <td className="px-2">
                        {team ? (
                          <Link href={`/admin/teams/${team.id}`} className="text-blue-700 hover:underline">
                            {team.name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-2 font-mono">{p.id}</td>
                      <td className="px-2">
                        <Link href={`/admin/people/${p.id}/edit`} className="font-semibold text-[#040f4f] hover:underline">
                          {fullName}
                        </Link>
                      </td>
                      <td className="px-2 text-center">{signal(!!p.commonName)}</td>
                      <td className="px-2 text-center">{signal(!!p.position)}</td>
                      <td className="px-2 text-center">{signal(!!p.dob)}</td>
                      <td className="px-2 text-center">{signal(!!p.placeOfBirth)}</td>
                      <td className="px-2 text-center">{signal(!!p.height)}</td>
                      <td className="px-2 text-center">{signal(!!p.weight)}</td>
                      <td className="px-2 text-center">{signal(!!p.strongFoot)}</td>
                      <td className="px-2 text-center">{signal(!!p.image)}</td>
                      <td className="px-2 text-center">{complete ? "🔒" : ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

