type DeletionEvent = { id: number; substitutionId: string | null };

// Receive only events from the current match. Never leave half a substitution.
export function matchEventIdsToDelete(events: DeletionEvent[], selectedIds: number[]): number[] {
  const selected = new Set(selectedIds);
  const substitutions = new Set(events.filter((event) => selected.has(event.id) && event.substitutionId).map((event) => event.substitutionId));
  return events.filter((event) => selected.has(event.id) || (event.substitutionId !== null && substitutions.has(event.substitutionId))).map((event) => event.id);
}
