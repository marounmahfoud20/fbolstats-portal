import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addMatchToRound, addTeamToRound } from "@/lib/actions";

export default async function RoundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const roundId = parseInt(resolvedParams.id);

  if (isNaN(roundId)) notFound();

  // Fetch the Round, its parent Season (and the Season's teams), its own Teams, and its Matches
  const round = await prisma.group.findUnique({
    where: { id: roundId },
    include: {
      season: {
        include: {
          league: true,
          teams: { include: { team: true } } // Gets all teams in the Season
        }
      },
      teams: {
        include: { team: true } // Gets teams assigned to THIS specific round
      },
      matches: {
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      }
    }
  });

  if (!round) {
    return (
      <div className="min-h-screen bg-white p-10 font-bold text-red-600 flex justify-center pt-20">
        404 - Round not found in database.
      </div>
    );
  }

  const matches = round.matches || [];
  const genderIcon = round.season.league.type.includes("Women") || round.season.league.type.includes("Girls") ? "♀" : "♂";

  // Filter out teams that are already in this round so they don't show up in the "Add" dropdown
  const roundTeamIds = new Set(round.teams.map(rt => rt.teamId));
  const availableSeasonTeams = round.season.teams.filter(st => !roundTeamIds.has(st.teamId));

  return (
    <div className="min-h-screen bg-white text-[#040f4f] pb-20 font-sans text-[11px]">

      {/* ---------------- BREADCRUMB HEADER ---------------- */}
      <div className="w-[980px] mx-auto pt-6 pb-2">
        <Link
          href={`/admin/seasons/${round.seasonId}`}
          className="text-[#f4a01c] text-sm font-bold hover:underline inline-flex items-center"
        >
          ← Back to {round.season.name}
        </Link>
      </div>

      <div className="w-[980px] mx-auto flex items-center text-[#f4a01c] font-bold text-lg mb-6 mt-4">
        <span className="mr-2">⚽</span>
        <span className="mr-2">{genderIcon}</span>
        <span>
          {round.season.league.competitionName} - {round.name}
        </span>
      </div>

      {/* ---------------- ROUND TEAMS SECTION ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center justify-between h-[28px] px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">
          Teams in this Round ({round.teams.length})
        </span>
      </div>

      <div className="w-[980px] mx-auto bg-[#f9f9f9] border-x border-b border-[#040f4f] p-4 mb-6 flex gap-4 items-center">
        <span className="font-bold text-[#f4a01c]">Assign Team to Round:</span>
        <form action={addTeamToRound} className="flex gap-2">
          <input type="hidden" name="groupId" value={round.id} />

          <select name="teamId" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-64" required>
            <option value="">-- Select from Season Teams --</option>
            {availableSeasonTeams.map(st => (
              <option key={st.team.id} value={st.team.id}>{st.team.name}</option>
            ))}
          </select>

          <button type="submit" className="bg-[#f4a01c] text-white font-bold px-6 py-1.5 hover:bg-[#040f4f] transition-colors">
            Add to Round
          </button>
        </form>
      </div>

      {/* ---------------- MATCHES SECTION ---------------- */}
      <div className="w-[980px] mx-auto text-left border border-[#040f4f] bg-[#f2f2f2] rounded-t-lg flex items-center justify-between h-[28px] px-3">
        <span className="font-bold text-[#040f4f] uppercase tracking-wider">
          Round Matches ({matches.length})
        </span>
      </div>

      <div className="w-[980px] mx-auto bg-[#f9f9f9] border-x border-b border-[#040f4f] p-4 mb-6">
        <div className="font-bold text-[#f4a01c] mb-3 text-sm border-b border-gray-300 pb-1">
          + Add New Match
        </div>

        <form action={addMatchToRound} className="flex flex-wrap gap-4 items-end">
          <input type="hidden" name="groupId" value={round.id} />

          <div className="flex flex-col gap-1">
            <label className="text-[#040f4f] font-bold">Date</label>
            <input type="date" name="date" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-36" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#040f4f] font-bold">Time</label>
            <input type="time" name="time" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-28" />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[#040f4f] font-bold">Team A (Home)</label>
            {/* THIS IS THE NEW DROPDOWN */}
            <select name="teamA" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-full" required>
              <option value="">Select Team A...</option>
              {round.teams.map(rt => (
                <option key={`home-${rt.team.id}`} value={rt.team.name}>{rt.team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[#040f4f] font-bold">Team B (Away)</label>
            {/* THIS IS THE NEW DROPDOWN */}
            <select name="teamB" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-full" required>
              <option value="">Select Team B...</option>
              {round.teams.map(rt => (
                <option key={`away-${rt.team.id}`} value={rt.team.name}>{rt.team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[#040f4f] font-bold">Venue</label>
            <input type="text" name="venue" placeholder="e.g. Camille Chamoun" className="px-2 py-1.5 text-[#040f4f] outline-none border border-[#040f4f] w-full" />
          </div>

          <button type="submit" className="bg-[#f4a01c] text-white font-bold px-6 py-1.5 hover:bg-[#040f4f] transition-colors h-[32px]">
            Add Match
          </button>
        </form>
      </div>

      {/* ---------------- MATCHES TABLE ---------------- */}
      <table className="w-[980px] mx-auto border border-[#040f4f] mb-6 border-collapse bg-white">
        <thead className="bg-[#f2f2f2] text-[#040f4f] h-8 border-b border-[#040f4f] text-left">
          <tr>
            <th className="w-10 text-center">ID</th>
            <th className="w-24 pl-2">Date</th>
            <th className="w-16">Time</th>
            <th className="w-48 text-right pr-4">Team A</th>
            <th className="w-10 text-center">vs</th>
            <th className="w-48 pl-4">Team B</th>
            <th className="w-32">Venue</th>
            <th className="w-24">Status</th>
            <th className="w-16 text-center">Link</th>
          </tr>
        </thead>
        <tbody>
          {matches.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-gray-500 font-bold text-sm">
                No matches have been added to this round yet. Use the form above to create one.
              </td>
            </tr>
          ) : (
            matches.map((match) => (
              <tr key={match.id} className="h-10 border-b border-gray-200 hover:bg-gray-50">
                <td className="text-center text-gray-500 font-mono">{match.id}</td>
                <td className="pl-2 font-bold text-[#040f4f]">{match.date || "TBD"}</td>
                <td className="text-gray-600">{match.time || "-"}</td>
                <td className="text-right pr-4 font-bold text-[#040f4f] text-[13px]">{match.teamA}</td>
                <td className="text-center text-[#f4a01c] text-[10px]">VS</td>
                <td className="pl-4 font-bold text-[#040f4f] text-[13px]">{match.teamB}</td>
                <td className="text-gray-500 truncate max-w-[120px]" title={match.venue || ""}>{match.venue || "-"}</td>
                <td>
                  <span className="bg-[#f2f2f2] text-[#040f4f] px-2 py-0.5 rounded border border-[#040f4f]">
                    {match.status}
                  </span>
                </td>
                <td className="text-center">
                  <Link
                    href={`/admin/matches/${match.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}