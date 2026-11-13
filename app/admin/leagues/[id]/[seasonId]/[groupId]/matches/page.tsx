import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function MatchesListPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; seasonId: string; groupId: string }>;
}) {
  const params = await paramsPromise;
  const matches = await prisma.match.findMany({
    where: { groupId: parseInt(params.groupId) },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return (
    <div className="p-4 ml-16 font-sans">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#dfdfdf]">
            <div className="text-[#B40404] font-bold text-lg">
                Group Matches
            </div>
        </div>

        <div className="w-full">
            {matches.map((match, i) => (
                <div key={match.id} className="flex text-xs py-2 border-b border-[#dfdfdf] items-center">
                    <div className="w-8 font-bold text-gray-500">{i + 1}</div>
                    <div className="w-24 font-bold">{match.date}</div>
                    <div className="w-16">{match.time}</div>
                    <div className="w-48 font-bold">{match.teamA}</div>
                    <div className="w-48 font-bold">{match.teamB}</div>
                    <div className="w-48 text-gray-600">{match.venue}</div>
                    <div className="w-24">
                        <span className={`px-2 py-1 rounded ${match.status === 'Played' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                            {match.status}
                        </span>
                    </div>
                </div>
            ))}

            {matches.length === 0 && (
                <div className="p-4 text-center text-gray-500 italic">No matches found for this group.</div>
            )}
        </div>
    </div>
  );
}
