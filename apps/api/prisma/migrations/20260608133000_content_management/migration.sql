CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "branch" TEXT,
    "serviceSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "experience" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photoFileName" TEXT,
    "photoMimeType" TEXT,
    "photoSize" INTEGER,
    "photoData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "type" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'ru',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" TEXT,
    "serviceSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "imageFileName" TEXT,
    "imageMimeType" TEXT,
    "imageSize" INTEGER,
    "imageData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Coach_projectKey_direction_idx" ON "Coach"("projectKey", "direction");

CREATE INDEX "Coach_projectKey_isActive_idx" ON "Coach"("projectKey", "isActive");

CREATE INDEX "ContentPost_projectKey_type_isPublished_idx" ON "ContentPost"("projectKey", "type", "isPublished");

CREATE INDEX "ContentPost_projectKey_languageCode_idx" ON "ContentPost"("projectKey", "languageCode");

CREATE INDEX "ContentPost_projectKey_createdAt_idx" ON "ContentPost"("projectKey", "createdAt");
