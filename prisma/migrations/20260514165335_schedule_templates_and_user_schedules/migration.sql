/*
  Warnings:

  - You are about to drop the `schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DAILY_POTD', 'TOPIC', 'STUDY_PLAN');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'MIXED');

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_userId_fkey";

-- DropTable
DROP TABLE "schedules";

-- CreateTable
CREATE TABLE "schedule_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "allowsDifficulty" BOOLEAN NOT NULL DEFAULT true,
    "allowsCount" BOOLEAN NOT NULL DEFAULT true,
    "defaultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_schedules" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dailyQuestions" INTEGER,
    "difficulty" "DifficultyLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_templates_slug_key" ON "schedule_templates"("slug");

-- CreateIndex
CREATE INDEX "user_schedules_userId_idx" ON "user_schedules"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_schedules_userId_templateId_key" ON "user_schedules"("userId", "templateId");

-- AddForeignKey
ALTER TABLE "user_schedules" ADD CONSTRAINT "user_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedules" ADD CONSTRAINT "user_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "schedule_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
