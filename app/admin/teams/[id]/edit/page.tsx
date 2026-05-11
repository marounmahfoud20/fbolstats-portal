import { updateTeam } from '@/lib/actions';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PlaceOfBirthInput from '@/components/PlaceOfBirthInput';
import { COUNTRIES } from '@/lib/countries';

export default async function EditTeamPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = parseInt(params.id);
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) notFound();

  const logos = await prisma.$queryRaw<Array<{
    id: number;
    logoPath: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
  }>>`SELECT "id","logoPath","status","startDate","endDate","isCurrent" FROM "TeamLogoHistory" WHERE "teamId" = ${teamId} ORDER BY "createdAt" DESC`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Edit Team (ID: {team.id})</h1>
      </div>

      <form action={updateTeam} className="bg-white border border-[#040f4f] p-4 max-w-4xl space-y-4 text-sm text-[#040f4f]">
        <input type="hidden" name="id" value={team.id} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Club Name</label>
            <input type="text" name="name" defaultValue={team.name} required className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Short Name</label>
            <input type="text" name="shortName" defaultValue={team.shortName || ''} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">TLA (Abbreviation)</label>
            <input type="text" name="tla" maxLength={3} defaultValue={team.tla || ''} className="border border-[#040f4f] p-1.5 w-24 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Official Name</label>
            <input type="text" name="officialName" defaultValue={team.officialName || ''} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Area</label>
            <PlaceOfBirthInput
              name="area"
              defaultValue={team.area || ''}
              countryFieldName="country"
              placeholder="Type area / village"
              className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f] w-full"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Country</label>
            <select name="country" defaultValue={team.country || ''} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
              <option value=""></option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Type</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="club" className="accent-[#040f4f]" defaultChecked={team.type === 'club'} /> Club Team</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="national" className="accent-[#040f4f]" defaultChecked={team.type === 'national'} /> National Team</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="selection" className="accent-[#040f4f]" defaultChecked={team.type === 'selection'} /> Selection</label>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Status</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" className="accent-[#040f4f]" defaultChecked={team.status === 'active'} /> Active</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="defunct" className="accent-[#040f4f]" defaultChecked={team.status === 'defunct'} /> Defunct</label>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Gender</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="male" className="accent-[#040f4f]" defaultChecked={team.gender === 'male'} /> Male</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="female" className="accent-[#040f4f]" defaultChecked={team.gender === 'female'} /> Female</label>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Address</label>
            <input type="text" name="address" defaultValue={team.address || ''} placeholder="Paste Google Maps URL or coordinates (lat,lng)" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">ZIP + City</label>
            <input type="text" name="city" defaultValue={team.city || ''} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">URL</label>
            <input type="url" name="url" defaultValue={team.url || ''} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Facebook</label>
            <input type="url" name="facebookUrl" defaultValue={team.facebookUrl || ''} placeholder="https://facebook.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Instagram</label>
            <input type="url" name="instagramUrl" defaultValue={team.instagramUrl || ''} placeholder="https://instagram.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Twitter</label>
            <input type="url" name="twitterUrl" defaultValue={team.twitterUrl || ''} placeholder="https://x.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Founded</label>
            <input type="text" name="founded" defaultValue={team.founded || ''} className="border border-[#040f4f] p-1.5 w-32 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Club Colors</label>
            <input type="text" name="clubColors" defaultValue={team.clubColors || ''} placeholder="#F4A01C, #040F4F" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Nicknames</label>
            <input type="text" name="nicknames" defaultValue={team.nicknames || ''} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Upload New Logo</label>
            <input type="file" name="logo" className="text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[#f4a01c] file:text-[#040f4f] hover:file:bg-[#d6d6d6]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">New Logo Status</label>
            <select name="logoStatus" defaultValue="active" className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
              <option value="active">Active</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">New Logo Start Date</label>
            <input type="date" name="logoStartDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">New Logo End Date</label>
            <input type="date" name="logoEndDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>
        </div>

        <div className="mt-6 border border-[#040f4f] bg-white p-3">
          <h2 className="mb-2 font-bold text-[#040f4f]">Logo History</h2>
          {logos.length === 0 ? (
            <div className="text-xs text-gray-500">No logo history entries yet.</div>
          ) : (
            <div className="space-y-2 text-xs text-[#040f4f]">
              {logos.map((logo) => (
                <div key={logo.id} className="flex items-center gap-3 border border-gray-200 p-2">
                  <img src={logo.logoPath} alt={`Logo ${logo.id}`} className="h-10 w-10 object-contain" />
                  <div className="flex-1">
                    <div className="font-semibold">{logo.status} {logo.isCurrent ? "(Current)" : ""}</div>
                    <div>{logo.startDate || "-"} to {logo.endDate || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#040f4f]/20">
          <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Update Team
          </button>
        </div>
      </form>
    </div>
  );
}
