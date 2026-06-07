-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'BOOKED', 'PAID', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('NEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'ru',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "clientId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "serviceSlug" TEXT,
    "branch" TEXT NOT NULL,
    "preferredTime" TEXT,
    "comment" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_projectKey_idx" ON "Client"("projectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Client_projectKey_telegramId_key" ON "Client"("projectKey", "telegramId");

-- CreateIndex
CREATE INDEX "Lead_projectKey_createdAt_idx" ON "Lead"("projectKey", "createdAt");

-- CreateIndex
CREATE INDEX "Receipt_projectKey_createdAt_idx" ON "Receipt"("projectKey", "createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
