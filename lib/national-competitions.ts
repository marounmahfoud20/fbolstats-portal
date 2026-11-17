export const NATIONAL_TEAM_AGES = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13] as const;
type YouthAge = typeof NATIONAL_TEAM_AGES[number];
type NationalTeamGender = "men" | "women";
export type NationalTeamSection = NationalTeamGender | `${NationalTeamGender}-u${YouthAge}`;
type SectionDetails = { title: string; category: string; gender: NationalTeamGender; age: YouthAge | null };

export const NATIONAL_TEAM_SECTIONS = Object.fromEntries(
  (["men", "women"] as const).flatMap(gender => {
    const label = gender === "men" ? "Men" : "Women";
    return [
      [gender, { title: `${label}'s National Team`, category: label, gender, age: null }],
      ...NATIONAL_TEAM_AGES.map(age => [
        `${gender}-u${age}`,
        { title: `${label}'s U${age} National Team`, category: `${label} U${age}`, gender, age },
      ]),
    ];
  }),
) as Record<NationalTeamSection, SectionDetails>;

export function isNationalTeamSection(value: string): value is NationalTeamSection {
  return Object.hasOwn(NATIONAL_TEAM_SECTIONS, value);
}

export function nationalTeamSection(competition: { footballType?: string | null; type?: string | null }): NationalTeamSection | null {
  if (competition.footballType?.toLowerCase() !== "national") return null;
  return (Object.keys(NATIONAL_TEAM_SECTIONS) as NationalTeamSection[])
    .find(section => NATIONAL_TEAM_SECTIONS[section].category === competition.type) ?? null;
}

export function nationalCompetitionHref(section: NationalTeamSection, id: number): string {
  return `/admin/national-teams/${section}/competitions/${id}`;
}
