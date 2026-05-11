ALTER TABLE "League"
ADD COLUMN IF NOT EXISTS "footballType" TEXT NOT NULL DEFAULT 'club';

UPDATE "League"
SET "footballType" = 'club'
WHERE "footballType" IS NULL OR BTRIM("footballType") = '';
