import { createEntityMetadata } from "@/lib/page-metadata";

export const generateMetadata = createEntityMetadata("Edit Lineups", "match");

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditLineupForm from "./EditLineupForm";
import { getEditionShirtNumbers } from "@/lib/edition-shirt-numbers";

export default async function EditLineupsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);
  if (isNaN(matchId)) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      appearances: true,
      shirts: true,
      group: true,
    }
  });

  if (!match) notFound();

  const teamA = await prisma.team.findFirst({
    where: { name: match.teamA },
    include: {
      memberships: {
        include: { person: true }
      }
    }
  });

  const teamB = await prisma.team.findFirst({
    where: { name: match.teamB },
    include: {
      memberships: {
        include: { person: true }
      }
    }
  });

  const suggestedShirts = await getEditionShirtNumbers(prisma, {
    matchId, seasonId: match.group.seasonId, date: match.date,
    teamIds: [teamA?.id, teamB?.id].filter((id): id is number => id != null),
  });

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href={`/admin/matches/${matchId}`} className="text-[#f4a01c] hover:underline mb-4 inline-block font-bold text-base">&larr; Back to Match</Link>
        <h1 className="text-2xl font-bold mb-6">Edit Lineups: {match.teamA} vs {match.teamB}</h1>
        
        <EditLineupForm 
          key={matchId}
          matchId={matchId} 
          matchDate={match.date}
          initialShirts={Object.fromEntries(match.shirts.map((shirt) => [shirt.personId, shirt.number || ""]))}
          suggestedShirts={suggestedShirts}
          teamA={teamA} 
          teamB={teamB} 
          existingAppearances={match.appearances} 
        />
      </div>
    </div>
  );
}
