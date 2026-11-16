export function parseDayFirstDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (year === "0000" || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;
  return { day, month, year, iso };
}
