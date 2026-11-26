import { parseDayFirstDate } from "./date-input";

export function isPlayerRole(role: string) {
  return role.trim().toLowerCase() === "player";
}

export function readPlayerEndDate(
  formData: FormData,
  dayField = "endDay",
  monthField = "endMonth",
  yearField = "endYear",
): string | null | undefined {
  const day = String(formData.get(dayField) ?? "").trim();
  const month = String(formData.get(monthField) ?? "").trim();
  const year = String(formData.get(yearField) ?? "").trim();
  if (!day && !month && !year) return null;
  return parseDayFirstDate(`${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`)?.iso;
}

export function playerMembershipStatusError(isActive: boolean, endDate: string | null | undefined) {
  if (endDate === undefined) return "Enter a valid end date in DD/MM/YYYY format.";
  if (isActive && endDate) return "Set the Player membership to inactive or clear its end date.";
  if (!isActive && !endDate) return "Enter an end date or mark the Player membership active to reopen it.";
}
