import prisma from "@/lib/prisma";
import Link from "next/link";
import { createSeason } from "@/lib/actions";

export default async function AddSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const leagueId = parseInt(resolvedParams.id);
  
  const league = await prisma.league.findUnique({ where: { id: leagueId } });

  if (!league) return <div className="p-10 text-white">League not found.</div>;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href={`/admin/leagues/${leagueId}`} className="text-[#f4a01c] text-sm font-bold hover:underline mb-2 inline-block">
            ← Back to {league.competitionName}
          </Link>
          <h1 className="text-3xl font-bold text-white">Add New Season</h1>
        </div>

        {/* Form Container */}
        <div className="bg-[#030b3a] border border-[#f4a01c]/30 rounded-lg p-6 shadow-xl">
          <form action={createSeason} className="flex flex-col gap-5">
            <input type="hidden" name="leagueId" value={leagueId} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Season Title</label>
                <input name="title" placeholder="e.g. 2026/2027" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 text-white p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" required />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Competition Title Override</label>
                <input name="competitionName" defaultValue={league.competitionName} className="w-full bg-[#040f4f] border border-[#f4a01c]/30 text-white p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Start Date</label>
                <input type="date" name="startDate" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 text-white p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">End Date</label>
                <input type="date" name="endDate" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 text-white p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f4a01c]/20 flex justify-end">
              <button type="submit" className="bg-[#f4a01c] text-[#040f4f] font-bold py-3 px-8 rounded hover:bg-white transition-colors">
                SAVE SEASON
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}