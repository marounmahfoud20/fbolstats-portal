import Link from "next/link";

export default async function AddMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/groups/${groupId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
          ← Back to Group Settings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Add Match</h1>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden p-6">
        <form className="space-y-4 max-w-2xl">
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Date:</span>
            <div className="flex gap-2">
              <input type="text" placeholder="DD" className="w-12 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
              <input type="text" placeholder="MM" className="w-12 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
              <input type="text" placeholder="YYYY" className="w-16 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Time:</span>
            <div className="flex gap-2">
              <input type="text" placeholder="HH" className="w-12 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
              <input type="text" placeholder="MM" className="w-12 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Team A:</span>
            <select className="w-[300px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none">
              <option>Al Ansar SC</option><option>Nejmeh SC</option>
            </select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Team B:</span>
            <select className="w-[300px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none">
              <option>Nejmeh SC</option><option>Al Ansar SC</option>
            </select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Final Period:</span>
            <div className="flex gap-4">
              <label><input type="radio" name="period" className="accent-[#f4a01c] mr-1" defaultChecked /> 90 Min</label>
              <label><input type="radio" name="period" className="accent-[#f4a01c] mr-1" /> 120 Min</label>
              <label><input type="radio" name="period" className="accent-[#f4a01c] mr-1" /> Penalties</label>
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Venue:</span>
            <input type="text" placeholder="Search Venue..." className="w-[300px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none" />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Final Score:</span>
            <div className="flex gap-2 items-center text-lg font-bold">
              <input type="text" className="w-12 h-10 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none" />
              <span>-</span>
              <input type="text" className="w-12 h-10 text-center bg-[#040f4f] border border-[#f4a01c]/30 rounded outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Status:</span>
            <select className="w-[200px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none">
              <option>Fixture</option><option>Played</option><option>Postponed</option><option>Awarded</option>
            </select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="font-bold text-[#f4a01c]">Winner:</span>
            <select className="w-[200px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-1 outline-none">
              <option>Yet Unknown</option><option>Team A</option><option>Team B</option><option>Draw</option>
            </select>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f4a01c]/30">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-8 rounded hover:bg-white transition-colors">
              Save Match
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}