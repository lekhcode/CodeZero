-- CreateEnum
CREATE TYPE "AutoRevisionType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "auto_revisions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "problemTitle" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL,
    "revisionType" "AutoRevisionType" NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "isRevised" BOOLEAN NOT NULL DEFAULT false,
    "revisedAt" TIMESTAMP(3),
    "scheduleTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auto_revisions_userId_problemId_revisionType_key" ON "auto_revisions"("userId", "problemId", "revisionType");

-- CreateIndex
CREATE INDEX "auto_revisions_userId_scheduledFor_idx" ON "auto_revisions"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "auto_revisions_userId_isRevised_scheduledFor_idx" ON "auto_revisions"("userId", "isRevised", "scheduledFor");

-- AddForeignKey
ALTER TABLE "auto_revisions" ADD CONSTRAINT "auto_revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_revisions" ADD CONSTRAINT "auto_revisions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
