-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE "Broadcast" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT';
ALTER TABLE "Broadcast" ADD COLUMN "direction" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "branch" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Broadcast_projectKey_status_scheduledAt_idx" ON "Broadcast"("projectKey", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Broadcast_projectKey_audience_idx" ON "Broadcast"("projectKey", "audience");
