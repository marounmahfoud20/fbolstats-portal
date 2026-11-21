type Appearance = { personId: number; teamId: number | null; role: string };
type FieldEvent = {
  personId: number | null;
  teamId: number | null;
  eventType: string;
  minute: string | null;
  extraTime: string | null;
  substitutionId?: string | null;
};

export function matchTime(minute: string, extraTime = ""): [number, number] | null {
  const parts = minute.trim().match(/^(\d{1,3})(?:\s*\+\s*(\d{1,3}))?'?$/);
  if (!parts || (extraTime.trim() && !/^\d{1,3}$/.test(extraTime.trim()))) return null;
  if (parts[2] && extraTime.trim() && Number(parts[2]) !== Number(extraTime)) return null;
  return [Number(parts[1]), Number(extraTime.trim() || parts[2] || 0)];
}

// Compare base minutes first so 45+3 is before minute 46.
function compareTime(a: [number, number], b: [number, number]) {
  return a[0] - b[0] || a[1] - b[1];
}

export function playersOnField(
  appearances: readonly Appearance[],
  events: readonly FieldEvent[],
  teamId: number,
  time: [number, number],
  excludedSubstitutionId?: string,
): Set<number> {
  const players = new Set(appearances.filter((a) => a.teamId === teamId && a.role.toLowerCase() === "starter").map((a) => a.personId));
  const timeline = events
    .filter((event) => event.teamId === teamId && (!excludedSubstitutionId || event.substitutionId !== excludedSubstitutionId))
    .flatMap((event) => {
      const eventTime = matchTime(event.minute || "", event.extraTime || "");
      return eventTime && compareTime(eventTime, time) <= 0 ? [{ event, time: eventTime }] : [];
    })
    .sort((a, b) => compareTime(a.time, b.time));
  for (const { event } of timeline) {
    if (event.personId === null) continue;
    const type = event.eventType.trim().toLowerCase();
    if (isSubstitutionIn(type)) players.add(event.personId);
    if (isFieldExit(type)) players.delete(event.personId);
  }
  return players;
}

export function isSubstitutionIn(type: string) {
  return ["sub_in", "substitute_in", "si"].includes(type.trim().toLowerCase());
}

function isFieldExit(type: string) {
  return ["sub_out", "substitute_out", "so", "red_card", "second_yellow"].includes(type);
}

export function goalkeeperCleanSheet(input: {
  appearance: Appearance;
  isGoalkeeper: boolean;
  teamName: string;
  match: {
    teamA: string;
    teamB: string;
    meta: { ftA: string | null; ftB: string | null; etA?: string | null; etB?: string | null } | null;
    events: readonly FieldEvent[];
  };
}): number {
  const { appearance, isGoalkeeper, teamName, match } = input;
  const { personId, teamId } = appearance;
  const role = appearance.role.trim().toLowerCase();
  if (!isGoalkeeper || teamId === null || (role !== "starter" && role !== "substitute")) return 0;
  if (teamName !== match.teamA && teamName !== match.teamB) return 0;

  const scoreA = match.meta?.ftA?.trim() ?? "";
  const scoreB = match.meta?.ftB?.trim() ?? "";
  if (!/^\d+$/.test(scoreA) || !/^\d+$/.test(scoreB)) return 0;
  const extraScoreA = match.meta?.etA?.trim() ?? "";
  const extraScoreB = match.meta?.etB?.trim() ?? "";
  const playedExtraTime = /^\d+$/.test(extraScoreA) && /^\d+$/.test(extraScoreB)
    && Number(extraScoreA) >= Number(scoreA) && Number(extraScoreB) >= Number(scoreB);
  const finalScoreA = playedExtraTime ? extraScoreA : scoreA;
  const finalScoreB = playedExtraTime ? extraScoreB : scoreB;
  const conceded = Number(teamName === match.teamA ? finalScoreB : finalScoreA);
  const duration = playedExtraTime ? 120 : 90;

  let entry: [number, number] | null = role === "starter" ? [0, 0] : null;
  let exit: [number, number] | null = null;
  const concededTimes: ([number, number] | null)[] = [];
  for (const event of match.events) {
    const type = event.eventType.trim().toLowerCase();
    if (event.personId === personId && event.teamId === teamId) {
      const enters = role === "substitute" && isSubstitutionIn(type);
      const leaves = isFieldExit(type);
      if (enters || leaves) {
        const time = matchTime(event.minute ?? "", event.extraTime ?? "");
        if (!time || time[0] > duration) return 0;
        if (enters && (!entry || compareTime(time, entry) < 0)) entry = time;
        if (leaves && (!exit || compareTime(time, exit) < 0)) exit = time;
      }
    }

    const isConcededGoal = type === "own_goal" ? event.teamId === teamId
      : (type === "goal" || type === "penalty_goal") && event.teamId !== null && event.teamId !== teamId;
    if (isConcededGoal) concededTimes.push(matchTime(event.minute ?? "", event.extraTime ?? ""));
  }

  if (!entry || (exit?.[0] ?? duration) - entry[0] < 60) return 0;
  // Every conceded goal must be accounted for before crediting a partial-match shutout.
  if (concededTimes.length !== conceded) return 0;
  // A goal at the exact time of a substitution has no recorded ordering.
  return concededTimes.every((time) => time && time[0] <= duration
    && (compareTime(time, entry) < 0 || (exit && compareTime(time, exit) > 0))) ? 1 : 0;
}
