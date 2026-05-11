import Link from "next/link";
import prisma from "@/lib/prisma";
import { bulkUpdateActivePlayers } from "@/lib/actions";
import { COUNTRIES } from "@/lib/countries";

function splitDate(date?: string | null) {
  if (!date) return { day: "", month: "", year: "" };
  const [year, month, day] = date.split("-");
  return { day: day || "", month: month || "", year: year || "" };
}

export default async function EditActivePlayersPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = parseInt(params.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        where: { isActive: true, role: { equals: "player", mode: "insensitive" } },
        include: { person: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      <form action={bulkUpdateActivePlayers} className="max-w-[1200px] mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs">
        <input type="hidden" name="teamId" value={teamId} />
        <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] p-2 mb-4">
          <span className="text-[#040f4f] font-bold text-sm">&nbsp;&nbsp;&nbsp;Edit Active Players - {team?.name || `Team #${teamId}`}</span>
          <Link href={`/admin/teams/${teamId}`} className="text-[#040f4f] hover:underline font-bold text-sm">Back to Team</Link>
        </div>

        <div className="space-y-3">
          {(team?.memberships || []).map((m) => {
            const sDate = splitDate(m.startDate);
            return (
              <div key={m.id} className="border border-gray-300 p-2 bg-[#fdfdfd] flex gap-2 flex-wrap items-center">
                <input type="hidden" name="membershipId" value={m.id} />
                <span className="w-14 text-gray-500 font-mono">{m.person.id}</span>
                <input type="text" name={`firstName_${m.id}`} defaultValue={m.person.firstName || ""} className="w-[120px] border border-gray-400 p-1" />
                <input type="text" name={`lastName_${m.id}`} defaultValue={m.person.lastName || ""} className="w-[120px] border border-gray-400 p-1" />
                <input type="text" name={`matchName_${m.id}`} defaultValue={m.person.matchName || ""} className="w-[120px] border border-gray-400 p-1" />
                <input type="text" name={`commonName_${m.id}`} defaultValue={m.person.commonName || ""} className="w-[120px] border border-gray-400 p-1" />
                <select name={`position_${m.id}`} defaultValue={m.person.position || ""} className="w-[120px] border border-gray-400 p-1 bg-white">
                  <option value="">Position</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Defender">Defender</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Forward">Forward</option>
                </select>
                <select name={`nationality_${m.id}`} defaultValue={m.person.nationality || ""} className="w-[170px] border border-gray-400 p-1 bg-white">
                  <option value="">Nationality</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" name={`startDay_${m.id}`} defaultValue={sDate.day} maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
                <input type="text" name={`startMonth_${m.id}`} defaultValue={sDate.month} maxLength={2} className="w-[36px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
                <input type="text" name={`startYear_${m.id}`} defaultValue={sDate.year} maxLength={4} className="w-[58px] border border-gray-400 p-1 text-center bg-[#F0F0FF]" />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] px-8 py-2 font-bold hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Save Active Players
          </button>
        </div>
      </form>
    </div>
  );
}
