import Link from "next/link";
import prisma from "@/lib/prisma";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VenuesPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const where: {
    id?: number;
    name?: { contains: string; mode: "insensitive" };
    city?: { contains: string; mode: "insensitive" };
    country?: { contains: string; mode: "insensitive" };
    status?: string;
  } = {};

  if (searchParams.venueId) {
    const id = parseInt(searchParams.venueId);
    if (!Number.isNaN(id)) where.id = id;
  }
  if (searchParams.name) where.name = { contains: searchParams.name, mode: "insensitive" };
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
  if (searchParams.country) where.country = { contains: searchParams.country, mode: "insensitive" };
  if (searchParams.status) where.status = searchParams.status;

  const venues = await prisma.venue.findMany({
    where,
    take: 200,
    orderBy: { id: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between border border-[#040f4f] bg-[#f4a01c] p-3">
        <h1 className="text-lg font-bold text-[#040f4f]">Venue Search</h1>
        <Link href="/admin/venues/add" title="Create New Venue" className="text-[#040f4f] hover:opacity-80">
          <PlusCircle size={18} />
        </Link>
      </div>

      <div className="mb-6 border border-[#040f4f] bg-white p-4">
        <form method="GET" action="/admin/venues" className="grid grid-cols-1 gap-4 text-sm text-[#040f4f] md:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold">Venue ID</label>
            <input name="venueId" defaultValue={searchParams.venueId || ""} className="w-32 border border-[#040f4f] p-1.5" />
          </div>
          <div>
            <label className="mb-1 block font-semibold">Venue Name</label>
            <input name="name" defaultValue={searchParams.name || ""} className="w-full border border-[#040f4f] p-1.5" />
          </div>
          <div>
            <label className="mb-1 block font-semibold">City</label>
            <input name="city" defaultValue={searchParams.city || ""} className="w-full border border-[#040f4f] p-1.5" />
          </div>
          <div>
            <label className="mb-1 block font-semibold">Country</label>
            <input name="country" defaultValue={searchParams.country || ""} className="w-full border border-[#040f4f] p-1.5" />
          </div>
          <div>
            <label className="mb-1 block font-semibold">Status</label>
            <select name="status" defaultValue={searchParams.status || ""} className="w-full border border-[#040f4f] p-1.5">
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button type="submit" className="border border-[#040f4f] bg-[#f4a01c] px-6 py-2 font-bold text-[#040f4f]">
              Search
            </button>
            <Link href="/admin/venues" className="border border-[#040f4f] bg-white px-6 py-2 font-bold text-[#040f4f]">
              Clear
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto border border-[#040f4f] bg-white">
        <table className="w-full text-left text-sm text-[#040f4f]">
          <thead className="border-b border-[#040f4f] bg-[#f2f2f2]">
            <tr>
              <th className="p-2"></th>
              <th className="p-2">ID</th>
              <th className="p-2">Venue Name</th>
              <th className="p-2">City</th>
              <th className="p-2">Country</th>
              <th className="p-2">Capacity</th>
              <th className="p-2">Surface</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No venues found.
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2">
                    <Link href={`/admin/venues/${venue.id}/edit`} className="text-blue-700 hover:underline">
                      Edit
                    </Link>
                  </td>
                  <td className="p-2">{venue.id}</td>
                  <td className="p-2">{venue.name}</td>
                  <td className="p-2">{venue.city || "-"}</td>
                  <td className="p-2">{venue.country || "-"}</td>
                  <td className="p-2">{venue.capacity ?? "-"}</td>
                  <td className="p-2">{venue.surface || "-"}</td>
                  <td className="p-2 capitalize">{venue.status || "active"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
