import prisma from "@/lib/prisma";
import Link from "next/link";
import { createSeason } from "@/lib/actions";
import { nationalTeamSection, nationalCompetitionHref } from "@/lib/national-competitions";

export default async function AddSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const leagueId = parseInt(resolvedParams.id);
  
  const league = await prisma.league.findUnique({ where: { id: leagueId } });

  if (!league) return <div className="p-10 text-white">League not found.</div>;
  const section = nationalTeamSection(league);
  const editionLabel = section ? "Edition" : "Season";
  const backHref = section ? nationalCompetitionHref(section, leagueId) : `/admin/leagues/${leagueId}`;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href={backHref} className="text-[#f4a01c] text-sm font-bold hover:underline mb-2 inline-block">
            ← Back to {league.competitionName}
          </Link>
          <h1 className="text-3xl font-bold text-white">Add New {editionLabel}</h1>
        </div>

        {/* Form Container */}
        <div className="bg-[#030b3a] border border-[#f4a01c]/30 rounded-lg p-6 shadow-xl">
          <form action={createSeason} className="flex flex-col gap-5">
            <input type="hidden" name="leagueId" value={leagueId} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{editionLabel} Title</label>
                <input name="title" placeholder={section ? `e.g. 2027 ${league.competitionName}` : "e.g. 2026/2027"} className="w-full bg-white border border-[#f4a01c]/30 text-slate-900 placeholder:text-slate-500 p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" required />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{section ? "Competition" : "Competition Title Override"}</label>
                <input name="competitionName" defaultValue={league.competitionName} readOnly={!!section} className="w-full bg-white border border-[#f4a01c]/30 text-slate-900 p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Start Date</label>
                <input type="date" name="startDate" className="w-full bg-white border border-[#f4a01c]/30 text-slate-900 p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">End Date</label>
                <input type="date" name="endDate" className="w-full bg-white border border-[#f4a01c]/30 text-slate-900 p-3 rounded mt-1 outline-none focus:border-[#f4a01c]" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f4a01c]/20 flex justify-end">
              <button type="submit" className="bg-[#f4a01c] text-[#040f4f] font-bold py-3 px-8 rounded hover:bg-white transition-colors">
                SAVE {editionLabel.toUpperCase()}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
