import prisma from "@/lib/prisma";
import { createSingleMatch } from "@/lib/actions";

export default async function AddOneMatchPage({
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

  return (
    <div className="p-4 ml-16 font-sans">
      <div className="border border-[#040f4f] bg-[#f4a01c] text-[#040f4f] font-bold p-2 rounded-lg mb-4 max-w-2xl">
        Add/Edit Match
      </div>

      <form action={createSingleMatch} method="POST" className="pl-2">
        <datalist id="venue-list">
          {venues.map((v) => (
            <option key={v.name} value={v.name} />
          ))}
        </datalist>

        {/* Hidden inputs to pass URL parameters back to the action */}
        <input type="hidden" name="groupId" value={params.groupId} />
        <input type="hidden" name="leagueId" value={params.id} />
        <input type="hidden" name="seasonId" value={params.seasonId} />

        <table className="w-full max-w-2xl text-sm border-spacing-y-2">
          <tbody>
            <tr>
              <td className="w-32 font-bold py-1">Date:</td>
              <td className="flex gap-1 py-1">
                <input type="text" name="day" className="w-8 border text-center" placeholder="DD" />
                <input type="text" name="month" className="w-8 border text-center" placeholder="MM" />
                <input type="text" name="year" className="w-12 border text-center" placeholder="YYYY" />
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1">Time:</td>
              <td className="flex gap-1 py-1">
                <input type="text" name="hour" className="w-8 border text-center" placeholder="HH" />
                <input type="text" name="minute" className="w-8 border text-center" placeholder="mm" />
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1">Team A:</td>
              <td className="py-1">
                <select name="teamA" className="border w-48 p-1">
                  <option value=""></option>
                  {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1">Team B:</td>
              <td className="py-1">
                <select name="teamB" className="border w-48 p-1">
                  <option value=""></option>
                  {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1">Venue:</td>
              <td className="py-1">
                <input type="text" name="venue" list="venue-list" placeholder="Start typing stadium name..." className="border w-72 p-1" />
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1">Status:</td>
              <td className="py-1">
                <select name="status" className="border w-48 p-1">
                  <option value="Fixture">Fixture</option>
                  <option value="Played">Played</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-4">
                <button type="submit" className="bg-[#f4a01c] border border-gray-400 px-6 py-1 font-bold hover:bg-gray-200">Save</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}
