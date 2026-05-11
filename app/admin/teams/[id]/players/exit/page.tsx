import Link from "next/link";
import prisma from "@/lib/prisma";
import { exitTeamPlayers } from "@/lib/actions";
import ExitPlayersForm from "./ExitPlayersForm";

export default async function ExitPlayersPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = parseInt(params.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        where: { isActive: true, role: { equals: "player", mode: "insensitive" } },
        include: { person: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen font-sans">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center bg-[#f4a01c] border border-[#040f4f] p-2 mb-4">
        <span className="text-[#040f4f] font-bold text-sm">&nbsp;&nbsp;&nbsp;Exit Players - {team?.name || `Team #${teamId}`}</span>
        <Link href={`/admin/teams/${teamId}`} className="text-[#040f4f] hover:underline font-bold text-sm">Back to Team</Link>
      </div>

      <ExitPlayersForm
        teamId={teamId}
        action={exitTeamPlayers}
        rows={(team?.memberships || []).map((m) => ({
          membershipId: m.id,
          personId: m.person.id,
          firstName: m.person.firstName,
          lastName: m.person.lastName,
          matchName: m.person.matchName,
          dob: m.person.dob,
          position: m.person.position,
          startDate: m.startDate,
        }))}
      />
    </div>
  );
}
