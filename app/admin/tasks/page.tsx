import prisma from "@/lib/prisma";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { extendSeasonDate, markSeasonFinished } from "@/lib/actions";

export default async function TasksPage() {
  // Fetch seasons that are NOT finished, including their parent League
  let activeSeasons: Array<{
    id: number;
    endDate: string | null;
    leagueId: number;
    league: { competitionName: string };
  }> = [];
  let dbUnavailable = false;
  try {
    activeSeasons = await prisma.season.findMany({
      where: { isFinished: false },
      include: { league: { select: { competitionName: true } } },
      orderBy: { endDate: "asc" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dbUnavailable = true;
    if (!message.includes("Can't reach database server")) {
      console.error("Failed to load tasks page seasons:", error);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // Separate into "Overdue/Ending" and "Active Checks"
  const seasonsOver = activeSeasons.filter(s => s.endDate && s.endDate <= today);
  const competitionChecks = activeSeasons.filter(s => s.endDate && s.endDate > today);

  // Reusable component for the time extension buttons
  const ExtendButtons = ({ seasonId }: { seasonId: number }) => (
    <form action={extendSeasonDate} className="flex gap-2 text-[#040f4f] font-bold text-xs items-center">
      <input type="hidden" name="seasonId" value={seasonId} />
      <button type="submit" name="days" value="1" className="hover:underline border-l border-[#040f4f] pl-2">+ 1d</button>
      <button type="submit" name="days" value="3" className="hover:underline border-l border-[#040f4f] pl-2">+ 3d</button>
      <button type="submit" name="days" value="7" className="hover:underline border-l border-[#040f4f] pl-2">+ 7d</button>
      <button type="submit" name="days" value="14" className="hover:underline border-l border-[#040f4f] pl-2">+ 2w</button>
      <button type="submit" name="days" value="30" className="hover:underline border-l border-[#040f4f] pl-2">+ 1M</button>
      <button type="submit" name="days" value="90" className="hover:underline border-l border-[#040f4f] pl-2">+ 3M</button>
      <button type="submit" name="days" value="180" className="hover:underline border-l border-[#040f4f] pl-2">+ 6M</button>
    </form>
  );

  return (
    <div className="p-4 ml-16 font-sans">
      
      {/* MAIN HEADER - Matches the exact style of your "Add Match" and "Round Teams" pages */}
      <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] p-2 rounded-lg mb-6 max-w-5xl">
        <span className="font-bold">Task Dashboard</span>
        <Link href="/admin/tasks/add">
          <PlusCircle size={18} className="cursor-pointer hover:text-red-800 transition-colors" />
        </Link>
      </div>

      <div className="max-w-5xl">
          {dbUnavailable && (
            <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              Database is currently unreachable. Showing empty results until the connection is restored.
            </div>
          )}
          
          {/* COMPETITION CHECKS SECTION */}
          <h2 className="font-bold text-[#040f4f] text-sm mb-2 px-1 border-b-2 border-[#040f4f] pb-1">
            Competition Checks
          </h2>
          <div className="mb-8">
            {competitionChecks.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 italic">No upcoming checks.</div>
            ) : (
              competitionChecks.map((season) => (
                <div key={season.id} className="flex items-center justify-between py-2 text-sm border-b border-[#f4a01c] hover:bg-[#f4a01c]/30 px-1 transition-colors">
                  <div className="flex items-center gap-2 w-1/3">
                    <span className="text-gray-500 text-xs">🇱🇧</span>
                    <Link href={`/admin/leagues/${season.leagueId}`} className="font-bold text-[#040f4f] hover:underline">
                      {season.league.competitionName}
                    </Link>
                  </div>
                  <div className="text-[#040f4f] font-bold w-24">
                    {season.endDate}
                  </div>
                  <div className="flex-1 flex justify-end">
                    <ExtendButtons seasonId={season.id} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SEASON OVER SECTION */}
          <h2 className="font-bold text-[#040f4f] text-sm mb-2 px-1 border-b-2 border-[#040f4f] pb-1 mt-6">
            Season Over? (new season to be created?)
          </h2>
          <div>
            {seasonsOver.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 italic">No overdue seasons.</div>
            ) : (
              seasonsOver.map((season) => (
                <div key={season.id} className="flex items-center justify-between py-2 text-sm border-b border-[#040f4f]/30 hover:bg-[#f4a01c]/50 px-1 transition-colors">
                  <div className="flex items-center gap-2 w-1/3">
                    <span className="text-gray-500 text-xs">🇱🇧</span>
                    <Link href={`/admin/leagues/${season.leagueId}`} className="font-bold text-[#040f4f] hover:underline">
                      {season.league.competitionName}
                    </Link>
                  </div>
                  
                  <div className="text-[#040f4f] font-bold w-24 flex items-center gap-1">
                    {season.endDate}
                    {/* Replaced generic yellow warning with an aggressive brand-colored badge */}
                    <span className="text-[10px] bg-[#040f4f] text-white px-1.5 py-0.5 rounded-full font-bold">!</span>
                  </div>

                  <div className="flex gap-4 items-center flex-1 justify-end">
                    <form action={markSeasonFinished}>
                      <input type="hidden" name="seasonId" value={season.id} />
                      <button 
                        type="submit" 
                        className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] px-3 py-0.5 text-xs font-bold hover:bg-[#040f4f] hover:text-white transition-colors"
                      >
                        Finished
                      </button>
                    </form>
                    <ExtendButtons seasonId={season.id} />
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}
