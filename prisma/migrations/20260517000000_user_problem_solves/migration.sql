-- Per-user solved state when a FULL_JUDGE submission reaches ACCEPTED.
CREATE TABLE "user_problem_solves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedSubmissionId" UUID NOT NULL,

    CONSTRAINT "user_problem_solves_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_problem_solves_userId_problemId_key" ON "user_problem_solves"("userId", "problemId");

CREATE INDEX "user_problem_solves_userId_idx" ON "user_problem_solves"("userId");

CREATE INDEX "user_problem_solves_problemId_idx" ON "user_problem_solves"("problemId");

ALTER TABLE "user_problem_solves" ADD CONSTRAINT "user_problem_solves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_problem_solves" ADD CONSTRAINT "user_problem_solves_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
