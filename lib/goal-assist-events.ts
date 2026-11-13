type GoalAssistEvent = {
  id: number;
  matchId?: number;
  personId: number;
  teamId: number | null;
  eventType: string;
  minute: string | null;
  extraTime: string | null;
  assistPersonId: number | null;
  playerName: string;
  assistPlayerName: string | null;
};

function eventKey(event: GoalAssistEvent): string | null {
  if (event.teamId === null) return null;
  const minute = event.minute?.trim().match(/^(\d+)(?:\s*\+\s*(\d+))?'?$/);
  if (!minute) return null;
  const extraTime = event.extraTime?.trim();
  if (extraTime && !/^\d+$/.test(extraTime)) return null;
  if (minute[2] && extraTime && Number(minute[2]) !== Number(extraTime)) return null;
  return JSON.stringify([
    event.matchId ?? null,
    event.teamId,
    Number(minute[1]),
    Number(extraTime || minute[2] || 0),
  ]);
}

// Keep the stored events intact, including standalone assists used by statistics.
// Only combine entries when their goal association is unambiguous.
export function combineGoalAndAssistEvents<T extends GoalAssistEvent>(events: readonly T[]): T[] {
  const groups = new Map<string, { goals: T[]; assists: T[] }>();
  for (const event of events) {
    if (!["goal", "penalty_goal", "assist"].includes(event.eventType)) continue;
    const key = eventKey(event);
    if (!key) continue;
    const group = groups.get(key) ?? { goals: [], assists: [] };
    if (event.eventType === "assist") group.assists.push(event);
    else group.goals.push(event);
    groups.set(key, group);
  }

  const combinedGoals = new Map<number, T>();
  const combinedAssists = new Set<number>();
  for (const { goals, assists } of groups.values()) {
    for (const goal of goals) {
      let matchingAssists: T[];
      if (goal.assistPersonId !== null) {
        matchingAssists = assists.filter((assist) => assist.personId === goal.assistPersonId);
      } else {
        if (goals.length !== 1) continue;
        matchingAssists = assists.filter((assist) => assist.personId !== goal.personId);
        if (new Set(matchingAssists.map((assist) => assist.personId)).size !== 1) continue;
      }
      if (!matchingAssists.length) continue;
      const assist = matchingAssists[0];
      combinedGoals.set(goal.id, {
        ...goal,
        assistPersonId: goal.assistPersonId ?? assist.personId,
        assistPlayerName: goal.assistPlayerName || assist.playerName,
      });
      for (const entry of matchingAssists) combinedAssists.add(entry.id);
    }
  }
  return events.filter((event) => !combinedAssists.has(event.id)).map((event) => combinedGoals.get(event.id) ?? event);
}
