-- Optional client-reported coding time (editor session → Submit click).
ALTER TABLE "judge_submissions" ADD COLUMN "codingDurationMs" INTEGER;
