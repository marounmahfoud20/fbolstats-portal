import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateSeasonSettings } from "@/lib/actions";

export default async function SeasonSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const seasonId = parseInt(resolvedParams.id);
  if (isNaN(seasonId)) notFound();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { league: true }
  });

  if (!season) notFound();

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/seasons/${season.id}`} className="text-[#f4a01c] text-sm font-bold hover:underline">
          ← Back to Season
        </Link>
      </div>

      <div className="w-[980px] mx-auto border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg px-3 py-2 font-bold text-[#040f4f]">
        {season.league.competitionName} - Season Settings
      </div>

      <form action={updateSeasonSettings} className="w-[980px] mx-auto border-x border-b border-[#040f4f] bg-white p-4">
        <input type="hidden" name="seasonId" value={season.id} />
        <input type="hidden" name="leagueId" value={season.leagueId} />

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f2f2f2] text-[#040f4f] border border-[#040f4f]">
              <th className="border border-[#040f4f] p-2 text-left">Season Title</th>
              <th className="border border-[#040f4f] p-2 text-left">Start Date</th>
              <th className="border border-[#040f4f] p-2 text-left">End Date</th>
              <th className="border border-[#040f4f] p-2 text-left">Competition Title</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#040f4f] p-2">
                <input
                  type="text"
                  name="seasonTitle"
                  defaultValue={season.name}
                  className="w-full border border-gray-400 px-2 py-1 outline-none"
                  required
                />
              </td>
              <td className="border border-[#040f4f] p-2">
                <input
                  type="date"
                  name="seasonStartDate"
                  defaultValue={season.startDate || ""}
                  className="w-full border border-gray-400 px-2 py-1 outline-none"
                />
              </td>
              <td className="border border-[#040f4f] p-2">
                <input
                  type="date"
                  name="seasonEndDate"
                  defaultValue={season.endDate || ""}
                  className="w-full border border-gray-400 px-2 py-1 outline-none"
                />
              </td>
              <td className="border border-[#040f4f] p-2">
                <input
                  type="text"
                  name="seasonCompName"
                  defaultValue={season.league.competitionName}
                  className="w-full border border-gray-400 px-2 py-1 outline-none"
                  required
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <button type="submit" className="bg-[#f4a01c] text-[#040f4f] font-bold px-5 py-2 border border-[#040f4f] hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

