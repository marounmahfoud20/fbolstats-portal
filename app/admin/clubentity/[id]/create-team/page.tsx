import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createTeamForClubEntity } from '@/lib/actions';
import prisma from '@/lib/prisma';

const TEAM_CATEGORIES = ['Men', 'Women', 'Youth Men', 'Youth Women'];

export default async function CreateTeamPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) notFound();

  const entity = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT "id", "name" FROM "ClubEntity" WHERE "id" = ${id} LIMIT 1`;
  if (entity.length === 0) notFound();

  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6 flex items-center justify-between">
        <h1 className="text-[#040f4f] font-bold text-lg">Create Teams - {entity[0].name}</h1>
        <Link href={`/admin/clubentity/${id}`} className="text-[#040f4f] font-semibold hover:underline">Back To Club Details</Link>
      </div>

      <form action={createTeamForClubEntity} className="bg-white border border-[#040f4f] p-4 mb-8 text-sm text-[#040f4f] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <input type="hidden" name="clubEntityId" value={id} />
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Team Category</label>
          <select name="teamCategory" required className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
            <option value="">Select</option>
            {TEAM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col md:col-span-2">
          <label className="font-semibold mb-1">Official Team Name</label>
          <input type="text" name="name" required placeholder="This will be saved as official name" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
        </div>
        <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-4 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">Add Team</button>
      </form>
    </div>
  );
}
