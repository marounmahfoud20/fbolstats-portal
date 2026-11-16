CREATE TABLE "AdminActivityLog" (
  "id" SERIAL PRIMARY KEY,
  "accountId" INTEGER,
  "username" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "path" TEXT,
  "details" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActivityLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AdminActivityLog_accountId_createdAt_id_idx" ON "AdminActivityLog"("accountId", "createdAt", "id");
CREATE INDEX "AdminActivityLog_username_createdAt_id_idx" ON "AdminActivityLog"("username", "createdAt", "id");
