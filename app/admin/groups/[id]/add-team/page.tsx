import Link from "next/link";

export default async function AddGroupTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  const mockTeams = [
    { id: 70087, name: "Al Jaish SC" },
    { id: 36856, name: "Al Nahda SC Ain Baal" },
    { id: 12142, name: "Al Nahda SC Bar Elias" },
    { id: 22572, name: "Al Shabab Club Tripoli" },
    { id: 33988, name: "Ansar SC Howara" },
    { id: 63098, name: "Athletico SC" },
  ];

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/groups/${groupId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
          ← Back to Group Settings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Add/Edit Group Teams</h1>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden p-6">
        <div className="flex gap-4 mb-6 text-[#f4a01c] font-bold cursor-pointer underline">
          <span>Select All</span>
          <span>Deselect All</span>
        </div>

        <form>
          <div className="grid grid-cols-2 gap-4">
            {mockTeams.map((team) => (
              <label key={team.id} className="flex items-center p-3 border border-[#f4a01c]/20 rounded hover:bg-[#f4a01c]/10 cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 mr-4 accent-[#f4a01c]" />
                <span className="font-mono text-gray-400 mr-4 w-12">{team.id}</span>
                <span className="font-bold text-[14px]">{team.name}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#f4a01c]/30">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-6 rounded hover:bg-white transition-colors">
              Submit Teams
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}