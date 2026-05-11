-- Add optional assist and metadata fields for match events
-- This project has older baseline migrations; guard so shadow DB can still migrate.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'MatchEvent'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'MatchEvent' AND column_name = 'assistPersonId'
    ) THEN
      ALTER TABLE "MatchEvent" ADD COLUMN "assistPersonId" INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'MatchEvent' AND column_name = 'goalType'
    ) THEN
      ALTER TABLE "MatchEvent" ADD COLUMN "goalType" TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'MatchEvent' AND column_name = 'bookingReason'
    ) THEN
      ALTER TABLE "MatchEvent" ADD COLUMN "bookingReason" TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'MatchEvent_assistPersonId_fkey'
    ) THEN
      ALTER TABLE "MatchEvent"
      ADD CONSTRAINT "MatchEvent_assistPersonId_fkey"
      FOREIGN KEY ("assistPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
