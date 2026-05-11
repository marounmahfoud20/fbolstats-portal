import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function TeamSearchPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;

  const where: any = {};

  if (searchParams.teamId) {
    where.id = parseInt(searchParams.teamId);
  }
  if (searchParams.clubName) {
    where.name = { contains: searchParams.clubName, mode: 'insensitive' };
  }
  if (searchParams.area) {
    where.area = searchParams.area;
  }
  if (searchParams.type) {
    where.type = searchParams.type;
  }
  if (searchParams.status) {
    where.status = searchParams.status;
  }
  if (searchParams.gender && searchParams.gender !== 'both') {
    where.gender = searchParams.gender;
  }

  let teams: any[] = [];
  try {
    teams = await prisma.team.findMany({
      where,
      take: 100,
      orderBy: { id: 'desc' }
    });
  } catch (e) {
    console.error("Prisma query failed", e);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Team Search</h1>
        <Link href="/admin/teams/add-team" className="text-[#040f4f] hover:opacity-80 transition-opacity" title="Create a new team">
          <PlusCircle size={18} />
        </Link>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-[#040f4f] p-4 max-w-4xl mb-6">
        <form method="GET" action="/admin/teams" className="space-y-4 text-sm text-[#040f4f]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Team ID</label>
              <input type="text" name="teamId" defaultValue={searchParams.teamId || ""} className="border border-[#040f4f] p-1.5 w-1/3 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Club Name</label>
              <input type="text" name="clubName" defaultValue={searchParams.clubName || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Area</label>
              <select name="area" defaultValue={searchParams.area || ""} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
                <option value=""></option>
                <option value="LB">Lebanon</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Type</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="club" className="accent-[#040f4f]" defaultChecked={!searchParams.type || searchParams.type === 'club'} /> Club Team</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="national" className="accent-[#040f4f]" defaultChecked={searchParams.type === 'national'} /> National Team</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="selection" className="accent-[#040f4f]" defaultChecked={searchParams.type === 'selection'} /> Selection</label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Status</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" className="accent-[#040f4f]" defaultChecked={!searchParams.status || searchParams.status === 'active'} /> Active</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="defunct" className="accent-[#040f4f]" defaultChecked={searchParams.status === 'defunct'} /> Defunct</label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Gender</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="male" className="accent-[#040f4f]" defaultChecked={searchParams.gender === 'male'} /> Male</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="female" className="accent-[#040f4f]" defaultChecked={searchParams.gender === 'female'} /> Female</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="both" className="accent-[#040f4f]" defaultChecked={!searchParams.gender || searchParams.gender === 'both'} /> Both</label>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#040f4f]/20 flex gap-3">
            <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
              Search
            </button>
            <Link href="/admin/teams" className="bg-white border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-gray-50 transition-colors">
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4">
        <h2 className="text-[#040f4f] font-bold">Search Result (limit = 100 entries)</h2>
      </div>

      <div className="bg-white border border-[#040f4f] overflow-x-auto">
        <table className="w-full text-sm text-left text-[#040f4f]">
          <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
            <tr>
              <th className="p-2 w-10"></th>
              <th className="p-2">ID</th>
              <th className="p-2">Gender</th>
              <th className="p-2">Team Name</th>
              <th className="p-2">Short Name</th>
              <th className="p-2">Abbreviation</th>
              <th className="p-2">Area</th>
              <th className="p-2">City</th>
              <th className="p-2">Status</th>
              <th className="p-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No teams found matching your criteria.
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 text-center">
                    <Link href={`/admin/teams/${team.id}`} title="View Team" className="text-[#040f4f] hover:opacity-70 inline-block">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                  </td>
                  <td className="p-2">{team.id}</td>
                  <td className="p-2 capitalize">{team.gender || '-'}</td>
                  <td className="p-2">{team.name}</td>
                  <td className="p-2">{team.shortName || '-'}</td>
                  <td className="p-2">{team.tla || '-'}</td>
                  <td className="p-2">{team.area || '-'}</td>
                  <td className="p-2">{team.city || '-'}</td>
                  <td className="p-2">{team.status || '-'}</td>
                  <td className="p-2">{team.type || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
