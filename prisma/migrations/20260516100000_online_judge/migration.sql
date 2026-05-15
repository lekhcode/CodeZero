-- CreateEnum
CREATE TYPE "JudgeMode" AS ENUM ('RUN_SAMPLE', 'FULL_JUDGE');

-- CreateTable
CREATE TABLE "judge_submissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "mode" "JudgeMode" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "testResults" JSONB,
    "stderr" TEXT,
    "stdout" TEXT,
    "runtimeMs" INTEGER,
    "exitCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_code_templates" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_code_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_testcases" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "problem_testcases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "judge_submissions_userId_idx" ON "judge_submissions"("userId");

-- CreateIndex
CREATE INDEX "judge_submissions_problemId_idx" ON "judge_submissions"("problemId");

-- CreateIndex
CREATE INDEX "judge_submissions_status_idx" ON "judge_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "problem_code_templates_problemId_language_key" ON "problem_code_templates"("problemId", "language");

-- CreateIndex
CREATE INDEX "problem_code_templates_problemId_idx" ON "problem_code_templates"("problemId");

-- CreateIndex
CREATE INDEX "problem_testcases_problemId_orderIndex_idx" ON "problem_testcases"("problemId", "orderIndex");

-- AddForeignKey
ALTER TABLE "judge_submissions" ADD CONSTRAINT "judge_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_submissions" ADD CONSTRAINT "judge_submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_code_templates" ADD CONSTRAINT "problem_code_templates_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_testcases" ADD CONSTRAINT "problem_testcases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
