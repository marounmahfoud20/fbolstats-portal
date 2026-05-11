import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function ClubEntityDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) notFound();

  const entity = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    shortName: string | null;
    tla: string | null;
    officialName: string | null;
    area: string | null;
    country: string | null;
    type: string | null;
    status: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    city: string | null;
    url: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    founded: string | null;
    clubColors: string | null;
    nicknames: string | null;
    logo: string | null;
  }>>`SELECT "id","name","shortName","tla","officialName","area","country","type","status","address","latitude","longitude","city","url","facebookUrl","instagramUrl","twitterUrl","founded","clubColors","nicknames","logo" FROM "ClubEntity" WHERE "id" = ${id} LIMIT 1`;

  if (entity.length === 0) notFound();

  const teams = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    teamCategory: string | null;
    gender: string | null;
    status: string | null;
  }>>`SELECT "id","name","teamCategory","gender","status" FROM "Team" WHERE "clubEntityId" = ${id} ORDER BY "id" DESC`;
  const e = entity[0];

  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6 flex items-center justify-between">
        <h1 className="text-[#040f4f] font-bold text-lg">Club Details</h1>
        <Link href="/admin/clubentity" className="text-[#040f4f] font-semibold hover:underline">Back</Link>
      </div>

      <div className="bg-white border border-[#040f4f] p-4 flex flex-col md:flex-row gap-6 mb-8 text-[#040f4f] text-sm">
        <div className="w-full md:w-3/5 grid grid-cols-2 gap-y-2">
          <div className="font-bold">Club Entity ID:</div><div>{e.id}</div>
          <div className="font-bold">Club Name:</div><div>{e.name}</div>
          <div className="font-bold">Shortname:</div><div>{e.shortName || 'N/A'}</div>
          <div className="font-bold">TLA:</div><div>{e.tla || 'N/A'}</div>
          <div className="font-bold">Official Name:</div><div>{e.officialName || 'N/A'}</div>
          <div className="font-bold">Area:</div><div>{e.area || 'N/A'}</div>
          <div className="font-bold">Country:</div><div>{e.country || 'N/A'}</div>
          <div className="font-bold">Type/Status:</div><div>{e.type || 'club'} - {e.status || 'active'}</div>
          <div className="font-bold">Address:</div><div>{e.address || 'N/A'}</div>
          <div className="font-bold">Coordinates:</div><div>{e.latitude && e.longitude ? `${e.latitude}, ${e.longitude}` : 'N/A'}</div>
          <div className="font-bold">ZIP + City:</div><div>{e.city || 'N/A'}</div>
          <div className="font-bold">URL:</div><div>{e.url || 'N/A'}</div>
          <div className="font-bold">Facebook:</div><div>{e.facebookUrl || 'N/A'}</div>
          <div className="font-bold">Instagram:</div><div>{e.instagramUrl || 'N/A'}</div>
          <div className="font-bold">Twitter:</div><div>{e.twitterUrl || 'N/A'}</div>
          <div className="font-bold">Founded:</div><div>{e.founded || 'N/A'}</div>
          <div className="font-bold">Club Colors:</div><div>{e.clubColors || 'N/A'}</div>
          <div className="font-bold">Nicknames:</div><div>{e.nicknames || 'N/A'}</div>
        </div>
        <div className="w-full md:w-2/5 flex justify-center items-center">
          <div className="w-48 h-48 border border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
            {e.logo ? <img src={e.logo} alt="Club Logo" className="max-w-full max-h-full object-contain" /> : "No Logo Uploaded"}
          </div>
        </div>
      </div>

      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-3 flex items-center justify-between">
        <h2 className="text-[#040f4f] font-bold">Logo History</h2>
        <Link href={`/admin/clubentity/${e.id}/logo-history`} className="text-[#040f4f] hover:opacity-70" title="View Logo History">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="12" r="3"></circle>
            <path d="M9 12h6"></path>
            <path d="M3 9V7a2 2 0 0 1 2-2h2"></path>
            <path d="M21 9V7a2 2 0 0 0-2-2h-2"></path>
            <path d="M3 15v2a2 2 0 0 0 2 2h2"></path>
            <path d="M21 15v2a2 2 0 0 1-2 2h-2"></path>
          </svg>
        </Link>
      </div>

      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-3 flex items-center justify-between">
        <h2 className="text-[#040f4f] font-bold">Create Teams</h2>
        <Link href={`/admin/clubentity/${e.id}/create-team`} className="text-[#040f4f] hover:opacity-70" title="Create Team">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>
      </div>

      <div className="bg-white border border-[#040f4f] overflow-x-auto">
        <table className="w-full text-sm text-left text-[#040f4f]">
          <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
            <tr>
              <th className="p-2">Team ID</th>
              <th className="p-2">Team Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Gender</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No teams created under this club entity yet.</td></tr>
            ) : teams.map((t) => (
              <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-2"><Link href={`/admin/teams/${t.id}`} className="hover:underline">{t.id}</Link></td>
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.teamCategory || '-'}</td>
                <td className="p-2 capitalize">{t.gender || '-'}</td>
                <td className="p-2">{t.status || '-'}</td>
                <td className="p-2"><Link href={`/admin/teams/${t.id}/edit`} className="text-[#040f4f] hover:underline font-semibold">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
