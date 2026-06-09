-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL DEFAULT 'mbpg',
    "slug" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "branch" TEXT,
    "titleRu" TEXT NOT NULL,
    "titleKa" TEXT,
    "titleEn" TEXT,
    "ageRu" TEXT,
    "ageKa" TEXT,
    "ageEn" TEXT,
    "packageRu" TEXT NOT NULL,
    "packageKa" TEXT,
    "packageEn" TEXT,
    "priceRu" TEXT NOT NULL,
    "priceKa" TEXT,
    "priceEn" TEXT,
    "noteRu" TEXT,
    "noteKa" TEXT,
    "noteEn" TEXT,
    "lessons" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServicePrice_projectKey_direction_isActive_idx" ON "ServicePrice"("projectKey", "direction", "isActive");

-- CreateIndex
CREATE INDEX "ServicePrice_projectKey_sortOrder_idx" ON "ServicePrice"("projectKey", "sortOrder");

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN "interview" TEXT;
ALTER TABLE "Coach" ADD COLUMN "videoUrl" TEXT;

-- Seed initial MBPG price rows.
INSERT INTO "ServicePrice" (
  "id", "projectKey", "slug", "direction", "branch", "titleRu", "titleEn", "ageRu", "ageEn",
  "packageRu", "packageEn", "priceRu", "priceEn", "noteRu", "noteEn", "lessons", "sortOrder", "updatedAt"
) VALUES
('price_baby_swim_trial', 'mbpg', 'baby-swim', 'pool', 'Pool Javakhishvili 28', 'Грудничковое плавание', 'Baby swimming', '1 мес - 12 мес', '1-12 months', 'Диагностическое занятие', 'Diagnostic lesson', '50 лари', '50 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 1, 10, CURRENT_TIMESTAMP),
('price_baby_swim_8', 'mbpg', 'baby-swim', 'pool', 'Pool Javakhishvili 28', 'Грудничковое плавание', 'Baby swimming', '1 мес - 12 мес', '1-12 months', '8 индивидуальных занятий', '8 individual lessons', '480 лари', '480 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 8, 20, CURRENT_TIMESTAMP),
('price_kids_swim_trial', 'mbpg', 'kids-swim', 'pool', 'Pool Javakhishvili 28', 'Плавание', 'Kids swimming', '1 год - 10 лет', '1-10 years', 'Диагностическое занятие', 'Diagnostic lesson', '50 лари', '50 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 1, 30, CURRENT_TIMESTAMP),
('price_kids_swim_8', 'mbpg', 'kids-swim', 'pool', 'Pool Javakhishvili 28', 'Плавание', 'Kids swimming', '1 год - 10 лет', '1-10 years', '8 индивидуальных занятий', '8 individual lessons', '480 лари', '480 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 8, 40, CURRENT_TIMESTAMP),
('price_motor_8', 'mbpg', 'baby-motor', 'pool', 'Pool Javakhishvili 28', 'Двигательная моторика для грудных детей', 'Motor skills for babies', '1 мес - 2 года', '1 month - 2 years', '8 занятий', '8 lessons', 'уточняйте', 'ask admin', 'Уточняйте у администратора', 'Ask the administrator for details', 8, 50, CURRENT_TIMESTAMP),
('price_gym_trial', 'mbpg', 'gym-groups', 'gym', 'Gym Gorgasali 127', 'Детский спорт', 'Kids sport', '3,5 лет - 16 лет', '3.5-16 years', 'Пробное занятие', 'Trial lesson', 'бесплатно', 'free', 'Уточняйте у администратора', 'Ask the administrator for details', 1, 60, CURRENT_TIMESTAMP),
('price_gym_8', 'mbpg', 'gym-groups', 'gym', 'Gym Gorgasali 127', 'Детский спорт', 'Kids sport', '3,5 лет - 16 лет', '3.5-16 years', '8 занятий', '8 lessons', '160 лари', '160 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 8, 70, CURRENT_TIMESTAMP),
('price_child_massage', 'mbpg', 'massage', 'massage', 'Pool Javakhishvili 28', 'Детский массаж', 'Child massage', '1 мес - 16 лет', '1 month - 16 years', '10 занятий', '10 sessions', '350 лари', '350 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 10, 80, CURRENT_TIMESTAMP),
('price_adult_massage', 'mbpg', 'adult-massage', 'massage', 'Pool Javakhishvili 28', 'Взрослый массаж', 'Adult massage', 'для взрослых', 'adults', 'Сеанс', 'Session', 'от 40 лари', 'from 40 GEL', 'Уточняйте у администратора', 'Ask the administrator for details', 1, 90, CURRENT_TIMESTAMP);
