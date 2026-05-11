import Link from "next/link";

export default async function AddZonePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs">
      <div className="w-[980px] mx-auto mb-4">
        <Link href={`/admin/groups/${groupId}`} className="text-[#f4a01c] hover:underline font-bold text-sm">
          ← Back to Group Settings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Add Group Table Zone</h1>
      </div>

      <div className="w-[980px] mx-auto bg-[#030b3a] border border-[#f4a01c]/50 rounded-lg shadow-xl overflow-hidden p-6">
        <form>
          <div className="flex font-bold text-[#f4a01c] border-b border-[#f4a01c]/30 pb-2 mb-4 uppercase tracking-wider">
            <div className="w-32">Position</div>
            <div className="flex-1">Table Zone Action</div>
          </div>

          {[1, 2, 3, 4, 8, 9, 10].map((pos, idx) => (
            <div key={idx} className="flex items-center mb-3">
              <div className="w-32 font-bold text-lg">{pos}</div>
              <div className="flex-1">
                <select className="w-[330px] bg-[#040f4f] border border-[#f4a01c]/30 rounded p-2 text-white outline-none focus:border-[#f4a01c]">
                  <option value="">-- Select Action --</option>
                  <option value="championship">Championship Round</option>
                  <option value="promotion">Promotion Round</option>
                  <option value="relegation">Relegation Round</option>
                  <option value="afc_cup">AFC Cup</option>
                  <option value="demoted">Demoted</option>
                </select>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-4 border-t border-[#f4a01c]/30">
            <button type="button" className="bg-[#f4a01c] text-[#040f4f] font-bold py-2 px-6 rounded hover:bg-white transition-colors">
              Submit Zones
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}