-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'INTERNAL_ERROR');

-- CreateTable
CREATE TABLE "compiler_submissions" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "stdin" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "exitCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compiler_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compiler_submissions_userId_idx" ON "compiler_submissions"("userId");

-- CreateIndex
CREATE INDEX "compiler_submissions_status_idx" ON "compiler_submissions"("status");

-- CreateIndex
CREATE INDEX "compiler_submissions_createdAt_idx" ON "compiler_submissions"("createdAt");

-- AddForeignKey
ALTER TABLE "compiler_submissions" ADD CONSTRAINT "compiler_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
