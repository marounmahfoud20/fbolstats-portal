CREATE TABLE IF NOT EXISTS "LeagueCategory" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "footballType" TEXT NOT NULL DEFAULT 'club',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeagueCategory_name_footballType_key"
  ON "LeagueCategory" ("name", "footballType");

INSERT INTO "LeagueCategory" ("name", "footballType", "createdAt", "updatedAt")
SELECT DISTINCT l."type", COALESCE(l."footballType", 'club'), NOW(), NOW()
FROM "League" l
WHERE COALESCE(BTRIM(l."type"), '') <> ''
ON CONFLICT ("name", "footballType") DO NOTHING;
