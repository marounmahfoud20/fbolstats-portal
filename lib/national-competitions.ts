export const NATIONAL_TEAM_AGES = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13] as const;
type YouthAge = typeof NATIONAL_TEAM_AGES[number];
type NationalTeamGender = "men" | "women";
export type NationalTeamSection = NationalTeamGender | `${NationalTeamGender}-u${YouthAge}`;
type SectionDetails = { title: string; category: string; gender: NationalTeamGender; age: YouthAge | null };

export const WOMEN_NATIONAL_TEAM_GROUPS = {
  "women-u20-u19-u18": [20, 19, 18],
  "women-u17-u16": [17, 16],
  "women-u15-u14-u13": [15, 14, 13],
} as const satisfies Record<string, readonly YouthAge[]>;
type WomenNationalTeamGroup = keyof typeof WOMEN_NATIONAL_TEAM_GROUPS;
export type NationalTeamView = NationalTeamSection | WomenNationalTeamGroup;
export type NationalTeamViewDetails = Pick<SectionDetails, "title" | "gender" | "age"> & {
  id: NationalTeamView;
  sections: NationalTeamSection[];
  categoryFilter: string | { in: string[] };
};
const womenGroupIds = Object.keys(WOMEN_NATIONAL_TEAM_GROUPS) as WomenNationalTeamGroup[];

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

export function nationalTeamViewForAge(gender: NationalTeamGender, age: YouthAge | null): NationalTeamView {
  if (!age) return gender;
  const group = gender === "women" && womenGroupIds.find(id =>
    WOMEN_NATIONAL_TEAM_GROUPS[id].some(groupAge => groupAge === age));
  return group || `${gender}-u${age}`;
}

export function getNationalTeamView(value: string): NationalTeamViewDetails | null {
  if (isNationalTeamSection(value)) {
    const { category, ...details } = NATIONAL_TEAM_SECTIONS[value];
    return { id: value, ...details, sections: [value], categoryFilter: category };
  }
  const group = womenGroupIds.find(id => id === value);
  if (!group) return null;
  const ages = WOMEN_NATIONAL_TEAM_GROUPS[group];
  const sections = ages.map(age => `women-u${age}` as const);
  return {
    id: group,
    title: `Women's ${ages.map(age => `U${age}`).join(", ")} National Teams`,
    gender: "women" as const,
    age: ages[0],
    sections,
    categoryFilter: { in: sections.map(section => NATIONAL_TEAM_SECTIONS[section].category) },
  };
}

export function nationalTeamOptions(gender: NationalTeamGender) {
  return [
    { value: gender, label: "Senior" },
    ...NATIONAL_TEAM_AGES.flatMap(age => {
      const value = nationalTeamViewForAge(gender, age);
      const group = womenGroupIds.find(id => id === value);
      if (!group) return [{ value, label: `U${age}` }];
      const ages = WOMEN_NATIONAL_TEAM_GROUPS[group];
      return ages[0] === age ? [{ value, label: ages.map(age => `U${age}`).join(", ") }] : [];
    }),
  ];
}

export function nationalTeamSection(competition: { footballType?: string | null; type?: string | null }): NationalTeamSection | null {
  if (competition.footballType?.toLowerCase() !== "national") return null;
  return (Object.keys(NATIONAL_TEAM_SECTIONS) as NationalTeamSection[])
    .find(section => NATIONAL_TEAM_SECTIONS[section].category === competition.type) ?? null;
}

export function nationalCompetitionHref(section: NationalTeamView, id: number): string {
  return `/admin/national-teams/${section}/competitions/${id}`;
}
