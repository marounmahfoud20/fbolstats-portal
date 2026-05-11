import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import PlaceOfBirthInput from "@/components/PlaceOfBirthInput";
import AddressMapPicker from "@/components/AddressMapPicker";
import { COUNTRIES } from "@/lib/countries";

export default function AddVenuePage() {
  async function createVenue(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string | null)?.trim() || "";
    if (!name) return;

    const capacityRaw = (formData.get("capacity") as string | null)?.trim() || "";
    const capacity = capacityRaw ? parseInt(capacityRaw) : null;

    await prisma.venue.create({
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
    redirect("/admin/venues");
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold text-[#040f4f]">Add Venue</h1>
        </div>

        <form action={createVenue} className="grid grid-cols-1 gap-4 border border-[#040f4f] bg-white p-5 text-sm text-[#040f4f]">
          <div>
            <label className="mb-1 block font-semibold">Venue Name</label>
            <input name="name" required className="w-full border border-[#040f4f] p-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold">City</label>
              <PlaceOfBirthInput
                name="city"
                countryFieldName="country"
                placeholder="Type City / Village"
                className="w-full border border-[#040f4f] p-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Country</label>
              <select name="country" className="w-full border border-[#040f4f] p-2 bg-white">
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
              googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ""}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block font-semibold">Capacity</label>
              <input name="capacity" type="number" min={0} className="w-full border border-[#040f4f] p-2" />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Surface</label>
              <select name="surface" defaultValue="" className="w-full border border-[#040f4f] p-2 bg-white">
                <option value=""></option>
                <option value="Grass">Grass</option>
                <option value="Turf">Turf</option>
                <option value="Sand">Sand</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold">Status</label>
              <select name="status" defaultValue="active" className="w-full border border-[#040f4f] p-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <button type="submit" className="border border-[#040f4f] bg-[#f4a01c] px-6 py-2 font-bold text-[#040f4f]">
              Save Venue
            </button>
            <a href="/admin/venues" className="border border-[#040f4f] bg-white px-6 py-2 font-bold text-[#040f4f]">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
