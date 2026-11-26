-- Older historical stints may lack a documented end date. Preserve them and
-- enforce the rule on every new or updated Player membership.
ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_player_status_end_date_check"
CHECK (
  lower(btrim("role")) <> 'player'
  OR ("isActive" AND "endDate" IS NULL)
  OR (NOT "isActive" AND COALESCE("endDate" ~ '[^[:space:]]', false))
) NOT VALID;
