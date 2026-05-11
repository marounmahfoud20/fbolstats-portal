import prisma from "@/lib/prisma";
import RetroSeasonHub from "./RetroSeasonHub";
import Link from "next/link";

export default async function SeasonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const seasonId = parseInt(resolvedParams.id);

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      league: true,
      groups: true,
      teams: {
        include: {
          team: true
        }
      }
    }
  });

  if (!season) {
    return (
      <div className="min-h-screen bg-white p-10 font-bold text-red-600 flex justify-center pt-20">
        404 - Season not found in database.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-[980px] mx-auto pt-6 pb-2">
        <Link
          href={`/admin/leagues/${season.leagueId}`}
          className="text-[#f4a01c] text-sm font-bold hover:underline inline-flex items-center"
        >
          ← Back to {season.league.competitionName}
        </Link>
      </div>

      <RetroSeasonHub season={season} />
    </div>
  );
}