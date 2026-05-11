import Link from "next/link";

export default async function EditRoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const seasonId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/seasons/${seasonId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
          ← Back to Season Hub
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Edit Rounds</h1>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden p-4">
        <form className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#f4a01c]/10 text-[#f4a01c] uppercase tracking-wider">
              <tr className="border-b border-[#f4a01c]/30">
                <th className="p-2 w-16">ID</th>
                <th className="p-2 w-28">Start Date</th>
                <th className="p-2 w-28">End Date</th>
                <th className="p-2 w-28">Draw Date</th>
                <th className="p-2 w-16">Match #</th>
                <th className="p-2 w-20">Gender</th>
                <th className="p-2 w-24">AgeG</th>
                <th className="p-2">Round Format (Template)</th>
              </tr>
            </thead>
            <tbody>
              {/* Mocking the existing round we built earlier */}
              <tr className="border-b border-[#f4a01c]/10 hover:bg-[#f4a01c]/5">
                <td className="p-2 font-mono text-gray-400">130982</td>
                <td className="p-2"><input type="date" defaultValue="2025-09-19" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                <td className="p-2"><input type="date" defaultValue="2026-05-17" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                <td className="p-2"><input type="date" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                <td className="p-2"><input type="text" defaultValue="121" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none text-center" /></td>
                <td className="p-2">
                  <select defaultValue="Male" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none">
                    <option>Male</option><option>Female</option><option>Mixed</option>
                  </select>
                </td>
                <td className="p-2">
                  <select defaultValue="Senior" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none">
                    <option>Senior</option><option>U23</option><option>U20</option><option>U18</option>
                  </select>
                </td>
                <td className="p-2"><input type="text" defaultValue="Regular Season (table)" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-6 rounded hover:bg-white transition-colors">
              SAVE CHANGES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}