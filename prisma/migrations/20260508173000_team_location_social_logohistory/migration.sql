ALTER TABLE "Team"
  ADD COLUMN "country" TEXT,
  ADD COLUMN "latitude" TEXT,
  ADD COLUMN "longitude" TEXT,
  ADD COLUMN "facebookUrl" TEXT,
  ADD COLUMN "instagramUrl" TEXT,
  ADD COLUMN "twitterUrl" TEXT;

CREATE TABLE "TeamLogoHistory" (
  "id" SERIAL NOT NULL,
  "teamId" INTEGER NOT NULL,
  "logoPath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startDate" TEXT,
  "endDate" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeamLogoHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TeamLogoHistory"
  ADD CONSTRAINT "TeamLogoHistory_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
