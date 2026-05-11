import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditLineupForm from "./EditLineupForm";

export default async function EditLineupsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const matchId = parseInt(resolvedParams.id);
  if (isNaN(matchId)) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      appearances: true
    }
  });

  if (!match) notFound();

  const teamA = await prisma.team.findFirst({
    where: { name: match.teamA },
    include: {
      memberships: {
        where: { isActive: true },
        include: { person: true }
      }
    }
  });

  const teamB = await prisma.team.findFirst({
    where: { name: match.teamB },
    include: {
      memberships: {
        where: { isActive: true },
        include: { person: true }
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#040f4f] text-white py-10 font-sans text-xs pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href={`/admin/matches/${matchId}`} className="text-[#f4a01c] hover:underline mb-4 inline-block font-bold text-base">&larr; Back to Match</Link>
        <h1 className="text-2xl font-bold mb-6">Edit Lineups: {match.teamA} vs {match.teamB}</h1>
        
        <EditLineupForm 
          matchId={matchId} 
          matchDate={match.date}
          teamA={teamA} 
          teamB={teamB} 
          existingAppearances={match.appearances} 
        />
      </div>
    </div>
  );
}
