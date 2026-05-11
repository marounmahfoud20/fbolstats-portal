import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { COUNTRIES } from '@/lib/countries';

export default async function ClubEntityPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const whereParts: string[] = [];
  const values: Array<string | number> = [];

  if (searchParams.entityId && Number.isFinite(Number.parseInt(searchParams.entityId, 10))) {
    whereParts.push(`ce."id" = $${values.length + 1}`);
    values.push(Number.parseInt(searchParams.entityId, 10));
  }
  if (searchParams.name) {
    whereParts.push(`ce."name" ILIKE $${values.length + 1}`);
    values.push(`%${searchParams.name}%`);
  }
  if (searchParams.area) {
    whereParts.push(`ce."area" = $${values.length + 1}`);
    values.push(searchParams.area);
  }
  if (searchParams.country) {
    whereParts.push(`ce."country" = $${values.length + 1}`);
    values.push(searchParams.country);
  }
  if (searchParams.status) {
    whereParts.push(`ce."status" = $${values.length + 1}`);
    values.push(searchParams.status);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  let dbUnavailable = false;
  let rawRows: Array<{
    id: number;
    name: string;
    area: string | null;
    country: string | null;
    status: string | null;
    createdAt: Date;
    teamCount: number;
  }> = [];
  try {
    rawRows = await prisma.$queryRawUnsafe(
      `SELECT ce."id", ce."name", ce."area", ce."country", ce."status", ce."createdAt", COALESCE(COUNT(t."id"),0)::int as "teamCount"
        FROM "ClubEntity" ce
        LEFT JOIN "Team" t ON t."clubEntityId" = ce."id"
        ${whereSql}
        GROUP BY ce."id"
        ORDER BY ce."id" DESC`,
      ...values
    ) as Array<{
      id: number;
      name: string;
      area: string | null;
      country: string | null;
      status: string | null;
      createdAt: Date;
      teamCount: number;
    }>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dbUnavailable = true;
    if (!message.includes("Can't reach database server")) {
      console.error("Failed to load club entities:", error);
    }
  }
  const rows = Array.isArray(rawRows) ? rawRows : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Club Entity Search</h1>
        <Link href="/admin/clubentity/add-team" className="text-[#040f4f] hover:opacity-80 transition-opacity" title="Create a new club entity">
          <PlusCircle size={18} />
        </Link>
      </div>

      <div className="bg-white border border-[#040f4f] p-4 max-w-4xl mb-6">
        {dbUnavailable ? (
          <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            Database is currently unreachable. Showing empty results until the connection is restored.
          </div>
        ) : null}
        <form method="GET" action="/admin/clubentity" className="space-y-4 text-sm text-[#040f4f]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Club Entity ID</label>
              <input type="text" name="entityId" defaultValue={searchParams.entityId || ""} className="border border-[#040f4f] p-1.5 w-1/3 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Club Name</label>
              <input type="text" name="name" defaultValue={searchParams.name || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Area</label>
              <input type="text" name="area" defaultValue={searchParams.area || ""} className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Country</label>
              <select name="country" defaultValue={searchParams.country || ""} className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
                <option value=""></option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Status</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" className="accent-[#040f4f]" defaultChecked={!searchParams.status || searchParams.status === 'active'} /> Active</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="defunct" className="accent-[#040f4f]" defaultChecked={searchParams.status === 'defunct'} /> Defunct</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="" className="accent-[#040f4f]" defaultChecked={searchParams.status === ''} /> Both</label>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#040f4f]/20 flex gap-3">
            <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">Search</button>
            <Link href="/admin/clubentity" className="bg-white border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-gray-50 transition-colors">Clear</Link>
          </div>
        </form>
      </div>

      <div className="bg-white border border-[#040f4f] overflow-x-auto">
        <table className="w-full text-sm text-left text-[#040f4f]">
          <thead className="bg-[#f2f2f2] border-b border-[#040f4f]">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Club Entity</th>
              <th className="p-2">Area</th>
              <th className="p-2">Country</th>
              <th className="p-2">Status</th>
              <th className="p-2">Teams</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No club entities found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-2"><Link href={`/admin/clubentity/${row.id}`} className="hover:underline">{row.id}</Link></td>
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.area || '-'}</td>
                <td className="p-2">{row.country || '-'}</td>
                <td className="p-2">{row.status || '-'}</td>
                <td className="p-2">{row.teamCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
