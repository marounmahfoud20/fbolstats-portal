import Link from "next/link";

export default async function ManageMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  // Mocking the match data since your DB doesn't have the match columns yet.
  const mockMatches = [
    { id: 3902303, day: "19", month: "09", year: "2025", time: "14:30", teamA: "Bourj SC", teamB: "Jwaya SC", status: "Played" },
    { id: 3902304, day: "19", month: "09", year: "2025", time: "14:30", teamA: "Shabab Al Sahel SC", teamB: "Al Mabarrah SC", status: "Played" },
    { id: 3902305, day: "20", month: "09", year: "2025", time: "14:30", teamA: "Al Riyadi Al Abbasiyah Club", teamB: "Al Ahed SC", status: "Played" },
  ];

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/groups/${groupId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
          ← Back to Group Settings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Manage Group Matches</h1>
      </div>

      {/* Date Filter Bar */}
      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg p-3 mb-6 flex justify-between items-center text-gray-300">
        <div>2023-12-29 <span className="ml-2 text-[#f4a01c]">⚠️ No fixtures left</span></div>
        <div className="flex gap-3 text-[#f4a01c] font-bold text-[10px]">
          <span className="cursor-pointer hover:underline border-l border-[#f4a01c] pl-3">+ 1d</span>
          <span className="cursor-pointer hover:underline border-l border-[#f4a01c] pl-3">+ 3d</span>
          <span className="cursor-pointer hover:underline border-l border-[#f4a01c] pl-3">+ 7d</span>
          <span className="cursor-pointer hover:underline border-l border-[#f4a01c] pl-3">+ 2w</span>
          <span className="cursor-pointer hover:underline border-l border-[#f4a01c] pl-3">+ 1M</span>
        </div>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden p-6">
        <form>
          <div className="flex font-bold text-[#f4a01c] border-b border-[#f4a01c]/30 pb-2 mb-4 uppercase tracking-wider text-[10px]">
            <div className="w-8 text-center">⚙</div>
            <div className="w-16">Match ID</div>
            <div className="w-24">Date</div>
            <div className="w-16">Time</div>
            <div className="w-40">Team A</div>
            <div className="w-40">Team B</div>
            <div className="flex-1">Status</div>
          </div>

          {mockMatches.map((match) => (
            <div key={match.id} className="flex items-center mb-3 border-b border-[#f4a01c]/10 pb-3 hover:bg-[#f4a01c]/5">
              
              <div className="w-8 text-center text-[#f4a01c] cursor-pointer hover:scale-110 transition-transform">⚙</div>
              
              <div className="w-16">
                <span className="text-blue-400 hover:underline font-mono cursor-pointer">
                  {match.id}
                </span>
              </div>

              <div className="w-24 flex gap-1">
                <input type="text" defaultValue={match.day} className="w-6 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none text-[10px]" />
                <input type="text" defaultValue={match.month} className="w-6 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none text-[10px]" />
                <input type="text" defaultValue={match.year} className="w-10 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none text-[10px]" />
              </div>

              <div className="w-16">
                <input type="text" defaultValue={match.time} className="w-12 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none font-mono" />
              </div>

              <div className="w-40 font-bold">{match.teamA}</div>
              <div className="w-40 font-bold">{match.teamB}</div>

              <div className="flex-1">
                <select defaultValue={match.status} className="w-32 bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none focus:border-[#f4a01c]">
                  <option value="Played">Played</option>
                  <option value="Fixture">Fixture</option>
                  <option value="Postponed">Postponed</option>
                  <option value="Awarded">Awarded</option>
                </select>
              </div>

            </div>
          ))}

          <div className="mt-6 pt-4 flex justify-end">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-6 rounded hover:bg-white transition-colors">
              Save Match Updates
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}