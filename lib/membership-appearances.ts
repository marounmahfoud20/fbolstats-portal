type Appearance = {
  matchId: number;
  role: string;
};

export function membershipCleanSheet(input: {
  role: string;
  isGoalkeeper: boolean;
  teamName: string;
  match: {
    teamA: string;
    teamB: string;
    meta: { ftA: string | null; ftB: string | null } | null;
  };
}): number {
  if (input.role.toLowerCase() !== "starter" || !input.isGoalkeeper) return 0;
  const { match, teamName } = input;
  const scoreA = match.meta?.ftA?.trim() ?? "";
  const scoreB = match.meta?.ftB?.trim() ?? "";
  // Missing scores must not turn fixtures or incomplete results into clean sheets.
  if (!/^\d+$/.test(scoreA) || !/^\d+$/.test(scoreB)) return 0;
  const conceded = match.teamA === teamName ? scoreB : match.teamB === teamName ? scoreA : null;
  return conceded !== null && Number(conceded) === 0 ? 1 : 0;
}

// Captain and Goalkeeper are additional roles for the same player in a match,
// not separate appearances. Prefer the lineup role when calculating minutes.
export function groupMembershipAppearances<T extends Appearance>(appearances: T[]) {
  const matches = new Map<number, { appearance: T; captain: boolean }>();
  const priority = (role: string) => {
    switch (role.toLowerCase()) {
      case "starter": return 3;
      case "substitute": return 2;
      default: return 1;
    }
  };

  for (const appearance of appearances) {
    const existing = matches.get(appearance.matchId);
    const captain = appearance.role.toLowerCase() === "captain";
    if (!existing) {
      matches.set(appearance.matchId, { appearance, captain });
      continue;
    }
    existing.captain ||= captain;
    if (priority(appearance.role) > priority(existing.appearance.role)) {
      existing.appearance = appearance;
    }
  }

  return Array.from(matches.values());
}
