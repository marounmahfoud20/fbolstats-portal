// Only record record identifiers. Never serialize action payloads, credentials,
// uploaded files, names, or arbitrary FormData into the audit trail.
export function activityDetails(args: Record<string, unknown>): string | null {
  const entries: string[] = [];
  const add = (key: string, value: unknown) => {
    if (!/^(id|[a-zA-Z]+Id)$/.test(key)) return;
    if ((typeof value === "number" && Number.isSafeInteger(value) && value > 0) ||
      (typeof value === "string" && /^\d{1,10}$/.test(value) && Number(value) > 0)) {
      entries.push(`${key}: ${value}`);
    }
  };
  for (const [key, value] of Object.entries(args)) {
    add(key, value);
    if (value instanceof FormData) {
      for (const [field, entry] of value.entries()) add(field, entry);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [field, entry] of Object.entries(value)) add(field, entry);
    }
  }
  return entries.length ? [...new Set(entries)].join(" · ").slice(0, 1000) : null;
}
