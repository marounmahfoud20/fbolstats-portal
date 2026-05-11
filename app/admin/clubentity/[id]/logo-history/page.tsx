import { notFound } from 'next/navigation';
import Link from 'next/link';
import { addClubEntityLogoHistory, deleteClubEntityLogoHistory, updateClubEntityLogoHistory } from '@/lib/actions';
import prisma from '@/lib/prisma';

export default async function ClubEntityLogoHistoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) notFound();

  const entity = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT "id", "name" FROM "ClubEntity" WHERE "id" = ${id} LIMIT 1`;
  if (entity.length === 0) notFound();

  const logos = await prisma.$queryRaw<Array<{
    id: number;
    logoPath: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
  }>>`SELECT "id","logoPath","status","startDate","endDate","isCurrent" FROM "ClubEntityLogoHistory" WHERE "clubEntityId" = ${id} ORDER BY "createdAt" DESC`;

  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6 flex items-center justify-between">
        <h1 className="text-[#040f4f] font-bold text-lg">Logo History - {entity[0].name}</h1>
        <Link href={`/admin/clubentity/${id}`} className="text-[#040f4f] font-semibold hover:underline">Back To Club Details</Link>
      </div>

      <form action={addClubEntityLogoHistory} className="bg-white border border-[#040f4f] p-4 mb-4 text-sm text-[#040f4f] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <input type="hidden" name="clubEntityId" value={id} />
        <div className="flex flex-col md:col-span-2">
          <label className="font-semibold mb-1">Upload Logo</label>
          <input type="file" name="logo" required className="text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[#f4a01c] file:text-[#040f4f] hover:file:bg-[#d6d6d6]" />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Status</label>
          <select name="status" defaultValue="active" className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-4 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">Add Logo</button>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Start Date</label>
          <input type="date" name="startDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">End Date</label>
          <input type="date" name="endDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
        </div>
      </form>

      <div className="bg-white border border-[#040f4f] p-3 mb-8">
        {logos.length === 0 ? (
          <div className="text-gray-500 text-sm">No logo history entries.</div>
        ) : (
          <div className="space-y-2">
            {logos.map((logo) => (
              <div key={logo.id} className="border border-gray-200 p-2 text-sm text-[#040f4f]">
                <div className="flex items-center gap-3 mb-2">
                  <img src={logo.logoPath} alt={`Logo ${logo.id}`} className="h-10 w-10 object-contain" />
                  <div className="flex-1">
                    <div className="font-semibold capitalize">{logo.status} {logo.isCurrent ? "(Current)" : ""}</div>
                    <div className="text-xs">{logo.startDate || "-"} to {logo.endDate || "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <form action={updateClubEntityLogoHistory} className="border border-[#040f4f]/20 p-2 grid grid-cols-1 gap-2">
                    <input type="hidden" name="clubEntityId" value={id} />
                    <input type="hidden" name="logoHistoryId" value={logo.id} />
                    <input type="hidden" name="status" value={logo.status} />
                    <div className="font-semibold text-xs">Edit Logo</div>
                    <input type="file" name="logo" className="text-xs file:mr-2 file:py-1 file:px-2 file:border-0 file:text-xs file:font-semibold file:bg-[#f4a01c] file:text-[#040f4f]" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" name="startDate" defaultValue={logo.startDate || ""} className="border border-[#040f4f] p-1 text-xs outline-none focus:ring-1 focus:ring-[#040f4f]" />
                      <input type="date" name="endDate" defaultValue={logo.endDate || ""} disabled={logo.status === 'active'} className="border border-[#040f4f] p-1 text-xs outline-none focus:ring-1 focus:ring-[#040f4f] disabled:bg-gray-100 disabled:text-gray-400" />
                    </div>
                    <button type="submit" className="w-fit bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-3 py-1 text-xs hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">Save</button>
                  </form>
                  <form action={deleteClubEntityLogoHistory} className="border border-red-200 p-2 flex flex-col justify-between">
                    <input type="hidden" name="clubEntityId" value={id} />
                    <input type="hidden" name="logoHistoryId" value={logo.id} />
                    <div className="text-xs">Delete this logo entry permanently.</div>
                    <button type="submit" className="mt-2 w-fit bg-white border border-red-500 text-red-600 font-bold px-3 py-1 text-xs hover:bg-red-600 hover:text-white transition-colors">Delete</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
