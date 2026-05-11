import CategoryRow from "./CategoryRow";
import prisma from "@/lib/prisma";
import ManageRow from "./ManageRow";
import { createCompetitionCategory, createLeague } from "@/lib/actions";

export default async function ManagePage() {
  // Fetch all leagues, sorting them by type first, then alphabetically
  const leagues = await prisma.$queryRaw<Array<{
    id: number;
    competitionName: string;
    type: string;
    footballType: string;
  }>>`
    SELECT
      "id",
      "competitionName",
      "type",
      COALESCE("footballType", 'club') AS "footballType"
    FROM "League"
    ORDER BY COALESCE("footballType", 'club') ASC, "type" ASC, "competitionName" ASC
  `;
  let savedCategories: Array<{ name: string; footballType: string }> = [];
  try {
    savedCategories = await prisma.$queryRaw<Array<{ name: string; footballType: string }>>`
      SELECT "name", COALESCE("footballType", 'club') AS "footballType"
      FROM "LeagueCategory"
      ORDER BY "name" ASC
    `;
  } catch {
    savedCategories = [];
  }

  // Extract unique categories for the Datalist
  const categories = Array.from(new Set([
    ...leagues.map((l) => l.type),
    ...savedCategories.map((c) => c.name),
  ]));
  const clubCategories = Array.from(new Set([
    ...leagues.filter((l) => l.footballType !== "national").map((l) => l.type),
    ...savedCategories.filter((c) => c.footballType !== "national").map((c) => c.name),
  ]));
  const nationalCategories = Array.from(new Set([
    ...leagues.filter((l) => l.footballType === "national").map((l) => l.type),
    ...savedCategories.filter((c) => c.footballType === "national").map((c) => c.name),
  ]));

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between border border-[#040f4f] bg-[#f4a01c] p-3">
          <h1 className="text-lg font-bold text-[#040f4f]">Manage Competitions</h1>
          <span className="text-xs font-semibold text-[#040f4f]">Database Settings</span>
        </div>

        <datalist id="manage-categories">
          {categories.map((c) => (
             <option key={c as string} value={c as string} />
          ))}
        </datalist>

        <div className="mb-8 border border-[#040f4f] bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-[#040f4f]">Add New Competition</h2>
          <form action={createLeague} className="flex flex-col gap-4 text-sm text-[#040f4f]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
              <div>
                <label className="mb-1 block font-semibold">Competition Name</label>
                <input 
                  name="competitionName" 
                  placeholder="e.g. Lebanese Futsal League" 
                  className="w-full border border-[#040f4f] p-2 outline-none focus:ring-1 focus:ring-[#040f4f]" 
                  required 
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Category</label>
                <input 
                  name="type" 
                  list="manage-categories" 
                  placeholder="Select or type new..." 
                  className="w-full border border-[#040f4f] p-2 outline-none focus:ring-1 focus:ring-[#040f4f]" 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold">Football Type</label>
                <div className="mt-1 flex gap-6 rounded border border-[#040f4f]/25 bg-[#f8fafc] px-3 py-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#040f4f]">
                    <input type="radio" name="footballType" value="club" defaultChecked className="accent-[#040f4f]" />
                    Club Football
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#040f4f]">
                    <input type="radio" name="footballType" value="national" className="accent-[#040f4f]" />
                    National Team Football
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="mt-2 w-fit border border-[#040f4f] bg-[#f4a01c] px-6 py-2 font-bold text-[#040f4f] hover:bg-[#040f4f] hover:text-[#f4a01c] transition-colors">
              Create Competition
            </button>
          </form>
        </div>

        <div className="mb-8 border border-[#040f4f] bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-[#040f4f]">Add New Category</h2>
          <form action={createCompetitionCategory} className="grid grid-cols-1 gap-4 text-sm text-[#040f4f] md:max-w-2xl">
            <div>
              <label className="mb-1 block font-semibold">Category Name</label>
              <input
                name="name"
                placeholder="e.g. Futsal Men"
                className="w-full border border-[#040f4f] p-2 outline-none focus:ring-1 focus:ring-[#040f4f]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">Football Type</label>
              <div className="mt-1 flex gap-6 rounded border border-[#040f4f]/25 bg-[#f8fafc] px-3 py-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#040f4f]">
                  <input type="radio" name="footballType" value="club" defaultChecked className="accent-[#040f4f]" />
                  Club Football
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#040f4f]">
                  <input type="radio" name="footballType" value="national" className="accent-[#040f4f]" />
                  National Team Football
                </label>
              </div>
            </div>
            <button type="submit" className="h-[42px] w-fit border border-[#040f4f] bg-[#f4a01c] px-6 font-bold text-[#040f4f] transition-colors hover:bg-[#040f4f] hover:text-[#f4a01c]">
              Add Category
            </button>
          </form>
        </div>
        
        <div className="mb-8">
          <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Edit Categories</div>
          <p className="mb-4 text-xs text-[#040f4f]/80">Renaming a category here updates all competitions in that category.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#040f4f]/80">Club Football Categories</div>
              <div className="grid grid-cols-1 gap-3">
                {clubCategories.map((c) => (
                  <CategoryRow key={`club-${c as string}`} category={c as string} footballType="club" />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#040f4f]/80">National Team Categories</div>
              <div className="grid grid-cols-1 gap-3">
                {nationalCategories.map((c) => (
                  <CategoryRow key={`national-${c as string}`} category={c as string} footballType="national" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 border border-[#040f4f] bg-[#f4a01c] p-2 font-bold text-[#040f4f]">Existing Competitions</div>
          <div className="flex flex-col">
            {leagues.length === 0 ? (
              <p className="border border-[#040f4f] bg-white p-4 text-sm italic text-[#040f4f]/70">No competitions found.</p>
            ) : (
              leagues.map((league) => (
                <ManageRow key={league.id} league={league} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
