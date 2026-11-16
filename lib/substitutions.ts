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
    if (["sub_in", "substitute_in", "si"].includes(type)) players.add(event.personId);
    if (["sub_out", "substitute_out", "so", "red_card", "second_yellow"].includes(type)) players.delete(event.personId);
  }
  return players;
}

export function isSubstitutionIn(type: string) {
  return ["sub_in", "substitute_in", "si"].includes(type.trim().toLowerCase());
}
