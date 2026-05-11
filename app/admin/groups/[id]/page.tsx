import Link from "next/link";

export default async function GroupHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  const BlockHeader = ({ title, addLink }: { title: string, addLink: string }) => (
    <div className="w-[980px] mx-auto text-left border border-[#f4a01c]/50 bg-[#030b3a] rounded-t-lg flex items-center justify-between h-[28px] mt-6 px-3">
      <span className="font-bold text-white uppercase tracking-wider">{title}</span>
      <Link href={addLink} className="text-[#f4a01c] font-bold text-lg cursor-pointer hover:text-white pb-1">+</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs pb-20">
      
      <div className="w-[980px] mx-auto flex items-center text-[#f4a01c] font-bold text-lg mb-6">
        <span className="mr-2">⚽</span>
        <span>Group Settings: <span className="text-white ml-1">{groupId}</span></span>
      </div>

      <BlockHeader title="Matches" addLink={`/admin/groups/${groupId}/add-match`} />
      <div className="w-[980px] mx-auto border-x border-b border-[#f4a01c]/50 bg-[#040f4f] p-4 text-center text-gray-500 italic">No matches scheduled in this group.</div>

      <BlockHeader title="Table Zones" addLink={`/admin/groups/${groupId}/add-zone`} />
      <table className="w-[980px] mx-auto border-x border-b border-[#f4a01c]/50 border-collapse bg-[#040f4f]">
        <thead className="bg-[#f4a01c]/10 text-[#f4a01c] h-8 border-b border-[#f4a01c]/30 text-left">
          <tr><th className="pl-3 w-32">Position</th><th>Table Zone Action</th></tr>
        </thead>
        <tbody>
          <tr className="h-10 border-b border-[#f4a01c]/10 hover:bg-[#f4a01c]/5">
            <td className="pl-3 font-bold text-center w-32">1</td>
            <td className="text-green-400 font-bold">Promotion Round</td>
          </tr>
        </tbody>
      </table>

      <BlockHeader title="Group Teams (8)" addLink={`/admin/groups/${groupId}/add-team`} />
      <table className="w-[980px] mx-auto border-x border-b border-[#f4a01c]/50 border-collapse bg-[#040f4f]">
        <thead className="bg-[#f4a01c]/10 text-[#f4a01c] h-8 border-b border-[#f4a01c]/30 text-left">
          <tr><th className="pl-3 w-32">Team ID</th><th>Team Name</th></tr>
        </thead>
        <tbody>
          {[
            { id: 70087, name: "Al Jaish SC" },
            { id: 36856, name: "Al Nahda SC Ain Baal" },
            { id: 12142, name: "Al Nahda SC Bar Elias" }
          ].map((team) => (
            <tr key={team.id} className="h-8 border-b border-[#f4a01c]/10 hover:bg-[#f4a01c]/5">
              <td className="pl-3 text-blue-400 hover:underline cursor-pointer font-mono">{team.id}</td>
              <td className="font-bold text-gray-300">{team.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}