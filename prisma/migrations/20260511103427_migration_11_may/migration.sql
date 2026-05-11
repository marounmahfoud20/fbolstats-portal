-- DropIndex
DROP INDEX IF EXISTS "Team_name_key";

-- AlterTable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'AdminAccount'
    ) THEN
        ALTER TABLE "AdminAccount" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'LeagueCategory'
    ) THEN
        ALTER TABLE "LeagueCategory" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "isFinished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "address" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "clubColors" TEXT,
ADD COLUMN     "founded" TEXT,
ADD COLUMN     "gender" TEXT DEFAULT 'both',
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "nicknames" TEXT,
ADD COLUMN     "officialName" TEXT,
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'active',
ADD COLUMN     "tla" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'club',
ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "matchName" TEXT,
    "commonName" TEXT,
    "dob" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dateOfDeath" TEXT,
    "placeOfBirth" TEXT,
    "countryOfBirth" TEXT,
    "nationality" TEXT,
    "gender" TEXT,
    "position" TEXT,
    "detailedPos1" TEXT,
    "detailedPos2" TEXT,
    "detailedPos3" TEXT,
    "isReferee" TEXT DEFAULT 'no',
    "strongFoot" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "nickname" TEXT,
    "birthYear" TEXT,
    "mappingSource" TEXT,
    "image" TEXT,
    "teamId" INTEGER,
    "teamStartDate" TEXT,
    "teamEndDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "personId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAppearance" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "matchId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonTeam" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTeam" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchMeta" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "spectators" TEXT,
    "ftA" TEXT,
    "ftB" TEXT,
    "htA" TEXT,
    "htB" TEXT,
    "etA" TEXT,
    "etB" TEXT,
    "pkA" TEXT,
    "pkB" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "assistPersonId" INTEGER,
    "teamId" INTEGER,
    "eventType" TEXT NOT NULL,
    "minute" TEXT,
    "extraTime" TEXT,
    "goalType" TEXT,
    "bookingReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchShirtNumber" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "number" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchShirtNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "address" TEXT,
    "capacity" INTEGER,
    "surface" TEXT,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeasonTeam_seasonId_teamId_key" ON "SeasonTeam"("seasonId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTeam_groupId_teamId_key" ON "GroupTeam"("groupId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchMeta_matchId_key" ON "MatchMeta"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchShirtNumber_matchId_personId_key" ON "MatchShirtNumber"("matchId", "personId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAppearance" ADD CONSTRAINT "MatchAppearance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAppearance" ADD CONSTRAINT "MatchAppearance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAppearance" ADD CONSTRAINT "MatchAppearance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonTeam" ADD CONSTRAINT "SeasonTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonTeam" ADD CONSTRAINT "SeasonTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTeam" ADD CONSTRAINT "GroupTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTeam" ADD CONSTRAINT "GroupTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMeta" ADD CONSTRAINT "MatchMeta_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_assistPersonId_fkey" FOREIGN KEY ("assistPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchShirtNumber" ADD CONSTRAINT "MatchShirtNumber_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchShirtNumber" ADD CONSTRAINT "MatchShirtNumber_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
