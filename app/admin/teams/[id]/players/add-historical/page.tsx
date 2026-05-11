import Link from "next/link";
import prisma from "@/lib/prisma";
import { addHistoricalPlayers } from "@/lib/actions";
import { COUNTRIES } from "@/lib/countries";

export default async function AddHistoricalPlayersPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = parseInt(params.id);
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      <form action={addHistoricalPlayers} className="max-w-[1200px] mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs">
        <input type="hidden" name="teamId" value={teamId} />
        <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] p-2 mb-4">
          <span className="text-[#040f4f] font-bold text-sm">&nbsp;&nbsp;&nbsp;Add Historical Players - {team?.name || `Team #${teamId}`}</span>
          <Link href={`/admin/teams/${teamId}`} className="text-[#040f4f] hover:underline font-bold text-sm">Back to Team</Link>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="border border-gray-300 p-2 bg-[#fdfdfd] flex gap-2 flex-wrap">
              <input type="text" name={`firstName_${i}`} placeholder="First Name" className="w-[130px] border border-gray-400 p-1" />
              <input type="text" name={`lastName_${i}`} placeholder="Last Name" className="w-[130px] border border-gray-400 p-1" />
              <input type="text" name={`matchName_${i}`} placeholder="Match Name" className="w-[130px] border border-gray-400 p-1" />
              <input type="text" name={`commonName_${i}`} placeholder="Common Name" className="w-[130px] border border-gray-400 p-1" />
              <select name={`position_${i}`} className="w-[120px] border border-gray-400 p-1 bg-white">
                <option value="">Position</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
              <select name={`nationality_${i}`} className="w-[170px] border border-gray-400 p-1 bg-white">
                <option value="">Nationality</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" name={`startDay_${i}`} placeholder="SD" maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
              <input type="text" name={`startMonth_${i}`} placeholder="SM" maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
              <input type="text" name={`startYear_${i}`} placeholder="SYYY" maxLength={4} className="w-[58px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
              <input type="text" name={`endDay_${i}`} placeholder="ED" maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
              <input type="text" name={`endMonth_${i}`} placeholder="EM" maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
              <input type="text" name={`endYear_${i}`} placeholder="EYYY" maxLength={4} className="w-[58px] border border-gray-400 p-1 text-center bg-[#FFF0F0]" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] px-8 py-2 font-bold hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Save Historical Players
          </button>
        </div>
      </form>
    </div>
  );
}
