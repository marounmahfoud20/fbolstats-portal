export const NATIONAL_TEAM_SECTIONS = {
  men: { title: "Men's National Team", category: "Men" },
  women: { title: "Women's National Team", category: "Women" },
} as const;

export type NationalTeamSection = keyof typeof NATIONAL_TEAM_SECTIONS;

export function isNationalTeamSection(value: string): value is NationalTeamSection {
  return value === "men" || value === "women";
}

export function nationalTeamSection(competition: { footballType?: string | null; type?: string | null }): NationalTeamSection | null {
  if (competition.footballType?.toLowerCase() !== "national") return null;
  if (competition.type === "Men") return "men";
  if (competition.type === "Women") return "women";
  return null;
}

export function nationalCompetitionHref(section: NationalTeamSection, id: number): string {
  return `/admin/national-teams/${section}/competitions/${id}`;
}
