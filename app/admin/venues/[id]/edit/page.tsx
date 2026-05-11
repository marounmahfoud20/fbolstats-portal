import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import PlaceOfBirthInput from "@/components/PlaceOfBirthInput";
import AddressMapPicker from "@/components/AddressMapPicker";
import { COUNTRIES } from "@/lib/countries";

export default async function EditVenuePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const venueId = parseInt(params.id);
  if (Number.isNaN(venueId)) notFound();

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) notFound();

  async function updateVenue(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string | null)?.trim() || "";
    if (!name) return;

    const capacityRaw = (formData.get("capacity") as string | null)?.trim() || "";
    const capacity = capacityRaw ? parseInt(capacityRaw) : null;

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        name,
        city: ((formData.get("city") as string | null)?.trim() || null),
        country: ((formData.get("country") as string | null)?.trim() || null),
        address: ((formData.get("address") as string | null)?.trim() || null),
        capacity: capacity && !Number.isNaN(capacity) ? capacity : null,
        surface: ((formData.get("surface") as string | null)?.trim() || null),
        status: ((formData.get("status") as string | null)?.trim() || "active"),
      },
    });

    revalidatePath("/admin/venues");
    revalidatePath(`/admin/venues/${venueId}/edit`);
    redirect("/admin/venues");
  }

  async function deleteVenue() {
    "use server";

    const venueToDelete = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });

    if (!venueToDelete) {
      redirect("/admin/venues");
    }

    const usedInMatches = await prisma.match.count({
      where: {
        venue: {
          equals: venueToDelete.name,
          mode: "insensitive",
        },
      },
    });

    if (usedInMatches > 0) {
      const message = encodeURIComponent("This stadium is already used in game(s) and cannot be deleted.");
      redirect(`/admin/venues/${venueId}/edit?error=${message}`);
    }

    await prisma.venue.delete({ where: { id: venueId } });
    revalidatePath("/admin/venues");
    redirect("/admin/venues");
  }

  const errorMessage = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold text-[#040f4f]">Edit Venue #{venue.id}</h1>
          <Link href="/admin/venues" className="text-sm font-semibold text-[#040f4f] underline">
            Back
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <form action={updateVenue} className="grid grid-cols-1 gap-4 border border-[#040f4f] bg-white p-5 text-sm text-[#040f4f]">
          <div>
            <label className="mb-1 block font-semibold">Venue Name</label>
            <input name="name" required defaultValue={venue.name} className="w-full border border-[#040f4f] p-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold">City</label>
              <PlaceOfBirthInput
                name="city"
                countryFieldName="country"
                defaultValue={venue.city || ""}
                placeholder="Type City / Village"
                className="w-full border border-[#040f4f] p-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Country</label>
              <select name="country" defaultValue={venue.country || ""} className="w-full border border-[#040f4f] p-2 bg-white">
                <option value=""></option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block font-semibold">Address</label>
            <AddressMapPicker
              name="address"
              defaultValue={venue.address || ""}
              googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block font-semibold">Capacity</label>
              <input name="capacity" type="number" min={0} defaultValue={venue.capacity ?? ""} className="w-full border border-[#040f4f] p-2" />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Surface</label>
              <select name="surface" defaultValue={venue.surface || ""} className="w-full border border-[#040f4f] p-2 bg-white">
                <option value=""></option>
                <option value="Grass">Grass</option>
                <option value="Turf">Turf</option>
                <option value="Sand">Sand</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold">Status</label>
              <select name="status" defaultValue={venue.status || "active"} className="w-full border border-[#040f4f] p-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <button type="submit" className="border border-[#040f4f] bg-[#f4a01c] px-6 py-2 font-bold text-[#040f4f]">
              Save Changes
            </button>
            <Link href="/admin/venues" className="border border-[#040f4f] bg-white px-6 py-2 font-bold text-[#040f4f]">
              Cancel
            </Link>
          </div>
        </form>
        <form action={deleteVenue} className="mt-4 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <div className="mb-2 font-semibold">Danger Zone</div>
          <p className="mb-3">Delete this stadium permanently.</p>
          <button
            type="submit"
            className="border border-red-700 bg-white px-4 py-2 font-bold text-red-700 hover:bg-red-700 hover:text-white"
          >
            Delete Stadium
          </button>
        </form>
      </div>
    </div>
  );
}
