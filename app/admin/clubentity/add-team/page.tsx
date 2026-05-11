import { createClubEntity } from '@/lib/actions';
import PlaceOfBirthInput from '@/components/PlaceOfBirthInput';
import AddressMapPicker from '@/components/AddressMapPicker';
import { COUNTRIES } from '@/lib/countries';

export default function AddClubEntityPage() {
  return (
    <div className="p-6">
      <div className="bg-[#f4a01c] border border-[#040f4f] p-3 mb-6">
        <h1 className="text-[#040f4f] font-bold text-lg">Add New Club Entity</h1>
      </div>

      <form action={createClubEntity} className="bg-white border border-[#040f4f] p-4 max-w-4xl space-y-4 text-sm text-[#040f4f]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Club Name</label>
            <input type="text" name="name" required className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Short Name</label>
            <input type="text" name="shortName" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">TLA (Abbreviation)</label>
            <input type="text" name="tla" maxLength={3} className="border border-[#040f4f] p-1.5 w-24 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Official Name</label>
            <input type="text" name="officialName" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Area</label>
            <PlaceOfBirthInput name="area" countryFieldName="country" placeholder="Type area / village" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f] w-full" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Country</label>
            <select name="country" className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
              <option value=""></option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Type</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="club" className="accent-[#040f4f]" defaultChecked /> Club</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="type" value="national" className="accent-[#040f4f]" /> National</label>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Status</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" className="accent-[#040f4f]" defaultChecked /> Active</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="defunct" className="accent-[#040f4f]" /> Defunct</label>
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">Address</label>
            <AddressMapPicker
              name="address"
              placeholder="Search address or click on map"
              className="outline-none focus:ring-1 focus:ring-[#040f4f]"
              cityFieldName="city"
              countryFieldName="country"
              googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ""}
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">ZIP + City</label>
            <input type="text" name="city" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">URL</label>
            <input type="url" name="url" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Facebook</label>
            <input type="url" name="facebookUrl" placeholder="https://facebook.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Instagram</label>
            <input type="url" name="instagramUrl" placeholder="https://instagram.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Twitter</label>
            <input type="url" name="twitterUrl" placeholder="https://x.com/..." className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Founded</label>
            <input type="text" name="founded" className="border border-[#040f4f] p-1.5 w-32 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Club Colors</label>
            <input type="text" name="clubColors" placeholder="#F4A01C, #040F4F" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Nicknames</label>
            <input type="text" name="nicknames" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Logo Upload</label>
            <input type="file" name="logo" className="text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[#f4a01c] file:text-[#040f4f] hover:file:bg-[#d6d6d6]" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Logo Status</label>
            <select name="logoStatus" defaultValue="active" className="border border-[#040f4f] p-1.5 bg-white outline-none focus:ring-1 focus:ring-[#040f4f]">
              <option value="active">Active</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Logo Start Date</label>
            <input type="date" name="logoStartDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Logo End Date</label>
            <input type="date" name="logoEndDate" className="border border-[#040f4f] p-1.5 outline-none focus:ring-1 focus:ring-[#040f4f]" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#040f4f]/20">
          <button type="submit" className="bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] font-bold px-6 py-2 hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
            Create Club Entity
          </button>
        </div>
      </form>
    </div>
  );
}
