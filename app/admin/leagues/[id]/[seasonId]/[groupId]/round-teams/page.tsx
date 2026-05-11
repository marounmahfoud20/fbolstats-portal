import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function RoundTeamsPage({
  params,
}: {
  params: { id: string; seasonId: string; groupId: string };
}) {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-4 ml-16 font-sans">
      <div className="flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] text-[#040f4f] p-2 rounded-lg mb-4">
        <span className="font-bold">Add/Edit Round Teams</span>
        <div className="text-xs space-x-4">
            <span className="cursor-pointer hover:underline">Select All</span>
            <span className="cursor-pointer hover:underline">Deselect All</span>
        </div>
      </div>

      <form action="/api/round-teams/update" method="POST">
        <input type="hidden" name="groupId" value={params.groupId} />
        
        <div className="grid grid-cols-3 gap-y-2 gap-x-4">
            {teams.map((team) => (
                <div key={team.id} className="flex items-center gap-2 p-1 hover:bg-gray-50">
                    <input 
                        type="checkbox" 
                        name="teamIds" 
                        value={team.id} 
                        className="w-4 h-4"
                    />
                    <span className="text-sm">{team.name}</span>
                </div>
            ))}
        </div>

        <div className="mt-6 border-t pt-4">
            <button type="submit" className="bg-[#f4a01c] border border-gray-400 px-4 py-1 rounded text-sm">
                Submit
            </button>
        </div>
      </form>
    </div>
  );
}