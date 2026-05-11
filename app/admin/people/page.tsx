import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { COUNTRIES, getLegacyCountryIdsForName, resolveCountryName } from '@/lib/countries';
import { genderIcon, nationalityFlag, resolvePositionName } from '@/lib/people-format';

export default async function PeopleSearchPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  
  // Construct Prisma 'where' clause dynamically
  const where: any = {};

  if (searchParams.peopleId) {
    where.id = parseInt(searchParams.peopleId);
  }
  if (searchParams.firstName) {
    where.firstName = { contains: searchParams.firstName, mode: 'insensitive' };
  }
  if (searchParams.lastName) {
    where.lastName = { contains: searchParams.lastName, mode: 'insensitive' };
  }
  if (searchParams.commonName) {
    where.commonName = { contains: searchParams.commonName, mode: 'insensitive' };
  }
  if (searchParams.nationality) {
    const legacyIds = getLegacyCountryIdsForName(searchParams.nationality);
    where.nationality = legacyIds.length > 0
      ? { in: [searchParams.nationality, ...legacyIds] }
      : searchParams.nationality;
  }
  if (searchParams.countryOfBirth) {
    const legacyIds = getLegacyCountryIdsForName(searchParams.countryOfBirth);
    where.countryOfBirth = legacyIds.length > 0
      ? { in: [searchParams.countryOfBirth, ...legacyIds] }
      : searchParams.countryOfBirth;
  }
  if (searchParams.gender && searchParams.gender !== 'both') {
    where.gender = searchParams.gender;
  }
  if (searchParams.type) {
    if (searchParams.type === 'referee') {
      where.isReferee = 'yes';
    } else {
      where.isReferee = { not: 'yes' };
    }
  }

  // Handle DOB search params loosely
  if (searchParams.dobYear) {
    where.dob = { contains: searchParams.dobYear };
  }

  // Only run query if at least one parameter exists, or just return top 200
  const people = await prisma.person.findMany({
    where,
    take: 200,
    orderBy: { id: 'desc' }
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">People Search</h1>
        <Link href="/admin/people/add-person" className="text-[#040f4f] hover:opacity-80 transition-opacity">
          <PlusCircle size={18} />
        </Link>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-[#040f4f] p-4 max-w-4xl mb-6">
        <form method="GET" action="/admin/people" className="space-y-4 text-sm text-[#040f4f]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">People ID</label>
              <input type="text" name="peopleId" defaultValue={searchParams.peopleId || ""} className="border border-[#040f4f] p-1.5 w-1/3 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Firstname</label>
              <input type="text" name="firstName" defaultValue={searchParams.firstName || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Lastname</label>
              <input type="text" name="lastName" defaultValue={searchParams.lastName || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Commonname</label>
              <input type="text" name="commonName" defaultValue={searchParams.commonName || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Date of Birth</label>
              <div className="flex gap-2">
                <input type="text" name="dobDay" defaultValue={searchParams.dobDay || ""} placeholder="DD" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="dobMonth" defaultValue={searchParams.dobMonth || ""} placeholder="MM" className="border border-[#040f4f] p-1.5 w-16 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={2} />
                <input type="text" name="dobYear" defaultValue={searchParams.dobYear || ""} placeholder="YYYY" className="border border-[#040f4f] p-1.5 w-24 text-center outline-none focus:ring-1 focus:ring-[#040f4f]" maxLength={4} />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Country of Birth</label>
              <select name="countryOfBirth" defaultValue={searchParams.countryOfBirth || ""} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
                <option value=""></option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Nationality</label>
              <select name="nationality" defaultValue={searchParams.nationality || ""} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
                <option value=""></option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Gender</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="male" className="accent-[#040f4f]" defaultChecked={searchParams.gender === 'male'} /> Male</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="female" className="accent-[#040f4f]" defaultChecked={searchParams.gender === 'female'} /> Female</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="both" className="accent-[#040f4f]" defaultChecked={!searchParams.gender || searchParams.gender === 'both'} /> Both</label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Type</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="player" className="accent-[#040f4f]" defaultChecked={!searchParams.type || searchParams.type === 'player'} /> Player</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="referee" className="accent-[#040f4f]" defaultChecked={searchParams.type === 'referee'} /> Referee</label>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" name="secondarySport" className="accent-[#040f4f]" />
                Secondary Sport
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#040f4f]/20 flex gap-3">
            <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
              Search
            </button>
            <Link href="/admin/people" className="bg-white border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-gray-50 transition-colors">
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-4">
        <h2 className="text-[#040f4f] font-bold">Search Result (limit = 200 entries)</h2>
      </div>

      <div className="bg-white border border-[#040f4f] overflow-x-auto">
        <table className="w-full text-sm text-left text-[#040f4f]">
          <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Gender</th>
              <th className="p-2">Firstname</th>
              <th className="p-2">Lastname</th>
              <th className="p-2">Common name</th>
              <th className="p-2">DOB</th>
              <th className="p-2">Nationality</th>
              <th className="p-2">Position</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No people found matching your criteria.
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 font-semibold">
                    <Link href={`/admin/people/${person.id}`} className="hover:underline">
                      {person.id}
                    </Link>
                  </td>
                  <td className="p-2 text-center" title={person.gender || '-'}>{genderIcon(person.gender)}</td>
                  <td className="p-2">{person.firstName || '-'}</td>
                  <td className="p-2">{person.lastName || '-'}</td>
                  <td className="p-2">{person.commonName || '-'}</td>
                  <td className="p-2">{person.dob || '-'}</td>
                  <td className="p-2">
                    {resolveCountryName(person.nationality) ? `${nationalityFlag(person.nationality)} ${resolveCountryName(person.nationality)}` : '-'}
                  </td>
                  <td className="p-2">{resolvePositionName(person.position) || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
