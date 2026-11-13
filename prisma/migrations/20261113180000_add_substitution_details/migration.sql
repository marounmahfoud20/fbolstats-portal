ALTER TABLE "MatchEvent"
  ADD COLUMN IF NOT EXISTS "substitutionId" TEXT,
  ADD COLUMN IF NOT EXISTS "substitutionReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MatchEvent_substitutionId_eventType_key"
  ON "MatchEvent" ("substitutionId", "eventType");
