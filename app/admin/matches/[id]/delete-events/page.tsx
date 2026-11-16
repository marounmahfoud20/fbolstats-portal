import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { createEntityMetadata } from "@/lib/page-metadata";
import DeleteEventsForm from "./DeleteEventsForm";

export const generateMetadata = createEntityMetadata("Delete Match Events", "match");

function personName(person: { commonName: string | null; firstName: string | null; lastName: string | null }) {
  return person.commonName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unknown";
}

export default async function DeleteEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isSafeInteger(matchId) || matchId <= 0) notFound();
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      events: { include: { person: true, assistPerson: true, team: true }, orderBy: { id: "asc" } },
      appearances: { include: { person: true, team: true }, orderBy: { id: "asc" } },
    },
  });
  if (!match) notFound();

  const rows = [
    ...match.events.map((event) => ({
      id: event.id, kind: "event" as const, type: event.eventType.replaceAll("_", " "),
      minute: event.minute ? `${event.minute}${event.extraTime ? `+${event.extraTime}` : ""}` : "—",
      team: event.team?.name || "—", person: event.person ? personName(event.person) : "Team own goal", personId: event.personId,
      detail: [event.assistPerson ? `Assist: ${personName(event.assistPerson)}` : "", event.goalType, event.bookingReason, event.substitutionReason].filter(Boolean).join(" · "),
      substitutionId: event.substitutionId,
    })),
    ...match.appearances.map((appearance) => ({
      id: appearance.id, kind: "appearance" as const, type: appearance.role,
      minute: "—", team: appearance.team?.name || "—", person: personName(appearance.person), personId: appearance.personId,
      detail: "Lineup assignment", substitutionId: null,
    })),
  ];

  return (
    <div className="min-w-0 text-sm text-[#040f4f]">
      <Link href={`/admin/matches/${matchId}`} className="mb-4 inline-block font-bold hover:underline">&larr; Back to Match</Link>
      <h1 className="mb-2 border border-[#040f4f] bg-[#f4a01c] p-3 text-lg font-bold">Delete Match Events</h1>
      <p className="mb-4 font-semibold">{match.teamA} vs {match.teamB}{match.date ? ` · ${match.date}` : ""}</p>
      <DeleteEventsForm matchId={matchId} rows={rows} />
    </div>
  );
}
