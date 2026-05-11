import Link from "next/link";

export default async function AddRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const seasonId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4 flex items-center justify-between">
        <div>
          <Link href={`/admin/seasons/${seasonId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
            ← Back to Season Hub
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Add New Round</h1>
        </div>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden">
        <form className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#f4a01c]/10 text-[#f4a01c] uppercase tracking-wider">
              <tr className="border-b border-[#f4a01c]/30">
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
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-[#f4a01c]/10 hover:bg-[#f4a01c]/5 transition-colors">
                  <td className="p-2"><input type="date" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                  <td className="p-2"><input type="date" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                  <td className="p-2"><input type="date" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                  <td className="p-2"><input type="text" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none text-center" /></td>
                  <td className="p-2">
                    <select className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none">
                      <option>Male</option><option>Female</option><option>Mixed</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none">
                      <option>Senior</option><option>U23</option><option>U20</option><option>U18</option>
                    </select>
                  </td>
                  <td className="p-2"><input type="text" placeholder="e.g. Regular Season (table)" className="w-full bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 text-white outline-none" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-6 rounded hover:bg-white transition-colors">
              SAVE ROUNDS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}