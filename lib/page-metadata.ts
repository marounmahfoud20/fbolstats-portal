import type { Metadata } from "next";
import { cache } from "react";
import { connection } from "next/server";
import prisma from "@/lib/prisma";
import { getNationalTeamView } from "@/lib/national-competitions";

type Entity = "team" | "person" | "match" | "league" | "season" | "group" | "club" | "venue";
type MetadataProps = { params: Promise<Record<string, string>> };

// Reuse the context when metadata is resolved more than once in a request.
const entityName = cache(async (entity: Entity, id: number): Promise<string | undefined> => {
  switch (entity) {
    case "team":
      return (await prisma.team.findUnique({ where: { id }, select: { name: true } }))?.name;
    case "person": {
      const person = await prisma.person.findUnique({ where: { id }, select: { firstName: true, lastName: true, commonName: true } });
      return person ? person.commonName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || `Person ${id}` : undefined;
    }
    case "match": {
      const match = await prisma.match.findUnique({ where: { id }, select: { teamA: true, teamB: true, date: true } });
      return match ? `${match.teamA} vs ${match.teamB}${match.date ? ` (${match.date})` : ""}` : undefined;
    }
    case "league":
      return (await prisma.league.findUnique({ where: { id }, select: { competitionName: true } }))?.competitionName;
    case "season": {
      const season = await prisma.season.findUnique({ where: { id }, select: { name: true, league: { select: { competitionName: true } } } });
      return season ? `${season.league.competitionName} ${season.name}` : undefined;
    }
    case "group": {
      const group = await prisma.group.findUnique({ where: { id }, select: { name: true, season: { select: { name: true, league: { select: { competitionName: true } } } } } });
      return group ? `${group.name} — ${group.season.league.competitionName} ${group.season.name}` : undefined;
    }
    case "club":
      return (await prisma.clubEntity.findUnique({ where: { id }, select: { name: true } }))?.name;
    case "venue":
      return (await prisma.venue.findUnique({ where: { id }, select: { name: true } }))?.name;
  }
});

export function createEntityMetadata(
  title: string,
  entity: Entity,
  options: { idParam?: string; titleParam?: string; titles?: Record<string, string>; nameOnly?: boolean } = {},
) {
  return async ({ params }: MetadataProps): Promise<Metadata> => {
    await connection();
    const values = await params;
    const pageTitle = (options.titleParam && options.titles?.[values[options.titleParam]]) || title;
    const id = Number(values[options.idParam || "id"]);
    if (!Number.isSafeInteger(id) || id <= 0) return { title: pageTitle };
    try {
      const name = await entityName(entity, id);
      return { title: name ? options.nameOnly ? name : `${pageTitle} — ${name}` : pageTitle };
    } catch {
      // Keep the page's own error/retry UI available if its title lookup fails.
      return { title: pageTitle };
    }
  };
}

export function createNationalTeamMetadata(matches = false) {
  return async ({ params }: MetadataProps): Promise<Metadata> => {
    const { gender } = await params;
    const name = getNationalTeamView(gender)?.title ?? "National Teams";
    return { title: `${name}${matches ? " Matches" : ""}` };
  };
}
