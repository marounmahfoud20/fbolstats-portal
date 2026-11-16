-- Own goals may be recorded for a team when the scorer is unknown.
ALTER TABLE "MatchEvent" ALTER COLUMN "personId" DROP NOT NULL;
