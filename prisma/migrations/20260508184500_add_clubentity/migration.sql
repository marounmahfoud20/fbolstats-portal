CREATE TABLE "ClubEntity" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "shortName" TEXT,
  "tla" TEXT,
  "officialName" TEXT,
  "area" TEXT,
  "country" TEXT,
  "type" TEXT DEFAULT 'club',
  "status" TEXT DEFAULT 'active',
  "address" TEXT,
  "latitude" TEXT,
  "longitude" TEXT,
  "city" TEXT,
  "url" TEXT,
  "facebookUrl" TEXT,
  "instagramUrl" TEXT,
  "twitterUrl" TEXT,
  "founded" TEXT,
  "clubColors" TEXT,
  "nicknames" TEXT,
  "logo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubEntity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Team" ADD COLUMN "clubEntityId" INTEGER;
ALTER TABLE "Team" ADD COLUMN "teamCategory" TEXT;

ALTER TABLE "Team"
  ADD CONSTRAINT "Team_clubEntityId_fkey"
  FOREIGN KEY ("clubEntityId") REFERENCES "ClubEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
