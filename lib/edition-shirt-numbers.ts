import type { Prisma } from "@prisma/client";

type EditionMatch = { matchId: number; seasonId: number; date: string | null; teamIds: number[] };

// A season is an edition; groups/rounds within it share shirt numbers.
export async function getEditionShirtNumbers(
  db: Pick<Prisma.TransactionClient, "matchShirtNumber">,
  { matchId, seasonId, date, teamIds }: EditionMatch,
): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};
  const playerAppearances = { teamId: { in: teamIds }, role: { in: ["Starter", "Substitute"] } };
  const shirts = await db.matchShirtNumber.findMany({
    where: {
      matchId: { not: matchId },
      match: {
        group: { seasonId },
        ...(date ? { OR: [{ date: { lt: date } }, { date, id: { lt: matchId } }] } : {}),
        appearances: { some: playerAppearances },
      },
    },
    select: {
      personId: true,
      number: true,
      match: { select: {
        appearances: { where: playerAppearances, select: { personId: true, teamId: true } },
      } },
    },
    orderBy: [{ match: { date: "desc" } }, { matchId: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
  });
  const numbers: Record<string, string> = {};
  for (const shirt of shirts) {
    if (!shirt.number?.trim()) continue;
    for (const appearance of shirt.match.appearances) {
      if (appearance.personId !== shirt.personId) continue;
      const key = `${appearance.teamId}-${shirt.personId}`;
      if (!(key in numbers)) numbers[key] = shirt.number;
    }
  }
  return numbers;
}
