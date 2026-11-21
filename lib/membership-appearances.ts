type Appearance = {
  matchId: number;
  role: string;
};

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
