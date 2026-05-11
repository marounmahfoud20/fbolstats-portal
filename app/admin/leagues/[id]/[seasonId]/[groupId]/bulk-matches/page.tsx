import prisma from "@/lib/prisma";
import { createBulkMatches } from "@/lib/actions";
import CsvUploader from "@/components/CsvUploader";

export default async function BulkMatchesPage({
  params,
}: {
  params: { id: string; seasonId: string; groupId: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const venues = await prisma.venue.findMany({
    where: { status: "active" },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const rows = Array.from({ length: 60 });

  return (
    <div className="p-4 flex gap-4">
      {/* Sidebar Placeholder */}
      <div className="w-16 bg-[#2C2C2C] shrink-0 h-screen fixed left-0 top-0"></div>

      <div className="flex-1 ml-16">
        <div className="flex items-center gap-4 mb-4">
            <h1 className="text-xl font-bold text-[#040f4f]">Add Multiple Matches</h1>
            
            {/* Our new interactive file parser! */}
            <CsvUploader />
        </div>

        <form action={createBulkMatches} method="POST">
          <datalist id="venue-list">
            {venues.map((v) => (
              <option key={v.name} value={v.name} />
            ))}
          </datalist>

          <input type="hidden" name="groupId" value={params.groupId} />
          <input type="hidden" name="leagueId" value={params.id} />
          <input type="hidden" name="seasonId" value={params.seasonId} />
          
          <div className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold p-2 rounded-lg mb-4 text-sm flex">
            <div className="w-[180px]">dd mm yyyy hh mm</div>
            <div className="w-[170px] text-center">Team A</div>
            <div className="w-[170px] text-center">Team B</div>
            <div className="w-[50px] text-center">GW</div>
            <div className="w-[170px] text-center">Venue</div>
          </div>

          <div className="space-y-2">
            {rows.map((_, i) => (
              <div key={i} className="flex gap-2 text-sm border-b pb-2">
                <div className="flex gap-1 w-[180px]">
                  <input type="text" name={`day[${i}]`} className="w-8 border p-1 text-center" placeholder="DD" />
                  <input type="text" name={`month[${i}]`} className="w-8 border p-1 text-center" placeholder="MM" />
                  <input type="text" name={`year[${i}]`} className="w-12 border p-1 text-center" placeholder="YYYY" />
                  <span className="mx-1"></span>
                  <input type="text" name={`hour[${i}]`} className="w-8 border p-1 text-center" placeholder="HH" />
                  <input type="text" name={`minute[${i}]`} className="w-8 border p-1 text-center" placeholder="mm" />
                </div>

                <div className="w-[170px]">
                  <select name={`team_a[${i}]`} className="w-full border p-1">
                    <option value=""></option>
                    {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div className="w-[170px]">
                  <select name={`team_b[${i}]`} className="w-full border p-1">
                    <option value=""></option>
                    {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div className="w-[50px]">
                  <input type="text" name={`gameweek[${i}]`} className="w-full border p-1 text-center" />
                </div>

                <div className="w-[170px]">
                  <input type="text" name={`venue[${i}]`} list="venue-list" placeholder="Stadium..." className="w-full border p-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pb-12">
            <button type="submit" className="bg-[#f4a01c] border border-gray-400 px-8 py-2 font-bold hover:bg-gray-200 transition-colors">Submit Matches</button>
          </div>
        </form>
      </div>
    </div>
  );
}
