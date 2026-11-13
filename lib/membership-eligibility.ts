type MembershipDates = {
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export function isMembershipActiveOnDate(membership: MembershipDates, matchDate: string | null): boolean {
  if (!matchDate) return membership.isActive;
  const matchTs = Date.parse(matchDate);
  if (Number.isNaN(matchTs)) return false;

  // An inactive membership without an end date has no known active period.
  if (!membership.endDate && !membership.isActive) return false;

  const startTs = membership.startDate ? Date.parse(membership.startDate) : Number.NEGATIVE_INFINITY;
  const endTs = membership.endDate ? Date.parse(membership.endDate) : Number.POSITIVE_INFINITY;
  return matchTs >= startTs && matchTs <= endTs;
}
