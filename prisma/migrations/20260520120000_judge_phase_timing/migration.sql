-- Separate judge phase timings (queue / compile / execution / total wall).
ALTER TABLE "judge_submissions" ADD COLUMN "queueTimeMs" INTEGER;
ALTER TABLE "judge_submissions" ADD COLUMN "compileTimeMs" INTEGER;
ALTER TABLE "judge_submissions" ADD COLUMN "executionTimeMs" INTEGER;
ALTER TABLE "judge_submissions" ADD COLUMN "totalTimeMs" INTEGER;
ALTER TABLE "judge_submissions" ADD COLUMN "sandboxWallMs" INTEGER;
