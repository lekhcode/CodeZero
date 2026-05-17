-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'SOLVED', 'MISSED', 'SKIPPED');

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "userScheduleId" UUID NOT NULL,
    "assignedDate" DATE NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "solvedAt" TIMESTAMP(3),
    "solvedSubmissionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_userId_idx" ON "assignments"("userId");

-- CreateIndex
CREATE INDEX "assignments_userId_assignedDate_idx" ON "assignments"("userId", "assignedDate");

-- CreateIndex
CREATE INDEX "assignments_userId_status_idx" ON "assignments"("userId", "status");

-- CreateIndex
CREATE INDEX "assignments_assignedDate_idx" ON "assignments"("assignedDate");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignments_createdAt_idx" ON "assignments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_userId_problemId_userScheduleId_assignedDate_key" ON "assignments"("userId", "problemId", "userScheduleId", "assignedDate");

-- CreateIndex
CREATE INDEX "judge_submissions_userId_createdAt_idx" ON "judge_submissions"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_userScheduleId_fkey" FOREIGN KEY ("userScheduleId") REFERENCES "user_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_solvedSubmissionId_fkey" FOREIGN KEY ("solvedSubmissionId") REFERENCES "judge_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
