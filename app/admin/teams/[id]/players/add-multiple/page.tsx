import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { COUNTRIES, resolveCountryName } from "@/lib/countries";
import AddMultiplePlayersForm from "./AddMultiplePlayersForm";

export default async function AddMultiplePlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isSafeInteger(teamId) || teamId <= 0) notFound();
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true, country: true } });
  if (!team) notFound();
  const country = resolveCountryName(team.country);
  return <AddMultiplePlayersForm teamId={teamId} teamName={team.name} teamCountry={COUNTRIES.includes(country) ? country : ""} />;
}
