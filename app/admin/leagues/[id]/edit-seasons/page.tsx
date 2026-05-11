import prisma from "@/lib/prisma";
import Link from "next/link";
import { bulkUpdateSeasons } from "@/lib/actions";

export default async function EditSeasonsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const leagueId = Number.parseInt(resolvedParams.id, 10);

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { seasons: { orderBy: { id: "desc" } } },
    });

    if (!league) return <div className="p-10 text-slate-700">League not found.</div>;

    return (
      <div className="min-h-screen p-10 font-sans text-slate-800">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <Link href={`/admin/leagues/${leagueId}`} className="text-[#f4a01c] text-sm font-bold hover:underline mb-2 inline-block">
                Back to {league.competitionName}
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">Manage Multiple Seasons</h1>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-6 shadow">
            <form action={bulkUpdateSeasons}>
              <input type="hidden" name="leagueId" value={leagueId} />

              <table className="min-w-[900px] w-full border-collapse text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="p-3 w-16">ID</th>
                    <th className="p-3 w-32">Season Title</th>
                    <th className="p-3 w-40">Start Date</th>
                    <th className="p-3 w-40">End Date</th>
                    <th className="p-3">Competition Name</th>
                  </tr>
                </thead>
                <tbody>
                  {league.seasons.map((season) => (
                    <tr key={season.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-gray-400">
                        {season.id}
                        <input type="hidden" name="seasonId" value={season.id} />
                      </td>
                      <td className="p-2">
                        <input name="title" defaultValue={season.name} className="w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-900" required />
                      </td>
                      <td className="p-2">
                        <input type="date" name="startDate" defaultValue={season.startDate || ""} className="w-full rounded border border-slate-300 bg-white p-2 text-[13px] text-slate-900" />
                      </td>
                      <td className="p-2">
                        <input type="date" name="endDate" defaultValue={season.endDate || ""} className="w-full rounded border border-slate-300 bg-white p-2 text-[13px] text-slate-900" />
                      </td>
                      <td className="p-2">
                        <input name="competitionName" defaultValue={league.competitionName} className="w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-900" required />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {league.seasons.length === 0 && (
                <div className="p-8 text-center italic text-slate-500">No seasons exist for this competition yet.</div>
              )}

              <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
                <button type="submit" className="rounded bg-blue-600 px-8 py-3 font-bold text-white transition-colors hover:bg-blue-700">
                  SAVE ALL CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="p-10">
        <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="mb-2 text-lg font-bold">Database connection issue</h1>
          <p className="text-sm">Could not reach the database right now. Please retry in a few seconds.</p>
        </div>
      </div>
    );
  }
}
