import prisma from "@/lib/prisma";
import RetroLeagueView from "./RetroLeagueView";

// Note the change here: params is now a Promise
export default async function LeagueDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. We must 'await' the params to unpack the URL first
  const resolvedParams = await params;
  
  // 2. Now we can safely turn the ID into a number
  const leagueId = parseInt(resolvedParams.id);

  // Fetch the specific league requested in the URL
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      seasons: {
        orderBy: { id: 'desc' }
      }
    }
  });

  // If someone types a random ID that doesn't exist, show this:
  if (!league) {
    return (
      <div className="min-h-screen bg-white p-10 font-bold text-red-600 flex justify-center pt-20">
        404 - League not found in database.
      </div>
    );
  }

  // If found, load the Retro layout we built!
  return <RetroLeagueView league={league} />;
}