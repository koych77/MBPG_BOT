CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED');

CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "clientId" TEXT,
    "telegramId" BIGINT,
    "audience" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "error" TEXT,
    "relatedModel" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationLog_projectKey_createdAt_idx" ON "NotificationLog"("projectKey", "createdAt");

CREATE INDEX "NotificationLog_projectKey_type_idx" ON "NotificationLog"("projectKey", "type");

CREATE INDEX "NotificationLog_projectKey_status_idx" ON "NotificationLog"("projectKey", "status");

ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
