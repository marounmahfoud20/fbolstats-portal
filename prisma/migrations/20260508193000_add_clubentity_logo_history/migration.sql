CREATE TABLE "ClubEntityLogoHistory" (
  "id" SERIAL NOT NULL,
  "clubEntityId" INTEGER NOT NULL,
  "logoPath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startDate" TEXT,
  "endDate" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubEntityLogoHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClubEntityLogoHistory"
  ADD CONSTRAINT "ClubEntityLogoHistory_clubEntityId_fkey"
  FOREIGN KEY ("clubEntityId") REFERENCES "ClubEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ClubEntityLogoHistory" ("clubEntityId","logoPath","status","isCurrent","createdAt","updatedAt")
SELECT "id", "logo", 'active', true, NOW(), NOW()
FROM "ClubEntity"
WHERE "logo" IS NOT NULL;
